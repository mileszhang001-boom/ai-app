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

## 四、AI Pipeline — 三维正交生成系统

### 4.1 系统架构：三层正交

```
用户输入: "十周年、浪漫、红色"
           │
    ┌──────┴──────────────┐
    │   AI 语义理解层       │  ← generator.py (_mock_nl_response / LLM API)
    │   意图识别 + 参数提取  │
    └──────┬──────────────┘
           │
    ┌──────┼──────────┐
    │      │          │
    ▼      ▼          ▼
  模板选择  风格宏      颜色引擎
  9种模板   4种风格     任意hex
  ×         ×          ×
  各自theme  glass      #CC2244
             minimal    (用户自定义)
             material
             pixel
```

三个维度**完全正交**，可自由组合：
- **9 模板 × 4 风格 × 无限颜色 = 无限组合**
- 向后兼容：不传 `primary_color` 或 `visual_style` 时，行为与之前完全一致

### 4.2 端到端生成流程（逐步详解）

以用户输入 **"做一个红色的结婚纪念卡片，要高级感"** 为例：

```
━━━ STEP 1: 用户输入（手机端 market.js）━━━━━━━━━━━━━━━━━━
耗时: 0ms | 调用模型: 否 | 风险: 无

用户在首页 AI 输入框输入自然语言，点击生成。
前端发起 POST /api/chat-generate { "text": "做一个红色的结婚纪念卡片，要高级感" }

输出: HTTP 请求发送到后端
```

```
━━━ STEP 2: 意图识别（generator.py → _mock_nl_response）━━━
耗时: Mock <50ms / LLM 1-3s | 调用模型: Mock否/LLM是 | 风险: ⚠️ 中

2a. 颜色提取 (_extract_color)
    "红色" → 命中 COLOR_KEYWORDS → "#CC2244"

2b. 视觉风格提取 (_extract_visual_style)
    "高级感" → 命中 STYLE_KEYWORDS["glass"] 中的 "高级" → "glass"

2c. 日期提取 (_extract_date_enhanced)
    无明确日期 → 无周年数 → fallback "2024-06-01"

2d. 意图匹配
    "结婚" → 命中 love_keywords → component_type="anniversary", theme="love"

2e. 智能 title
    "结婚" 匹配 → title="结婚纪念日"

2f. 文案生成 (_generate_nl_subtitle)
    days_diff=根据日期计算 → random.choice(对应区间的8-12个选项)

2g. 结果组装 (_build_result)
    注入 primary_color="#CC2244", visual_style="glass"
    style_preset 设为 "dynamic"（因为有 primary_color）

输出:
{
  "component_type": "anniversary",
  "mode": "countup",
  "theme": "love",
  "template_id": "anniversary_love",
  "style_preset": "dynamic",
  "primary_color": "#CC2244",
  "visual_style": "glass",
  "params": {
    "title": "结婚纪念日",
    "start_date": "2024-06-01",
    "subtitle": "岁月流转爱意永驻"    ← 每次可能不同 (random.choice)
  }
}

⚠️ 风险点:
- Mock模式: 关键词匹配可能误判（如 "爱心形状的天气" 会匹配到 love 而非 weather）
- LLM模式: JSON 格式偶尔不合法（概率 <1%，有 _parse_response 兜底）
- 日期理解: "明天是十周年" 可正确处理，但 "后年的国庆" 不支持
```

