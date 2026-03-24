# 模板重构迭代计划

> **目标**：基于 `TEMPLATE_SCHEMA.md`（唯一数据契约）+ `DESIGN.md` §六（Pencil 页面索引）+ 更新后的 `card.pen` 设计稿，**删除全部旧模板实现**，从零重构 8 套模板及其配套基础设施。
>
> **原则**：Schema 驱动 · Pencil 对标 · 一次做对

---

## 〇、重构范围总览

### 要删除的（老代码）

| 路径 | 说明 | 原因 |
|------|------|------|
| `src/widget-templates/anniversary/warm/` | 暖橙模板 | 已在 SCHEMA 中移除 |
| `src/widget-templates/anniversary/love/main.js + style.css` | 恋爱模板 JS/CSS | 字段名不统一、色彩逻辑硬编码 |
| `src/widget-templates/anniversary/baby/main.js + style.css` | 宝宝模板 JS/CSS | 同上 |
| `src/widget-templates/anniversary/holiday/main.js + style.css` | 倒计时模板 JS/CSS | 同上 |
| `src/widget-templates/weather/main.js + style.css` | 天气模板 | API 调用方式重做、tokens 不对齐 |
| `src/widget-templates/music/main.js + style.css` | 音乐模板 | visual_style 系统重做 |
| `src/widget-templates/calendar/main.js + style.css` | 日历模板 | 数据流重做（mock/localStorage）|
| `src/widget-templates/news/main.js + style.css` | 新闻模板 | v2 方案确认后对齐 |
| `src/widget-templates/alarm/main.js + style.css` | 闹钟模板 | 交互态拆分、accent 系统重做 |
| `src/mobile-web/src/components/config-panel.js` | 配置面板 | 硬编码 if/else → schema 驱动 |
| `src/server/ai_generator/prompt.py` | AI Prompt | 字段名统一、NL 映射更新 |

### 要保留的（基础设施）

| 路径 | 说明 | 改动程度 |
|------|------|----------|
| `src/widget-templates/shared/tokens.css` | Design Tokens | 中度修改：对齐 DESIGN.md §1.4 色值 |
| `src/widget-templates/shared/visual-styles.css` | 视觉风格宏 | 轻度修改：新增 `[data-style]` 变体 |
| `src/widget-templates/shared/color-engine.js` | 配色引擎 | 轻度修改：输出变量名对齐 SCHEMA |
| `src/widget-templates/shared/color-extract.js` | 图片取色 | 保持不变 |
| `src/widget-templates/shared/bridge.js` | JSBridge | 保持不变 |
| `src/widget-templates/shared/overlay.js/.css` | 弹窗组件 | 保持不变 |
| `src/widget-templates/shared/storage.js` | localStorage | 保持不变 |
| `src/widget-templates/shared/easter-egg.js` | 彩蛋粒子 | 保持不变 |
| `src/widget-templates/anniversary/*/backgrounds/` | 预设背景图 | 保留 love/baby/holiday 各 5 张 |
| `src/widget-templates/template-engine/` | 渲染引擎 | 轻度修改 |
| `src/mobile-web/src/pages/*.js` | 三页面 | 轻度修改：接入新 config-panel |
| `src/mobile-web/src/utils/render-widget.js` | 渲染工具 | 中度修改：字段名统一、URL MAP 更新 |
| `src/server/ai_generator/generator.py` | AI 生成管道 | 保持不变 |
| `src/server/ai_generator/validator.py` | 校验 | 中度修改：按 SCHEMA 约束重写 |
| `src/server/main.py` | API 入口 | 保持不变 |
| 各 `index.html` | 模板骨架 HTML | 重写：对齐 Pencil 节点结构 |

---

## 一、Phase 0 — 基础设施对齐（前置，阻塞后续所有模板）

> **交付物**：tokens.css + color-engine.js + config-panel.js + prompt.py + render-widget.js 全部对齐到 SCHEMA

### 0-1. tokens.css 与 DESIGN.md 色值对齐

**输入**：DESIGN.md §1.4 颜色体系
**工作**：

