# AI小组件 · 视觉系统架构

> **本文档解决一个核心问题**：如何让系统在 v0.1 → v0.5 → v1.0 → v2.0 的持续迭代中，始终维持 80 分以上的视觉体验水平。
>
> **核心原则**：AI 的自由度沿"内容轴"扩展，永远不沿"样式轴"扩展。视觉品质由架构保障，不依赖 AI 自觉。

---

## 一、问题定义

### 1.1 为什么视觉品质会随迭代衰减

多数 AI 生成类产品的视觉品质曲线是这样的：

```
品质
 ↑
80 ─ ●──── v0.1（模板，人工控制，效果好）
     │ ╲
70 ─ │   ╲
     │     ╲
50 ─ │       ●──── v0.5（AI 获得 CSS 自由度，品质开始波动）
     │         ╲
40 ─ │           ●── v1.0（AI 自由生成，品质断崖）
     │
     └──────────────────────────► 版本
```

原因不是 AI 能力不够，而是**视觉决策在不知不觉中被移交给了 AI**。AI 在某次生成中选了一个不够极端的字号、某次用了一个不和谐的颜色、某次把内容堆满了卡片——每个单独看"能用"，但累加起来就从 80 分跌到 50 分。

### 1.2 目标品质曲线

我们要实现的是：

```
品质
 ↑
80 ─ ●────●────●────●────  始终 ≥ 80
     v0.1  v0.5  v1.0  v2.0
     │      │      │      │
     │      │      │      └─ 组件种类极大丰富，品质不降
     │      │      └──────── AI 能力更强，品质不降
     │      └─────────────── AI 开始生成文案，品质不降
     └────────────────────── 纯模板，品质可控
```

### 1.3 实现路径

```
不是：让 AI 越来越自由，靠 AI 越来越强来保品质
而是：让设计系统越来越丰富，靠架构约束来保品质
```

---

## 二、架构总览：三层分离

整个视觉系统分为三层，层与层之间有严格的权限边界：

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   🔒 设计系统层（Design System）                          │
│   ─────────────────────────────                         │
│   人工打磨，架构锁死，AI 不可覆盖                          │
│                                                         │
│   · Design Tokens（字体/字号/间距/色板/圆角）              │
│   · 原子组件库（NumberDisplay / SubtitleBlock / ...）     │
│   · 布局模板库（BottomAligned / Centered / List）         │
│   · 氛围系统（光晕/氛围光线/边框）                         │
│   · 动效预设库                                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   🤖 AI 决策层（AI Decision）                             │
│   ─────────────────────────────                         │
│   AI 在受限范围内做选择和创作                               │
│                                                         │
│   · 从枚举中选择：主题/布局/风格/动效                       │
│   · 自由创作：文案内容（标题/副标题/标签）                   │
│   · 组合决策：选哪些原子组件拼装（v1.0+）                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   🛡️ 品质守门层（Quality Gate）                           │
│   ─────────────────────────────                         │
│   渲染前自动校验，不合格则 fallback                         │
│                                                         │
│   · 字号对比校验                                          │
│   · 内容面积占比校验                                       │
│   · 对比度校验（WCAG AA）                                 │
│   · 文案长度校验（防破版）                                  │
│   · 色值白名单校验                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**核心规则：AI 决策层的输出必须经过品质守门层校验后，才能交给设计系统层渲染。AI 的任何输出都不能绕过设计系统层直接到达用户。**

---

## 三、设计系统层（锁死的部分）

这一层的所有内容由设计师和前端团队人工打磨，AI 无法修改、覆盖或绕过。

### 3.1 Design Tokens

Design Tokens 是整个视觉系统的最底层约束，以 CSS 变量形式注入每个组件，不可覆盖。

#### 3.1.1 字体系统

```css
/* ══════════════════════════════════════════
   字体 Tokens — 所有组件强制使用
   AI 不能修改这些值
   ══════════════════════════════════════════ */

/* 核心数字 */
--font-hero-family: 'DIN Alternate', 'SF Pro Display', 'Helvetica Neue', system-ui;
--font-hero-weight: 300;           /* 超大 + 超轻 = 高级感 */
--font-hero-letter-spacing: -3px;
--font-hero-line-height: 0.9;

/* 中文内容 */
--font-cn-family: 'SF Pro Text', 'Noto Sans SC', system-ui;

/* 英文标注 */
--font-en-family: 'SF Pro Display', 'Helvetica Neue', system-ui;
```

