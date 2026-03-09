# AI小组件 视觉品质优化方案

> 核心目标：从 50 分提升到 80 分，让人看到第一眼就觉得"这不像 AI 生成的，像设计师做的"。
> 配套预览：`ai_widget_visual_preview.jsx` 提供可交互的深色/浅色实时预览。

---

## 一、评价标准对齐

### 1.1 参考标杆

| 产品 | 为什么好 | 借鉴点 |
|------|---------|--------|
| **Pretty Progress**（iOS） | 被称为"最美倒计时"——极简、配色高级、留白充分 | 字体层级节奏、色彩克制、留白比例 |
| **Apple Weather Widget** | widget 设计教科书——glanceable、信息密度精确、与系统融为一体 | 信息层级：一个核心数字 + 最少辅助信息 |
| **Tesla 仪表盘 UI** | 车载 UI 极致——暗色、高对比、极简、科技感 | 暗色调性、字体选择、元素间距 |
| **Material Design 3** 暗色主题 | 色彩系统科学——tonal palette 从同一种子色推导，和谐统一 | 用 tonal elevation（亮度差）而非阴影创造层次 |

### 1.2 分数定义

| 分数 | 感受 | 特征 |
|------|------|------|
| 50（改前） | "能用，但一看就是 AI 做的" | 布局合理但无亮点、颜色安全但无个性、缺少"呼吸感" |
| 65-70 | "还不错，挺好看" | 配色和谐、字体有层级、留白充分 |
| **80（目标）** | "哇，这很精致" | 有设计感的细节、字体考究、色彩有情绪、像设计师精心调过 |

### 1.3 五大核心差距

| 维度 | 50 分 | 80 分 |
|------|-------|-------|
| **字体** | 单一字重、数字和文字差不多大 | 极端字号对比（数字 88-104px 超轻 vs 副标题 12px 极淡） |
| **色彩** | 安全纯色背景 | 带色调的渐变背景 + 主题专属色温 + 背景光晕 |
| **空间** | 元素间距均匀、内容偏满 | 内容只占 40-45%，大量留白，视觉重心偏下 |
| **深度** | 纯平面 | tonal elevation + 背景光晕 + 微光边框 |
| **细节** | 无微妙处理 | 数字渐变色、氛围光线、单位弱化、渐隐分割线 |

---

## 二、设计语言定义：Ambient Light（氛围光）

### 2.1 设计哲学

**"暗色空间中的精确信息"**

取 Apple 的克制与排版哲学 + Material 3 的色彩系统思维 + 车载场景独有的"氛围灯"概念。

核心特征：
- 暗色空间（深色优先，浅色同步支持）
- 精确排版（DIN 数字字体 + 极端层级对比）
- tonal 色彩系统（每种主题有专属色调，从同一色系推导所有色值）
- 氛围光线（所有组件底部共享一条渐隐的微光线条，颜色跟随主题）

### 2.2 为什么不加 SU7 标识 / 车模

不加任何装饰性品牌元素。Apple Weather Widget 没有苹果 logo，Tesla 仪表盘没有 T 标。真正的品牌感来自设计语言本身，不来自 logo。唯一的品牌识别是小米橙（#FF6A00）作为实用类组件的系统级强调色。

### 2.3 Demo 版本选择深色模式

基于真实车机截图分析，深色下数字渐变效果、背景光晕、氛围光线都更突出，视觉层次更丰富，"惊艳感"显著强于浅色。浅色同步设计但不作为 Demo 主推。

---

## 三、色彩系统

### 3.1 基底色（从真实车机截图提取）

```css
/* ══ 深色模式基底（匹配 SU7 深色桌面） ══ */
--dark-bg:            #0e1013;     /* 全局底色，带微妙蓝调 */
--dark-card-bg:       #161a1f;     /* 卡片默认底色 */
--dark-card-border:   rgba(255,255,255,0.04);
--dark-text-primary:  #ffffff;
--dark-text-secondary: rgba(255,255,255,0.55);
--dark-text-tertiary: rgba(255,255,255,0.30);

/* ══ 浅色模式基底（匹配 SU7 浅色桌面） ══ */
--light-bg:            #e4e9f0;    /* 柔和蓝灰底色 */
--light-card-bg:       rgba(255,255,255,0.85);
--light-card-border:   rgba(0,0,0,0.04);
--light-text-primary:  #1a1a2e;
--light-text-secondary: rgba(0,0,0,0.45);
--light-text-tertiary: rgba(0,0,0,0.25);

/* ══ 系统强调色 ══ */
--accent-xiaomi-orange: #FF6A00;
```