- 暗色文字层级变量对齐：
  ```css
  --text-primary:   #F5F5F0;
  --text-secondary: #F5F5F060;
  --text-tertiary:  #F5F5F040;
  ```
- 亮色（日历专用）变量对齐：
  ```css
  --light-text-primary:   #1E293B;
  --light-text-secondary: #64748B;
  --light-text-tertiary:  #94A3B8;
  --light-text-quaternary: #CBD5E1;
  ```
- 每模板强调色变量（作为 fallback，运行时被 color-engine 覆盖）：
  ```css
  --accent-weather: #FFD700;
  --accent-music-purple: #8B5CF6;
  --accent-music-gold: #DCA050;
  --accent-calendar: #3B82F6;
  --accent-alarm: #4ADE80;
  --accent-love: #FF6B8A;
  --accent-baby: #F5C842;
  --accent-holiday: #FF8C42;
  ```
- 统一间距变量对齐 §1.5（padding 64px, gap 12/24, spacer 16/24/32/36/40/48/64）

**验证**：`grep` 旧色值引用 → 全部替换为变量

### 0-2. color-engine.js 输出变量名统一

**输入**：TEMPLATE_SCHEMA.md §0.4 色彩体系总览
**工作**：

- `computePalette(hex, 'mood')` 输出变量名确认：
  ```
  --dyn-bg-start, --dyn-bg-end     → 背景渐变
  --dyn-glow                        → 光晕色
  --dyn-accent                      → 强调色
  --dyn-glass-bg                    → 毛玻璃面板背景
  ```
- `computePalette(hex, 'clean')` 输出变量名确认：
  ```
  --dyn-accent         → Toggle/FAB/指示色
  --dyn-accent-bg      → 带透明度的背景版
  --dyn-label-color    → 标签文字色
  --dyn-divider-color  → 分割线色
  ```
- 确保模板只消费 CSS 变量，不直接引用 hex

### 0-3. config-panel.js — Schema 驱动重写

**输入**：TEMPLATE_SCHEMA.md 每个模板的 `editable=✅` 字段
**工作**：

删除旧的硬编码 `if (scene === 'love')` 分支，改为数据驱动：

```javascript
// 新架构
const TEMPLATE_CONFIGS = {
  anniversary_love: {
    fields: [
      { key: 'start_date', type: 'date_picker', label: '在一起的日期', constraints: { max: 'today' } },
      { key: 'title', type: 'text_input', label: '标题', default: '在一起', constraints: { maxLength: 8 } },
      { key: 'nickname', type: 'text_input', label: '对方昵称', constraints: { maxLength: 6 } },
      { key: 'background_image', type: 'image_picker', label: '背景图', presets: 'love_bg' }
    ]
  },
  // ... 8 个模板的配置，直接映射 SCHEMA editable 字段
};

// 通用渲染器：根据 field.type 渲染对应 UI 控件
function renderConfigField(field) {
  switch (field.type) {
    case 'date_picker': return renderDatePicker(field);
    case 'text_input': return renderTextInput(field);
    case 'image_picker': return renderImagePicker(field);
    case 'color_picker': return renderColorPicker(field);
    case 'segment': return renderSegment(field);
    case 'multi_select': return renderMultiSelect(field);
    case 'enum_select': return renderEnumSelect(field);
  }
}
```

**各模板可编辑字段速查**（来自 SCHEMA）：

| 模板 | 字段 | 控件 |
|------|------|------|
| love | start_date, title, nickname, background_image | date + text×2 + image |
| baby | birth_date, title, baby_name, background_image | date + text×2 + image |
| holiday | target_date, holiday_name, title, background_image | date + text×2 + image |
| weather | city | text_input(带搜索) |
| music | visual_style | enum_select(glass/minimal/material/pixel) |
| calendar | accent_color | color_picker(6色) |
| news | topics, display_style | multi_select + enum_select |
| alarm | default_view, accent_color | segment + color_picker(6色) |

### 0-4. prompt.py — 字段名统一 + NL 映射更新

