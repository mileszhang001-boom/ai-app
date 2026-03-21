# AI小组件 · 技术规划与开发进度

> 最后更新：2026-03-21

---

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     手机端 (创建)                            │
│  ┌───────────────────────────────────────────────────┐      │
│  │  AI 输入 → 意图识别 → 参数生成 → 896×1464 预览    │      │
│  │  Vite + Vanilla JS | 9 个场景入口               │      │
│  └───────────────────────────────────────────────────┘      │
│                          │ HTTPS                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     云端服务                                │
│  ┌───────────────────────────────────────────────────┐      │
│  │  FastAPI (Python)                                 │      │
│  │  ├─ AI 生成: LLM (qwen-plus) + Mock 模式         │      │
│  │  ├─ Quality Gate: 白名单 + 自动截断              │      │
│  │  ├─ 模板注册: 9 种模板 × 多风格预设              │      │
│  │  └─ 同步: 轮询推送 (Demo)                         │      │
│  └───────────────────────────────────────────────────┘      │
│                          │ 轮询                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     车端 (运行)                              │
│  ┌───────────────────────────────────────────────────┐      │
│  │  WebView 容器 + JSBridge                          │      │
│  │  ├─ H5 模板直接渲染 (Liquid Glass 设计)           │      │
│  │  └─ 卡片切换: ← → 手动切换                       │      │
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、技术决策

| 决策项 | 选择 | 理由 | 状态 |
|--------|------|------|------|
| AI 生成方案 | 混合路线：精品模板 + AI 参数化 | 模板保证视觉下限，AI 做匹配和文案增强 | ✅ 已确定 |
| 设计语言 | Liquid Glass (Glassmorphism) | 对标 Apple CarPlay iOS 26，行业主流车载美学 | ✅ 已实施 |
| LLM 模型 | qwen-plus (阿里云通义千问) | 国内访问快，中文质量高，OpenAI 兼容模式 | ✅ 已验证 |
| 卡片尺寸 | 896×1464 逻辑像素 | 行车桌面 1/3 竖屏 | ✅ 已确定 |
| 模板引擎 | Vanilla JS + CSS 变量 | 最轻量，无框架依赖，单模板 ≤ 36KB | ✅ 已确定 |
| 前端构建 | Vite | 热更新快，构建轻量 | ✅ 已确定 |

### 竞品对比

| 竞品 | 方案 | 我们的差异化优势 |
|------|------|-----------------|
| 理想「桌面大师」 | AI 全代码生成，慢且质量不稳定 | 模板保证视觉下限，生成快 (1-3s) |
| Apple CarPlay iOS 26 | Liquid Glass 设计语言，无 AI 生成 | 有 AI 个性化能力 |
| 鸿蒙车机 | 原子化服务，开发者创建 | 用户可自己用自然语言创建 |

---

## 三、组件模板清单

### 9 个模板全部完成（Liquid Glass 设计语言）

| 模板 | 模板 ID | 风格预设 | 特色功能 |
|------|---------|---------|---------|
| 恋爱纪念 | `anniversary_love` | sweet-pink, vibrant-orange, soft-purple, ocean-blue, forest-green, warm-yellow, minimal-dark | 心形粒子 + 数字翻牌 + 里程碑文案 (520天/1314天等) |
| 宝宝成长 | `anniversary_baby` | soft-purple, sweet-pink, ocean-blue, warm-yellow | 星星粒子(旋转) + 宝宝里程碑 (满月/百天/周岁) |
| 放假倒计时 | `anniversary_holiday` | vibrant-orange, ocean-blue, forest-green, sweet-pink, soft-purple, warm-yellow, minimal-dark | 彩纸/钻石/闪光粒子(下落) + 倒计时感知 |
| 暖橙纪念 | `anniversary_warm` | vibrant-orange, warm-yellow, sweet-pink, minimal-dark | 萤火虫粒子(全向漂浮+呼吸闪烁) |
| 每日新闻 | `news_daily` | tech-blue, xiaomi-orange, ocean-blue, forest-green | 毛玻璃独立卡片 + 自动轮播高亮 + 交错淡入 |
| 闹钟 | `alarm_clock` | vibrant-orange, ocean-blue, forest-green, minimal-dark, digital-neon | SVG 进度环 + 实时倒计时 + 日夜感知 |
| **天气** | `weather_realtime` | clear-blue, twilight, warm-sun | 动态天气粒子(雨/雪/晴/云) + 3日预报 + AI穿衣建议 |
| **音乐播放器** | `music_player` | dark-vinyl, neon-purple, minimal-light | 专辑模糊背景 + CSS频谱动画 + 播放控制 + 歌词 |
| **日历日程** | `calendar_schedule` | business-gray, nature-green, elegant-white | 农历/节气 + 时间线 + 事件倒计时 |

