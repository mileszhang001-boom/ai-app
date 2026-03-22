# AI小组件 v0.4 升级方案 — 8 模板功能完善

> 基于 v0.3 已完成的 UI 设计 (card.pen) + 已有代码实现，对 8 个模板进行功能补齐
> 更新日期：2026-03-22

---

## 一、总体目标

将 8 个模板从「静态展示卡片」升级为「可交互的车载小组件」：每个模板支持**用户自定义**（颜色、背景图、参数）+ **卡片内交互**（弹窗操作、彩蛋触发）。

### ⚠️ 改造范围声明

> **本次重点改造内容：卡片内设计与交互、自定义 & 微调选项。**
> **手机端交互框架（market → preview → finetune 三页面流程、AI 生成 Pipeline、config-panel 整体架构）保持不变。**
>
> 具体来说：
> - ✅ **改**：H5 模板内部（HTML/CSS/JS）、卡片内 overlay 弹窗、彩蛋效果、背景图切换
> - ✅ **改**：config-panel 内各场景的**字段扩展**（新增多选 pills、背景图 grid 等）
> - ✅ **改**：server 端模板参数白名单扩展
> - ❌ **不改**：手机端页面路由、preview/finetune 页面布局、AI 意图解析流程、render-widget.js 渲染框架

### 技术决策确认

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 弹窗交互 | **H5 内部 overlay** | 与 card.pen 设计一致，不依赖车端能力，Demo 可独立运行 |
| 背景图 | **预设图库选择** | 每主题 5-8 张精选图，开发快、体验可控，不需要图片上传后端 |
| 闹钟表盘 | **传统圆形钟面** | 时针/分针指向闹钟时间，经典直觉，与现有列表风格形成差异 |
| 数据存储 | **localStorage** | Demo 阶段足够，简单快速，后续可平滑迁移到 JSBridge/云端 |

---

## 二、现状 vs 目标：8 模板 Gap 分析

### ✅ 已具备（所有模板共有）

- 896×1464 Liquid Glass 设计语言，Design Tokens 完整
- 颜色引擎 `color-engine.js`：任意 hex → 完整调色板
- 4 种视觉风格宏 `visual-styles.css`：glass / minimal / material / pixel
- 手机端配置面板 `config-panel.js`：颜色选择器 + 场景字段
- AI 生成 Pipeline：NL 意图识别 → JSON 参数 → 模板渲染
- JSBridge 封装 `bridge.js`：mock + 真实桥接

### 📋 逐模板 Gap 分析

| 模板 | 自定义能力 | 现状 | 需新增 |
|------|-----------|------|--------|
| **天气** | 颜色 ✅ / 城市 ⚠️ | 城市通过 config 选择，6 个预设 | ▶ 卡片内切换城市弹窗 overlay |
| **音乐** | 颜色 ⚠️ | 固定 style_preset 选色 | ▶ 封面取色（自动提取主色调）|
| **日程** | 颜色 ✅ | 展示型时间线，无交互 | ▶ 新增/删除日程 overlay + localStorage |
| **新闻** | 颜色 ✅ / 领域 ⚠️ | 单 category 参数 | ▶ 多领域选择（多选 4-5 个）|
| **闹钟** | 颜色 ✅ / 风格 ❌ | 单闹钟展示 + 进度环 | ▶ 多闹钟列表 + 表盘风格 + 新建/开关/删除 |
| **恋爱** | 颜色 ✅ / 背景 ❌ / 彩蛋 ❌ | 固定背景渐变 + 粒子 | ▶ 预设背景图 + 点击弹出爱心 |
| **宝宝** | 颜色 ✅ / 背景 ❌ / 彩蛋 ❌ | 固定背景渐变 + 粒子 | ▶ 预设背景图 + 点击弹出小玩具 |
| **假期** | 颜色 ✅ / 背景 ❌ / 彩蛋 ❌ | 固定背景渐变 + 粒子 | ▶ 预设背景图 + 点击弹出礼花彩带 |

---

## 三、架构设计

### 3.1 新增公共能力层