**输入**：TEMPLATE_SCHEMA.md §10 NL 映射规则 + §12.4 字段名统一表
**工作**：

- `TEMPLATES` dict 内字段名全部对齐 SCHEMA（`date` → `start_date`/`target_date`/`birth_date`，`message` → `description`，`bg_photo` → `background_image`）
- 移除 warm 模板定义
- NL 关键词表与 SCHEMA §10 同步
- AI 输出 JSON 格式对齐 SCHEMA §12.3：
  ```json
  {
    "template_id": "anniversary_love",
    "component_type": "anniversary",
    "theme": "love",
    "params": { "start_date": "2023-05-20", "title": "在一起", "nickname": "小美" },
    "needs_follow_up": [],
    "ai_generated": { "description": "每一天都是最好的一天" }
  }
  ```

### 0-5. render-widget.js — URL MAP + buildWidgetParams 更新

**输入**：新的 8 模板路径 + SCHEMA 字段名
**工作**：

- `TEMPLATE_URL_MAP` 移除 warm，确认 8 个 key：
  ```javascript
  const TEMPLATE_URL_MAP = {
    'anniversary-love': '/widget-templates/anniversary/love/index.html',
    'anniversary-baby': '/widget-templates/anniversary/baby/index.html',
    'anniversary-holiday': '/widget-templates/anniversary/holiday/index.html',
    'weather-weather': '/widget-templates/weather/index.html',
    'music-music': '/widget-templates/music/index.html',
    'calendar-calendar': '/widget-templates/calendar/index.html',
    'news-news': '/widget-templates/news/index.html',
    'alarm-clock': '/widget-templates/alarm/index.html',
  };
  ```
- `buildWidgetParams()` 按 SCHEMA 字段名生成 `__WIDGET_PARAMS__`

### 0-6. validator.py — 按 SCHEMA 约束重写

**输入**：每模板 `constraints` 列
**工作**：每个字段的 required/nullable/type/constraints 直接映射为校验规则

---

## 二、Phase 1 — 共享模板骨架（为 8 个模板建立统一的代码结构）

> **目的**：定义每个模板的标准 index.html / main.js / style.css 骨架代码，确保一致性

### 1-1. index.html 标准骨架

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark" data-style="glass">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=896,initial-scale=1">
  <link rel="stylesheet" href="../shared/tokens.css">
  <link rel="stylesheet" href="../shared/visual-styles.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- 卡片容器 896×1464 -->
  <div id="widget-root" class="widget-card">
    <!-- 模板特有 DOM 结构，节点 ID 对齐 Pencil Node ID -->
  </div>

  <script src="../shared/color-engine.js"></script>
  <!-- 按需引入 -->
  <script src="../shared/color-extract.js"></script>
  <script src="../shared/bridge.js"></script>
  <script src="../shared/storage.js"></script>
  <script src="../shared/overlay.js"></script>
  <script src="../shared/easter-egg.js"></script>
  <script src="main.js"></script>
</body>
</html>
```

### 1-2. main.js 标准骨架

```javascript
'use strict';
(function() {
  // ① 读取注入参数
  const params = window.__WIDGET_PARAMS__ || {};
  const dataMode = window.__WIDGET_DATA_MODE__ || 'preview';
  const isPreview = dataMode === 'preview';

  // ② Mock 数据（手机端预览用）
  const MOCK_DATA = { /* 按 SCHEMA fallback 填充 */ };

  // ③ 合并参数：用户输入 > AI 生成 > mock
  function mergeParams(userParams) { /* ... */ }

  // ④ 色彩引擎初始化
  function initColors(accentOrImage) { /* computePalette / extractPanelTint */ }

  // ⑤ DOM 渲染
  function render(data) { /* 按 SCHEMA §x.2 渲染映射逐字段填充 */ }

  // ⑥ 交互绑定
  function bindInteractions() { /* 手势、点击、定时器 */ }

  // ⑦ 空字段处理
  function handleEmpty(data) { /* 按 SCHEMA §x.3 空字段处理 */ }

  // ⑧ 启动
  const data = mergeParams(params);
  initColors(data.accent_color || data.background_image);
  handleEmpty(data);
  render(data);
  bindInteractions();
})();
```

---

## 三、Phase 2 — 逐模板重建（核心工作量）

### 执行顺序与依赖

```
Phase 0 (基础设施)
  │
  ├─→ Phase 2A: 纪念日三卡（结构相同，可并行）
  │     ├── 2A-1 anniversary/love
  │     ├── 2A-2 anniversary/baby
  │     └── 2A-3 anniversary/holiday
  │
  ├─→ Phase 2B: 天气 + 音乐（mood 配色，需 color-engine）
  │     ├── 2B-1 weather
  │     └── 2B-2 music
  │
  └─→ Phase 2C: 日历 + 闹钟 + 新闻（交互复杂度高）
        ├── 2C-1 calendar
        ├── 2C-2 alarm
        └── 2C-3 news
