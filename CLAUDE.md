# AI小组件 · 创意工坊 — v2.0

## 项目概述

车载 AI 小组件平台，核心目标：**跑通 AI 生成应用在车载场景下的体验，打造标杆场景**。

**一句话**："告诉我你想要什么，AI 帮你生成一张专属的车机桌面卡片。"

**当前阶段**：v1.0 已完成流程验证（AI 生成 → 预览 → 推送），v2.0 聚焦**数据真实性、交互完整性、设计精度**，从"能看"升级到"能用"。

## 文档

| 文档 | 说明 |
|------|------|
| `docs/SPEC.md` | 产品 Spec（功能定义、交互规范） |
| `docs/TECH_PLAN.md` | 技术架构 & 开发进度 |
| `docs/V2_ROADMAP.md` | v2.0 迭代路线图（4 Sprint、37 项反馈、15 个迭代项） |

## 核心技术决策

1. **AI 生成：双模式** — 场景卡片走精品模板（AI→JSON 参数），自由输入走 AI编程（LLM→HTML/CSS/JS）
2. **车端渲染：H5 + WebView 沙箱** — 通过 JSBridge 访问车机能力
3. **手机端：H5 Web App**（Vite + Vanilla JS）
4. **车端卡片尺寸：896×1464 逻辑像素**（行车桌面 1/3 屏）
5. **Design-at-896 + CSS zoom**：模板按 896px 设计，手机端 `zoom:containerWidth/896` 等比缩小
6. **设计语言：Liquid Glass** — 毛玻璃 + 光晕 + 粒子 + 翻牌动画 + 动态配色引擎
7. **数据分层**（v2.0 新增）：手机端用精品 mock 数据保障预览体验，车端用真实数据
8. **组件类型（9 模板）**：纪念日×4（恋爱/宝宝/放假/暖橙）、新闻、闹钟、天气、音乐、日历

## 项目结构

```
ai-widget-workshop/
├── CLAUDE.md                          # 本文件
├── docs/
│   ├── SPEC.md                        # 产品 Spec
│   ├── TECH_PLAN.md                   # 技术架构 & 进度
│   └── V2_ROADMAP.md                  # v2.0 迭代路线图
├── src/
│   ├── server/                        # 云端服务（FastAPI, port 8000）
│   │   ├── main.py                    #   API 入口
│   │   ├── ai_generator/             #   AI 生成 Pipeline（prompt/generator/validator）
│   │   ├── weather_service/          #   天气（和风天气 API + 缓存 + mock）
│   │   ├── news_service/             #   新闻（RSS 聚合 + AI 摘要）
│   │   ├── sync_service/             #   组件同步推送
│   │   └── storage/                  #   元数据存储
│   ├── mobile-web/                    # 手机端 H5 Web App（Vite, port 3000）
│   │   ├── src/pages/                #   market → preview → finetune 三页面
│   │   ├── src/components/           #   config-panel 共享配置组件
│   │   ├── src/utils/               #   render-widget 渲染引擎
│   │   └── public/car-simulator.html #   车端模拟器
│   ├── widget-templates/              # H5 组件模板（核心产物）
│   │   ├── anniversary/              #   纪念日（love/baby/holiday/warm）
│   │   ├── news/                     #   每日新闻
│   │   ├── alarm/                    #   闹钟
│   │   ├── weather/                  #   天气
│   │   ├── music/                    #   音乐播放器
│   │   ├── calendar/                 #   日历日程
│   │   └── shared/                   #   公共基础设施
│   │       ├── tokens.css            #     Design Tokens
│   │       ├── color-engine.js       #     动态配色引擎
│   │       ├── bridge.js            #     JSBridge（含 MediaSession）
│   │       ├── overlay.js/css       #     通用弹窗组件
│   │       ├── storage.js           #     localStorage 封装
│   │       ├── easter-egg.js        #     彩蛋粒子引擎
│   │       └── color-extract.js     #     背景图取色
│   └── car-host/                     # 车端宿主（Android）
└── tests/
```

## 技术栈

| 模块 | 选型 |
|------|------|
| AI 生成 | LLM API (qwen-plus) + JSON Mode, Mock 模式可用 |
| 云端 | Python FastAPI |
| H5 模板 | Vanilla JS + CSS (Liquid Glass) |
| 手机端 | Vite + Vanilla JS |
| 天气 | 和风天气 QWeather API (30min 缓存, mock fallback) |
| 新闻 | RSS 聚合 + AI 摘要 (30min 缓存) |
| 音乐 | JSBridge MediaSession |
| 车端 | Android WebView |
| 部署 | Render (后端) + Netlify (前端) |

## 关键约束

- 单组件总资源 ≤ 100KB
- 禁止重型前端框架（React/Vue），模板用 Vanilla JS + CSS
- 暗色模式优先
- 生成 → 预览 ≤ 5s
- 车端 WebView 连续 8 小时无崩溃
- HMI 标准：body text ≥24dp, touch target ≥76×76dp

## Skills（自动技能）

项目 `.claude/skills/` 下有以下技能，在相关场景中**必须**自动读取并遵循：

### pencil-design-system
- **触发时机**：任何涉及 `.pen` 设计文件修改、UI 设计审查、设计-代码一致性验证的操作
- **使用方式**：先读取 `.claude/skills/pencil-design-system/SKILL.md`，然后严格按照 SCAN → PLAN → EXECUTE → VERIFY 四阶段执行
- **Pencil MCP 工具**：已连接，可直接调用 `batch_design`、`batch_get`、`snapshot_layout`、`get_screenshot` 等
- **设计稿路径**：`UI_pen/card.pen`
- **关键规则**：
  - 每次 `batch_design` 后必须 `batch_get` 验证写入成功
  - 必须截图检查（`problemsOnly` 有盲点，不能替代视觉检查）
  - 修改代码后如涉及 UI，用 Code Linkage 章节做设计-代码对比验证

## 快速启动

```bash
# 后端（需 .env: QWEATHER_API_KEY, QWEATHER_API_HOST）
cd src/server && pip install -r requirements.txt && python3 main.py

# 前端
cd src/mobile-web && npm install && npm run dev
```

## v2.0 迭代概览

详见 `docs/V2_ROADMAP.md`。4 个 Sprint：

| Sprint | 主题 | 关键内容 |
|--------|------|----------|
| S1 | 基础架构 | 手势规范、卡片 ID 去重、数据分层、车端编辑态 |
| S2 | 数据与功能 | 天气城市搜索、音乐 MediaSession、新闻增强、日程修复 |
| S3 | 交互打磨 | 纪念日彩蛋优化、闹钟重做、图片压缩 |
| S4 | 设计对齐 | Pencil 设计同步、全局 SVG icon、纪念日三卡对齐 |