### 3.2 主题色系（情感类组件专属）

每种主题从一个种子色出发，推导出完整的色彩集合：

```css
/* ── 恋爱纪念 · 玫瑰 ── */
--love-bg-dark:     linear-gradient(155deg, #1a0e20 0%, #1e1428 35%, #140e1a 100%);
--love-bg-light:    linear-gradient(155deg, #fdf2f8 0%, #fce7f3 40%, #f5e6ff 100%);
--love-glow:        rgba(200,120,180,0.12);  /* 背景光晕色 */
--love-ambient:     rgba(220,140,180,0.4);   /* 底部氛围光线 */
--love-label-dark:  rgba(220,160,190,0.5);   /* 英文标注色 */
--love-label-light: rgba(150,80,120,0.5);
--love-line:        rgba(220,160,190,0.2);   /* 分割线 */

/* ── 放假倒计时 · 翠绿 ── */
--holiday-bg-dark:     linear-gradient(140deg, #1a2a1a 0%, #0f1a12 100%);
--holiday-bg-light:    linear-gradient(140deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%);
--holiday-glow:        rgba(80,200,120,0.10);
--holiday-ambient:     rgba(80,200,120,0.35);
--holiday-label-dark:  rgba(120,220,160,0.45);
--holiday-label-light: rgba(22,163,74,0.45);
--holiday-line:        rgba(120,220,160,0.15);

/* ── 宝宝成长 · 靛蓝 ── */
--baby-bg-dark:     linear-gradient(160deg, #141825 0%, #1a1e2e 40%, #151a28 100%);
--baby-bg-light:    linear-gradient(160deg, #eff6ff 0%, #e0f2fe 40%, #f0f4ff 100%);
--baby-glow:        rgba(120,160,255,0.07);
--baby-ambient:     rgba(140,180,255,0.30);
--baby-label-dark:  rgba(140,180,255,0.40);
--baby-label-light: rgba(59,130,246,0.40);
--baby-line:        rgba(140,180,255,0.15);

/* ── 暖橙纪念 · 琥珀 ── */
--warm-bg-dark:     linear-gradient(150deg, #1f1510 0%, #261a12 40%, #1a1210 100%);
--warm-bg-light:    linear-gradient(150deg, #fff7ed 0%, #ffedd5 40%, #fef3c7 100%);
--warm-glow:        rgba(255,140,60,0.08);
--warm-ambient:     rgba(255,150,60,0.35);
--warm-label-dark:  rgba(255,180,100,0.40);
--warm-label-light: rgba(194,65,12,0.35);
--warm-line:        rgba(255,180,100,0.15);
```

### 3.3 实用类组件色彩

新闻和闹钟不使用主题色，统一用车机底色 + 小米橙强调：

```css
/* ── 实用类组件 ── */
--util-bg-dark:  linear-gradient(180deg, #111316 0%, #0e1013 100%);
--util-bg-light: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
--util-accent:   #FF6A00;
--util-accent-bg-dark:  rgba(255,106,0,0.10);  /* 标签底色 */
--util-accent-bg-light: rgba(255,106,0,0.08);
--util-accent-text:     rgba(255,106,0,0.70);  /* 标签文字 */
--util-ambient:         rgba(255,106,0,0.30);  /* 底部氛围光线 */
```

---

## 四、字体系统

### 4.1 字体选择

| 用途 | 字体 | 回退 |
|------|------|------|
| 核心数字 | DIN Alternate | SF Pro Display → Helvetica Neue → system-ui |
| 英文标注 | SF Pro Display | Helvetica Neue → system-ui |
| 中文内容 | SF Pro Text / Noto Sans SC | system-ui |

### 4.2 字号层级（896×1464 卡片，以下为等比缩放前的设计值）