```
━━━ STEP 3: Quality Gate（validator.py）━━━━━━━━━━━━━━━━━━
耗时: <5ms | 调用模型: 否 | 风险: 低

3a. 基础字段检查: component_type/template_id/style_preset/params 必须存在
3b. component_type 白名单: "anniversary" ✅
3c. theme 白名单: "love" ∈ {"love","baby","holiday","warm"} ✅
3d. template_id 白名单: "anniversary_love" ∈ VALID_TEMPLATE_IDS ✅
3e. style_preset: "dynamic" → 特殊放行 ✅
3f. primary_color 格式: "#CC2244" 匹配 /^#[0-9A-Fa-f]{6}$/ ✅
3g. visual_style 枚举: "glass" ∈ {"glass","minimal","material","pixel"} ✅
3h. params 逐字段:
    - title: "结婚纪念日" (string, len=5 ≤ 20) ✅
    - start_date: "2024-06-01" (date, YYYY-MM-DD) ✅
    - subtitle: 如果超过30字 → 自动截断 + warning

输出: (is_valid=True, cleaned_params, warnings)

⚠️ 风险点:
- 如果 LLM 输出了不在白名单的 template_id → 直接拒绝，不会渲染
- 文案超长自动截断，可能截断后语义不通（概率极低，30字限制宽裕）
```

```
━━━ STEP 4: 响应返回（main.py → preview.js）━━━━━━━━━━━━━
耗时: <10ms | 调用模型: 否 | 风险: 无

后端返回 JSON → 前端 preview.js 接收
preview.js.buildWidgetParams() 透传:
- params.primary_color = "#CC2244"
- params.visual_style = "glass"
- params.style_preset = "dynamic"

输出: widgetParams 对象，注入到 iframe
```

```
━━━ STEP 5: 模板渲染（iframe srcdoc + H5 模板）━━━━━━━━━━
耗时: 200-500ms | 调用模型: 否 | 风险: ⚠️ 低

5a. preview.js 根据 template_id 找到模板 URL
    "anniversary_love" → /widget-templates/anniversary/love/index.html

5b. fetch 模板 HTML，修复相对路径，注入 __WIDGET_PARAMS__

5c. 模板 main.js init() 执行:

    ① style_preset="dynamic" → data-style="dynamic"

    ② primary_color="#CC2244" → computePalette("#CC2244")
       color-engine.js 计算:
       - hex→RGB→HSL
       - 生成背景渐变(暗色, hue=340°, sat=30%, light=8%)
       - 生成 glow/glass/label/divider 各槽位颜色
       - 设置 12 个 CSS 自定义属性 (--dyn-bg, --dyn-glow-primary, ...)

    ③ visual_style="glass" → data-visual-style="glass"
       glass 是默认风格，无额外 CSS 覆盖

    ④ visual-styles.css 中的 [data-style="dynamic"] 规则生效:
       - .widget-love 背景 → var(--dyn-bg) → 红色暗调渐变
       - .glow-primary → 红色光晕
       - .glass-card → 红色微透毛玻璃
       - .ambient-line → 红色氛围线

    ⑤ 粒子系统 getParticleColor() 检测 data-style="dynamic"
       → computePalette().particleRgb → 红色心形粒子

    ⑥ 数字翻牌动画: calculateDays() → animateInitial() → 数字递增

输出: 一张 896×1464 的红色主题、毛玻璃风格、心形粒子的恋爱纪念卡片

⚠️ 风险点:
- 极浅色（黄/白）：color-engine 有 clamp 保护（饱和度≥0.15, 亮度≥0.10）
- 极深色（纯黑）：同上保护
- WebView 不支持 backdrop-filter：@supports 降级为实色背景
- CSS 变量未设置：所有 var() 有 fallback 值
```

```
━━━ 完整时序图 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 用户          前端(market.js)      后端(main.py)        generator.py        validator.py        前端(preview.js)       iframe(模板)
  │                │                    │                    │                   │                    │                    │
  │──输入文字───►│                    │                    │                   │                    │                    │
  │                │──POST /api/──────►│                    │                   │                    │                    │
  │                │  chat-generate     │──_mock_nl_resp──►│                   │                    │                    │
  │                │                    │                    │──颜色提取         │                    │                    │
  │                │                    │                    │──风格提取         │                    │                    │
  │                │                    │                    │──日期提取         │                    │                    │
  │                │                    │                    │──意图匹配         │                    │                    │
  │                │                    │                    │──文案生成         │                    │                    │
  │                │                    │◄──JSON────────────│                   │                    │                    │
  │                │                    │──validate────────────────────────────►│                    │                    │
  │                │                    │◄──(ok, cleaned)──────────────────────│                    │                    │
  │                │◄──200 JSON────────│                    │                   │                    │                    │
  │                │──navigate('preview')────────────────────────────────────►│                    │
  │                │                    │                    │                   │──fetch template──►│                    │
  │                │                    │                    │                   │──inject params───►│                    │
  │                │                    │                    │                   │                    │──init()            │
  │                │                    │                    │                   │                    │  computePalette()  │
  │                │                    │                    │                   │                    │  set CSS vars      │
  │                │                    │                    │                   │                    │  render particles  │
  │◄──看到预览────│                    │                    │                   │                    │  render number     │
  │                │                    │                    │                   │                    │                    │

  总耗时: Mock模式 ≈ 0.3-0.8s | LLM模式 ≈ 2-4s
```

