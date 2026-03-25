# 走查问题修复计划

> 基于 2025-03-25 走查发现的 6 类卡片问题，按优先级排列，含根因分析 + 修复方案 + 涉及文件。

---

## 1. 天气卡片 — 手机端数据不更新 & 车端地点延迟

### 问题 A：手机端所有地点都是 18°C

**根因**：Preview 模式下 `currentCity` 始终为 `'北京'`，未从 `params.city` 初始化。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/weather/main.js` | 89-90 | `var MOCK = MOCK_CITY_DATA['北京']` 写死默认城市 |
| `src/widget-templates/weather/main.js` | 260-265 | `fetchData()` 在 preview 模式用 `currentCity`，但 `currentCity` 从未用 `params.city` 赋值 |
| `src/widget-templates/weather/main.js` | 129 | `params` 已正确注入，但初始化时未读取 `params.city` |

**修复方案**：
```javascript
// main.js 初始化段（约 line 129 后）
var params = window.__WIDGET_PARAMS__ || {};
var dataMode = window.__WIDGET_DATA_MODE__ || 'live';
var currentCity = params.city || '北京'; // ← 关键：从 params 初始化
var MOCK = MOCK_CITY_DATA[currentCity] || MOCK_CITY_DATA['北京'];
```

### 问题 B：车端温度更新但地点有延迟

**根因**：`/api/sync` 推送时只传 `SyncState`（sync_id/widget_id），不包含 widget params。车端需要额外 fetch 完整数据，导致两阶段更新的竞态。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/server/main.py` | 484-521 | `POST /api/sync` 仅创建 SyncState，不传 widget params |
| `src/server/sync_service/state.py` | 65-101 | `create_sync()` 只存 sync 元数据，无 params 字段 |
| `src/server/sync_service/push.py` | 158-194 | `_notify_device()` 只发 SyncState，不带完整数据 |

**修复方案**：
1. `SyncState` 增加 `widget_params` 字段
2. `create_sync()` 接受并存储完整 widget params
3. `_notify_device()` 推送时附带完整 params（包含 city）
4. 车端收到推送后直接用 params 渲染，不再二次 fetch

---

## 2. 纪念日卡片 — 车端默认卡 & 底部黑边

### 问题 A：推送到车端后显示默认卡片

**根因**：`TemplateMapper.kt` 缺少 `"birthday"` 主题映射，导致 `getAssetPath()` 返回 null。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/car-host/android/.../TemplateMapper.kt` | 14-19 | `"anniversary" -> when (theme)` 只列了 `love/baby/holiday`，缺少 `birthday` |

**修复方案**：
```kotlin
"anniversary" -> when (theme) {
    "love", "baby", "holiday", "birthday" -> "anniversary/$theme"  // ← 补上 birthday
    else -> null
}
```

### 问题 B：放假 & 生日底部有黑边（恋爱/宝宝已修）

**根因**：Holiday 和 Birthday 模板缺少 `#bottom-darken` 渐变遮罩元素，且 glass-panel 用 `top: 866px` 而非 `bottom: 0`。

**Love/Baby（已修好的）结构**：
```html
<div id="bottom-darken"></div>  <!-- 渐变过渡 -->
<div id="glass-panel" style="bottom: 0">...</div>
```

**Holiday/Birthday（有黑边的）缺失**：
- 无 `#bottom-darken` 元素
- glass-panel 用 `top: 866px` 绝对定位（866+598=1464 数学正确，但缺过渡渐变）

| 文件 | 问题 |
|------|------|
| `src/widget-templates/anniversary/holiday/index.html` | 缺少 `<div id="bottom-darken"></div>` |
| `src/widget-templates/anniversary/holiday/style.css` L26-48 | glass-panel 用 `top:866px`，缺 bottom-darken 样式 |
| `src/widget-templates/anniversary/birthday/index.html` | 同上，缺少 bottom-darken |
| `src/widget-templates/anniversary/birthday/style.css` L30-48 | 同上 |

**修复方案**：
1. 两个 index.html 均添加 `<div id="bottom-darken"></div>`
2. CSS 添加 `#bottom-darken { position:absolute; bottom:0; left:0; width:896px; height:600px; background:linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%); pointer-events:none; }`
3. glass-panel 改为 `bottom: 0` 定位（删除 `top: 866px`）

---

## 3. 日程卡片 — 弹窗错乱 & 倒计时位置 & 无法滑动删除

### 问题 A：弹窗组件对齐错乱无法使用

**根因**：共享弹窗 overlay.css 的 `.overlay-panel` 宽度 720px 在 896px 容器内居中，但内部表单元素缺少约束。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/shared/overlay.css` | 25-41 | panel 宽度/高度约束不足，表单内容可能溢出 |

**修复方案**：
1. 检查弹窗内部 form 元素的宽度约束
2. 为 `.overlay-panel` 添加 `overflow: hidden` 和内部 flex 对齐
3. 表单字段添加 `width: 100%; box-sizing: border-box`

### 问题 B："距下次回忆还有xxx" 显示在中间而非底部

**根因**：`#nextMeeting` 前使用固定高度 spacer（64px），未用 flex-grow 推到底部。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/calendar/style.css` | 227-251 | `.next-meeting` 缺少 `margin-top: auto` |
| `src/widget-templates/calendar/index.html` | 44-45 | spacer 写死 `height: 64px`，应改为 `flex: 1` |

