# AI小组件 · 技术规划与开发进度

> 最后更新：2026-03-22

---

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     手机端 (创建)                            │
│  ┌───────────────────────────────────────────────────┐      │
│  │  首页(8场景宫格) → 配置面板(BottomSheet)            │      │
│  │  → 预览(AI摘要+卡片) → 微调(缩小预览+配置)         │      │
│  │  Vite + Vanilla JS | ConfigPanel 共享组件         │      │
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
| AI 生成方案 | 双模式并行：模板生成 + AI编程 | 场景卡片走模板（快+稳），自由输入走代码生成（展示端到端能力） | ✅ 已确定 |
| 设计语言 | Liquid Glass (Glassmorphism) | 对标 Apple CarPlay iOS 26，行业主流车载美学 | ✅ 已实施 |
| LLM 模型 | qwen-plus (阿里云通义千问) | 国内访问快，中文质量高，OpenAI 兼容模式 | ✅ 已验证 |
| 卡片尺寸 | 896×1464 逻辑像素 | 行车桌面 1/3 竖屏 | ✅ 已确定 |
| 模板引擎 | Vanilla JS + CSS 变量 | 最轻量，无框架依赖，单模板 ≤ 36KB | ✅ 已确定 |
| 前端构建 | Vite | 热更新快，构建轻量 | ✅ 已确定 |

### 竞品对比

| 竞品 | 方案 | 我们的差异化优势 |
|------|------|-----------------|
| 理想「桌面大师」 | AI 全代码生成，慢且质量不稳定 | 双模式：模板保证视觉下限(1-3s)，AI编程展示端到端能力(10-15s) |
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
| **Design-at-896 缩放** | 模板 CSS 全部按 896px 设计，手机端通过 CSS `zoom` 等比缩小 |
| 毛玻璃效果 | `backdrop-filter: blur(60px) saturate(1.8)` + 半透明背景 |
| 折射边框 | `rgba(255,255,255, 0.08)` 边框 + 内发光 |
| 深度阴影 | 三层 box-shadow 系统 (subtle/elevated/floating) |
| 呼吸光晕 | `breathing-glow` 动画，4s 周期 |
| 数字翻牌 | `digit-flip-in/out` 3D 翻转动画 |
| 交错淡入 | `stagger-fadeIn` + 0.08s 延迟 |
| 粒子系统 | Canvas 2D，每模板 15-25 粒子，主题色适配，尺寸/速度按 896px 设计 |
| 高光扫过 | `light-sweep` 动画 |
| WebView 兼容 | `@supports` 降级方案 (backdrop-filter / background-clip) |

#### Design-at-896 + CSS zoom 缩放机制

```
Pencil 设计 (896×1464) = 设计源头 = 车端真实尺寸
    ↓ 1:1 映射
模板 CSS px 值（全部按 896px 设计）
    ├── 车端 WebView (896×1464) → 原样渲染 ✓
    └── 手机端 iframe (260×425) → CSS zoom: 0.29 缩小 ✓
```

**核心原理**：`render-widget.js` 在创建 iframe 时测量容器宽度，计算 `zoom = containerWidth / 896`，注入 `<style>html{zoom:N}</style>`。CSS `zoom` 使布局视口从 260px 扩展为 `260/0.29 ≈ 896px`，模板 `width:100%` 自动解析为 896px。

**关键文件**：
- `render-widget.js`：注入 zoom 样式（手机端）
- `car-simulator.html`：896×1464 直接渲染，无需 zoom
- `tokens.css`：所有尺寸 token 按 896px 设计
- 各模板 `style.css`：所有硬编码 px 值按 896px 设计
- 各模板 `main.js`：Canvas 粒子尺寸/速度按 896px 设计