```

> 2A / 2B / 2C 三组之间**无依赖**，可并行或按顺序执行。每组内建议按顺序做（先做一个跑通流程，后续复用）。

---

### 2A-1. anniversary/love（恋爱纪念日）

**Pencil 对标**：`Card-Love` (`UyUeC`)
**SCHEMA 对标**：§1 纪念日·恋爱
**色彩模式**：image-tint

**DOM 结构**（对齐 Pencil 节点名）：

```
#widget-root
  #photo-area          ← background_image (object-fit:cover, opacity 0.85)
  #bottom-darken       ← 底部暗化渐变层 (7 色标 linear-gradient)
  #glass-panel         ← 毛玻璃信息面板 (y:884, h:580)
    #heartIcon         ← ❤️ emoji (fontSize 32)
    #bigNum            ← days_count (fontSize 160, weight 300)
    #label             ← title + "天的相伴" (fontSize 42, weight 500)
    #divider           ← 分割线 (48×1.5, #FFFFFF60)
    #subtitle          ← description (AI) (fontSize 36, weight 500)
    #dateText          ← "start_date — today" (fontSize 28)
```

**实现要点**：

| 要点 | 说明 |
|------|------|
| 背景图加载 | 优先 `params.background_image`，fallback `backgrounds/love_bg_01.jpg` |
| 取色 | `color-extract.js` → `extractPanelTint(img)` → glass-panel 背景 |
| 天数计算 | `daysDiff(start_date, today)` — DV 字段，前端实时计算 |
| 标题拼接 | `${days_count} 天的${title}` 或直接分行 |
| 空 nickname | 隐藏 nickname 区域，不影响布局 |
| 彩蛋 | 点击 glass-panel → `easter-egg.js` 触发 ❤️ 粒子 |

**交付检查清单**：

- [ ] 卡片尺寸 896×1464，cornerRadius 24
- [ ] 背景图 object-fit:cover
- [ ] Glass panel 位置 y:884，高度 580
- [ ] Hero 数字 160px/300 weight
- [ ] 5 张预设背景正确加载
- [ ] 换图后 panel 色调实时更新
- [ ] 点击触发粒子效果
- [ ] 截图与 Pencil `UyUeC` 视觉一致

### 2A-2. anniversary/baby（宝宝成长）

**Pencil 对标**：`Card-Baby` (`3A9gr`)
**SCHEMA 对标**：§2 纪念日·宝宝

与 love 结构**完全一致**，差异点：

| 差异 | love | baby |
|------|------|------|
| 图标 | ❤️ | ⭐ |
| 计算模式 | 天数 `daysDiff` | 月数 `monthsDiff` |
| Hero 单位标签 | "天的{title}" | "个月的{title}" |
| 字段 | nickname (TA 昵称) | baby_name (宝宝名) |
| 默认 panel 色 | 玫瑰棕 #3a1808 | 暖琥珀 #b89060 |
| 文字色 | 白色 #F5F5F0 | 深棕 #3D2510 |
| 彩蛋粒子 | ❤️ 上飘 | ⭐🧸 四散 |

### 2A-3. anniversary/holiday（放假倒计时）

**Pencil 对标**：`Card-Holiday` (`7EC5L`)
**SCHEMA 对标**：§3 纪念日·放假

与 love 结构**类似**，差异点：

| 差异 | love | holiday |
|------|------|---------|
| 图标 | ❤️ | ✈️ tag pill (带 holiday_name) |
| 计算模式 | 正计时 `daysDiff(start→today)` | **倒计时** `daysDiff(today→target)` |
| Hero 单位标签 | "天的{title}" | "天" (fontSize 42) |
| 额外字段 | — | holiday_name (tag pill 内) |
| 已过期处理 | 无 | 显示"已到达 🎉"替换倒计时 |
| 彩蛋粒子 | ❤️ | 🎉🎊 + 彩纸 |

---

### 2B-1. weather（天气）

**Pencil 对标**：`Card-Weather` (`tPVm8`) + `Variant-Weather-Cloudy/Rainy`
**SCHEMA 对标**：§4 天气
**色彩模式**：mood（天况自动决定）

**DOM 结构**：

```
#widget-root                 ← mesh-gradient 背景
  #sun-glow                  ← 装饰光晕 (radial-gradient, 天况决定色)
  #content                   ← 主内容容器 (padding 64)
    #header                  ← cityName + dateText
    #hero                    ← sunIcon + temperature + condition + feels-like
    #pill-row                ← humidity + wind + uv (3 个 glass pill)
    #forecast-row            ← 3 天预报 (day1/day2/day3)
    #ai-suggestion           ← AI 建议框 (glass card)