**修复方案**：
```css
/* 将 spacer 改为弹性空间 */
#nextMeeting前的spacer { flex: 1; }

/* 或直接给 #nextMeeting 加 */
.next-meeting { margin-top: auto; }
```

### 问题 C：无法上下滑动查看日程 & 无法删除

**根因**：`.event-list` 设置了 `flex-shrink: 0` 且无 `overflow-y: auto`，超出部分直接被卡片 clip 掉。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/calendar/style.css` | 123-128 | `.event-list` 无滚动属性 |
| `src/widget-templates/calendar/main.js` | 257-320 | 滑动删除代码存在，但 UI 上被裁切无法交互 |

**修复方案**：
```css
.event-list {
  flex: 1;           /* 占满剩余空间 */
  overflow-y: auto;  /* 允许垂直滚动 */
  -webkit-overflow-scrolling: touch;
  flex-shrink: 1;    /* 允许收缩 */
}
```

---

## 4. 音乐卡片 — 封面 & MediaSession & 兜底图

### 问题 A：手机端没有正确显示封面

**根因**：封面 URL 赋值时无 error 回调，图片加载失败时无 fallback。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/music/main.js` | 114-125 | `backgroundImage = url(...)` 无加载错误处理 |

**修复方案**：
```javascript
var img = new Image();
img.onload = function() {
  albumArt.style.backgroundImage = 'url(' + coverUrl + ')';
};
img.onerror = function() {
  albumArt.style.backgroundImage = ''; // 显示 CSS 默认渐变
  albumArt.classList.add('empty-state');
};
img.src = coverUrl;
```

### 问题 B：车端不调用 MediaSession，仍用 mock 数据

**根因**：Preview 模式硬编码用 MOCK；bridge.js 的 mock handler 在车端环境也返回假数据。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/music/main.js` | 217-244 | preview 模式直接 `renderSession(MOCK)` |
| `src/widget-templates/shared/bridge.js` | 119-128 | mock handler 不区分环境 |

**修复方案**：
1. `main.js`：live 模式调用 `bridge.getMediaSession()` 获取真实数据
2. `bridge.js`：检测 `window.CarWidgetBridge` 存在时调用真实接口，不走 mock
3. 轮询机制：每 5s 调用 `bridge.getMediaSession()` 刷新播放状态

### 问题 C：无播放内容时没有显示兜底图

**根因**：空状态只隐藏内容区，未显示专用占位图。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/music/main.js` | 87-98 | 空状态只 hide，无占位图 |
| `src/widget-templates/music/style.css` | 106-121 | 无 `.empty-state` 样式 |

**修复方案**：
1. 添加 `.album-art.empty-state` 样式：居中音符图标 + 渐变背景
2. 添加提示文字："暂无播放内容"
3. 空状态下隐藏进度条和控制按钮

---

## 5. 闹钟卡片 — 右上角 ··· 可删除

### 问题

**根因**：`···` 只是静态文本元素，有 `cursor: pointer` 但无 click handler。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/alarm/index.html` | 24 | `<span class="alarm-menu">···</span>` 无事件绑定 |
| `src/widget-templates/alarm/main.js` | 全文 | 未找到 `.alarm-menu` 的 click 绑定 |
| `src/widget-templates/alarm/style.css` | 55-62 | 有 pointer 样式但无功能 |

**修复方案**：
1. 给 `.alarm-menu` 绑定 click 事件，弹出删除确认弹窗（复用 shared/overlay）
2. 删除逻辑：清除该闹钟对应的 localStorage 数据 + 从 DOM 移除
3. 或者按用户要求直接移除 ··· 元素（如果不需要删除功能）

---

## 6. 新闻卡片 — 内容多时顶部遮挡

### 问题

**根因**：hero-info 固定 290px 高度，内部文字溢出时无 overflow 处理，与下方内容重叠。

| 文件 | 行号 | 问题 |
|------|------|------|
| `src/widget-templates/news/style.css` | 100-114 | `.hero-info` 高度 290px，无 overflow:hidden |
| `src/widget-templates/news/style.css` | 122-141 | `.hero-title` 有 line-clamp，但 `.hero-summary` 溢出未处理 |

**修复方案**：
```css
.hero-info {
  overflow: hidden;   /* 防止溢出 */
}

.hero-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;      /* 最多 2 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;     /* ← 用 ... 省略 */
}
```

---

## 执行优先级

| 优先级 | 卡片 | 问题 | 复杂度 | 预估工时 |
|--------|------|------|--------|----------|
| P0 | 天气 | 手机端数据不更新 | 低 | 10min |
| P0 | 纪念日 | 车端 TemplateMapper 缺 birthday | 低 | 5min |
| P0 | 纪念日 | 底部黑边（holiday/birthday） | 中 | 30min |
| P1 | 日程 | 事件列表无法滚动 | 低 | 10min |
| P1 | 日程 | "距下次回忆" 位置 | 低 | 5min |
| P1 | 音乐 | 封面加载 + 兜底图 | 中 | 30min |
| P1 | 新闻 | 顶部溢出 → ellipsis | 低 | 10min |
| P2 | 天气 | 车端地点同步延迟 | 高 | 1h |
| P2 | 日程 | 弹窗对齐修复 | 中 | 30min |
| P2 | 音乐 | 车端 MediaSession 集成 | 高 | 2h |
| P2 | 闹钟 | ··· 删除功能 | 中 | 20min |

**总预估**：~5h，建议分 2 个 Sprint 执行（P0/P1 为 S1，P2 为 S2）。