### 4.3 两种运行模式对比

| 维度 | Mock 模式 (无 API Key) | LLM 模式 (有 API Key) |
|------|----------------------|----------------------|
| 激活条件 | `QWEN_API_KEY` 未设置 | `QWEN_API_KEY` 已设置 |
| 意图识别 | 关键词匹配 (generator.py) | LLM 语义理解 (qwen-plus) |
| 颜色/风格提取 | 本地关键词表 (12种颜色) | LLM 理解 + prompt 中的映射表 |
| 文案生成 | random.choice(8-12个预设) | LLM 自由创作 |
| 日期理解 | 正则 + 相对日期计算 | LLM 语义理解 |
| 耗时 | **<100ms** | **1-3s** |
| 准确率 | ~85%（关键词覆盖有限） | ~95%（复杂语句也能理解） |
| 文案创意 | 固定池随机选取 | 每次独创 |
| 适用场景 | 开发测试、Demo 演示 | 线上正式使用 |

### 4.4 三维系统详解

#### 颜色引擎 (shared/color-engine.js)

```
输入: "#CC2244" (任意hex)
  │
  ├─ hex → RGB → HSL
  ├─ 背景: hue保留, sat×0.30, light=0.08 (三个stop微调)
  ├─ glowPrimary: 原色 opacity=0.22
  ├─ glowSecondary: 亮化版 opacity=0.12
  ├─ glowTertiary: 亮化版 opacity=0.06
  ├─ ambientLine: 亮化版 opacity=0.50
  ├─ glassBg: 原色 opacity=0.04
  ├─ glassBorder: 亮化版 opacity=0.10
  ├─ labelColor: 亮化版 opacity=0.50
  ├─ dividerColor: 亮化版 opacity=0.20
  ├─ particleRgb: 亮化版 [r,g,b]
  └─ 12个 CSS 自定义属性 (--dyn-*)
```

边缘 case 保护：
- 极浅色(黄/白): 饱和度 clamp ≥ 0.15
- 极深色(纯黑): 亮度 clamp ≥ 0.10

#### 视觉风格宏 (shared/visual-styles.css)

| 风格 | 特征 | 覆盖的属性 |
|------|------|-----------|
| `glass` | 默认 Liquid Glass | 无额外CSS（使用模板自身样式） |
| `minimal` | 极简墨线 | 隐藏光晕/粒子，transparent卡片，4px圆角，font-weight:200 |
| `material` | Material Design | 隐藏光晕，实色卡片(0.95)，elevation阴影，font-weight:700 |
| `pixel` | 8bit像素 | Press Start 2P字体，0圆角，3px实线边框，pixelated渲染 |

### 4.5 Quality Gate

| 校验项 | 规则 | 不通过处理 |
|--------|------|-----------|
| `component_type` | 必须 ∈ {anniversary,news,alarm,weather,music,calendar} | 拒绝 |
| `theme` | 必须匹配 component_type 的合法主题 | 拒绝 |
| `template_id` | 必须 ∈ 9个合法ID | 拒绝 |
| `style_preset` | ∈ 全局白名单 或 "dynamic" | 拒绝 |
| `primary_color` | 可选，匹配 `#RRGGBB` | 拒绝 |
| `visual_style` | 可选，∈ {glass,minimal,material,pixel} | 拒绝 |
| `title` | string, ≤20字 | 自动截断 |
| `subtitle` | string, ≤30字 | 自动截断 |
| `start_date` | YYYY-MM-DD | 拒绝 |
| 数值参数 | 范围 clamp（新闻条数 3-8 等） | 自动 clamp |