```css
/* ── 极端对比是核心 ── */

/* 核心数字：卡片的绝对主角 */
.hero-number {
  font-family: 'DIN Alternate', 'SF Pro Display', 'Helvetica Neue', system-ui;
  font-size: 88px;           /* 情感类标准 */
  /* font-size: 104px; */    /* 居中布局的放假倒计时可更大 */
  font-weight: 300;          /* 超大 + 超轻 = 高级感（反直觉但有效） */
  letter-spacing: -3px;      /* 紧凑字距增加力量感 */
  line-height: 0.9;          /* 紧凑行高 */
  
  /* 数字渐变色：上白下灰白，不用纯白 */
  background: linear-gradient(180deg, #ffffff 20%, rgba(255,255,255,0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 英文单位标注：极度弱化 */
.unit-label {
  font-family: 'SF Pro Display', system-ui;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 3px;       /* 宽字距增加呼吸感 */
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);  /* 主题色的淡化版 */
}

/* 英文类别标注（顶部）：同样极度弱化 */
.category-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: /* 主题 label 色 */;
}

/* 中文副标题：有存在感但不抢戏 */
.subtitle-cn {
  font-family: 'SF Pro Text', 'Noto Sans SC', system-ui;
  font-size: 15px;
  font-weight: 400;
  color: rgba(255,255,255,0.75);   /* 深色模式 */
  letter-spacing: 0.3px;
}

/* 中文辅助信息：最弱 */
.caption-cn {
  font-family: 'SF Pro Text', 'Noto Sans SC', system-ui;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255,255,255,0.30);   /* 深色模式 */
}
```

### 4.3 字号对比关系

```
核心数字  88-104px  ████████████████████████████  极大
标题      20px      ████                          中等
副标题    15px      ███                           偏小
英文标注  11px      ██                            极小
辅助信息  12px      ██                            极小

对比比 = 88:15 ≈ 6:1（数字与副标题），这就是"高级感"的来源
```

---

## 五、空间与布局

### 5.1 留白原则

```
卡片总面积中：
  内容占比 ≤ 45%
  上方留白 > 下方留白（视觉重心偏下更稳定）

两种布局模式：

A. 底部对齐（恋爱、宝宝）        B. 居中偏下（放假、闹钟）
┌──────────────────┐              ┌──────────────────┐
│                  │              │                  │
│                  │              │    COUNTDOWN     │
│                  │   ≈55%      │                  │
│   1096           │   留白       │      47          │
│   DAYS TOGETHER  │              │     DAYS         │
│                  │              │                  │
│   ── 分割线       │              │   ── 分割线       │
│   每一天都算数    │              │   假期在向你招手   │
│   在一起·恋爱纪念日│              │   国庆快乐·放假    │
└──────────────────┘              └──────────────────┘
```

### 5.2 间距规范

```css
/* 卡片内边距 */
padding: 32px 28px;

/* 核心数字 → 英文单位：紧密 */
margin-bottom: 6px;

/* 英文单位 → 分割线：拉开 */
margin-bottom: 28px;

/* 分割线 → 中文副标题 */
margin-bottom: 14px;

/* 中文副标题 → 辅助信息：紧密 */
margin-bottom: 5px;
```

### 5.3 分割线

不是实线，是一段短的细线，作为"数字区"和"文案区"的呼吸间隔：

```css
.divider {
  width: 24px;      /* 很短，不横贯 */
  height: 1px;
  background: /* 主题 line 色 */;
  /* 居中布局时加 margin: 0 auto */
}
```

---

## 六、深度与氛围

### 6.1 背景光晕

每个情感类组件的背景上放置 1-2 个模糊的彩色圆形光晕，颜色来自主题色系，营造"暗色空间中有微光"的氛围：

```css
/* 主光晕：偏右上 */
.glow-primary {
  position: absolute;
  top: 15%; right: -5%;
  width: 180px; height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--theme-glow) 0%, transparent 70%);
  filter: blur(30px);
}

/* 副光晕：偏左下，更弱 */
.glow-secondary {
  position: absolute;
  bottom: 25%; left: -10%;
  width: 140px; height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--theme-glow-alt) 0%, transparent 70%);
  filter: blur(25px);
}
```

**浅色模式**：光晕保留但透明度微调（深色 0.12 → 浅色 0.15），在浅色背景上依然可见。

