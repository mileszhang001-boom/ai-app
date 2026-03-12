# AI小组件 · 创意工坊 — 项目交接文档

> 更新日期：2026-03-12 · 版本 v0.1 Demo

---

## 一、项目是什么

**一句话**：用户在手机上告诉 AI 想要什么，AI 自动生成一张车机桌面卡片，同步到车上即可使用。

**定位**：v0.1 Demo，用于向高层验证「AI 小组件」方向的可行性。效果导向，视觉品质 > 功能数量。

**线上地址**：
| 环境 | 地址 | 说明 |
|------|------|------|
| 手机端 | https://ai-apps-car.netlify.app | Netlify 自动部署 |
| 后端 API | https://ai-widget-api.onrender.com | Render 免费计划，首次访问冷启动约 50s |
| 车端模拟器 | https://ai-apps-car.netlify.app/car-simulator.html | 896×1464 模拟 |
| GitHub | https://github.com/mileszhang001-boom/ai-app | 推送 main 分支自动部署 |
| API 文档 | https://ai-widget-api.onrender.com/docs | Swagger 自动生成 |

---

## 二、核心用户流程

```
手机端                             云端                          车端
┌──────────┐   自然语言    ┌──────────────┐   JSON     ┌──────────────┐
│ "和女朋友  │ ──────────→ │  AI 理解意图   │ ────────→ │ H5 模板渲染   │
│  6月1日在  │  POST /api/ │  选择模板      │  参数注入  │ 896×1464 卡片│
│  一起的"   │  chat-gen   │  生成参数+文案  │          │ WebView 展示  │
└──────────┘              └──────────────┘          └──────────────┘
     ↕                                                     ↕
  预览确认                                            ← → 手动切换
  同步到车                                            多卡片管理
```

**用户操作只有两步**：
1. 输入一句话（或点选场景卡片）
2. 预览满意后点「同步到车机」

---

## 三、已完成的功能清单

### 3.1 H5 组件模板（6 个）

| 模板 | 类型 | 说明 | 风格预设 |
|------|------|------|---------|
| 恋爱纪念 | anniversary/love | 正计时，在一起第 X 天 | sweet-pink, vibrant-orange, soft-purple, minimal-dark |
| 宝宝成长 | anniversary/baby | 正计时，出生第 X 天 | soft-purple, sweet-pink, ocean-blue, warm-yellow |
| 放假倒计时 | anniversary/holiday | 倒计时，还有 X 天 | vibrant-orange, warm-yellow, ocean-blue, forest-green |
| 暖橙纪念 | anniversary/warm | 正计时，结婚/通用 | vibrant-orange, warm-yellow, sweet-pink, minimal-dark |
| 每日新闻 | news/daily | AI 摘要 RSS 新闻 | minimal-dark, clean-light |
| 闹钟 | alarm/clock | 显示下个闹钟时间 | analog-minimal, digital-neon |

- 每个模板独立 H5（index.html + style.css + main.js），总资源 ≤ 100KB
- 暗色模式优先，共享 Design Tokens（`shared/tokens.css`）
- 卡片尺寸：896 × 1464 逻辑像素（行车桌面 1/3 屏）

### 3.2 AI 生成能力

- **方案**：L1 纯模板参数化 — AI 只输出 JSON 参数，不生成代码
- **模型**：通义千问 qwen-plus（默认），也支持 GPT-4o / Claude
- **两种模式**：
  - **自然语言模式**（主推）：一句话 → AI 自动选模板 + 填参数 + 生成文案
  - **结构化模式**：用户手选模板 → AI 补全缺失参数
- **Mock 模式**：无 API Key 时自动切换，基于关键词匹配，可离线开发和演示
- **Quality Gate**：模板白名单校验、文案自动截断、数值 clamp

### 3.3 手机端 Web App

- 纯 H5，Vanilla JS + Vite 构建，无框架依赖
- 页面：首页（AI 输入）→ 参数配置 → 预览（896×1464 模拟）→ 同步到车
- 首页设计：Hero 区 + AI 输入框 + 6 个场景卡片（点击即生成）