### Liquid Glass 公共特性

所有模板共享以下 Design Tokens (`shared/tokens.css`)：

| 特性 | 实现 |
|------|------|
| 毛玻璃效果 | `backdrop-filter: blur(20px) saturate(1.8)` + 半透明背景 |
| 折射边框 | `rgba(255,255,255, 0.08)` 边框 + 内发光 |
| 深度阴影 | 三层 box-shadow 系统 (subtle/elevated/floating) |
| 呼吸光晕 | `breathing-glow` 动画，4s 周期 |
| 数字翻牌 | `digit-flip-in/out` 3D 翻转动画 |
| 交错淡入 | `stagger-fadeIn` + 0.08s 延迟 |
| 粒子系统 | Canvas 2D，每模板 15-25 粒子，主题色适配 |
| 高光扫过 | `light-sweep` 动画 |
| WebView 兼容 | `@supports` 降级方案 (backdrop-filter / background-clip) |

---

## 四、AI Pipeline

### 生成模式

| 模式 | 端点 | 说明 |
|------|------|------|
| 自然语言 | `POST /api/chat-generate` | 一句话描述 → AI 理解意图 → 选模板 + 生成参数 |
| 结构化 | `POST /api/generate` | 用户已选模板/主题 → AI 补全参数 |

### 意图识别关键词

| 场景 | 关键词 |
|------|--------|
| 恋爱纪念 | 恋爱、在一起、结婚、女朋友、男朋友、老婆、老公 |
| 宝宝成长 | 宝宝、孩子、出生、满月、周岁 |
| 放假倒计时 | 放假、倒计时、国庆、春节、五一 |
| 闹钟 | 闹钟、起床、叫我、提醒 |
| 新闻 | 新闻、资讯、热点、头条 |
| 天气 | 天气、温度、穿什么、下雨、多少度 |
| 音乐 | 音乐、歌、播放、听歌 |
| 日历 | 日历、日程、安排、会议、行程 |

### Quality Gate

- `template_id` 白名单：9 个合法 ID
- `style_preset` 白名单：按模板限定可用风格
- 文案自动截断：title ≤ 20字, subtitle ≤ 30字
- 数值 clamp：时间 0-23, 新闻条数 3-8
- Mock 模式：无 API Key 时自动激活，关键词匹配生成

### API 配置

```bash
# .env
QWEN_API_KEY=sk-xxx    # 阿里云通义千问（主力）
# 无 Key 时自动 Mock 模式
```

---

## 五、开发进度

### ✅ 已完成

| 阶段 | 内容 | 状态 |
|------|------|------|
| 项目架构 | 目录结构、配置文件、构建工具 | ✅ |
| Design Tokens | `tokens.css` 500+ 行 — 深浅色主题、6 色系、间距/字号/动画 | ✅ |
| **Liquid Glass 升级** | Glassmorphism 变量、呼吸光晕、数字翻牌、粒子、深度阴影 | ✅ |
| 纪念日模板 ×4 | love/baby/holiday/warm — 全部 Liquid Glass 升级 | ✅ |
| 新闻模板 | 毛玻璃卡片 + 轮播高亮 + 交错淡入 | ✅ |
| 闹钟模板 | SVG 进度环 + 实时倒计时 + 日夜感知 | ✅ |
| **天气模板** (新建) | 动态天气粒子 + 3日预报 + AI建议 | ✅ |
| **音乐播放器** (新建) | 频谱动画 + 播放控制 + 歌词 | ✅ |
| **日历日程** (新建) | 农历/节气 + 时间线 + 事件倒计时 | ✅ |
| AI Pipeline | prompt.py + generator.py + validator.py (9模板注册) | ✅ |
| 手机端 Web App | 首页(9场景) + 配置 + 预览 + 我的组件 + 同步 | ✅ |
| 自然语言创建 | `/api/chat-generate` + 意图识别 + Mock 模式 | ✅ |
| 车端模拟器 | `car-simulator.html` 896×1464 + 卡片切换 | ✅ |
| JSBridge | Mock 实现，支持浏览器开发 | ✅ |
| 公网部署 | Render 后端 + Netlify 前端 + 自动部署 | ✅ |

### 🔲 下一步计划