### 4.6 意图识别关键词

| 场景 | 关键词 | 特殊检测 |
|------|--------|---------|
| 恋爱纪念 | 恋爱、在一起、结婚、周年、女朋友、老婆、对象 | N周年反推start_date |
| 宝宝成长 | 宝宝、孩子、出生、满月、周岁 | "我家XXX...N天"模式 |
| 放假倒计时 | 放假、倒计时、国庆、春节、五一、端午 | 自动推算节日日期 |
| 闹钟 | 闹钟、起床、叫我、提醒、上班 | 提取时间 HH:MM |
| 新闻 | 新闻、资讯、热点、头条 | — |
| 天气 | 天气、温度、穿什么、下雨、多少度 | 提取城市名 |
| 音乐 | 音乐、歌、播放、听歌、播放器 | 提取歌手名 |
| 日历 | 日历、日程、安排、会议、行程 | — |

**颜色关键词**: 红→#CC2244, 蓝→#2255CC, 粉→#CC6688, 绿→#22AA66, 金→#CCAA33, 紫→#8844CC, 橙→#CC6622, 青→#22AAAA, 霓虹紫→#8844CC

**风格关键词**: 简约/科技/极简→minimal, 活力/青春/潮流→material, 复古/像素→pixel, 浪漫/高级/优雅→glass

### 4.7 API 配置

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
| Design Tokens | `tokens.css` 580+ 行 — 深浅色主题、6 色系、间距/字号/动画 | ✅ |
| **Liquid Glass 升级** | Glassmorphism 变量、呼吸光晕、数字翻牌、粒子、深度阴影 | ✅ |
| 纪念日模板 ×4 | love/baby/holiday/warm — 全部 Liquid Glass 升级 | ✅ |
| 新闻模板 | 毛玻璃卡片 + 轮播高亮 + 交错淡入 | ✅ |
| 闹钟模板 | SVG 进度环 + 实时倒计时 + 日夜感知 | ✅ |
| **天气模板** | 动态天气粒子 + 3日预报 + AI建议 | ✅ |
| **音乐播放器** | 频谱动画 + 播放控制 + 歌词 | ✅ |
| **日历日程** | 农历/节气 + 时间线 + 事件倒计时 | ✅ |
| AI Pipeline | prompt.py + generator.py + validator.py (9模板注册) | ✅ |
| 手机端 Web App | 首页(9场景) + 配置 + 预览 + 我的组件 + 同步 | ✅ |
| 自然语言创建 | `/api/chat-generate` + 意图识别 + Mock 模式 | ✅ |
| 车端模拟器 | `car-simulator.html` 896×1464 + 卡片切换 | ✅ |
| JSBridge | Mock 实现，支持浏览器开发 | ✅ |
| 公网部署 | Render 后端 + Netlify 前端 + 自动部署 | ✅ |
| **动态配色引擎** | `color-engine.js` — 任意hex→完整调色板，9模板全部集成 | ✅ |
| **视觉风格宏** | `visual-styles.css` — glass/minimal/material/pixel，9模板全部集成 | ✅ |
| **语义联动** | 颜色关键词提取、风格语义映射、三维正交组合 | ✅ |
| **文案引擎升级** | 8-12选项/区间 + random.choice + 节日专属池 + 情感融入 | ✅ |
| **日期理解增强** | 明天/后天/下周X/X月X日/N周年反推/N天反推 | ✅ |

### ✅ 视觉质量保障系统