```

**实现要点**：

| 要点 | 说明 |
|------|------|
| 数据获取 | 预览用 mock；车端 `GET /api/weather?city={city}` |
| 天况→配色 | 晴→蓝 mesh, 阴→灰蓝, 雨→靛蓝, 雪→深紫, 夜→暗蓝 |
| mesh gradient | CSS mesh-gradient 或 4 色径向混合模拟 |
| AI 建议 | 来自 `params.ai_suggestion` (AG 字段) |
| 城市切换 | 点击城市名 → overlay 弹出搜索 (Sub-Weather-CityPicker) |
| 刷新 | 下拉刷新或定时 30min |

### 2B-2. music（音乐播放器）

**Pencil 对标**：`Card-Music` (`qXG2n`)
**SCHEMA 对标**：§5 音乐
**色彩模式**：mood（封面取色）

**DOM 结构**：

```
#widget-root                 ← mesh-gradient 背景 (暗紫基底)
  #album-bg-blur             ← 封面模糊背景 (blur 80, opacity 0.4)
  #dark-overlay              ← 暗化层 (linear-gradient)
  #glow-purple               ← 紫色光晕
  #content                   ← 主内容
    #album-art               ← 封面图 (560×560, r28, shadow)
    #song-name               ← 歌名 (fontSize 56, weight 600)
    #artist                  ← 歌手 (fontSize 36, #F5F5F060)
    #lyrics                  ← 歌词片段 (italic, #F5F5F040)
    #spectrum                ← 频谱柱 (7 bars, #DCA050)
    #progress-bar            ← 进度条 (gradient fill)
    #time-row                ← 当前/总时长
    #controls                ← prev + play + next (glass pill)
```

**实现要点**：

| 要点 | 说明 |
|------|------|
| 数据获取 | `bridge.getMediaSession()` → 歌名/歌手/封面/进度/歌词 |
| 无播放兜底 | 切换到 `Sub-Music-EmptyState` (Pencil `OLLkg`) |
| visual_style | `params.visual_style` → `data-style="glass/minimal/material/pixel"` |
| 封面取色 | 封面图 → `extractPanelTint` → 替换 glow/accent 色 |
| 控制按钮 | `bridge.play()` / `bridge.pause()` / `bridge.next()` / `bridge.prev()` |
| 频谱动画 | CSS animation 模拟 (非真实音频分析) |

---

### 2C-1. calendar（日历日程）

**Pencil 对标**：`Card-Calendar` (`7fKb6`) + 5 色变体 + `State-Calendar-SwipeDelete`
**SCHEMA 对标**：§6 日历
**色彩模式**：clean（用户选 accent_color）

**DOM 结构**：

```
#widget-root                 ← 亮色 mesh-gradient 背景
  #content
    #calHeader               ← "日程" + weekText
    #date-section            ← bigDate(22) + "3月 2026" + 农历
    #dividerLine
    #event-list              ← 3 条事件 (time + dot + title + location)
    #next-meeting            ← "距下次会议还有 N 分钟" (accent glass pill)
  #fab-add-cal               ← FAB "+" 按钮 (accent色)