#### 3.1.2 字号层级

```css
/* ══════════════════════════════════════════
   字号 Tokens — 锁定极端对比关系
   核心比例：数字:副标题 ≥ 6:1
   ══════════════════════════════════════════ */

--size-hero-lg: 104px;     /* 居中布局的大数字（放假倒计时） */
--size-hero-md: 88px;      /* 底部对齐布局的数字（恋爱/宝宝） */
--size-hero-sm: 80px;      /* 时间显示（闹钟 07:30） */

--size-category: 11px;     /* 顶部英文类别标注 */
--size-unit: 11px;         /* 数字下方英文单位 */
--size-subtitle: 15px;     /* 中文副标题 */
--size-caption: 12px;      /* 中文辅助信息 */
--size-news-title: 14px;   /* 新闻标题 */
--size-news-meta: 11px;    /* 新闻时间/标签 */
--size-header: 14px;       /* 列表头标题 */
```

#### 3.1.3 间距节奏

```css
/* ══════════════════════════════════════════
   间距 Tokens — 控制"呼吸感"
   ══════════════════════════════════════════ */

--card-padding-v: 32px;
--card-padding-h: 28px;
--card-radius: 20px;

--gap-hero-to-unit: 6px;       /* 数字 → 英文单位：紧密 */
--gap-unit-to-divider: 28px;   /* 英文单位 → 分割线：拉开 */
--gap-divider-to-subtitle: 14px;
--gap-subtitle-to-caption: 5px;
--gap-category-to-hero: 20px;  /* 顶部标注 → 数字 */

--divider-width: 24px;         /* 短分割线，不横贯 */
--divider-width-centered: 20px;
--ambient-line-width: 50%;     /* 底部氛围光线宽度 */
```

#### 3.1.4 色彩系统

```css
/* ══════════════════════════════════════════
   基底色（从真实 SU7 车机截图提取）
   ══════════════════════════════════════════ */

/* 深色模式 */
--dark-bg:            #0e1013;
--dark-card-bg:       #161a1f;
--dark-card-border:   rgba(255,255,255,0.04);
--dark-text-primary:  #ffffff;
--dark-text-secondary: rgba(255,255,255,0.55);
--dark-text-tertiary: rgba(255,255,255,0.30);

/* 浅色模式 */
--light-bg:            #e4e9f0;
--light-card-bg:       rgba(255,255,255,0.85);
--light-card-border:   rgba(0,0,0,0.04);
--light-text-primary:  #1a1a2e;
--light-text-secondary: rgba(0,0,0,0.45);
--light-text-tertiary: rgba(0,0,0,0.25);

/* 系统强调色 */
--accent: #FF6A00;


/* ══════════════════════════════════════════
   主题色板 — 每个主题从种子色推导全集
   AI 只能从主题名称中选择，不能指定色值
   ══════════════════════════════════════════ */

/* 恋爱 · 玫瑰 */
--love-bg-dark:       linear-gradient(155deg, #1a0e20 0%, #1e1428 35%, #140e1a 100%);
--love-bg-light:      linear-gradient(155deg, #fdf2f8 0%, #fce7f3 40%, #f5e6ff 100%);
--love-glow:          rgba(200,120,180,0.12);
--love-glow-alt:      rgba(255,150,100,0.08);
--love-ambient:       rgba(220,140,180,0.4);
--love-label-dark:    rgba(220,160,190,0.5);
--love-label-light:   rgba(150,80,120,0.5);
--love-line:          rgba(220,160,190,0.2);
--love-hero-light:    #2d1b3e;   /* 浅色模式数字色 */

/* 放假 · 翠绿 */
--holiday-bg-dark:    linear-gradient(140deg, #1a2a1a 0%, #0f1a12 100%);
--holiday-bg-light:   linear-gradient(140deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%);
--holiday-glow:       rgba(80,200,120,0.10);
--holiday-ambient:    rgba(80,200,120,0.35);
--holiday-label-dark: rgba(120,220,160,0.45);
--holiday-label-light: rgba(22,163,74,0.45);
--holiday-line:       rgba(120,220,160,0.15);
--holiday-hero-light: #14532d;

/* 宝宝 · 靛蓝 */
--baby-bg-dark:       linear-gradient(160deg, #141825 0%, #1a1e2e 40%, #151a28 100%);
--baby-bg-light:      linear-gradient(160deg, #eff6ff 0%, #e0f2fe 40%, #f0f4ff 100%);
--baby-glow:          rgba(120,160,255,0.07);
--baby-ambient:       rgba(140,180,255,0.30);
--baby-label-dark:    rgba(140,180,255,0.40);
--baby-label-light:   rgba(59,130,246,0.40);
--baby-line:          rgba(140,180,255,0.15);
--baby-hero-light:    #1e3a5f;

/* 暖橙 · 琥珀 */
--warm-bg-dark:       linear-gradient(150deg, #1f1510 0%, #261a12 40%, #1a1210 100%);
--warm-bg-light:      linear-gradient(150deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%);
--warm-glow:          rgba(255,140,60,0.08);
--warm-ambient:       rgba(255,150,60,0.35);
--warm-label-dark:    rgba(255,180,100,0.40);
--warm-label-light:   rgba(194,65,12,0.35);
--warm-line:          rgba(255,180,100,0.15);
--warm-hero-light:    #7c2d12;

/* 实用类（新闻/闹钟）— 统一车机底色 + 小米橙 */
--util-bg-dark:       linear-gradient(180deg, #111316 0%, #0e1013 100%);
--util-bg-light:      linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
--util-accent-bg:     rgba(255,106,0,0.10);
--util-accent-text:   rgba(255,106,0,0.70);
--util-ambient:       rgba(255,106,0,0.30);
```