### 3.4 后端 API

| 端点 | 用途 |
|------|------|
| `POST /api/chat-generate` | 自然语言生成（核心接口） |
| `POST /api/generate` | 结构化生成 |
| `GET /api/templates` | 模板列表 |
| `GET /api/templates/{type}/{theme}` | 模板详情 + 参数 Schema |
| `POST /api/sync` | 同步到车（Demo 模拟） |
| `GET /api/news` | 获取新闻（RSS + AI 摘要） |
| `POST /api/widgets` | 保存组件 |
| `GET /health` | 健康检查 |

完整 API 文档：访问 `/docs`（Swagger UI）

### 3.5 车端模拟器

- 浏览器模拟 896×1464 车机屏幕
- 支持 ← → 卡片切换 + 圆点指示器
- 底部控制面板可快速切换 6 种预设组件
- JSBridge mock 实现（getDateTime, getTheme, setAlarm 等）

### 3.6 部署

- **前端**：Netlify，git push 自动构建部署
- **后端**：Render，git push 自动部署
- **代理**：Netlify 的 `/api/*` 自动转发到 Render 后端

---

## 四、技术架构概览

```
项目结构
├── docs/SPEC.md                    ← 完整产品 Spec（必读）
├── CLAUDE.md                       ← 技术决策 + 项目结构
├── src/
│   ├── server/                     ← Python FastAPI 后端
│   │   ├── main.py                 ← 路由 + 启动
│   │   ├── ai_generator/           ← AI Pipeline
│   │   │   ├── generator.py        ← LLM 调用（真实 / Mock）
│   │   │   ├── prompt.py           ← System Prompt 管理
│   │   │   └── validator.py        ← JSON 校验 + 质量门禁
│   │   ├── news_service/           ← 新闻聚合 + AI 摘要
│   │   └── storage/                ← 数据存储（当前内存）
│   ├── mobile-web/                 ← Vite + Vanilla JS 前端
│   │   ├── src/pages/market.js     ← 首页（AI 输入）
│   │   ├── src/pages/preview.js    ← 预览页
│   │   └── netlify.toml            ← 部署配置
│   ├── widget-templates/           ← H5 组件模板（核心产物）
│   │   ├── anniversary/{love,baby,holiday,warm}/
│   │   ├── news/
│   │   ├── alarm/
│   │   └── shared/tokens.css       ← Design Tokens
│   └── car-host/                   ← 车端（仅模拟器）
```

### 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| AI 方案 | L1 纯参数化 | 速度快（1-3s）、质量可控、不生成代码 |
| 前端框架 | 无框架 Vanilla JS | 车端 WebView 兼容、轻量 ≤100KB |
| 存储 | 内存（Demo 阶段） | 快速验证，生产需替换为 MySQL + Redis |
| LLM | 通义千问 qwen-plus | 国内可用、中文效果好、成本较低 |
| 部署 | Render + Netlify 免费计划 | 零成本、git 推送即部署 |

---

## 五、如何本地运行

### 环境要求
- Python 3.9+
- Node.js 18+
- （可选）通义千问 API Key

### 启动步骤

```bash
# 1. 后端
cd src/server
pip install -r requirements.txt
cp .env.example .env          # 可选：填入 QWEN_API_KEY
uvicorn main:app --reload     # http://localhost:8000

# 2. 前端（新终端）
cd src/mobile-web
npm install
npm run dev                   # http://localhost:3000
```

无 API Key 也能正常运行（自动进入 Mock 模式）。

---

## 六、如何演示

### 推荐 Demo 脚本

**开场**（30s）：
> "这是 AI 小组件创意工坊。用户只需要说一句话，AI 就能生成一张专属的车机桌面卡片。"

**演示流程**（2-3 min）：

1. **打开手机端**：https://ai-apps-car.netlify.app
   - 展示首页：Hero 区 + AI 输入框 + 场景卡片

2. **场景一：恋爱纪念日**
   - 点击「恋爱纪念日」场景卡片，或直接输入 "和女朋友6月1日在一起的"
   - 展示 AI 生成过程（理解想法 → 选择模板 → 渲染卡片）
   - 预览页：896×1464 真实卡片效果
   - 点「同步到车机」→ 成功提示