```

**实现要点**：

| 要点 | 说明 |
|------|------|
| accent 注入 | `computePalette(accent_color, 'clean')` → CSS 变量 |
| 事件数据 | 预览用 mock 3 条；车端从 `localStorage` 读取 |
| 空列表 | 显示 empty state "暂无日程，点击 + 添加" |
| 左滑删除 | 事件行左滑 ≥64px → 露出红色删除按钮 (State-Calendar-SwipeDelete) |
| 新增日程 | 点击 FAB → overlay 表单 (Sub-Calendar-AddEvent) |
| 农历 | 简单公历转农历算法 (可用轻量库) |

### 2C-2. alarm（闹钟）

**Pencil 对标**：`Card-Alarm` (`Qb8jr`) + 5 色变体 + 3 个 State 页
**SCHEMA 对标**：§8 闹钟
**色彩模式**：clean（用户选 accent_color）

**DOM 结构（列表模式）**：

```
#widget-root                 ← 纯黑背景 #1A1A1C
  #alarm-content
    #header                  ← "闹钟" + "···" more按钮
    #countdown-text          ← "N小时N分钟后响铃"
    .section-label           ← "作息" (accent色)
    .alarm-row               ← time + period + label + toggle (可滑动)
    .section-label           ← "其他"
    .alarm-row               ← ...
  #fab-add                   ← FAB "+" (accent色)
```

**实现要点**：

| 要点 | 说明 |
|------|------|
| accent 注入 | `computePalette(accent_color, 'clean')` → toggle/FAB/标签色 |
| 双视图 | `default_view: list/clock` → 切换 (State-Alarm-ClockMode / ListMode) |
| 分组 | 按 `alarm.group` 或规则分"作息"/"其他" |
| 左滑删除 | 行左滑 ≥64px → 红色删除按钮 (State-Alarm-SwipeDelete) |
| ⚠️ 删除按钮 | **默认隐藏**，不在首屏渲染！仅 swipe 时动态显示 |
| 新增闹钟 | FAB → overlay 时间选择器 (Sub-Alarm-AddAlarm) |
| 倒计时 | 从当前时间到最近一个 enabled 闹钟的倒计时文本 |
| 数据持久化 | `WidgetStorage('alarms')` → localStorage |

### 2C-3. news（每日新闻）

**Pencil 对标**：`Card-News` (`OMxV7`)
**SCHEMA 对标**：§7 新闻
**色彩模式**：mood（分类→颜色自动映射，用户不可控）

**DOM 结构**：

```
#widget-root                 ← 深海蓝渐变背景
  #content
    #header                  ← "每日简报" + 日期
    #hero-news               ← 头条(图片+渐变蒙版+标题+摘要+来源)
    .news-card               ← 分类标签(颜色) + 标题 + 来源 (×3)