### 3.2 原子组件库

每个原子组件都是人工打磨过的最小视觉单元，AI 无法修改其内部实现，只能选择使用哪些、传入什么内容。

```
原子组件清单（v0.1 起步，持续扩展）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

数据展示类
  ├── HeroNumber         核心大数字（带渐变色）
  ├── HeroTime           时间显示 HH:MM（闹钟专用）
  ├── UnitLabel          英文单位标注（DAYS / DAYS TOGETHER 等）
  └── CategoryLabel      顶部英文类别标注（COUNTDOWN / ANNIVERSARY 等）

文案类
  ├── SubtitleCN         中文副标题（15px，0.75 透明度）
  ├── CaptionCN          中文辅助信息（12px，0.3 透明度）
  └── Divider            短分割线（24px / 20px）

列表类（实用组件用）
  ├── NewsItem           新闻条目（标签+标题+时间）
  ├── ListDivider        渐隐分割线
  └── SectionHeader      列表头（竖线+标题+右侧日期）

氛围类
  ├── BackgroundGlow     背景光晕（可配置位置、颜色、大小）
  ├── AmbientLine        底部氛围光线
  └── CardBorder         微光边框

动效类
  ├── FadeInEntrance     卡片首次加载淡入
  ├── NumberPulse        数字更新脉冲
  └── SlideTransition    卡片左右切换滑动
```

**扩展规则**：新增原子组件必须经过设计师审核 + 前端实现 + 深浅色双模式验证 + 车端 WebView 兼容测试，才能纳入组件库。AI 永远不能在运行时"创造"新的原子组件。

### 3.3 布局模板库

每种布局定义了原子组件的排列方式和内容插槽位置。

```
布局模板
━━━━━━━━

BottomAligned（底部对齐）
  适用：恋爱纪念日、宝宝成长
  结构：
    [BackgroundGlow × 2]
    [                    ]  ← 大量上方留白
    [HeroNumber          ]
    [UnitLabel           ]
    [      gap: 28px     ]
    [Divider             ]
    [SubtitleCN          ]
    [CaptionCN           ]
    [AmbientLine         ]

Centered（居中）
  适用：放假倒计时、闹钟、暖橙纪念
  结构：
    [BackgroundGlow]
    [              ]
    [CategoryLabel ]  ← 居中
    [HeroNumber    ]  ← 居中，更大字号
    [UnitLabel     ]
    [   gap: 32px  ]
    [Divider       ]  ← 居中
    [SubtitleCN    ]  ← 居中
    [CaptionCN     ]
    [AmbientLine   ]

ListLayout（列表）
  适用：每日新闻
  结构：
    [SectionHeader      ]
    [NewsItem           ]
    [ListDivider        ]
    [NewsItem           ]
    [ListDivider        ]
    [NewsItem           ]
    [AmbientLine        ]
```

### 3.4 动效预设