```
shared/
├── tokens.css              # ← 已有
├── color-engine.js         # ← 已有
├── visual-styles.css       # ← 已有
├── bridge.js               # ← 已有
├── overlay.js              # ★ 新增：通用弹窗 overlay 组件
├── overlay.css             # ★ 新增：弹窗样式（毛玻璃 + 动画）
├── storage.js              # ★ 新增：localStorage 封装（增删改查 + 事件通知）
├── bg-picker.js            # ★ 新增：背景图选择器组件
└── easter-egg.js           # ★ 新增：彩蛋粒子效果引擎（爱心/玩具/礼花）
```

### 3.2 通用 Overlay 组件 (`shared/overlay.js`)

所有卡片内弹窗共用一套 overlay 基础设施，与 card.pen 中设计的弹窗 UI 对齐：

```
┌─────────────────────────────────┐
│  896×1464 卡片                   │
│                                 │
│  ┌───── overlay-backdrop ─────┐ │  ← 半透明黑色遮罩
│  │                            │ │
│  │  ┌── overlay-panel ──────┐ │ │  ← 毛玻璃面板，居中
│  │  │  标题栏（取消/保存）    │ │ │
│  │  │  ─────────────────── │ │ │
│  │  │  表单内容             │ │ │
│  │  │  （由各模板自定义）    │ │ │
│  │  └───────────────────────┘ │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

**API 设计：**
```javascript
// 创建 overlay
const overlay = createOverlay({
  title: '切换地点',
  theme: 'dark',          // dark | light（日程用 light）
  panelHeight: 'auto',    // auto | 固定px
  onSave: (data) => {},
  onCancel: () => {},
  content: (panelEl) => {
    // 各模板在这里填充自己的表单内容
  }
});
overlay.show();
overlay.hide();
```

### 3.3 本地存储封装 (`shared/storage.js`)

```javascript
const store = WidgetStorage('alarm');    // namespace 隔离

store.getAll();                          // → [{id, ...}, ...]
store.add({time:'08:00', repeat:'weekdays', enabled:true});
store.update(id, {enabled: false});
store.remove(id);
store.onChange(callback);                // 数据变更通知
```

### 3.4 彩蛋粒子引擎 (`shared/easter-egg.js`)

三张纪念日卡共用一个彩蛋粒子引擎，参数化控制效果类型：

| 主题 | 粒子形状 | 行为 | 触发 |
|------|---------|------|------|
| 恋爱 | ❤️ 爱心 | 从点击位置向外扩散 + 上浮消散 | 点击卡片任意位置 |
| 宝宝 | ⭐🧸🎈 玩具 | 从点击位置弹出 + 重力下落 + 弹跳 | 点击卡片任意位置 |
| 假期 | 🎊🎉✨ 礼花 | 从底部喷射 + 纸屑飘落 | 点击卡片任意位置 |

**API：**
```javascript
import { triggerEasterEgg } from '../shared/easter-egg.js';
card.addEventListener('click', (e) => {
  triggerEasterEgg(canvas, e.clientX, e.clientY, 'love'); // 'love'|'baby'|'holiday'
});
```

---

## 四、逐模板详细方案

### 4.1 天气 (`weather/`)

**用户自定义：**
- 卡片颜色：已支持 ✅（config-panel 颜色选择器 → `primary_color` → `color-engine`）
- 城市：config-panel 已有 6 城市 pills ✅，**需新增卡片内切换**

**卡片内交互 — 切换城市弹窗：**

对应 card.pen 设计：`gmj9b`（天气-切换地点）

```
实现方案：
1. 卡片 header 区域「北京 📍」可点击 → 触发 overlay
2. overlay 内容：
   - 搜索框（输入城市名过滤）
   - 当前位置行（定位城市 + GPS 图标）
   - 已保存城市列表（5 个预设 + 用户添加）
   - 每行：城市名 + 天气描述 + 温度