**注意**：SVG viewBox 坐标（如闹钟进度环 `viewBox="0 0 200 200"`）不受 CSS zoom 影响，无需缩放。

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
| 手机端 Web App | 首页(8场景宫格) + 配置面板 + 预览 + 微调 | ✅ |
| 自然语言创建 | `/api/chat-generate` + 意图识别 + Mock 模式 | ✅ |
| 车端模拟器 | `car-simulator.html` 896×1464 + 卡片切换 | ✅ |
| JSBridge | Mock 实现，支持浏览器开发 | ✅ |
| 公网部署 | Render 后端 + Netlify 前端 + 自动部署 | ✅ |
| **动态配色引擎** | `color-engine.js` — 任意hex→完整调色板，9模板全部集成 | ✅ |
| **视觉风格宏** | `visual-styles.css` — glass/minimal/material/pixel，9模板全部集成 | ✅ |
| **语义联动** | 颜色关键词提取、风格语义映射、三维正交组合 | ✅ |
| **文案引擎升级** | 8-12选项/区间 + random.choice + 节日专属池 + 情感融入 | ✅ |
| **日期理解增强** | 明天/后天/下周X/X月X日/N周年反推/N天反推 | ✅ |

### ✅ 模板真实服务接入（2026-03-21）

| 模板 | 改动 | 状态 |
|------|------|------|
| **天气** | 新建 `weather_service/`，接入和风天气 API（城市查找 + 实时天气 + 3日预报），30分钟缓存，无 key 时 mock fallback | ✅ |
| **新闻** | 后端返回 `url` 字段 + 模板 UX 重构（默认 3 条、摘要行、点击详情毛玻璃浮层） | ✅ |
| **音乐** | JSBridge 新增 `getMediaSession()` / `onMediaSessionChange()` / `mediaControl()` + 模板接入 + 空状态 UI | ✅ |
| **日历** | 新增 `GET /api/calendar/today`（按星期生成模拟日程） + 模板 fetch 逻辑 + 已过事件灰显 | ✅ |
| **纪念日 ×4** | 纯本地计算，无需改动 | — |
| **闹钟** | 纯本地计算，无需改动 | — |

#### 天气服务架构

```
weather_service/
├── __init__.py
├── client.py      # 和风天气 API (QWeather) — 城市查找 + 实时 + 3日预报
└── service.py     # 30分钟缓存 + mock fallback + 建议文案生成
```

- API Host: `{CREDENTIAL_ID}.qweatherapi.com`（新版 QWeather 账户专属域名）
- 环境变量: `QWEATHER_API_KEY`, `QWEATHER_API_HOST`
- 免费版每日 1000 次调用

#### 新增 API Endpoints

| Endpoint | 方法 | 说明 |
|----------|------|------|
| `/api/weather?city=北京` | GET | 实时天气 + 3日预报 + AI穿衣建议 |
| `/api/calendar/today` | GET | 当日模拟日程（按星期变化，5-7 个事件） |

#### JSBridge MediaSession 接口

```javascript
AIWidgetBridge.getMediaSession()        // → {song_name, artist, album, duration, position, isPlaying, albumArtUrl} | null
AIWidgetBridge.onMediaSessionChange(cb) // 监听播放状态变化
AIWidgetBridge.mediaControl(action)     // 'play'|'pause'|'next'|'prev'
```

车端实现：Android 宿主 App 通过 `MediaController` 读取系统 MediaSession，暴露给 WebView。开发环境提供 mock 数据。

### ✅ 手机端 4 屏改版 (v0.3, 2026-03-22)