**实用类组件**（新闻/闹钟）：不加光晕，保持冷静科技感。

### 6.2 氛围光线（Ambient Light Line）

所有组件共享的视觉识别符，模拟车载氛围灯从边缘渐隐的效果：

```css
.ambient-line {
  position: absolute;
  bottom: 0; left: 0;
  width: 50%;          /* 只覆盖一半，不横贯 */
  height: 1px;
  border-radius: 1px;
  background: linear-gradient(
    90deg,
    var(--theme-ambient) 0%,     /* 主题色，约 0.3-0.4 透明度 */
    transparent 100%
  );
}
```

**各主题氛围光线色值**：
- 恋爱：`rgba(220,140,180,0.4)` — 玫瑰微光
- 放假：`rgba(80,200,120,0.35)` — 翠绿微光
- 宝宝：`rgba(140,180,255,0.3)` — 靛蓝微光
- 暖橙：`rgba(255,150,60,0.35)` — 琥珀微光
- 新闻/闹钟：`rgba(255,106,0,0.3)` — 小米橙微光

### 6.3 卡片边框

极微妙的边框增加"面板感"，深色下用白色极低透明度，浅色下用黑色极低透明度：

```css
.card {
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.04);  /* 深色 */
  /* border: 1px solid rgba(0,0,0,0.03); */  /* 浅色 */
}
```

### 6.4 WebView 兼容性说明

| CSS 特性 | 用途 | 不支持时的 fallback |
|----------|------|-------------------|
| `filter: blur()` | 背景光晕 | 半透明纯色圆形（去掉模糊） |
| `background-clip: text` | 数字渐变色 | 纯白文字 |
| `linear-gradient` | 渐变背景 | 所有 WebView 应支持 |
| `border-radius: 50%` | 光晕圆形 | 所有 WebView 应支持 |

不使用 `backdrop-filter`（毛玻璃），改用 tonal elevation（色彩亮度差）创造层次，兼容性更稳定。

---

## 七、各组件完整 CSS 规范

### 7.1 恋爱纪念日（底部对齐布局）

```css
.widget-love {
  width: 100%; height: 100%;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;      /* 内容沉底 */
  padding: 32px 28px;
  box-sizing: border-box;
  
  /* 深色 */
  background: linear-gradient(155deg, #1a0e20 0%, #1e1428 35%, #140e1a 100%);
  border: 1px solid rgba(255,255,255,0.04);
}

/* 光晕 */
.widget-love .glow-1 {
  position: absolute; top: 15%; right: -5%;
  width: 180px; height: 180px; border-radius: 50%;
  background: radial-gradient(circle, rgba(200,120,180,0.12) 0%, transparent 70%);
  filter: blur(30px);
}
.widget-love .glow-2 {
  position: absolute; bottom: 25%; left: -10%;
  width: 140px; height: 140px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,150,100,0.08) 0%, transparent 70%);
  filter: blur(25px);
}

/* 氛围光线 */
.widget-love .ambient-line {
  position: absolute; bottom: 0; left: 0;
  width: 55%; height: 1px;
  background: linear-gradient(90deg, rgba(220,140,180,0.4) 0%, transparent 100%);
}

/* 数字 */
.widget-love .hero-number {
  font-family: 'DIN Alternate', 'SF Pro Display', system-ui;
  font-size: 88px; font-weight: 300;
  letter-spacing: -3px; line-height: 0.9;
  margin-bottom: 6px;
  background: linear-gradient(180deg, #fff 20%, rgba(255,255,255,0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 英文单位 */
.widget-love .unit {
  font-family: 'SF Pro Display', system-ui;
  font-size: 11px; font-weight: 500;
  letter-spacing: 3px; text-transform: uppercase;
  color: rgba(220,160,190,0.5);
  margin-bottom: 28px;
}

/* 分割线 */
.widget-love .divider {
  width: 24px; height: 1px;
  background: rgba(220,160,190,0.2);
  margin-bottom: 14px;
}

/* 副标题 */
.widget-love .subtitle {
  font-family: 'SF Pro Text', 'Noto Sans SC', system-ui;
  font-size: 15px; font-weight: 400;
  color: rgba(255,255,255,0.75);
  letter-spacing: 0.3px;
  margin-bottom: 5px;
}

/* 辅助信息 */
.widget-love .caption {
  font-family: 'SF Pro Text', 'Noto Sans SC', system-ui;
  font-size: 12px; color: rgba(255,255,255,0.3);
}
```