3. 点击某城市 → overlay 关闭 → 卡片刷新天气数据
4. 选中的城市存入 localStorage，下次加载恢复
```

**改动文件：**
- `weather/main.js`：新增 overlay 触发逻辑、城市切换后重新 fetch `/api/weather`
- `weather/index.html`：header 城市文字添加 click handler
- `shared/overlay.js`：新建公共组件（首个使用者）

**工作量估算：** 1.5 天

---

### 4.2 音乐播放器 (`music/`)

**用户自定义：**
- 卡片颜色：**升级为封面取色模式** — 默认从专辑封面提取主色调，用户也可手动覆盖

**封面取色方案：**
```
1. album_cover_url 加载到隐藏 <img>
2. 绘制到 offscreen <canvas>（跨域需 crossOrigin="anonymous"）
3. 采样像素 → 提取主色调（取频率最高的非灰色像素簇）
4. 主色调 hex → computePalette() → 注入 CSS 变量
5. 如果取色失败（CORS / 无图）→ fallback 到 style_preset 默认配色
```

**卡片内交互：**
- 播放/暂停：已支持 ✅
- 上一首/下一首：已支持 ✅
- 进度条拖动：已支持 ✅

**改动文件：**
- `music/main.js`：新增 `extractDominantColor(imageUrl)` 函数
- `shared/color-engine.js`：无需改动，已支持任意 hex 输入

**工作量估算：** 0.5 天

---

### 4.3 日程提醒 (`calendar/`)

**用户自定义：**
- 卡片颜色：已支持 ✅

**卡片内交互 — 新增/删除日程：**

对应 card.pen 设计：`6eWNV`（日程-新增日程）

```
新增日程 overlay 表单字段：
- 标题（文本输入）
- 地点（文本输入）
- 全天开关（toggle）
- 开始时间（日期 + 时间选择器）
- 结束时间（日期 + 时间选择器）
- 提醒（选择器：无/5分钟前/15分钟前/30分钟前）
- 颜色标记（6 色圆点选择）
- 备注（文本输入）

删除日程：
- 长按某条日程 → 弹出确认气泡 → 确认删除
- 或在 overlay 编辑模式下提供删除按钮
```

**数据流：**
```
localStorage('calendar_events')
  → 首次加载：使用 __WIDGET_PARAMS__.events 作为初始数据
  → 新增/删除：更新 localStorage
  → 界面：重新渲染时间线
```

**FAB 按钮：**
- 卡片右下角 "+" 悬浮按钮（与 card.pen 设计一致）
- 点击 → 打开新增日程 overlay

**改动文件：**
- `calendar/main.js`：新增 localStorage 读写 + overlay 触发 + 事件渲染刷新
- `calendar/index.html`：添加 FAB 按钮 DOM
- `calendar/style.css`：FAB 样式、长按确认气泡样式

**工作量估算：** 2.5 天

---

### 4.4 新闻 (`news/`)

**用户自定义：**
- 卡片颜色：已支持 ✅
- 关注领域：**需升级 config-panel 为多选模式**

**领域多选方案：**
```
预设领域（5 个）：
- 科技 (tech)
- 汽车 (automotive)
- 财经 (finance)
- 体育 (sports)
- 生活 (lifestyle)

config-panel 改动：
- news 场景新增 categories 字段
- UI：5 个标签 pill，可多选（至少选 1 个，最多 5 个）
- 默认选中：科技 + 汽车
- 传递给模板：params.categories = ['tech', 'automotive']
```

**卡片内交互 — 查看详情/返回：**

对应 card.pen 设计：`D2HUa`（新闻-全文阅读）

```
已有实现（部分）：
- 点击新闻条目 → 展开详情 overlay ← 已有 click handler
- 需补充：全文阅读 overlay 的完整排版（标题 + 来源 + 正文 + 返回按钮）