| 优先级 | 内容 | 预计工期 |
|--------|------|---------|
| P0 | 视觉走查 — 每个模板×风格在 car-simulator 中逐一截图验证 | 1-2 天 |
| P0 | 内容真实性 — 天气接入和风天气 API、新闻接入真实 API | 2-3 天 |
| P1 | 多方案预览 — 一次生成 3 个风格变体供选择 | 2-3 天 |
| P1 | 交互式微调 — "换个颜色"/"文字大一点" 快捷调整 | 2-3 天 |
| P1 | 文案智能增强 — 节日感知、季节感知、里程碑感知 | 1-2 天 |
| P2 | 手机端体验 — 生成中骨架屏、"哇"时刻弹出动画 | 2 天 |
| P2 | 车端模拟器升级 — 更真实的车机环境、物理切换动效 | 1-2 天 |
| P2 | Demo 演示包 — 预生成精品组件、3分钟演示脚本 | 1 天 |
| P3 | 车端 Android WebView 真机集成 | 待定 |

---

## 六、文件清单

### 组件模板 (`src/widget-templates/`)

```
shared/
├── tokens.css                 # Design Tokens (Liquid Glass) — 580+ 行
└── bridge.js                  # JSBridge Mock 封装

anniversary/
├── love/     {index.html, style.css, main.js}  — 恋爱纪念 (32KB)
├── baby/     {index.html, style.css, main.js}  — 宝宝成长 (32KB)
├── holiday/  {index.html, style.css, main.js}  — 放假倒计时 (36KB)
└── warm/     {index.html, style.css, main.js}  — 暖橙纪念 (24KB)

news/         {index.html, style.css, main.js}  — 每日新闻 (24KB)
alarm/        {index.html, style.css, main.js}  — 闹钟 (24KB)
weather/      {index.html, style.css, main.js}  — 天气 (28KB)
music/        {index.html, style.css, main.js}  — 音乐播放器 (28KB)
calendar/     {index.html, style.css, main.js}  — 日历日程 (28KB)
```

### 后端 (`src/server/`)

```
main.py                        # FastAPI 主应用 (port 8000)
requirements.txt               # Python 依赖
ai_generator/
├── prompt.py                  # 模板配置 + NL/结构化 System Prompt
├── generator.py               # LLM 调用 (Qwen/GPT/Claude) + Mock
└── validator.py               # Quality Gate (白名单+截断+clamp)
sync_service/                  # 同步推送 (轮询模式)
news_service/                  # 新闻聚合
storage/                       # 元数据存储 (内存)
```

### 前端 (`src/mobile-web/`)

```
package.json + vite.config.js  # 构建配置
index.html                     # 入口 HTML
src/
├── main.js                    # 路由 + Toast
├── api.js                     # API 客户端
├── router.js                  # 页面路由
├── styles/main.css            # 全局样式
└── pages/
    ├── market.js              # 首页 AI 创建 (9 场景卡片)
    ├── config.js              # 参数配置
    ├── preview.js             # 896×1464 预览 (iframe srcdoc)
    ├── my-widgets.js          # 我的组件
    └── sync.js                # 同步确认
public/
└── car-simulator.html         # 车端模拟器
```

---

## 七、部署

| 服务 | 平台 | 地址 |
|------|------|------|
| 后端 API | Render (免费, 冷启动 ~50s) | https://ai-widget-api.onrender.com |
| 前端 | Netlify | https://ai-apps-car.netlify.app |
| 代码仓库 | GitHub | https://github.com/mileszhang001-boom/ai-app |

前端通过 Netlify `/api/*` 代理到 Render 后端。

---

## 八、启动与验证

### 本地启动

```bash
# 后端
cd src/server
pip install -r requirements.txt
python3 main.py          # → http://localhost:8000

# 前端
cd src/mobile-web
npm install
npm run dev              # → http://localhost:3000
```

### 验证流程

1. 打开 http://localhost:3000
2. 在首页输入 "和女朋友6月1日在一起的"
3. 确认 AI 生成 → 预览页显示 896×1464 恋爱纪念卡片
4. 切换测试："北京今天天气" / "给我来个音乐播放器" / "今天有什么会议"
5. 打开 http://localhost:3000/car-simulator.html 验证车端模拟效果

---

## 九、与远程仓库的关系

远程仓库 (GitHub) 有同事 yalohan 的一次大重构 (2fc98ba, 2026-03-17)，采用了完全不同的架构（AI 全代码生成，删除所有模板）。

**当前策略**：
- 不直接 merge（架构差异过大）
- 本地保持"精品模板 + AI 参数化"架构
- 可选择性提取远程版本的 `ui-ux-pro-max` 设计系统参考数据