| 阶段 | 内容 | 状态 |
|------|------|------|
| 预修复 | 5 个已知 CSS Bug（溢出/对比度/字号） | ✅ |
| 截图引擎 | Playwright 896×1464 自动截图 | ✅ |
| 规则引擎 | 8 项自动检查（溢出/对比度/颜色/布局/字体/内容/风格/粒子） | ✅ |
| 测试语料 | 50 条测试 query（6 个类别覆盖） | ✅ |
| 报告系统 | HTML 报告（截图 + 分数 + issue + 回归对比） | ✅ |
| 视觉模型 | Claude Vision 主观评分（可选） | ✅ stub |

### ✅ 第一轮视觉质量评估（50 case 全部通过）

| 指标 | 首轮 | 修复后 |
|------|------|--------|
| 通过率 | 44/50 (88%) | **50/50 (100%)** |
| 平均分 | 79 | **85** |
| 生成失败 | 1 | **0** |
| 最低分 | 0 | **66** |

修复内容：截图引擎时序 (add_init_script)、Mock 生成器「」括号提取 + 英文关键词 + 圣诞节 + 模糊 fallback、规则引擎 glow/hero-number 误报排除。

### 🔲 下一步计划

| 优先级 | 内容 | 预计工期 |
|--------|------|---------|
| P0 | 视觉质量持续优化 — 提高 color_08(cyan) 等低分 case 至 80+ | 1 天 |
| P0 | 内容真实性 — 天气接入和风天气 API、新闻接入真实 API | 2-3 天 |
| P1 | 多方案预览 — 一次生成 3 个风格变体供选择 | 2-3 天 |
| P1 | 交互式微调 — "换个颜色"/"换个风格" 快捷调整 | 2-3 天 |
| P2 | 手机端体验 — 生成中骨架屏、"哇"时刻弹出动画 | 2 天 |
| P2 | Demo 演示包 — 预生成精品组件、3分钟演示脚本 | 1 天 |
| P3 | 车端 Android WebView 真机集成 | 待定 |

---

## 六、视觉质量保障系统

> "用户说红色，卡片是否真的红了？文字是否溢出？对比度是否可读？"

传统的人工视觉走查无法覆盖 **9 模板 × 4 风格 × 无限颜色** 的组合空间。质量保障系统通过自动化的 **评分 → 诊断 → 修复** 闭环，使每次生成的卡片可被量化评估，bad case 可追溯到具体代码位置。

### 6.1 设计原则

从 WidgetSmith / Apple Widgets / 理想桌面大师等竞品中提炼：

| 原则 | 要求 | 检测方式 |
|------|------|---------|
| 三层信息层级 | 卡片最多 3 层（hero数字 → 标签 → 辅助文案） | 规则引擎 R4 |
| 2秒可读 | 主信息在 2 秒内必须看清（车载场景不能分心） | 规则引擎 R2 对比度 |
| 色彩同族 | 所有颜色源自同一色调家族（color-engine 保证） | 规则引擎 R3 色相对比 |
| 暗色安全 | 不出现纯白 #FFFFFF，文字带透明度过渡到背景 | 规则引擎 R2 WCAG |
| 边距呼吸 | 内容距卡片边缘 ≥ 24px | 规则引擎 R4 边界检测 |
| 动效克制 | 粒子/光晕增强氛围，不遮挡内容 | 规则引擎 R8 粒子健康 |

### 6.2 系统架构

```
              ┌─────────────────────────────────────────┐
              │         batch_runner.py                  │
              │  遍历 50 条测试 query → 逐条执行管线     │
              └────────────┬────────────────────────────┘
                           │
          ┌────────────────┼────────────────────┐
          ▼                ▼                    ▼
 ① API 生成           ② 截图渲染            ③ 评分
 POST /api/            Playwright             规则引擎
 chat-generate         896×1464               8项检查
 → JSON params         → PNG screenshot       → 0-100 分
          │                │                    │
          └────────────────┴────────────────────┘
                           │
              ┌────────────▼────────────────────┐
              │         report.py                │
              │  HTML 报告：截图 + 分数 + issue   │
              │  + 修复建议 + 回归对比            │
              └─────────────────────────────────┘
```

### 6.3 截图引擎 (Playwright)

