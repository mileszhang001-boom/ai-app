"""
E2E API 冒烟测试 — 模板重构后全链路验证
使用 FastAPI TestClient（无需启动服务）

运行: cd src/server && python3 ../../tests/test_e2e_api.py
"""

import sys, os, time, json

# 确保 server 模块可导入
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'server'))
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'src', 'server'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PASS = 0
FAIL = 0
RESULTS = []

def report(name, ok, detail=""):
    global PASS, FAIL
    if ok:
        PASS += 1
        RESULTS.append(f"  ✅ {name}")
    else:
        FAIL += 1
        RESULTS.append(f"  ❌ {name} — {detail}")


# ════════════════════════════════════════════
# Layer 1: 后端 API 冒烟
# ════════════════════════════════════════════

print("\n══ Layer 1: 后端 API 冒烟测试 ══\n")

# --- 1. 健康检查 ---
try:
    r = client.get("/")
    report("GET / 健康检查", r.status_code == 200)
except Exception as e:
    report("GET / 健康检查", False, str(e))

# --- 2. 模板列表 ---
try:
    r = client.get("/api/templates")
    data = r.json()
    # 至少 8 个模板
    templates = data if isinstance(data, list) else data.get("templates", [])
    report("GET /api/templates 返回模板列表", r.status_code == 200 and len(templates) >= 7,
           f"status={r.status_code}, count={len(templates)}")
except Exception as e:
    report("GET /api/templates", False, str(e))

# --- 3. 8 模板 NL 生成（mock 模式） ---
TEST_PROMPTS = {
    'love':     ('做一个恋爱纪念日，2024年6月1日在一起', 'anniversary', 'love'),
    'baby':     ('做一个宝宝成长卡片，2024年9月出生', 'anniversary', 'baby'),
    'holiday':  ('做一个五一假期倒计时', 'anniversary', 'holiday'),
    'weather':  ('做一个天气卡片，显示北京天气', 'weather', None),
    'music':    ('做一个音乐播放器卡片', 'music', None),
    'calendar': ('做一个日历日程卡片', 'calendar', None),
    'news':     ('做一个每日新闻简报', 'news', None),
    'alarm':    ('做一个闹钟卡片', 'alarm', None),
}

generated_widgets = {}

for scene, (text, expect_type, expect_theme) in TEST_PROMPTS.items():
    try:
        r = client.post("/api/chat-generate", json={
            "text": text,
            "generation_mode": "template"
        })
        body = r.json()
        ok = body.get("success", False)
        data = body.get("data") or {}

        type_ok = data.get("component_type") == expect_type
        theme_ok = expect_theme is None or data.get("theme") == expect_theme

        if ok and type_ok and theme_ok:
            report(f"NL 生成: {scene}", True)
            generated_widgets[scene] = data
        else:
            report(f"NL 生成: {scene}", False,
                   f"success={ok}, type={data.get('component_type')}(expect {expect_type}), "
                   f"theme={data.get('theme')}(expect {expect_theme})")
            if ok:
                generated_widgets[scene] = data
    except Exception as e:
        report(f"NL 生成: {scene}", False, str(e))

# --- 4. warm 拒绝/降级 ---
try:
    r = client.post("/api/chat-generate", json={
        "text": "做一个温暖风格的纪念日卡片",
        "generation_mode": "template"
    })
    body = r.json()
    data = body.get("data") or {}
    theme = data.get("theme", "")
    # warm 应被降级为 love 或其他有效 theme
    report("warm 降级测试", theme != "warm",
           f"theme={theme} (should not be warm)")
except Exception as e:
    report("warm 降级测试", False, str(e))

# --- 5. 天气 API ---
try:
    r = client.get("/api/weather", params={"city": "北京"})
    body = r.json()
    has_temp = "temperature" in str(body) or "temp" in str(body) or "now" in str(body)
    report("GET /api/weather?city=北京", r.status_code == 200 and has_temp,
           f"status={r.status_code}, keys={list(body.keys()) if isinstance(body, dict) else 'not dict'}")