```css
/* ══════════════════════════════════════════
   动效 Tokens — 统一的运动语言
   所有动效仅用 CSS，不依赖 JS 定时器
   ══════════════════════════════════════════ */

/* 卡片首次加载 */
@keyframes entrance-fadeIn {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
--anim-entrance-duration: 0.6s;
--anim-entrance-easing: ease-out;

/* 数字更新脉冲 */
@keyframes number-pulse {
  0%   { transform: scale(0.96); opacity: 0.7; }
  100% { transform: scale(1);    opacity: 1; }
}
--anim-pulse-duration: 0.4s;
--anim-pulse-easing: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 卡片左右切换 */
@keyframes slide-in-right {
  0%   { opacity: 0; transform: translateX(30px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-left {
  0%   { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
}
--anim-slide-duration: 0.3s;
--anim-slide-easing: ease-out;
```

---

## 四、AI 决策层（各阶段的权限边界）

### 4.1 权限演进总览

```
                         v0.1        v0.5        v1.0        v2.0
                         ─────────────────────────────────────────►

内容自由度
  填写参数                 ●
  生成副标题文案                       ●
  生成完整文案组                                   ●
  提议新组件类型                                               ●

选择自由度
  选模板（3种）             ●
  选主题（4个色板）          ●           ●
  选布局模式                            ●           ●
  选原子组件组合                                     ●           ●
  选动效预设                                        ●           ●
  提议新色板                                                    ●

样式自由度
  修改字号                  ✗           ✗           ✗           ✗
  修改间距                  ✗           ✗           ✗           ✗
  写自定义 CSS              ✗           ✗           ✗           ✗
  指定具体色值              ✗           ✗           ✗           ✗
  修改字体                  ✗           ✗           ✗           ✗
```

**注意最后一列**：即使到 v2.0，样式自由度依然全部是 ✗。AI 永远不能直接控制视觉属性。

### 4.2 各阶段 AI 输出格式

#### v0.1：纯参数填充

```json
{
  "component_type": "anniversary",
  "mode": "countdown",
  "theme": "holiday",
  "template_id": "anniversary_countdown_vibrant",
  "style_preset": "vibrant_orange",
  "params": {
    "title": "国庆快乐",
    "target_date": "2025-10-01T00:00:00",
    "subtitle": "假期在向你招手",
    "show_hours": false
  }
}
```

AI 能决定：`subtitle`（从 AI 生成）
AI 从枚举选：`theme`、`template_id`、`style_preset`
其他全部由用户填写或默认值。

#### v0.5：参数 + 文案生成 + 布局选择

```json
{
  "component_type": "anniversary",
  "mode": "countdown",
  "theme": "holiday",
  "layout": "centered",
  "style_preset": "forest_green",
  "content": {
    "title": "国庆快乐",
    "target_date": "2025-10-01T00:00:00",
    "subtitle": "再坚持一下就放假啦",
    "category_label": "COUNTDOWN",
    "unit_label": "DAYS",
    "caption": "国庆节 · 放假倒计时"
  }
}
```

新增 AI 权限：`layout` 选择、所有文案字段的生成。
仍然不能碰：任何视觉属性。

#### v1.0：组件组合

```json
{
  "component_type": "custom",
  "layout": "centered",
  "theme": "warm",
  "animation": "entrance-fadeIn",
  "components": [
    { "type": "CategoryLabel", "content": "MILESTONE" },
    { "type": "HeroNumber", "value": "10000", "size": "lg" },
    { "type": "UnitLabel", "content": "KILOMETERS" },
    { "type": "Divider" },
    { "type": "SubtitleCN", "content": "一万公里的旅途" },
    { "type": "CaptionCN", "content": "我的SU7 · 里程纪念" }
  ],
  "atmosphere": {
    "glow_count": 1,
    "glow_position": "top-right"
  }
}
```

新增 AI 权限：从原子组件库中选择和组合、选择光晕配置。
仍然不能碰：组件内部的字号/间距/色值。`size: "lg"` 映射到 `--size-hero-lg: 104px`，AI 不知道具体是多少 px。

#### v2.0：提议新组件类型

```json
{
  "proposal": {
    "name": "行车里程进度条",
    "description": "显示距离下一个里程整数的进度",
    "suggested_components": ["HeroNumber", "ProgressBar", "CaptionCN"],
    "suggested_theme": "warm"
  }
}
```

AI 可以提议新的组件类型组合，但提议必须经过**人工审核 + 设计师打磨 + 测试验证**后才能加入组件库。AI 的提议不会直接变成可用组件。

### 4.3 AI 不可输出字段的强制过滤

渲染引擎在接收 AI 输出时，执行白名单过滤：