用 Playwright (Python) 启动 Chromium 无头浏览器，直接以 896×1464 视口打开模板页面截图。

**流程**：

1. 调用 `POST /api/chat-generate` 获取生成结果 JSON
2. 根据 `component_type` + `theme` 拼接模板 URL（通过 Vite dev server 访问）
3. 注入 `window.__WIDGET_PARAMS__`，设置 `data-style` 和 `data-visual-style` 属性
4. 等待字体加载 (`document.fonts.ready`) + 动画稳定 (2s)
5. 截图保存为 PNG

**关键设计**：

- 不走 iframe srcdoc，直接 `page.goto` 模板 URL → 更稳定，路径解析与生产一致
- 通过 `page.evaluate` 注入参数 → reload → 再次注入 → 等待渲染，模拟真实预览行为
- 批量模式复用同一 Browser 实例，避免反复启动 Chromium 的开销

### 6.4 规则引擎 — 8 项自动检查

在 Playwright page context 中执行 JS 检查 + Pillow 分析截图像素：

| # | 检查项 | 权重 | 方法 | 检测内容 |
|---|--------|------|------|---------|
| R1 | **文字溢出** | 20% | DOM: `scrollWidth > clientWidth` | 所有文字元素是否超出容器 |
| R2 | **对比度** | 15% | DOM 取前景色 + Pillow 采样背景色 → WCAG 比值 | 文字与背景对比度 ≥ 4.5:1 |
| R3 | **颜色遵从** | 15% | Pillow: 提取截图上半区主色调 hue → 与请求颜色比对 | 用户说红色，卡片是否红色 |
| R4 | **布局完整** | 15% | DOM: 所有元素 `getBoundingClientRect()` 在 0-896 / 0-1464 内 | 无元素超出卡片边界 |
| R5 | **字体加载** | 10% | DOM: `document.fonts` 枚举状态 | Bebas Neue / Press Start 2P 是否加载成功 |
| R6 | **内容填充** | 10% | DOM: 扫描可见文本，检查 `--` 或 `undefined` 占位 | 参数是否成功注入 |
| R7 | **风格正确** | 10% | DOM: 检查 `data-visual-style` + 特定元素 display 状态 | minimal 该隐藏粒子的确隐藏了 |
| R8 | **粒子健康** | 5% | DOM: `canvas.getImageData` 检查非零像素 | 粒子系统是否正常运行 |

**评分规则**：

- 每项检查输出 0-100 分（通过=100，按严重程度递减）
- 综合分 = Σ (检查分 × 权重)
- **≥ 80 优秀** / **60-79 合格** / **< 60 需修复**

### 6.5 颜色匹配算法

颜色遵从 (R3) 是本系统最核心的检查——它回答"用户说红色，卡片是否真的红了"。

```
用户输入 "红色"
    │
    ├─ 关键词匹配 → 预期色相 hue=0°, 容差=30°
    │  (12种颜色关键词: 红/蓝/紫/绿/橙/粉/黄/青 + 英文)
    │
    └─ 若是 hex 值 "#CC2244" → RGB→HSV → hue=350°, 容差=30°

截图分析
    │
    ├─ Pillow 打开截图，裁剪上半区（hero 区域）
    ├─ 逐像素转 HSV，过滤低饱和度(s<0.15)和低明度(v<0.10)的像素
    ├─ 收集有效像素的 hue 值，取中位数作为"主色调"
    │
    └─ 计算色相角距离 = |主色调 - 预期色相| (环形取最小值)

判定
    │
    ├─ 距离 ≤ 容差 → PASS
    └─ 距离 > 容差 → FAIL, 得分按距离/容差比例衰减
```

### 6.6 测试语料 — 50 条