详情 overlay 布局：
- 顶栏：← 返回按钮 + 文章标题
- 封面图（如有）
- 正文内容（API 返回的 summary 扩展）
- 底部：来源 + 时间
```

**改动文件：**
- `news/main.js`：详情 overlay 完善、多 category 数据拼合
- `mobile-web/src/components/config-panel.js`：news 场景新增多选 categories
- `server/main.py`：`/api/news` 支持多 category 参数

**工作量估算：** 1.5 天

---

### 4.5 闹钟 (`alarm/`)

**这是改动量最大的模板，需要从单闹钟展示改为多闹钟管理器。**

**用户自定义：**
- 卡片颜色：已支持 ✅
- 闹钟风格：**列表 / 表盘**（需新增风格切换）

**两种风格布局：**

```
━━━ 列表风格 (list) ━━━          ━━━ 表盘风格 (dial) ━━━
┌────────────────────┐          ┌────────────────────┐
│ 闹钟          ···  │          │ 闹钟          ···  │
│                    │          │                    │
│ 10小时15分钟后响铃  │          │    ╭──────────╮    │
│                    │          │   ╱  12       ╲   │
│ 作息               │          │  │ 9    ● → 3  │  │ ← 时针指向08:00
│ ┌──────────── ◉ ┐ │          │  │      ↑      │  │
│ │ 08:00 上午     │ │          │   ╲  6       ╱   │
│ │ 周一至周五     │ │          │    ╰──────────╯    │
│ └────────────────┘ │          │                    │
│ ┌──────────── ◉ ┐ │          │  08:00 上午         │
│ │ 12:30 下午     │ │          │  10小时15分钟后响铃  │
│ │ 每天·要睡觉啦  │ │          │                    │
│ └────────────────┘ │          │  ┌────── ◉ ┐      │
│                    │          │  │12:30 每天│      │
│ 其他               │          │  └──────────┘      │
│ ┌──────────── ○ ┐ │          │  ┌────── ○ ┐      │
│ │ 07:00 上午     │ │          │  │07:00 周末│      │
│ │ 仅周末        │ │          │  └──────────┘      │
│ └────────────────┘ │          │                    │
│               (+)  │          │               (+)  │
└────────────────────┘          └────────────────────┘
```

**卡片内交互 — 新建/开关/删除闹钟：**

对应 card.pen 设计：`2Hly6`（闹钟-新增闹钟）

```
新建闹钟 overlay 表单字段：
- 时间选择（滚轮 picker：小时 + 分钟 + 上午/下午）
- 重复（选择器：无/工作日/周末/每天/自定义）
- 标签（文本输入，如"起床""午休"）

开关闹钟：
- 每个闹钟行右侧 toggle 开关
- 切换 → 更新 localStorage + UI 刷新（关闭的行降低透明度）