```javascript
const ALLOWED_FIELDS = {
  'v0.1': ['component_type', 'mode', 'theme', 'template_id', 
           'style_preset', 'params'],
  'v0.5': ['component_type', 'mode', 'theme', 'layout', 
           'style_preset', 'content'],
  'v1.0': ['component_type', 'layout', 'theme', 'animation',
           'components', 'atmosphere'],
};

function sanitizeAIOutput(output, version) {
  const allowed = ALLOWED_FIELDS[version];
  const safe = {};
  for (const key of allowed) {
    if (output[key] !== undefined) {
      safe[key] = output[key];
    }
  }
  // 关键：任何不在白名单中的字段被静默丢弃
  // 即使 AI 输出了 font_size、color、custom_css，也会被忽略
  return safe;
}
```

---

## 五、品质守门层（Quality Gate）

每次 AI 生成结果在渲染前，必须通过一组自动化检查。不通过则 fallback 到安全模板。

### 5.1 校验规则

```javascript
function qualityGate(aiOutput, renderedResult) {
  const checks = [];

  // ── 内容安全 ──
  checks.push({
    name: 'title_length',
    pass: aiOutput.content?.title?.length <= 20,
    fallback: 'truncate_to_20',
    reason: '标题过长会破版',
  });

  checks.push({
    name: 'subtitle_length',
    pass: aiOutput.content?.subtitle?.length <= 30,
    fallback: 'truncate_to_30',
    reason: '副标题过长会破版',
  });

  checks.push({
    name: 'content_safety',
    pass: contentSafetyCheck(aiOutput.content),
    fallback: 'reject_and_retry',
    reason: '内容不合规',
  });

  // ── 视觉合规 ──
  checks.push({
    name: 'theme_in_whitelist',
    pass: APPROVED_THEMES.includes(aiOutput.theme),
    fallback: 'use_default_theme',
    reason: '主题不在白名单中',
  });

  checks.push({
    name: 'layout_in_whitelist',
    pass: APPROVED_LAYOUTS.includes(aiOutput.layout),
    fallback: 'use_default_layout',
    reason: '布局不在白名单中',
  });

  // ── 渲染结果校验（v1.0+ 组件组合时需要）──
  if (renderedResult) {
    checks.push({
      name: 'content_area_ratio',
      pass: renderedResult.contentArea / renderedResult.totalArea <= 0.50,
      fallback: 'reduce_components',
      reason: '内容面积占比超过 50%',
    });

    checks.push({
      name: 'contrast_ratio',
      pass: renderedResult.contrastRatio >= 4.5,
      fallback: 'adjust_text_opacity',
      reason: '文字对比度不达标（WCAG AA）',
    });

    checks.push({
      name: 'hero_font_ratio',
      pass: renderedResult.heroFontSize / renderedResult.captionFontSize >= 5,
      fallback: 'enforce_token_sizes',
      reason: '字号对比不够极端',
    });

    checks.push({
      name: 'component_count',
      pass: renderedResult.componentCount <= 6,
      fallback: 'trim_components',
      reason: '组件数量过多，信息过载',
    });
  }

  return checks;
}
```

### 5.2 Fallback 策略

```
校验结果                 处理方式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
全部通过                 正常渲染
文案类不通过              自动截断 + 渲染（不阻塞用户）
主题/布局不合法            fallback 到默认主题/布局 + 渲染
内容不合规                拒绝 + 提示用户修改
渲染结果不达标（v1.0+）    fallback 到最接近的安全模板
```

### 5.3 品质监控（持续运营）

除了实时校验，还需要离线的品质监控：

```
每周品质报告
━━━━━━━━━━━
· 生成成功率（通过 Quality Gate 的比例）
· 各校验规则的失败率分布
· 用户"重新生成"的比例（暗示对结果不满意）
· 用户截图分享率（暗示对结果满意）
· 抽样人工审核评分（每周 50 个样本）
```

**当某个校验规则的失败率突然上升时**，通常意味着 AI 的 prompt 需要调整，或者新增了 AI 不熟悉的模板/主题。这是一个早期预警信号。

---

## 六、渲染引擎：如何将三层串联

### 6.1 渲染流程

```
用户操作 → AI 生成 JSON → 白名单过滤 → Quality Gate → 设计系统渲染 → 用户看到
                │              │              │              │
                │              │              │              ▼
                │              │              │         tokens.css 注入
                │              │              │         原子组件拼装
                │              │              │         布局模板填充
                │              │              │         氛围系统加载
                │              │              │         动效预设绑定
                │              │              ▼
                │              │         不通过 → fallback 安全模板
                │              ▼
                │         丢弃非白名单字段
                ▼
           AI 输出原始 JSON
```