| 类别 | 数量 | 目的 | 典型 case |
|------|------|------|----------|
| 颜色 × 模板 | 12 | 验证 12 种颜色关键词在不同模板下的配色效果 | "红色恋爱纪念日"、"蓝色天气"、"#CC2244" |
| 视觉风格 | 8 | 验证 4 种风格在不同模板下的结构覆盖 | "极简天气"、"像素风恋爱纪念" |
| 文本压力 | 10 | 长标题/副标题/歌词/建议文本的溢出检测 | 30字标题、60字副标题 |
| 意图边界 | 10 | 模糊意图/冲突关键词/只有日期等边缘 case | "今天天气怎么样"、"做个好看的卡片" |
| 三维组合 | 5 | 颜色 + 风格 + 模板同时指定 | "红色像素风恋爱纪念日" |
| 向后兼容 | 5 | 不带颜色/风格的传统输入，确认不回归 | "恋爱纪念日，2024-06-01" |

每条 query 附带 `expected_type`、`expected_color`、`expected_style`、`min_score`，支持自动判定通过/失败。

### 6.7 HTML 报告

报告包含：

- **总览面板**：总数 / 优秀 / 合格 / 失败 / 平均分
- **逐 case 卡片**：截图 + 分数 + 失败检查项 + issue 列表
- **回归对比**：与上次运行对比，显示分数 +/- 变化
- **筛选器**：按 All / Failed / Passed / Excellent 过滤

### 6.8 视觉模型评分（可选 Phase）

规则引擎覆盖结构性问题（溢出/对比度/颜色/布局），但无法评估主观质量：
- "这张卡片看起来高级吗？"
- "布局是否和谐？"
- "和 Apple CarPlay 同级别吗？"

视觉模型评分通过 Claude Vision API 对截图做 6 维打分：

| 维度 | 权重 | 评估内容 |
|------|------|---------|
| 意图匹配 | 25% | 卡片类型是否对应用户需求 |
| 配色匹配 | 20% | 配色是否与描述一致 |
| 文字可读 | 20% | 手臂距离是否清晰辨认 |
| 布局质量 | 15% | 层级清晰、留白舒适 |
| 美观质感 | 10% | 对标 Apple/Tesla 车机品质 |
| 暗色和谐 | 10% | 暗色环境无刺眼亮点 |

**综合评分** = 0.5 × 规则引擎分 + 0.5 × 视觉模型分

当前为 stub 实现，可在规则引擎跑出基线后按需激活。

### 6.9 Bad Case 诊断矩阵

报告中每个失败 case 可直接定位到修复位置：

| 症状 | 检测方式 | 修复位置 |
|------|---------|---------|
| 选错模板 | intent_mismatch | `generator.py` 关键词表扩充 |
| 颜色不对 | R3 color_match 失败 | `generator.py _extract_color()` 或 `color-engine.js` |
| 文字溢出 | R1 text_overflow 失败 | 对应模板 `style.css` 加 overflow/truncation |
| 对比度差 | R2 contrast 失败 | `tokens.css` 提高 opacity 或 `color-engine.js` lighten |
| 布局错位 | R4 layout_bounds 失败 | 对应模板 `style.css` 定位/尺寸修复 |
| 参数丢失 | R6 content_filled 失败 | `preview.js` 路径或 `main.js` init 逻辑 |
| 风格不生效 | R7 style_correct 失败 | `visual-styles.css` 选择器或 `main.js` 属性设置 |
| 粒子不工作 | R8 particle_health 失败 | 对应模板 `main.js` canvas 逻辑 |

**修复优先级**：
- **P0**: 文字溢出（用户看到破版）、选错模板（完全答非所问）
- **P1**: 对比度不合格（车上看不清）、颜色不对（用户会发现）
- **P2**: 布局小问题、粒子不工作、风格部分生效

### 6.10 已修复的结构性 Bug

#### 第零轮：预先修复（搭建评分系统前）

| Bug | 文件 | 修复 |
|-----|------|------|
| weather 建议文本溢出 | `weather/style.css` | 加 `-webkit-line-clamp: 2` + `overflow: hidden` |
| 三级文字对比度仅 2.8:1 | `shared/tokens.css` | `--dark-text-tertiary` opacity 0.30 → 0.45 |
| pixel 风格 hero 数字溢出 | `shared/visual-styles.css` | `font-size: 48px` → `clamp(36px, 5vw, 48px)` |
| 纪念日副标题无截断 | `anniversary/*/style.css` ×4 | 加 `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` |