| 变更 | 内容 | 状态 |
|------|------|------|
| **首页重构** | 移除底部导航 + Hero区，新增状态栏 + 品牌Header + 3×3 Lucide 图标宫格 + 底部单行输入 | ✅ |
| **配置面板** | 新建 `ConfigPanel` 共享组件（create/finetune 双模式），场景字段 + 6色圆 + 自由输入 | ✅ |
| **预览页重构** | 移除深色bezel，改为浅色 260×434 卡片 + AI摘要条 + AI洞察条 + 双按钮（渐变微调 + 描边同步） | ✅ |
| **微调页** | 新建独立页面，缩小卡片预览 + 嵌入式 ConfigPanel(finetune模式) + AI建议条 | ✅ |
| **4步生成动效** | 理解需求 → 匹配风格 → 生成布局 → 填充数据，与 API 并行 | ✅ |
| **设计系统更新** | 新色板 (#4A6CF7 品牌蓝) + 渐变按钮 + 描边按钮 + 100dvh 键盘适配 | ✅ |
| **render-widget.js** | 抽取 iframe 渲染 / 状态栏 / 生成动效 / sceneId映射 为共享工具 | ✅ |
| **路由增强** | `_replace` 参数避免微调回退栈循环，浮层自动清理 | ✅ |
| **页面删除** | `config.js` / `my-widgets.js` / `sync.js` 三个废弃页面 | ✅ |
| **全模板验证** | Playwright 截图 6 种模板全部渲染正确（天气/恋爱/音乐/日程/新闻/闹钟） | ✅ |

### ✅ Design-at-896 + CSS zoom 缩放 (2026-03-22)

Pencil 设计稿 (896×1464) 与代码渲染一致性方案，解决 Pencil 设计值与模板 CSS px 值不一致的问题。

| 变更 | 内容 | 状态 |
|------|------|------|
| **render-widget.js** | 注入 CSS `zoom = containerWidth / 896`，手机端 iframe 等比缩小 | ✅ |
| **tokens.css** | 所有尺寸 token 从 260px 设计值更新为 896px 设计值（字号/间距/圆角/光晕/blur/字间距） | ✅ |
| **9 个模板 style.css** | 所有硬编码 px 值 ×3（容器 padding/光晕尺寸/blur/毛玻璃/字号/间距） | ✅ |
| **7 个模板 main.js** | Canvas 粒子系统参数 ×3（尺寸/速度/生成位置），闹钟 SVG 保持 viewBox 坐标不变 | ✅ |
| **visual-styles.css** | 4 种风格宏（minimal/material/pixel）的 px 值 ×3 | ✅ |
| **car-simulator.html** | 确认无需改动（已是 896×1464 直接渲染） | ✅ |

### ✅ AI编程模式 — 端到端代码生成 (2026-03-22)

新增自由输入走 AI编程模式，LLM 直接生成完整 HTML/CSS/JS 代码。场景卡片仍走模板路径。

| 变更 | 内容 | 状态 |
|------|------|------|
| **prompt.py** | 新增 `CODE_GEN_SYSTEM_PROMPT`（896×1464 画布、Liquid Glass token、安全禁止项） | ✅ |
| **generator.py** | 新增 `generate_code_from_nl()`（max_tokens=4000, timeout=60s）+ `_validate_generated_code()`（大小/结构/禁止模式扫描） | ✅ |
| **main.py** | `ChatGenerateRequest` 新增 `generation_mode` 字段，handler 按 `"code"` 分支 | ✅ |
| **api.js** | `chatGenerate()` 透传 `generationMode` 参数 | ✅ |
| **market.js** | 自由输入自动走 `generation_mode: 'code'`，场景卡片走模板路径 | ✅ |
| **render-widget.js** | `showGenerateOverlay` 参数化（代码模式 5 步/1.5s 间隔/8s 最短），新增 `renderCodeWidgetInFrame()`（sandbox iframe） | ✅ |
| **preview.js** | 代码模式：自定义摘要/洞察文案、`renderCodeWidgetInFrame` 渲染、隐藏微调按钮 | ✅ |

#### 两种模式对比

| 维度 | 模板生成（场景卡片） | AI编程（自由输入） |
|------|---------------------|-------------------|
| 触发方式 | 点击 8 个场景卡片 | 底部输入框自由文字 |
| 后端路径 | `generate_from_nl()` → JSON 参数 | `generate_code_from_nl()` → 完整 HTML |
| 速度 | 1-3s（Mock <100ms） | 10-15s |
| 视觉质量 | 稳定精美（精品模板） | 不稳定（LLM 直出） |
| Mock 支持 | 有（无 API Key 可用） | 无（必须有 API Key） |
| 微调 | 支持 | 不支持（隐藏微调按钮） |
| 安全 | Quality Gate 白名单 | 代码校验（禁止 fetch/eval/外部依赖）+ sandbox iframe |
| 生成动效 | 4 步 × 300ms | 5 步 × 1500ms |

#### 安全校验（`_validate_generated_code`）

| 检查项 | 规则 |
|--------|------|
| 基本结构 | 必须包含 `<!DOCTYPE` 或 `<html` |
| 大小限制 | ≤ 100KB |
| 禁止 `fetch()` / `XMLHttpRequest` | 无网络请求 |
| 禁止 `localStorage` / `sessionStorage` | 无本地存储 |
| 禁止 `eval()` / `document.cookie` | 无动态执行/cookie |
| 禁止外部 `<script src>` / `<link href="http">` | 无外部依赖 |
| 前端 iframe | `sandbox="allow-scripts"` 安全隔离 |

### ✅ v0.4 升级完成（2026-03-23）— 8 模板功能完善 + 视觉重构 + 链路优化

**核心升级**：8 个模板从「静态展示卡片」升级为「可交互的车载小组件」，6 个模板视觉对齐 card.pen 设计稿

**新增公共基础设施**：
- `shared/overlay.js` + `overlay.css` — 通用弹窗 overlay 组件（暗色/亮色主题，720px 毛玻璃面板）
- `shared/storage.js` — localStorage 封装（namespace 隔离，增删改查 + 变更通知）
- `shared/easter-egg.js` — 彩蛋粒子效果引擎（爱心/星星/礼花，点击触发，2s cooldown）

**逐模板升级**：

| 模板 | 新增功能 |
|------|---------|
| **天气** | 城市切换 overlay（搜索+已保存城市列表），localStorage 记忆选中城市 |
| **音乐** | 封面取色（canvas 采样→computePalette→自动配色），CORS 失败自动 fallback |
| **新闻** | 多领域选择（5 领域 multi-select pills），全文阅读 fullscreen overlay |
| **闹钟** | 多闹钟列表 + 表盘双风格，新建闹钟 overlay（时间选择器+重复+标签），localStorage 持久化 |
| **日程** | FAB 按钮 + 新增事件 overlay（标题/地点/全天/时间/提醒/颜色标记/备注），长按删除，localStorage |
| **恋爱** | 预设背景图（6 张）+ 点击爱心彩蛋 |
| **宝宝** | 预设背景图（6 张）+ 点击星星彩蛋 |
| **假期** | 预设背景图（6 张）+ 点击礼花彩蛋 |

**Config Panel 扩展**：news 多选 pills、alarm 风格切换器、anniversary 背景图 2×3 grid

**Server 端**：`/api/news` 支持 `categories` 多领域参数，validator 白名单扩展

**视觉重构（2026-03-23）**：
- love/baby/holiday: Liquid Glass → 全屏照片 + 底部文字叠加（对齐 card.pen）
- news: 轮播列表 → hero 图 + 分类标签卡片式布局
- weather: 📍图标 + 日期含星期 + 紫外线
- music: 封面 560px + 歌词 32px
- 15 张 AI 生成预设背景图（Pencil MCP 导出）

**体验优化（2026-03-23）**：
- Mock 优先渲染（天气/新闻），API 后台异步替换
- iframe 深色背景防白闪 + 背景图渐入过渡 + 入场动画
- Config Panel 5 预设 + 1 上传合并为 6 格选择器
- 闹钟/日程支持滚动，新闻 hero 分类 emoji 装饰
- 大模型入口添加耗时提示

**生成/微调技术链路**：

| 链路 | 触发场景 | 数据来源 | API | 耗时 |
|------|---------|---------|-----|------|
| **A 模板配置** | 场景卡片 → ConfigPanel → 生成 | 预配置数据（客户端组装） | 无 | < 2s |
| **B 自然语言微调** | 微调页/ConfigPanel 输入文字 | 大模型分析（qwen-plus） | `/api/chat-generate` mode=template | 2-8s |
| **C AI 编程** | 首页底部输入框 | 大模型生成代码（qwen-turbo） | `/api/chat-generate` mode=code | 15-30s |

- 链路 A: 不调大模型，纯客户端 JSON 组装 → 4 步动效(1.5s) → 模板渲染
- 链路 B: `generate_from_nl()` → LLM 语义理解当前参数 + 用户意图 → 输出修改后 JSON（Mock 模式有兜底）
- 链路 C: `generate_code_from_nl()` → LLM 从零生成 HTML/CSS/JS → 安全扫描 → 沙箱渲染（**无 Mock 兜底，需 API Key**）
- 前端动效: 模板模式 4 步 × 0.3s（min 1.5s），代码模式 5 步 × 1.5s（min 8s）
- LLM 自动修正: `_fix_llm_output()` 处理 template_id/theme 常见错误

### 🔲 下一步计划

| 优先级 | 内容 | 预计工期 |
|--------|------|---------|
| P0 | AI 生成预设背景图 18 张（6×3 主题），替换占位图 | 1 天 |
| P1 | 多方案预览 — 一次生成 3 个风格变体供选择 | 2-3 天 |
| P2 | Demo 演示包 — 预生成精品组件、3分钟演示脚本 | 1 天 |
| P3 | 车端 Android WebView 真机集成 | 待定 |

---

## 六、文件清单

### 组件模板 (`src/widget-templates/`)

```
shared/
├── tokens.css                 # Design Tokens (Liquid Glass) — 580+ 行
├── color-engine.js            # 动态配色引擎 (hex→调色板, 4.3KB)
├── visual-styles.css          # 4种视觉风格宏 (glass/minimal/material/pixel, 9.2KB)
├── bridge.js                  # JSBridge 封装 (含 MediaSession 接口)
├── overlay.js                 # ★ v0.4 通用弹窗 overlay 组件 (~3KB)
├── overlay.css                # ★ v0.4 弹窗样式 (暗色/亮色, 720px 毛玻璃面板)
├── storage.js                 # ★ v0.4 localStorage 封装 (namespace 隔离, ~1.5KB)
└── easter-egg.js              # ★ v0.4 彩蛋粒子引擎 (love/baby/holiday, ~3.5KB)

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
├── prompt.py                  # 模板配置 + NL/结构化/代码生成 System Prompt
├── generator.py               # LLM 调用 (Qwen/GPT/Claude) + Mock + AI编程代码生成
└── validator.py               # Quality Gate (白名单+截断+clamp)
weather_service/               # 天气服务 (和风天气 API)
├── client.py                  # QWeather API 客户端
└── service.py                 # 缓存 + mock fallback
sync_service/                  # 同步推送 (轮询模式)
news_service/                  # 新闻聚合 (RSS + AI 摘要)
storage/                       # 元数据存储 (内存)
```

### 前端 (`src/mobile-web/`)

```
package.json + vite.config.js  # 构建配置
index.html                     # 入口 HTML (3 个 page div: market/preview/finetune)
src/
├── main.js                    # 路由注册 + Toast (3 页面: market/preview/finetune)
├── api.js                     # API 客户端
├── router.js                  # 页面路由 (支持 _replace 参数)
├── styles/main.css            # 全局样式 (v0.3 设计系统, #4A6CF7 品牌色)
├── components/
│   └── config-panel.js        # ConfigPanel 共享配置面板 (create/finetune 双模式)
├── utils/
│   └── render-widget.js       # iframe 渲染 + 状态栏 + 生成动效(模板4步/代码5步) + AI代码渲染 + sceneId 映射
└── pages/
    ├── market.js              # 首页 (状态栏 + Header + 8场景宫格 + 底部输入)
    ├── preview.js             # 预览 (AI摘要 + 260×434卡片 + AI洞察 + 微调/同步按钮)
    └── finetune.js            # 微调 (缩小预览 + 嵌入式 ConfigPanel)
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
2. **场景卡片流程**：点击"实时天气" → 配置面板弹出 → 选风格/配色 → "生成卡片" → 4步动效 → 预览页渲染天气卡片
3. **自由输入流程（AI编程）**：底部输入描述 → 回车 → 5步代码动效(需API Key) → 预览页渲染AI生成的代码卡片（无API Key时提示错误）
4. **微调流程**：预览页 → "微调效果" → 微调页 → 切换风格/配色 → "应用修改" → 回到预览
5. **回退验证**：预览页 → 返回 → 应回到首页（非微调页循环）
6. 打开 http://localhost:3000/car-simulator.html 验证车端模拟效果

---

## 九、与远程仓库的关系

远程仓库 (GitHub) 有同事 yalohan 的一次大重构 (2fc98ba, 2026-03-17)，采用了完全不同的架构（AI 全代码生成，删除所有模板）。

**当前策略**：
- 不直接 merge（架构差异过大）
- 本地保持"精品模板 + AI 参数化"架构
- 可选择性提取远程版本的 `ui-ux-pro-max` 设计系统参考数据