```

**实现要点**：

| 要点 | 说明 |
|------|------|
| 数据获取 | `GET /api/news?categories={topics.join(',')}` |
| topics 配置 | 用户通过 config-panel 选择关注领域 (multi_select) |
| display_style | card(默认) / list — 两种布局 |
| 分类→颜色 | SCHEMA §7.3 映射表 (tech→蓝, auto→橙, finance→绿, sports→红...) |
| 全文阅读 | 点击新闻条目 → overlay 详情页 (Sub-News-ArticleDetail) |
| 缓存 | 30min 服务端缓存，前端 5min 本地缓存 |

---

## 四、Phase 3 — 集成验证

### 3-1. 全链路冒烟测试

对每个模板执行：

```
[market.js 选场景] → [config-panel 填参数] → [API /chat-generate]
→ [preview.js 渲染预览] → [视觉截图对比 Pencil] → [推送到车模拟器]
```

**验证矩阵**（8 模板 × 5 检查项 = 40 项）：

| 检查项 | 方法 |
|--------|------|
| 视觉还原 | 截图对比 Pencil 主卡 |
| 字段映射 | config-panel 修改每个 editable 字段 → 预览实时反映 |
| 空值降级 | 清空所有可选字段 → fallback 正确 |
| 色彩联动 | 改色/换图 → 配色引擎实时生效 |
| 交互完整 | 左滑/FAB/点击/切换模式 全覆盖 |

### 3-2. Pencil 设计-代码一致性

对每个模板：
1. `batch_get(nodeId, readDepth=3)` 提取 Pencil 属性
2. 与代码中的 CSS 值逐项比对
3. 差异 → 以 Pencil 为准修正代码

### 3-3. HMI 合规检查

| 检查项 | 标准 | 方法 |
|--------|------|------|
| 文字最小尺寸 | ≥24dp (≈32px) | grep 所有 fontSize < 32 |
| 触控目标 | ≥76×76dp | 测量所有可点击元素 |
| 2 秒 Glanceability | Hero 数据 2s 可理解 | 人工评审 |
| 对比度 | WCAG AA (4.5:1 正文, 3:1 大字) | 工具检测 |

---

## 五、执行排期建议

| 阶段 | 预估工作量 | 产出 |
|------|-----------|------|
| **Phase 0** 基础设施 | 1 天 | tokens.css + color-engine + config-panel + prompt.py + render-widget 全部就绪 |
| **Phase 2A** 纪念日×3 | 1 天 | love 跑通后 baby/holiday 复用，快速完成 |
| **Phase 2B** 天气+音乐 | 1 天 | mood 配色模板，天气有 API 对接 |
| **Phase 2C** 日历+闹钟+新闻 | 1.5 天 | 交互最复杂（左滑删除、双视图、overlay） |
| **Phase 3** 集成验证 | 0.5 天 | 全链路冒烟 + Pencil 对标 + HMI 合规 |
| **总计** | **~5 天** | 8 模板全部重建 + 验证通过 |

---

## 六、Claude Code 执行指令

> 以下为可直接转发给 Claude Code 的分步执行指令。每步完成后截图验证再进入下一步。

### 指令 0：基础设施对齐

```
请按照 docs/TEMPLATE_REBUILD_PLAN.md Phase 0 执行基础设施对齐：

1. 读取 docs/DESIGN.md §1.4 颜色体系、§1.5 间距体系
2. 更新 src/widget-templates/shared/tokens.css，对齐所有色值和变量名
3. 更新 src/widget-templates/shared/color-engine.js，确保输出变量名与 TEMPLATE_SCHEMA.md §0.4 一致
4. 删除 src/mobile-web/src/components/config-panel.js，按 TEMPLATE_REBUILD_PLAN.md §0-3 重写为 schema 驱动
5. 更新 src/server/ai_generator/prompt.py，按 TEMPLATE_SCHEMA.md §12.4 统一字段名，移除 warm 模板
6. 更新 src/mobile-web/src/utils/render-widget.js，移除 warm，字段名对齐
7. 更新 src/server/ai_generator/validator.py，按各模板 SCHEMA constraints 重写校验规则

每步完成后用 grep 验证无旧字段名残留。
```

### 指令 1：纪念日三卡

```
按 docs/TEMPLATE_REBUILD_PLAN.md §2A 重建纪念日三卡：

1. 删除 src/widget-templates/anniversary/warm/ 整个目录
2. 删除 anniversary/love/main.js + style.css（保留 index.html 和 backgrounds/）
3. 读取 Pencil 设计稿 batch_get('UyUeC', readDepth=3) 提取所有节点属性
4. 按 TEMPLATE_SCHEMA.md §1 + Pencil 属性，重写 love/index.html + main.js + style.css
5. 截图对比 Card-Love 确认视觉还原
6. 复制 love 结构到 baby，按 §2A-2 差异表修改
7. 复制 love 结构到 holiday，按 §2A-3 差异表修改
8. 分别截图验证 baby、holiday
```

### 指令 2：天气 + 音乐

```
按 docs/TEMPLATE_REBUILD_PLAN.md §2B 重建天气和音乐：