### 6.2 tokens.css 的注入方式

tokens.css 不是组件"引用"的，而是由渲染引擎**强制注入**到每个组件 H5 的 `<head>` 中，并且设置 `!important` 防止被覆盖：

```html
<!-- 渲染引擎自动注入，组件代码中不包含此文件 -->
<style id="design-system-tokens">
  :root {
    --font-hero-family: 'DIN Alternate', 'SF Pro Display', system-ui !important;
    --size-hero-md: 88px !important;
    --card-padding-v: 32px !important;
    /* ... 所有 tokens ... */
  }
  
  /* 防覆盖：锁死关键属性 */
  .hero-number {
    font-family: var(--font-hero-family) !important;
    font-weight: var(--font-hero-weight) !important;
    letter-spacing: var(--font-hero-letter-spacing) !important;
  }
</style>
```

这意味着即使 AI 在 L3 阶段生成了包含自定义 CSS 的 H5 代码，设计系统的 tokens 也会通过 `!important` 强制覆盖掉 AI 的样式。

### 6.3 主题解析

AI 输出 `"theme": "holiday"`，渲染引擎将其解析为一整套 CSS 变量：

```javascript
const THEME_MAP = {
  love: {
    '--bg': 'var(--love-bg-dark)',    // 或 --love-bg-light
    '--glow': 'var(--love-glow)',
    '--ambient': 'var(--love-ambient)',
    '--label': 'var(--love-label-dark)',
    '--line': 'var(--love-line)',
    '--hero-light-color': 'var(--love-hero-light)',
  },
  holiday: { /* ... */ },
  baby:    { /* ... */ },
  warm:    { /* ... */ },
  util:    { /* ... */ },
};

function resolveTheme(themeName, isDarkMode) {
  const theme = THEME_MAP[themeName];
  if (!theme) return THEME_MAP['util'];  // 安全 fallback
  // 根据深浅色模式选择对应变量
  return isDarkMode ? theme.dark : theme.light;
}
```

---

## 七、设计系统的扩展流程

当需要新增主题、组件或布局时，遵循严格的流程：

### 7.1 新增主题色板

```
1. 设计师选定种子色
2. 用种子色推导全套色值（背景渐变、光晕、氛围光线、标注色、分割线色）
3. 在深色和浅色模式下分别调试
4. 加入 tokens.css
5. 在所有现有布局模板中验证效果
6. 通过 Quality Gate 所有校验
7. 合入代码库，AI 可以开始选择此主题
```

### 7.2 新增原子组件

```
1. 确认需求（来自用户数据分析或产品规划）
2. 设计师出设计稿（深色+浅色）
3. 前端实现为原子组件（遵循 tokens 约束）
4. 在所有主题×所有布局下验证效果
5. 车端 WebView 兼容性测试
6. 稳定性测试（8 小时无内存泄漏）
7. 合入组件库，AI 可以开始使用此组件
```

### 7.3 新增布局模板

```
1. 设计师定义插槽结构
2. 明确每个插槽可接受的原子组件类型
3. 定义各插槽的间距关系（用 tokens 变量）
4. 在所有主题下验证效果
5. 合入布局库，AI 可以开始选择此布局
```

**每次扩展都是"丰富 AI 的选项"，而不是"放宽 AI 的权限"。**

---

## 八、总结

### 8.1 一句话原则

> **AI 越来越聪明地选择和组合，但视觉系统永远由人类设计师守护。**

### 8.2 保障品质的四道防线

```
第一道：设计系统层 — tokens + 原子组件 + 布局模板，人工打磨，不可覆盖
第二道：AI 权限边界 — 白名单字段过滤，非法输出静默丢弃
第三道：Quality Gate — 渲染前自动校验，不合格自动 fallback
第四道：品质监控 — 每周抽样审核 + 失败率预警 + 用户行为数据
```

### 8.3 这套架构的长期价值

```
短期（v0.1-v0.5）：确保 Demo 和内测阶段视觉稳定，不因 AI 犯错翻车
中期（v1.0）：AI 能力增强时，品质不降反升（因为组件库在持续扩展）
长期（v2.0+）：开放第三方/UGC 时，提供"品质地板"，社区创作再自由也不会低于底线
```