#### 第一轮：跑批后修复（50 case 从 88% → 100%）

| Bug | 文件 | 修复 |
|-----|------|------|
| 截图引擎参数注入太晚 | `screenshot.py`, `batch_runner.py` | `page.evaluate` → `page.add_init_script` |
| Mock 不识别「」括号内容 | `generator.py` | 新增 `_extract_bracketed()` 正则提取器 |
| 缺英文颜色/风格关键词 | `generator.py` | COLOR_KEYWORDS + STYLE_KEYWORDS 补充英文 |
| "圣诞节"不在倒计时关键词中 | `generator.py` | holiday_keywords 补充"圣诞" + 日期推算 |
| 模糊 query 直接报错 | `generator.py` | 兜底随机返回展示型模板 |
| glow 元素误报越界 | `rule_checks.py` | 排除 `glow-primary/secondary/tertiary` |
| hero-number 误报溢出 | `rule_checks.py` | 排除 `line-height<1` 的紧凑数字排版 |

### 6.11 使用方式

```bash
# 安装依赖
pip3 install playwright Pillow requests
python3 -m playwright install chromium

# 启动服务（需要后端 + 前端同时运行）
cd src/server && python3 main.py          # 终端 1
cd src/mobile-web && npm run dev          # 终端 2

# 跑全部 50 条测试
python3 -m src.quality.batch_runner

# 只跑指定 case
python3 -m src.quality.batch_runner --ids color_01,style_01,text_03

# 开启视觉模型评分
ANTHROPIC_API_KEY=sk-xxx python3 -m src.quality.batch_runner --vision

# 与上次结果对比
python3 -m src.quality.batch_runner --compare quality_reports/20260321_143000

# 查看报告
open quality_reports/latest/index.html
```

**迭代循环**：

```
跑批量测试 → 查看报告 → 修复 score < 60 的 case → 重跑回归 → 确认无回归
```

---

## 七、文件清单

### 组件模板 (`src/widget-templates/`)

```
shared/
├── tokens.css                 # Design Tokens (Liquid Glass) — 580+ 行
├── color-engine.js            # 动态配色引擎 (hex→调色板, 4.3KB)
├── visual-styles.css          # 4种视觉风格宏 (glass/minimal/material/pixel, 9.2KB)
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

### 质量保障 (`src/quality/`)

```
__init__.py                    # 包初始化
__main__.py                    # python -m 入口
config.py                     # 权重/阈值/模板URL/颜色色相表
screenshot.py                  # Playwright 截图引擎 (896×1464)
rule_checks.py                 # 8 项规则检查 (DOM+Pillow)
vision_scorer.py               # 视觉模型评分 (Claude Vision, 可选)
test_queries.py                # 50 条测试语料 (6 个类别)
batch_runner.py                # 批量测试编排 (生成→截图→评分→报告)
report.py                      # HTML 报告生成 (截图+分数+对比)
requirements.txt               # playwright, Pillow, httpx
```

---

## 八、部署

| 服务 | 平台 | 地址 |
|------|------|------|
| 后端 API | Render (免费, 冷启动 ~50s) | https://ai-widget-api.onrender.com |
| 前端 | Netlify | https://ai-apps-car.netlify.app |
| 代码仓库 | GitHub | https://github.com/mileszhang001-boom/ai-app |

前端通过 Netlify `/api/*` 代理到 Render 后端。

---

## 九、启动与验证

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

## 十、与远程仓库的关系

远程仓库 (GitHub) 有同事 yalohan 的一次大重构 (2fc98ba, 2026-03-17)，采用了完全不同的架构（AI 全代码生成，删除所有模板）。

**当前策略**：
- 不直接 merge（架构差异过大）
- 本地保持"精品模板 + AI 参数化"架构
- 可选择性提取远程版本的 `ui-ux-pro-max` 设计系统参考数据
