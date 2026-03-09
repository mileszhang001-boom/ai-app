"""
Quality Gate 单元测试

验证 validator.py 的白名单校验、自动截断、类型检查等功能
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'server'))

from ai_generator.validator import validate_component


def test_valid_love():
    """合法的恋爱纪念日参数"""
    data = {
        "component_type": "anniversary",
        "mode": "countup",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {
            "title": "恋爱纪念",
            "start_date": "2024-06-01",
            "subtitle": "每一天都算数"
        }
    }
    is_valid, errors, cleaned = validate_component("anniversary", "love", data)
    assert is_valid, f"Should be valid, got errors: {errors}"
    assert cleaned["title"] == "恋爱纪念"
    assert cleaned["subtitle"] == "每一天都算数"
    print("  ✓ test_valid_love")


def test_valid_baby():
    """合法的宝宝成长参数"""
    data = {
        "component_type": "anniversary",
        "mode": "countup",
        "theme": "baby",
        "template_id": "anniversary_baby",
        "style_preset": "soft-purple",
        "params": {
            "title": "宝宝成长",
            "start_date": "2025-01-15",
            "subtitle": "慢慢长大不着急"
        }
    }
    is_valid, errors, cleaned = validate_component("anniversary", "baby", data)
    assert is_valid, f"Should be valid, got errors: {errors}"
    print("  ✓ test_valid_baby")


def test_valid_holiday():
    """合法的放假倒计时参数"""
    data = {
        "component_type": "anniversary",
        "mode": "countdown",
        "theme": "holiday",
        "template_id": "anniversary_holiday",
        "style_preset": "vibrant-orange",
        "params": {
            "title": "国庆快乐",
            "target_date": "2026-10-01",
            "subtitle": "假期在向你招手"
        }
    }
    is_valid, errors, cleaned = validate_component("anniversary", "holiday", data)
    assert is_valid, f"Should be valid, got errors: {errors}"
    print("  ✓ test_valid_holiday")


def test_valid_warm():
    """合法的暖橙纪念日参数（新增主题）"""
    data = {
        "component_type": "anniversary",
        "mode": "countup",
        "theme": "warm",
        "template_id": "anniversary_warm",
        "style_preset": "vibrant-orange",
        "params": {
            "title": "结婚纪念",
            "start_date": "2020-05-20",
            "subtitle": "岁月温柔"
        }
    }
    is_valid, errors, cleaned = validate_component("anniversary", "warm", data)
    assert is_valid, f"Should be valid, got errors: {errors}"
    print("  ✓ test_valid_warm")


def test_valid_news():
    """合法的新闻参数"""
    data = {
        "component_type": "news",
        "template_id": "news_daily",
        "style_preset": "minimal-dark",
        "params": {
            "category": "tech",
            "max_items": 5
        }
    }
    is_valid, errors, cleaned = validate_component("news", "daily", data)
    assert is_valid, f"Should be valid, got errors: {errors}"
    print("  ✓ test_valid_news")


def test_valid_alarm():
    """合法的闹钟参数"""
    data = {
        "component_type": "alarm",
        "template_id": "alarm_clock",
        "style_preset": "analog-minimal",
        "params": {
            "default_hours": 7,
            "label": "起床"
        }
    }
    is_valid, errors, cleaned = validate_component("alarm", "clock", data)
    assert is_valid, f"Should be valid, got errors: {errors}"
    print("  ✓ test_valid_alarm")


# ── 白名单拒绝测试 ──

def test_invalid_template_id():
    """非法 template_id 应被拒绝"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "hacked_template",
        "style_preset": "sweet-pink",
        "params": {"title": "test", "start_date": "2024-01-01"}
    }
    is_valid, errors, _ = validate_component("anniversary", "love", data)
    assert not is_valid
    assert any("template_id" in e.lower() for e in errors)
    print("  ✓ test_invalid_template_id")


def test_invalid_style_preset():
    """非法 style_preset 应被拒绝"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "rainbow-unicorn",
        "params": {"title": "test", "start_date": "2024-01-01"}
    }
    is_valid, errors, _ = validate_component("anniversary", "love", data)
    assert not is_valid
    assert any("style_preset" in e.lower() for e in errors)
    print("  ✓ test_invalid_style_preset")


def test_style_preset_wrong_theme():
    """style_preset 不属于该 theme 应被拒绝"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "forest-green",  # forest-green 属于 holiday，不属于 love
        "params": {"title": "test", "start_date": "2024-01-01"}
    }
    is_valid, errors, _ = validate_component("anniversary", "love", data)
    assert not is_valid
    assert any("style_preset" in e.lower() for e in errors)
    print("  ✓ test_style_preset_wrong_theme")


def test_invalid_theme():
    """非法 theme 应被拒绝"""
    data = {
        "component_type": "anniversary",
        "theme": "evil",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {"title": "test", "start_date": "2024-01-01"}
    }
    is_valid, errors, _ = validate_component("anniversary", "evil", data)
    assert not is_valid
    print("  ✓ test_invalid_theme")


def test_invalid_component_type():
    """非法 component_type 应被拒绝"""
    data = {
        "component_type": "malware",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {"title": "test"}
    }
    is_valid, errors, _ = validate_component("malware", "", data)
    assert not is_valid
    print("  ✓ test_invalid_component_type")