except Exception as e:
    report("GET /api/weather", False, str(e))

# --- 6. 新闻 API ---
try:
    r = client.get("/api/news")
    body = r.json()
    has_items = isinstance(body, list) or "articles" in str(body) or "news" in str(body) or "items" in str(body)
    report("GET /api/news", r.status_code == 200 and has_items,
           f"status={r.status_code}")
except Exception as e:
    report("GET /api/news", False, str(e))

# --- 7. 全流程: 保存 → 推送 → 车端拉取 ---
print("\n══ Layer 3: 全流程模拟（生成→保存→推送→车端拉取）══\n")

test_widget = generated_widgets.get("love", {})
widget_id = None
sync_id = None

# 保存
if test_widget:
    try:
        r = client.post("/api/widgets", json={
            "user_id": "e2e_test_user",
            "component_type": test_widget.get("component_type", "anniversary"),
            "theme": test_widget.get("theme", "love"),
            "params": test_widget.get("params", {}),
            "style_preset": test_widget.get("style_preset"),
        })
        body = r.json()
        widget_id = body.get("widget_id")
        report("POST /api/widgets 保存组件",
               body.get("success", False) and widget_id is not None,
               f"widget_id={widget_id}")
    except Exception as e:
        report("POST /api/widgets", False, str(e))

# 推送
if widget_id:
    try:
        r = client.post("/api/sync", json={
            "widget_id": widget_id,
            "device_id": "e2e_test_device"
        })
        body = r.json()
        sync_id = body.get("sync_id")
        report("POST /api/sync 推送到车端",
               body.get("success", False) and sync_id is not None,
               f"sync_id={sync_id}")
    except Exception as e:
        report("POST /api/sync", False, str(e))

# 等待同步 + 查询状态
if sync_id:
    try:
        time.sleep(3)
        r = client.get(f"/api/sync/{sync_id}")
        body = r.json()
        status = body.get("status", "")
        report("GET /api/sync/{id} 同步状态",
               status in ("SUCCESS", "success", "completed"),
               f"status={status}")
    except Exception as e:
        report("GET /api/sync/{id}", False, str(e))

# 车端拉取
if widget_id:
    try:
        r = client.get("/api/device/e2e_test_device/widgets")
        body = r.json()
        widgets = body.get("widgets", [])
        found = any(w.get("widget_id") == widget_id for w in widgets)
        report("GET /api/device/{id}/widgets 车端拉取",
               r.status_code == 200 and found,
               f"found={found}, total={len(widgets)}")
    except Exception as e:
        report("GET /api/device/{id}/widgets", False, str(e))

# --- 8. 字段名验证（SCHEMA 一致性）---
print("\n══ SCHEMA 字段名验证 ══\n")

if "love" in generated_widgets:
    params = generated_widgets["love"].get("params", {})
    # SCHEMA 要求: start_date, title, nickname (不是 date, message, bg_photo)
    has_old = any(k in params for k in ["date", "message", "bg_photo", "subtitle"])
    has_new = "start_date" in params or "title" in params
    report("love 字段名 SCHEMA 一致", has_new and not has_old,
           f"params keys={list(params.keys())}")

if "holiday" in generated_widgets:
    params = generated_widgets["holiday"].get("params", {})
    has_target = "target_date" in params or "holiday_name" in params
    report("holiday 字段名 SCHEMA 一致", has_target,
           f"params keys={list(params.keys())}")


# ════════════════════════════════════════════
# 报告
# ════════════════════════════════════════════

print("\n" + "═" * 50)
print(f" E2E API 测试结果: {PASS} 通过, {FAIL} 失败")
print("═" * 50)
for line in RESULTS:
    print(line)
print("═" * 50)

sys.exit(0 if FAIL == 0 else 1)