1. 读取 Pencil batch_get('tPVm8', readDepth=3)
2. 按 SCHEMA §4 + Pencil 属性重建 weather/index.html + main.js + style.css
3. 实现天况→配色映射（5 种天况 × 对应 mesh gradient）
4. 截图对比 Card-Weather + Variant-Weather-Cloudy + Variant-Weather-Rainy
5. 读取 Pencil batch_get('qXG2n', readDepth=3)
6. 按 SCHEMA §5 重建 music
7. 截图验证
```

### 指令 3：日历 + 闹钟 + 新闻

```
按 docs/TEMPLATE_REBUILD_PLAN.md §2C 重建日历、闹钟、新闻：

1. 日历：batch_get('7fKb6')，重建 + 实现 accent_color 6 色切换 + 左滑删除（State 页面对标）
2. 闹钟：batch_get('Qb8jr')，重建 + 双视图 + 左滑删除 + accent 6 色
3. 新闻：batch_get('OMxV7')，重建 + 分类颜色映射 + display_style 双布局
4. ⚠️ 闹钟和日历的删除按钮：默认 display:none，仅 swipe 事件触发时显示
5. 逐个截图验证
```

### 指令 4：集成验证

```
按 docs/TEMPLATE_REBUILD_PLAN.md Phase 3 执行全链路验证：

1. 启动前后端 (npm run dev + python3 main.py)
2. 对 8 个模板逐一执行：选场景 → 填参数 → 生成 → 预览 → 推送模拟
3. 每个模板截图对比 Pencil 主卡
4. 检查所有 fontSize ≥ 32px (HMI 合规)
5. 检查所有可点击元素 ≥ 76×76
6. 输出验证报告
```

---

## 附录：文件变更清单

### 删除

```
src/widget-templates/anniversary/warm/          ← 整个目录
src/widget-templates/anniversary/love/main.js
src/widget-templates/anniversary/love/style.css
src/widget-templates/anniversary/baby/main.js
src/widget-templates/anniversary/baby/style.css
src/widget-templates/anniversary/holiday/main.js
src/widget-templates/anniversary/holiday/style.css
src/widget-templates/weather/main.js
src/widget-templates/weather/style.css
src/widget-templates/music/main.js
src/widget-templates/music/style.css
src/widget-templates/calendar/main.js
src/widget-templates/calendar/style.css
src/widget-templates/news/main.js
src/widget-templates/news/style.css
src/widget-templates/alarm/main.js
src/widget-templates/alarm/style.css
```

### 新建

```
src/widget-templates/anniversary/love/main.js    ← 重写
src/widget-templates/anniversary/love/style.css
src/widget-templates/anniversary/baby/main.js
src/widget-templates/anniversary/baby/style.css
src/widget-templates/anniversary/holiday/main.js
src/widget-templates/anniversary/holiday/style.css
src/widget-templates/weather/main.js
src/widget-templates/weather/style.css
src/widget-templates/music/main.js
src/widget-templates/music/style.css
src/widget-templates/calendar/main.js
src/widget-templates/calendar/style.css
src/widget-templates/news/main.js
src/widget-templates/news/style.css
src/widget-templates/alarm/main.js
src/widget-templates/alarm/style.css
```

### 修改

```
src/widget-templates/shared/tokens.css           ← 色值对齐
src/widget-templates/shared/color-engine.js      ← 变量名对齐
src/widget-templates/*/index.html                ← DOM 结构对齐 Pencil
src/mobile-web/src/components/config-panel.js    ← schema 驱动重写
src/mobile-web/src/utils/render-widget.js        ← 字段名统一
src/server/ai_generator/prompt.py                ← 字段名统一 + 移除 warm
src/server/ai_generator/validator.py             ← 约束重写
docs/TECH_PLAN.md                                ← 更新进度
```