# ── 自动截断测试 ──

def test_title_truncation():
    """超长 title 应被自动截断到 20 字"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {
            "title": "这是一个非常非常非常非常非常长的标题超过二十个字了吧",
            "start_date": "2024-01-01",
        }
    }
    is_valid, warnings, cleaned = validate_component("anniversary", "love", data)
    assert is_valid, f"Should pass with truncation, got errors: {warnings}"
    assert len(cleaned["title"]) <= 20
    assert warnings and any("truncated" in w for w in warnings)
    print(f"  ✓ test_title_truncation (→ '{cleaned['title']}')")


def test_subtitle_truncation():
    """超长 subtitle 应被自动截断到 30 字"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {
            "title": "恋爱纪念",
            "start_date": "2024-01-01",
            "subtitle": "这是一段超过三十个字的副标题文案用来测试自动截断功能是否正常工作以及截断后的效果如何"
        }
    }
    is_valid, warnings, cleaned = validate_component("anniversary", "love", data)
    assert is_valid
    assert len(cleaned["subtitle"]) <= 30
    print(f"  ✓ test_subtitle_truncation (→ '{cleaned['subtitle']}')")


def test_alarm_label_truncation():
    """闹钟 label 超长截断到 15 字"""
    data = {
        "component_type": "alarm",
        "template_id": "alarm_clock",
        "style_preset": "analog-minimal",
        "params": {
            "label": "这是一个非常非常长的闹钟标签超过十五个字"
        }
    }
    is_valid, warnings, cleaned = validate_component("alarm", "clock", data)
    assert is_valid
    assert len(cleaned["label"]) <= 15
    print(f"  ✓ test_alarm_label_truncation (→ '{cleaned['label']}')")


def test_number_clamping():
    """数值超范围应被 clamp"""
    data = {
        "component_type": "news",
        "template_id": "news_daily",
        "style_preset": "minimal-dark",
        "params": {
            "category": "general",
            "max_items": 100  # max is 8
        }
    }
    is_valid, warnings, cleaned = validate_component("news", "daily", data)
    assert is_valid
    assert cleaned["max_items"] == 8
    print("  ✓ test_number_clamping")


# ── 缺失字段测试 ──

def test_missing_required_param():
    """缺少必填 params 字段"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {
            "subtitle": "没有 title 和 start_date"
        }
    }
    is_valid, errors, _ = validate_component("anniversary", "love", data)
    assert not is_valid
    assert any("title" in e.lower() for e in errors)
    print("  ✓ test_missing_required_param")


def test_missing_basic_field():
    """缺少顶层必填字段"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        # missing template_id
        "style_preset": "sweet-pink",
        "params": {"title": "test", "start_date": "2024-01-01"}
    }
    is_valid, errors, _ = validate_component("anniversary", "love", data)
    assert not is_valid
    assert any("template_id" in e for e in errors)
    print("  ✓ test_missing_basic_field")


# ── 日期格式测试 ──

def test_invalid_date_format():
    """非法日期格式应被拒绝"""
    data = {
        "component_type": "anniversary",
        "theme": "love",
        "template_id": "anniversary_love",
        "style_preset": "sweet-pink",
        "params": {
            "title": "test",
            "start_date": "not-a-date"
        }
    }
    is_valid, errors, _ = validate_component("anniversary", "love", data)
    assert not is_valid
    print("  ✓ test_invalid_date_format")


def test_datetime_multiple_formats():
    """holiday target_date 支持多种日期格式"""
    for date_str in ["2026-10-01", "2026-10-01T00:00:00", "2026-10-01 08:00:00"]:
        data = {
            "component_type": "anniversary",
            "theme": "holiday",
            "template_id": "anniversary_holiday",
            "style_preset": "vibrant-orange",
            "params": {
                "title": "国庆",
                "target_date": date_str,
            }
        }
        is_valid, errors, _ = validate_component("anniversary", "holiday", data)
        assert is_valid, f"Date '{date_str}' should be valid, got: {errors}"
    print("  ✓ test_datetime_multiple_formats")


if __name__ == "__main__":
    tests = [
        # 合法参数
        test_valid_love,
        test_valid_baby,
        test_valid_holiday,
        test_valid_warm,
        test_valid_news,
        test_valid_alarm,
        # 白名单拒绝
        test_invalid_template_id,
        test_invalid_style_preset,
        test_style_preset_wrong_theme,
        test_invalid_theme,
        test_invalid_component_type,
        # 自动截断
        test_title_truncation,
        test_subtitle_truncation,
        test_alarm_label_truncation,
        test_number_clamping,
        # 缺失字段
        test_missing_required_param,
        test_missing_basic_field,
        # 日期
        test_invalid_date_format,
        test_datetime_multiple_formats,
    ]

    print("\n🔒 Quality Gate 单元测试\n")
    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ✗ {test.__name__}: {type(e).__name__}: {e}")
            failed += 1

    print(f"\n{'='*40}")
    print(f"  Total: {passed + failed}  Passed: {passed}  Failed: {failed}")
    if failed == 0:
        print("  ✅ All tests passed!")
    else:
        print(f"  ❌ {failed} test(s) failed")
    print()