3. **场景二：放假倒计时**
   - 输入 "国庆倒计时，我已经迫不及待了"
   - 展示不同风格的卡片效果

4. **切换到车端模拟器**：https://ai-apps-car.netlify.app/car-simulator.html
   - 展示 896×1464 全屏卡片
   - 点「全部加载」→ 展示 ← → 卡片切换

**收尾**（15s）：
> "整个过程不到 5 秒。用户只需要说一句话，AI 理解意图、选择模板、生成文案，一步到位。"

### 注意事项
- Render 免费计划首次访问会冷启动约 50s，**演示前请先打开一次后端 /health 预热**
- 如果后端未响应，等待 1 分钟后重试
- Mock 模式下，不支持的输入会展示建议面板；真实 LLM 会将所有输入映射到最近的模板

---

## 七、未完成 & 后续规划

### 近期可做（v0.2）

| 功能 | 价值 | 复杂度 | 说明 |
|------|------|--------|------|
| 多方案预览 | 高 | 中 | 一次生成 3 种风格变体供选择 |
| AI 文案增强 | 高 | 中 | 根据时间/节日/里程碑自动生成有感情的文案 |
| 持久化存储 | 高 | 中 | 替换内存存储为 MySQL，数据不丢失 |
| 用户账号 | 中 | 中 | 登录 + 多设备同步 |

### 中期规划（v0.5）

| 功能 | 说明 |
|------|------|
| L2 CSS 变体生成 | AI 不仅选模板，还能微调配色和布局 |
| 浅色模式 | 完整的浅色主题支持 |
| 更多模板类型 | 天气、音乐、行车数据、日历等 |
| WCAG AA 对比度校验 | 自动检查文字可读性 |
| 真实新闻 API | 替换 RSS 为正式新闻数据源 |

### 长期方向（v1.0+）

- 车端 Android WebView 真机集成
- 语音创建组件（车内场景）
- 组件市场（用户分享/下载）
- 智能排序（根据场景自动调整卡片顺序）
- 8 小时稳定性测试 + 性能基线

---

## 八、已知问题 & 限制

| 问题 | 影响 | 状态 |
|------|------|------|
| Render 免费计划冷启动 ~50s | 首次访问慢 | 升级付费计划可解决 |
| 数据存储在内存中 | 后端重启后数据丢失 | 需接入数据库 |
| 无用户认证 | 所有人共享数据 | 需开发登录体系 |
| 新闻 RSS 源可能超时 | 新闻卡片偶尔加载失败 | 需增加容错 + 备用源 |
| 车端仅模拟器 | 未在真车验证 | 需车端团队配合 |
| 未做负载测试 | 并发能力未知 | 需压测 |

---

## 九、环境变量说明

### 后端（`src/server/.env`）

```bash
QWEN_API_KEY=sk-xxxx       # 通义千问 API Key（无则自动 Mock）
AI_MODEL=qwen-plus          # 模型选择：qwen-plus / qwen-max / gpt-4o
USE_MOCK=false              # 强制 Mock 模式（true/false）
```

### 前端

无需配置环境变量。API 代理通过 `netlify.toml` 配置：
```toml
[[redirects]]
from = "/api/*"
to = "https://ai-widget-api.onrender.com/api/:splat"
```

如后端地址变更，修改此处即可。

---

## 十、交接 Checklist

- [ ] 阅读 `docs/SPEC.md`（完整产品方案）
- [ ] 本地跑通后端 + 前端（参照第五节）
- [ ] 打开线上地址体验完整流程
- [ ] 了解 AI 生成 Pipeline（`generator.py` + `prompt.py`）
- [ ] 确认 Render / Netlify 部署账号权限已移交
- [ ] 确认 GitHub 仓库权限已移交
- [ ] 确认通义千问 API Key 已移交或重新申请
- [ ] 走一遍 Demo 演示脚本（第六节）

---

*本文档由项目原始开发者生成，如有疑问请联系交接人。*