删除闹钟：
- 左滑某行 → 露出删除按钮
- 或长按 → 弹出确认
```

**表盘风格技术方案：**
```
1. SVG 圆形钟面（viewBox="0 0 400 400"）
2. 12 个刻度数字 + 60 个分钟刻度线
3. 时针：旋转角度 = (hour%12)*30 + minute*0.5
4. 分针：旋转角度 = minute * 6
5. 闹钟标记：在钟面上用彩色圆点标记每个闹钟的位置
6. 下方：数字时间 + 倒计时 + 简化闹钟列表
```

**数据结构：**
```javascript
// localStorage('alarm_list')
[
  { id: 'a1', time: '08:00', period: 'AM', repeat: 'weekdays',
    label: '起床', enabled: true, category: '作息' },
  { id: 'a2', time: '12:30', period: 'PM', repeat: 'daily',
    label: '要睡觉啦', enabled: true, category: '作息' },
  { id: 'a3', time: '07:00', period: 'AM', repeat: 'weekends',
    label: '', enabled: false, category: '其他' },
]
```

**改动文件：**
- `alarm/main.js`：**重写**（多闹钟列表渲染 + 表盘 SVG + toggle 交互 + overlay + localStorage）
- `alarm/style.css`：**大幅更新**（列表行样式 + 表盘样式 + 风格切换）
- `alarm/index.html`：更新结构
- `config-panel.js`：alarm 场景新增 `display_style` 字段（list / dial）

**工作量估算：** 4 天

---

### 4.6 恋爱纪念 (`anniversary/love/`)

**用户自定义：**
- 卡片颜色：已支持 ✅
- 背景图：**需新增预设图库**
- 在一起时间：config-panel 日期选择已有 ✅
- 文案（如"5周年纪念日"）：config-panel 的 message 字段 ✅

**预设背景图库（恋爱主题）：**
```
love_bg_01.jpg — 海边日落情侣剪影（默认）
love_bg_02.jpg — 咖啡馆温暖光影
love_bg_03.jpg — 樱花树下
love_bg_04.jpg — 城市夜景灯光
love_bg_05.jpg — 星空下的草地
love_bg_06.jpg — 纯色渐变（fallback，不用图片）
```

**背景图方案：**
```
1. 图片存放在 widget-templates/anniversary/love/backgrounds/ 目录
2. config-panel 新增背景图选择器：6 张缩略图 grid
3. 参数传递：params.background_image = 'love_bg_01.jpg'
4. main.js：加载背景图 → 设为卡片背景（object-fit: cover）
5. 在背景图上叠加半透明渐变蒙层（保证文字可读性）
6. 如果无背景图参数 → 使用现有粒子渐变背景（向下兼容）
```

**卡片内交互 — 点击彩蛋（爱心弹出）：**
```
1. 监听卡片整体 click 事件
2. 触发时：在点击位置生成 15-20 个爱心粒子
3. 爱心粒子行为：向外扩散 + 向上飘浮 + 逐渐变透明 + 缩小
4. 动画时长 1.5-2s → 自动消失
5. 使用 shared/easter-egg.js 的 triggerEasterEgg(canvas, x, y, 'love')
6. 有 cooldown（2s 内不可重复触发，避免频繁点击卡顿）
```

**改动文件：**
- `anniversary/love/main.js`：背景图加载 + 彩蛋 click handler
- `anniversary/love/style.css`：背景图层 + 蒙层样式
- `anniversary/love/backgrounds/`：5-6 张预设图（需准备素材）
- `config-panel.js`：love 场景新增 background_image 选择器

**工作量估算：** 2 天

---

### 4.7 宝宝成长 (`anniversary/baby/`)

**与恋爱模板结构一致，区别在于视觉主题：**

**预设背景图库（宝宝主题）：**
```
baby_bg_01.jpg — 温暖婴儿房（默认）
baby_bg_02.jpg — 阳光草地上的玩具
baby_bg_03.jpg — 粉蓝色气球
baby_bg_04.jpg — 积木和毛绒玩具
baby_bg_05.jpg — 柔和水彩风
baby_bg_06.jpg — 纯色渐变（fallback）
```

**卡片内交互 — 点击彩蛋（玩具弹出）：**
```
粒子形状：⭐ 星星 + 🧸 小熊 + 🎈 气球 + 🎀 蝴蝶结（emoji 或 Canvas 绘制）
行为：从点击位置弹出 → 抛物线运动 → 轻微弹跳 → 消散
风格：柔和、可爱、慢速
```

**改动文件：** 与 love 对称

**工作量估算：** 1.5 天（复用 love 的基础设施）

---

### 4.8 假期倒计时 (`anniversary/holiday/`)

**预设背景图库（假期主题）：**
```
holiday_bg_01.jpg — 烟花庆典（默认，即当前 card.pen 中的图）
holiday_bg_02.jpg — 海滩椰树
holiday_bg_03.jpg — 雪山日出
holiday_bg_04.jpg — 城市彩灯节
holiday_bg_05.jpg — 热气球
holiday_bg_06.jpg — 纯色渐变（fallback）
```

**卡片内交互 — 点击彩蛋（礼花彩带）：**
```
粒子形状：🎊 彩纸片 + ✨ 闪光 + 🎉 小礼花
行为：从底部/点击位置喷射 → 扇形扩散 → 纸屑飘落（有重力 + 轻微左右摆动）
风格：热烈、活力、快速
```

**改动文件：** 与 love 对称

**工作量估算：** 1.5 天（复用基础设施）

---

## 五、手机端 Config Panel 升级

当前 `config-panel.js` 需要扩展以支持新的配置字段：

### 5.1 新增字段汇总

| 场景 | 现有字段 | 新增字段 |
|------|---------|---------|
| weather | city(6 pills) | — （卡片内切换，不在 config） |
| music | — | — （封面取色自动，不在 config） |
| calendar | — | — （卡片内添加，不在 config） |
| news | — | `categories`（多选 pills，5 个领域） |
| alarm | time, label, repeat | `display_style`（列表/表盘 二选一） |
| love | date, message | `background_image`（6 图缩略 grid） |
| baby | date, message | `background_image`（6 图缩略 grid） |
| countdown | date, message | `background_image`（6 图缩略 grid） |

### 5.2 新增 UI 组件

1. **多选 Pills**（news categories）— 已有单选 pills 样式，扩展为多选态（选中高亮边框）
2. **风格切换器**（alarm display_style）— 两张预览缩略图，点选切换
3. **背景图 Grid**（3 张纪念日卡）— 2×3 缩略图网格，选中态蓝色边框

**工作量估算：** 2 天

---

## 六、Server 端改动

改动较小，主要是参数传递和接口扩展：

| 改动 | 文件 | 说明 |
|------|------|------|
| 多 category 新闻 | `main.py` | `/api/news` 支持 `categories` 数组参数 |
| 模板参数扩展 | `prompt.py` | alarm 新增 display_style, 纪念日新增 background_image |
| Validator 扩展 | `validator.py` | 白名单新增字段 |

**工作量估算：** 0.5 天

---

## 七、实施计划（建议 3 周）

### Phase 1：公共基础设施（Week 1 前半）

| 天 | 任务 | 产出 |
|----|------|------|
| D1 | `shared/overlay.js` + `overlay.css` 通用弹窗组件 | 可复用的 overlay 基础设施 |
| D1 | `shared/storage.js` localStorage 封装 | 通用存储层 |
| D2 | `shared/easter-egg.js` 彩蛋粒子引擎（3 种效果） | love/baby/holiday 共用的粒子效果 |
| D2 | `shared/bg-picker.js` 背景图选择器 | config-panel 可用的图片选择组件 |

### Phase 1.5：预设素材图生成（与 Phase 1 并行）

> **为保证 Demo 视觉效果，需预先生成一批高质量素材图。** 这些图片将作为背景图预设选项，直接影响用户对产品品质的第一印象。

| 主题 | 数量 | 内容方向 | 图片风格要求 |
|------|------|---------|-------------|
| **恋爱** | 6 张 | 海边日落情侣、樱花树下、咖啡馆暖光、城市夜景灯光、星空草地、花海 | 暖色调、柔光、浪漫氛围，适合叠加半透明蒙层后文字仍清晰 |
| **宝宝** | 6 张 | 温暖婴儿房、阳光草地玩具、粉蓝气球、积木毛绒、水彩童话风、彩虹云朵 | 柔和色彩、高饱和低对比、可爱治愈，画面干净不杂乱 |
| **假期** | 6 张 | 烟花庆典、海滩椰树、雪山日出、城市彩灯节、热气球、薰衣草田 | 鲜艳明快、节日感强烈、画面有冲击力 |

**素材生成方案：**
- 使用 AI 图片生成（Midjourney / DALL·E / Stable Diffusion）生成无版权素材
- 尺寸：896×1464（与卡片一致），或 2:3 竖版高清后裁切
- 输出格式：WebP（优先，体积小）或 JPEG，单张 ≤ 80KB（压缩后）
- 命名规范：`{theme}_bg_{nn}.webp`（如 `love_bg_01.webp`）
- 存放路径：`widget-templates/anniversary/{theme}/backgrounds/`
- **总计 18 张素材图，目标总体积 ≤ 1.5MB**

### Phase 2：纪念日三件套（Week 1 后半）

| 天 | 任务 | 产出 |
|----|------|------|
| D3 | 恋爱模板：背景图 + 蒙层 + 彩蛋（爱心）| love 模板功能完整 |
| D4 | 宝宝模板：复用架构 + 彩蛋（玩具）| baby 模板功能完整 |
| D4 | 假期模板：复用架构 + 彩蛋（礼花）| holiday 模板功能完整 |
| D5 | ~~准备 3×6 张预设背景图素材~~ → Phase 1.5 已完成 | 验证素材在卡片中的实际效果 |

### Phase 3：实用模板 — 轻量交互（Week 2 前半）

| 天 | 任务 | 产出 |
|----|------|------|
| D6 | 天气：城市切换 overlay | 卡片内可切换城市 |
| D7 | 音乐：封面取色 | 自动跟随封面配色 |
| D7 | 新闻：多领域选择 + 详情 overlay | config 多选 + 全文阅读 |

### Phase 4：闹钟大改造（Week 2 后半 + Week 3 前半）

| 天 | 任务 | 产出 |
|----|------|------|
| D8 | 闹钟列表风格：多闹钟渲染 + localStorage + toggle | 列表模式功能完整 |
| D9 | 闹钟新建 overlay：时间选择器 + 表单 | 可新建/删除闹钟 |
| D10 | 闹钟表盘风格：SVG 钟面 + 闹钟标记 | 表盘模式功能完整 |
| D11 | 闹钟风格切换 + config-panel 集成 | 列表↔表盘可切换 |

### Phase 5：日程 + Config Panel + 联调（Week 3 后半）

| 天 | 任务 | 产出 |
|----|------|------|
| D12 | 日程：新增/删除 overlay + localStorage | 日程完全可交互 |
| D13 | Config Panel 升级：多选 pills + 风格切换 + 背景图 grid | 手机端配置完整 |
| D14 | Server 端参数扩展 + 全链路联调 | AI 生成 → 手机配置 → 卡片渲染全通 |
| D15 | 全模板 Review + 体验打磨 + Bug Fix | 交付 |

---

## 八、风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| 预设背景图版权 | 不能用于商业 Demo | AI 生成无版权素材（Phase 1.5 提前生产） |
| 素材图质量 | 低质量图片拉低整体产品感 | 每张图需 review 通过后方可入库，重点关注：叠加蒙层后文字可读性、色调与主题匹配度、无明显 AI 瑕疵 |
| 封面取色 CORS | 跨域图片无法 canvas 采样 | 后端代理图片 URL / fallback 到默认配色 |
| 闹钟表盘 SVG 性能 | 车端 WebView 渲染 SVG 可能有性能问题 | 限制刻度复杂度，测试目标车机 |
| localStorage 容量 | 车端 WebView 的 localStorage 限制未知 | 数据极轻量（<10KB/模板），不会触及限制 |
| 彩蛋粒子叠加 | 频繁触发可能导致帧率下降 | cooldown 2s + 单次最多 20 粒子 + 池化复用 |

---

## 九、验收标准

### 9.1 双端一致性（P0 — 每个模板必须通过）

> **核心原则：AI 生成的卡片必须在车机端可渲染、手机端可预览，两端体验与效果对齐。**

- [ ] **车机端渲染**：在 `car-simulator.html` 中以 896×1464 原生尺寸正常渲染，所有交互（overlay 弹窗、彩蛋、toggle、FAB）均可正常触发和响应
- [ ] **手机端预览**：通过 CSS zoom 缩放后，卡片视觉效果与车机端一致（文字清晰、元素不溢出、图片不变形），所有卡片内交互在手机端同样可用
- [ ] **双端效果对齐 checklist**：
  - 背景图：两端加载正确、蒙层叠加后文字可读性一致
  - 粒子/彩蛋动画：两端均流畅播放，无明显帧率差异
  - Overlay 弹窗：两端居中对齐、可滚动、表单输入可用
  - 配色引擎：color-engine 生成的调色板在两端视觉一致
  - 字体渲染：MiSans_VF 在车端正常加载，手机端 fallback 到系统字体时排版不错位
- [ ] **AI 生成全链路验证**：用户在手机端发起 AI 生成 → 预览卡片 → 微调配置 → 推送到车端，全流程无断链，车端接收后渲染效果与手机端预览一致

### 9.2 功能验收（每个模板交付时）

- [ ] 卡片颜色：config-panel 选色 → 实时生效
- [ ] 卡片内交互：弹窗 open/close 流畅，无卡顿
- [ ] 数据持久化：刷新页面后用户数据不丢失
- [ ] 无内存泄漏：overlay 关闭后事件监听器正确移除
- [ ] 离线可用：无网络时使用 mock 数据 / localStorage 缓存
- [ ] 与 card.pen UI 设计一致：弹窗布局、颜色、间距对齐 MiCar Design System