### 7.2 放假倒计时（居中布局）

```css
.widget-holiday {
  /* 同卡片基础属性 */
  justify-content: center;
  align-items: center;
  text-align: center;
  
  background: linear-gradient(140deg, #1a2a1a 0%, #0f1a12 100%);
  border: 1px solid rgba(255,255,255,0.04);
}

/* 顶部类别标注 */
.widget-holiday .category {
  font-size: 12px; font-weight: 500;
  letter-spacing: 2px; text-transform: uppercase;
  color: rgba(120,220,160,0.45);
  margin-bottom: 20px;
}

.widget-holiday .hero-number {
  font-size: 104px; font-weight: 200;    /* 比恋爱更大更轻 */
  letter-spacing: -4px; line-height: 0.85;
  margin-bottom: 4px;
  background: linear-gradient(180deg, #fff 15%, rgba(255,255,255,0.55) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.widget-holiday .unit {
  letter-spacing: 4px;
  color: rgba(120,220,160,0.4);
  margin-bottom: 32px;
}

/* 分割线居中 */
.widget-holiday .divider {
  width: 20px; height: 1px;
  background: rgba(120,220,160,0.15);
  margin: 0 auto 16px;
}

/* 氛围光线 */
.widget-holiday .ambient-line {
  background: linear-gradient(90deg, rgba(80,200,120,0.35) 0%, transparent 100%);
  width: 50%;
}
```

### 7.3 宝宝成长（底部对齐布局）

```css
.widget-baby {
  /* 同恋爱布局 */
  background: linear-gradient(160deg, #141825 0%, #1a1e2e 40%, #151a28 100%);
}

.widget-baby .glow-1 {
  top: 20%; left: 50%; transform: translateX(-50%);
  background: radial-gradient(circle, rgba(120,160,255,0.07) 0%, transparent 70%);
}

.widget-baby .unit { color: rgba(140,180,255,0.4); }
.widget-baby .divider { background: rgba(140,180,255,0.15); }
.widget-baby .ambient-line {
  background: linear-gradient(90deg, rgba(140,180,255,0.3) 0%, transparent 100%);
  width: 45%;
}
```

### 7.4 暖橙纪念日（居中布局）

```css
.widget-warm {
  /* 同放假居中布局 */
  background: linear-gradient(150deg, #1f1510 0%, #261a12 40%, #1a1210 100%);
}

.widget-warm .hero-number {
  font-size: 96px; font-weight: 200;
}

.widget-warm .glow-1 {
  background: radial-gradient(circle, rgba(255,140,60,0.08) 0%, transparent 70%);
}
.widget-warm .unit { color: rgba(255,180,100,0.35); }
.widget-warm .ambient-line {
  background: linear-gradient(90deg, rgba(255,150,60,0.35) 0%, transparent 100%);
}
```

### 7.5 每日新闻（列表布局）

```css
.widget-news {
  background: linear-gradient(180deg, #111316 0%, #0e1013 100%);
  display: flex; flex-direction: column;
  padding: 28px 24px;
}

/* 顶部标题栏 */
.widget-news .header {
  display: flex; align-items: center;
  margin-bottom: 22px;
}

/* 左侧竖线强调 */
.widget-news .header-bar {
  width: 3px; height: 14px;
  border-radius: 2px;
  background: #FF6A00;
  margin-right: 10px;
}

.widget-news .header-title {
  font-size: 14px; font-weight: 600;
  color: #fff; letter-spacing: 0.5px;
}

.widget-news .header-date {
  margin-left: auto;
  font-size: 11px; color: rgba(255,255,255,0.3);
}

/* 新闻标签 */
.widget-news .tag {
  padding: 2px 6px; border-radius: 4px;
  background: rgba(255,106,0,0.1);
  font-size: 10px; font-weight: 500;
  color: rgba(255,106,0,0.7);
}

/* 新闻标题 */
.widget-news .news-title {
  font-size: 14px; color: rgba(255,255,255,0.85);
  line-height: 1.45; margin-bottom: 4px;
}

/* 新闻时间 */
.widget-news .news-time {
  font-size: 11px; color: rgba(255,255,255,0.3);
}

/* 列表分割线：渐隐，不是实线 */
.widget-news .list-divider {
  height: 1px; margin: 14px 0;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 0%,
    rgba(255,255,255,0.01) 100%
  );
}

/* 氛围光线：小米橙 */
.widget-news .ambient-line {
  background: linear-gradient(90deg, rgba(255,106,0,0.3) 0%, transparent 100%);
  width: 40%;
}
```

