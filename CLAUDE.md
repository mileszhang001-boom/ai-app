# AI小组件 · 创意工坊 — v0.1 Demo

## 项目概述

这是一个车载 AI 小组件平台的 v0.1 Demo 项目。核心目标是通过 Demo 向高层验证「AI小组件」方向的可行性。

**一句话**："告诉我你想要什么，AI 帮你生成一张专属的车机桌面卡片。"

## 产品 Spec

完整产品方案见 `docs/SPEC.md`，在开始任何技术分析或开发之前，请先完整阅读该文档。

## 核心技术决策（已确定）

以下决策已由产品侧确认，不需要再讨论：

1. **AI 生成方案：L1 纯模板参数化** — AI 只输出 JSON 参数，不生成 H5 代码。前端模板引擎负责渲染。
2. **车端渲染：H5 + WebView 沙箱** — 组件以 H5 形式运行在 Android WebView 中，通过 JSBridge 访问车机能力。
3. **手机端：H5 Web App**（不使用小米快应用）— 追求最快交付速度。
4. **车端卡片尺寸：896×1464 逻辑像素**（行车桌面 1/3 屏）。
5. **多组件切换：手动点击 ← → 按钮** — 不做智能排序。
6. **组件类型（v0.1）**：纪念日（含恋爱/宝宝/放假3个主题）、每日新闻、闹钟。

## 项目结构

```
ai-widget-workshop/
├── CLAUDE.md                   # 本文件 - 项目入口说明
├── docs/
│   └── SPEC.md                 # 完整产品 Spec
├── src/
│   ├── server/                 # 云端服务（FastAPI）
│   │   ├── ai_generator/       # AI 生成 Pipeline（LLM API + Prompt + JSON 校验）
│   │   ├── sync_service/       # 组件同步推送服务
│   │   ├── news_service/       # 新闻聚合 + AI 摘要服务
│   │   └── storage/            # 组件元数据 + H5 产物存储
│   ├── mobile-web/             # 手机端 H5 Web App
│   │   ├── pages/              # 模板市场、参数配置、预览等页面
│   │   └── components/         # 通用 UI 组件
│   ├── widget-templates/       # H5 组件模板（核心产物）
│   │   ├── anniversary/        # 纪念日模板（love/baby/holiday 3个主题）
│   │   ├── news/               # 每日新闻模板
│   │   ├── alarm/              # 闹钟模板
│   │   ├── shared/             # 共享资源
│   │   │   ├── tokens.css      # Design Tokens
│   │   │   └── bridge.js       # JSBridge 封装
│   │   └── template-engine/    # 模板引擎（参数注入 + 渲染）
│   └── car-host/               # 车端宿主 App（Android）
│       ├── webview/            # WebView 容器 + 沙箱
│       ├── jsbridge/           # JSBridge 实现
│       ├── widget-manager/     # 组件下载/缓存/管理
│       └── card-switcher/      # 卡片切换 UI（← → + 圆点指示器）
└── tests/                      # 测试
```

## 技术栈

| 模块 | 选型 |
|------|------|
| AI 生成 | LLM API (GPT-4o / Claude) + JSON Mode |
| 云端框架 | Python FastAPI |
| H5 模板引擎 | Vanilla JS + Handlebars/Mustache |
| 手机端 | H5 Web App（纯前端，Vite 构建） |
| 车端宿主 | Android App + WebView |
| 云端存储 | 对象存储 + MySQL/Redis |
| 推送同步 | MQTT（复用车机已有通道）/ 轮询（Demo 降级方案） |

## 开发优先级

1. **P0 — H5 组件模板**：这是 Demo 的核心视觉产出，优先开发和打磨
2. **P0 — AI 生成 Pipeline**：Prompt 工程 + JSON 校验 + 模板引擎集成
3. **P1 — 手机端 Web App**：模板选择 + 参数配置 + 预览（896×1464 模拟）
4. **P1 — 跨端同步链路**：手机 → 云 → 车的完整链路
5. **P2 — 车端集成**：WebView 容器 + JSBridge + 卡片切换

## 关键约束

- H5 组件必须极度轻量：单组件总资源 ≤ 100KB
- 禁止使用重型前端框架（React/Vue），H5 模板用 Vanilla JS + CSS
- 所有组件必须暗色模式优先
- 生成速度目标：用户点击"生成" → 看到预览 ≤ 5s
- 车端 WebView 连续运行 8 小时无崩溃、无内存泄漏
