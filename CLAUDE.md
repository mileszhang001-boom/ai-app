# AI小组件 · 创意工坊 — v0.2

## 项目概述

车载 AI 小组件平台 Demo，核心目标：**跑通 AI 生成应用在车载场景下的体验，打造标杆场景**。

**一句话**："告诉我你想要什么，AI 帮你生成一张专属的车机桌面卡片。"

## 产品 Spec

- 完整产品方案见 `docs/SPEC.md`
- 技术进度与架构见 `docs/TECH_PLAN.md`

## 核心技术决策

1. **AI 生成方案：混合路线** — 精品模板为底座 + AI 智能匹配与内容增强。AI 输出 JSON 参数，不生成代码。
2. **车端渲染：H5 + WebView 沙箱** — 组件以 H5 运行在 Android WebView 中，通过 JSBridge 访问车机能力。
3. **手机端：H5 Web App**（Vite + Vanilla JS）— 追求最快交付速度。
4. **车端卡片尺寸：896×1464 逻辑像素**（行车桌面 1/3 屏）。
5. **设计语言：Liquid Glass** — Glassmorphism 毛玻璃 + 呼吸光晕 + 粒子系统 + 数字翻牌动画。支持 4 种视觉风格（glass/minimal/material/pixel）+ 动态配色引擎。
6. **组件类型（9个模板）**：
   - 纪念日 4 主题（恋爱/宝宝/放假/暖橙）
   - 每日新闻
   - 闹钟
   - **天气**（新增）
   - **音乐播放器**（新增）
   - **日历日程**（新增）

## 项目结构

```
ai-widget-workshop/
├── CLAUDE.md                          # 本文件
├── docs/
│   ├── SPEC.md                        # 产品 Spec
│   └── TECH_PLAN.md                   # 技术规划 & 开发进度
├── src/
│   ├── server/                        # 云端服务（FastAPI, port 8000）
│   │   ├── main.py                    # API 入口
│   │   ├── ai_generator/             # AI 生成 Pipeline
│   │   │   ├── prompt.py             #   模板注册 + System Prompt
│   │   │   ├── generator.py          #   LLM 调用 + Mock 模式
│   │   │   └── validator.py          #   Quality Gate（白名单+截断）
│   │   ├── sync_service/             # 组件同步推送
│   │   ├── news_service/             # 新闻聚合
│   │   └── storage/                  # 元数据存储
│   ├── mobile-web/                    # 手机端 H5 Web App（Vite, port 3000）
│   │   ├── src/pages/market.js       #   首页 AI 创建入口（9个场景卡片）
│   │   ├── src/pages/preview.js      #   896×1464 预览
│   │   ├── src/pages/config.js       #   参数配置
│   │   └── public/car-simulator.html #   车端模拟器
│   ├── widget-templates/              # H5 组件模板（核心产物）
│   │   ├── anniversary/              #   纪念日
│   │   │   ├── love/                 #     恋爱（心形粒子）
│   │   │   ├── baby/                 #     宝宝（星星粒子）
│   │   │   ├── holiday/              #     放假倒计时（彩纸粒子）
│   │   │   └── warm/                 #     暖橙（萤火虫粒子）
│   │   ├── news/                     #   每日新闻（毛玻璃卡片+轮播）
│   │   ├── alarm/                    #   闹钟（进度环+日夜感知）
│   │   ├── weather/                  #   天气（动态粒子+3日预报）
│   │   ├── music/                    #   音乐播放器（频谱+进度条）
│   │   ├── calendar/                 #   日历日程（时间线+农历）
│   │   └── shared/
│   │       ├── tokens.css            #     Design Tokens (Liquid Glass)
│   │       ├── color-engine.js       #     动态配色引擎（hex→完整调色板）
│   │       ├── visual-styles.css     #     4种视觉风格宏（glass/minimal/material/pixel）
│   │       └── bridge.js            #     JSBridge 封装
│   └── car-host/                     # 车端宿主（Android, 模拟器）
└── tests/
```

## 技术栈

| 模块 | 选型 |
|------|------|
| AI 生成 | LLM API (qwen-plus) + JSON Mode, Mock 模式可用 |
| 云端框架 | Python FastAPI |
| H5 模板 | Vanilla JS + CSS (Liquid Glass 设计语言) |
| 手机端 | H5 Web App (Vite 构建) |
| 车端宿主 | Android App + WebView |
| 部署 | Render (后端) + Netlify (前端) |

## 关键约束

- H5 组件极度轻量：单组件总资源 ≤ 100KB（当前每模板 ≤ 36KB）
- 禁止重型前端框架（React/Vue），H5 模板用 Vanilla JS + CSS
- 暗色模式优先
- 生成速度：用户点击"生成" → 看到预览 ≤ 5s
- 车端 WebView 连续运行 8 小时无崩溃

## 快速启动

```bash
# 后端
cd src/server && pip install -r requirements.txt && python3 main.py

# 前端
cd src/mobile-web && npm install && npm run dev
```