### 7.6 闹钟（居中布局）

```css
.widget-alarm {
  /* 同放假居中布局 */
  background: linear-gradient(180deg, #111316 0%, #0e1013 100%);
}

.widget-alarm .category {
  color: rgba(255,106,0,0.4);    /* 小米橙淡化 */
}

.widget-alarm .hero-number {
  font-size: 80px; font-weight: 300;
  letter-spacing: -2px;
  /* 显示为 07:30 格式 */
}

.widget-alarm .unit { color: rgba(255,255,255,0.25); }
.widget-alarm .divider { background: rgba(255,106,0,0.15); }
.widget-alarm .ambient-line {
  background: linear-gradient(90deg, rgba(255,106,0,0.3) 0%, transparent 100%);
  width: 45%;
}
```

---

## 八、微动效

所有动效仅用 CSS，不依赖 JS 定时器。

### 8.1 卡片首次加载

```css
@keyframes cardFadeIn {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

.widget { animation: cardFadeIn 0.6s ease-out; }
```

### 8.2 数字更新脉冲

当数字值变化时（跨天更新），加一个微妙的缩放脉冲：

```css
@keyframes numberPulse {
  0%   { transform: scale(0.96); opacity: 0.7; }
  100% { transform: scale(1);    opacity: 1; }
}

.hero-number.updating {
  animation: numberPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 8.3 卡片切换过渡

左右切换时的滑动过渡：

```css
@keyframes slideInRight {
  0%   { opacity: 0; transform: translateX(30px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  0%   { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
}

.widget.enter-right { animation: slideInRight 0.3s ease-out; }
.widget.enter-left  { animation: slideInLeft  0.3s ease-out; }
```

---

## 九、浅色模式适配规则

深色和浅色共享同一套布局和字体规范，只需调整以下属性：

| 属性 | 深色 | 浅色 |
|------|------|------|
| 卡片背景渐变 | 深色系渐变 | 对应浅色系渐变 |
| 数字渐变色 | 白→灰白 | 深色→浅深色（如 `#2d1b3e` → `rgba(45,27,62,0.65)`） |
| 文字主色 | `#ffffff` | `#1a1a2e` 或主题深色 |
| 文字副色透明度 | `0.55` / `0.30` | `0.45` / `0.25` |
| 光晕透明度 | 主题值 | 主题值 +0.03（稍强，补偿浅底反差弱） |
| 边框 | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.03)` |
| 氛围光线透明度 | 主题值 | 主题值 -0.1（稍弱，避免浅底上过亮） |

---

## 十、落地优先级

### 第一步：1.5 天 → 50 分到 70 分

| 改动 | 工时 |
|------|------|
| 换 DIN 字体 + 拉极端字号对比 | 0.5 天 |
| 背景从纯色改为主题渐变 | 0.5 天 |
| 留白加倍，信息砍到 3 层 | 0.5 天 |

### 第二步：2 天 → 70 分到 80 分

| 改动 | 工时 |
|------|------|
| 加背景光晕 + 氛围光线 | 0.5 天 |
| 数字渐变色 + 英文单位弱化 | 0.5 天 |
| 渐隐分割线 + 微动效 | 0.5 天 |
| 深色/浅色双主题调试 | 0.5 天 |

### 必须避免的坑

- 不用 `backdrop-filter`（毛玻璃），用 tonal elevation 替代，兼容性更好
- 所有颜色从预定义色板选取，不让 AI 自由选色
- 渐变不超过 3 个色值，多了就脏
- 不做复杂动画，只做 opacity + transform
- 深色背景永远不用纯黑（#000），用带微妙色调的深色