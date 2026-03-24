# 模板数据体系规范 (Template Schema Specification)

**单一信息源** · 定义每个模板的数据结构、数据来源、可自定义参数、以及自然语言映射规则。
本文档是连接 AI 生成层、前端配置面板、模板渲染引擎、Pencil 设计稿的**唯一数据契约**。

> **使用方式**：AI prompt 引用本文档的 Schema 定义；config-panel.js 根据 `editable` 字段渲染控件；模板 main.js 根据 Schema 消费 `__WIDGET_PARAMS__`；Pencil 设计稿的文本节点与 Schema 字段一一对应。

---

## 零、体系总览

### 0.1 核心架构

```
┌─────────────────────────────────────────────────────┐
│              Template Schema (本文档)                │
│  ── 每个模板的唯一数据契约 ──                         │
│                                                     │
│  定义：字段 · 类型 · 数据来源 · 是否可编辑 ·          │
│        编辑控件 · 空值策略 · NL 映射规则              │
└──────┬──────────┬──────────┬──────────┬──────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
   AI Prompt   ConfigPanel  Template   Pencil
   (prompt.py) (config-     (main.js)  (card.pen)
   解析NL→JSON  panel.js)   消费JSON   设计排版
               渲染编辑控件  渲染卡片    ↕ 对应字段
```

### 0.2 数据来源分类

| 来源类型 | 代号 | 说明 | 示例 |
|----------|------|------|------|
| **user_input** | `UI` | 用户主动输入/选择 | 纪念日标题、日期、背景图 |
| **system_api** | `SA` | 系统/车机 API 实时获取 | MediaSession 播放状态、系统日历 |
| **cloud_api** | `CA` | 云端服务接口 | 天气 API、新闻 RSS |
| **derived** | `DV` | 从其他字段计算得出 | 天数差值、农历、星期 |
| **ai_generated** | `AG` | AI 根据上下文自动生成 | 描述文案、穿衣建议 |
| **template_default** | `TD` | 模板内置默认值 | mock 数据、预设背景 |

### 0.3 字段属性定义

每个字段包含以下属性：

| 属性 | 含义 |
|------|------|
| `field` | 字段名（JSON key） |
| `type` | 值类型：string / number / date / boolean / enum / image / list |
| `source` | 数据来源（上表代号） |
| `required` | 是否必填 |
| `nullable` | 是否可为空（空时走 fallback） |
| `fallback` | 空值时的降级策略 |
| `editable` | 是否开放给用户编辑 |
| `control` | 编辑控件类型（仅 editable=true 时） |
| `constraints` | 值约束（长度、范围、枚举值等） |
| `nl_keywords` | 自然语言中触发该字段的关键词 |
| `pencil_bindto` | 对应 Pencil 设计稿中的节点/区域 |
| `effect` | 该字段变化时对渲染的影响 |

### 0.4 色彩体系总览

项目有三套色彩机制，按模板类型分配：

| 色彩模式 | 引擎 | 影响范围 | 适用模板 |
|----------|------|----------|----------|
| **mood** | `color-engine.js` computePalette(hex, 'mood') | 背景渐变 + 光晕 + 毛玻璃 + 强调色，全卡片染色 | 天气、音乐、新闻 |
| **clean** | `color-engine.js` computePalette(hex, 'clean') | 仅强调色（开关、色点、标题高亮），背景固定不变 | 日历、闹钟 |
| **image-tint** | `color-extract.js` extractPanelTint(img) | 从背景照片底部 30% 取色 → glass panel 背景色 | 纪念日（love/baby/holiday） |

**色彩优先级链**（所有模板通用）：

```
用户选色 / 上传照片
  ↓ 优先级最高
color-engine 或 color-extract 计算
  ↓
CSS 变量注入 (--dyn-accent, --dyn-bg, --panel-tint 等)
  ↓
模板消费 CSS 变量渲染
  ↓
visual-style 宏覆盖（minimal/material/pixel 可能隐藏光晕等）
  ↓ 优先级最低
tokens.css 中的硬编码 fallback
```

### 0.5 各模板色彩方案速查

| 模板 | 色彩输入来源 | 用户可控 | 默认配色 | 推荐色盘 |
|------|-------------|----------|----------|----------|
| **恋爱纪念日** | 背景照片自动取色 | 换照片间接改色 | 玫瑰棕渐变 | — |
| **宝宝成长** | 背景照片自动取色 | 换照片间接改色 | 暖琥珀渐变 | — |
| **放假倒计时** | 背景照片自动取色 | 换照片间接改色 | 暖棕红渐变 | — |
| **天气** | 天气类型自动决定 | 不可控 | 按天气：晴→蓝、阴→灰蓝、雨→靛蓝、雪→深紫 | — |
| **音乐** | 封面图自动取色 | 不可控 | 暗紫+橙色频谱 | — |
| **日历** | 用户选主题色 | ✅ color_picker | 蓝 #3B82F6 | 蓝/石墨/翠绿/琥珀/紫罗兰/深灰 |
| **新闻** | 话题分类自动映射 | 不可控 | 按分类：科技蓝/汽车橙/财经绿/体育红/生活紫 | — |
| **闹钟** | 用户选强调色 | ✅ color_picker | 绿 #4ADE80 | 薄荷绿/天空蓝/琥珀橙/石墨灰/薰衣紫/银灰 |

### 0.6 纪念日三卡文案体系（v2.0 新增）

**核心设计原则**：用户输入的昵称/名字是仪式感核心，必须融入卡片文案。title 字段不再由用户输入，改为 AI 自动生成。

**统一结构**（三卡一致）：
```
  ❤️/⭐                   ← icon（固定）
  365                     ← Hero 数字（DV，自动计算）
  天的陪伴                 ← label（DV+AG，随机选取）
  ──── divider ────
  与小美相伴的每一天        ← copy（AG，融入用户昵称，每次不同）
  2025.03.22 — 2026.03.22  ← date（DV，自动格式化）
```

**文案来源**：label 和 copy 由规则池随机选取 + AI 生成补充，**每次生成结果不同**，避免僵化重复。

**用户输入字段变更（v2.0）**：
- ~~title~~：已移除，不再由用户输入
- nickname / baby_name / holiday_name：**仪式感核心字段**，融入 copy 文案
- Pencil 设计稿已同步删除 Holiday 胶囊 tag（`2oXHu`），三卡结构统一

---

## 一、纪念日 · 恋爱 (anniversary/love)

### 1.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `anniversary_love` |
| component_type | `anniversary` |
| theme | `love` |
| 数据来源类型 | 用户输入为主 (`UI`) |
| 计算模式 | 正计时（start_date → 今天的天数差） |
| Pencil Node ID | `UyUeC` |

### 1.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `start_date` | date | UI | 是 | 否 | — | ✅ | date_picker | ≤今天 | "在一起/开始/日期" | 触发 hero 天数重算 |
| `nickname` | string | UI | 否 | 是 | — | ✅ | text_input | ≤6字 | "名字/昵称/TA/对象" | 融入 copy 文案 |
| `background_image` | image | UI+TD | 否 | 是 | 预设 `love_bg_01` | ✅ | image_picker | ≤200KB, JPG/PNG/WebP | "照片/图片/背景/换图" | 替换背景 + 触发配色引擎重算 |
| `days_count` | number | DV | — | 否 | — | ❌ | — | 自动计算 | — | Hero 大字数字 |
| `label` | string | DV+AG | — | 否 | "天的相伴" | ❌ | — | ≤6字 | — | Hero 数字下方的单位描述 |
| `copy` | string | AG | — | 否 | "与你相伴的每一天" | ❌ | — | ≤15字 | — | 分隔线下方的文案（融入 nickname） |
| `color_tint` | string | DV | — | 否 | 从 background_image 自动提取 | ❌ | — | hex color | — | Glass panel 色调、文字投影 |

### 1.2 文案拼接规则

**label**（Hero 数字后的单位描述）：
规则拼接，随机选取，避免每次相同：
- `天的相伴` · `天的陪伴` · `天的甜蜜` · `天的守护` · `天的浪漫`
- 里程碑变体：第100天 → `天！里程碑` ，第365天 → `天，整整一年` ，第1000天 → `天的奇迹`

**copy**（分隔线下方，融入 nickname 的个性化文案）：
AI 生成或规则拼接，**必须每次不同**：
- 有 nickname：`与{nickname}相伴的每一天` · `{nickname}，感谢有你` · `和{nickname}的第{days}天` · `{nickname}是最好的礼物`
- 无 nickname：`爱是最长情的告白` · `每一天都值得纪念` · `时光温柔，因为有你` · `最好的日子是有你的日子`

### 1.3 渲染映射

```
background_image ──→ 全屏背景层（object-fit:cover）
                 ──→ color-extract.js 提取主色 → color_tint
color_tint ────────→ glass panel 背景色（tint + 0.3 alpha）
start_date ────────→ days_count = daysDiff(start_date, today)
days_count ────────→ Hero 数字（160px/300 weight）
label ─────────────→ 数字下方描述（42px/500，DV+AG）
──── divider ────
copy ──────────────→ 文案（36px/500，AG，含 nickname）
date ──────────────→ 日期区间（28px/400）
```

### 1.4 空字段处理

| 场景 | 处理 |
|------|------|
| background_image 为空 | 使用预设 love_bg_01（海边漫步） |
| nickname 为空 | copy 使用无 nickname 的文案池 |

### 1.4 色彩方案

**色彩模式**：image-tint（从背景照片取色）

**取色流程**：
```
background_image ──→ extractPanelTint(img)
                     采样图片底部 30% 区域
                     中心像素加权
                     明度压暗至 L≤0.35，饱和度 ×0.80
                     ──→ rgba(r,g,b,0.88) 作为 glass panel 背景
```

**默认配色**（无用户照片时）：

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | 预设 love_bg_01 暗色情侣剪影 | 全屏铺满 |
| Glass panel | `linear-gradient(180deg, #5c3018d0, #3a1808f8)` | 玫瑰棕渐变 |
| Hero 数字 | `#F5F5F0` | 固定，不随取色变 |
| 标题/昵称 | `#F5F5F0` | 固定 |
| 描述 | `rgba(255,255,255,0.60)` | 固定 |
| 环境光晕 | `rgba(200,120,180,0.18)` | 玫瑰色 |

**用户换照片时的效果**：panel 背景色自动跟随照片色调变化（暖色照片→暖色 panel，冷色照片→冷色 panel），但文字始终保持浅色（light-on-dark），确保可读性。

**预设背景图配色倾向**：

| 预设 | 名称 | 主色调 | 取色结果倾向 |
|------|------|--------|-------------|
| love_bg_01 | 海边漫步 | 暖棕 | 棕红色 panel |
| love_bg_02 | 午后咖啡 | 暖橙 | 琥珀色 panel |
| love_bg_03 | 樱花小径 | 粉紫 | 玫瑰紫 panel |
| love_bg_04 | 霓虹夜色 | 冷蓝 | 深蓝紫 panel |
| love_bg_05 | 星空物语 | 深蓝 | 深靛蓝 panel |

---

## 二、纪念日 · 宝宝 (anniversary/baby)

### 2.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `anniversary_baby` |
| component_type | `anniversary` |
| theme | `baby` |
| 数据来源类型 | 用户输入为主 (`UI`) |
| 计算模式 | 正计时（birth_date → 今天的天/月/年差） |
| Pencil Node ID | `3A9gr` |

### 2.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `birth_date` | date | UI | 是 | 否 | — | ✅ | date_picker | ≤今天 | "出生/生日/日期" | 触发天/月龄重算 |
| `baby_name` | string | UI | 否 | 是 | "宝宝" | ✅ | text_input | ≤6字 | "名字/宝宝名" | 融入 copy 文案 |
| `background_image` | image | UI+TD | 否 | 是 | 预设 `baby_bg_01` | ✅ | image_picker | ≤200KB | "照片/图片/宝宝照" | 替换背景 + 触发配色引擎 |
| `days_count` | number | DV | — | 否 | — | ❌ | — | 自动计算 | — | Hero 大字（天数或月数） |
| `hero_unit` | string | DV | — | 否 | — | ❌ | — | "天"或"个月" | — | 决定 Hero 显示天数还是月数 |
| `label` | string | DV+AG | — | 否 | "天的成长" | ❌ | — | ≤6字 | — | Hero 数字下方的单位描述 |
| `copy` | string | AG | — | 否 | "{baby_name}的成长日记" | ❌ | — | ≤15字 | — | 分隔线下方的文案（融入 baby_name） |
| `color_tint` | string | DV | — | 否 | 从 background_image 提取 | ❌ | — | hex color | — | Glass panel 色调 |

### 2.2 文案拼接规则

**Hero 数字逻辑**：
- ≤90 天：显示天数（如 `45`），hero_unit = "天"
- >90 天：显示月数（如 `18`），hero_unit = "个月"
- ≥365 天且为整年月：可显示 `1岁6个月`

**label**（Hero 数字后的单位描述）：
规则拼接，随机选取：
- 天数模式：`天的成长` · `天的陪伴` · `天的奇妙旅程`
- 月数模式：`个月的成长` · `个月的时光` · `个月的精彩`
- 里程碑变体：满100天 → `天！百日快乐` ，满1岁 → `岁啦！生日快乐`

**copy**（分隔线下方，融入 baby_name 的个性化文案）：
AI 生成或规则拼接，**必须每次不同**：
- 有 baby_name：`{baby_name}的成长日记` · `{baby_name}每天都在进步` · `{baby_name}的精彩瞬间` · `记录{baby_name}的每一步`
- 使用默认名：`宝宝的成长日记` · `小宝贝每天都在进步` · `记录每一个珍贵瞬间`

### 2.3 空字段处理

| 场景 | 处理 |
|------|------|
| baby_name 为空 | copy 使用"宝宝"作为默认名 |
| background_image 为空 | 使用预设 baby_bg_01 |

### 2.3 色彩方案

**色彩模式**：image-tint（同 Love）

**关键差异**：Baby 模板的 **文字是深色**（dark-on-light），而非 Love 的浅色文字。因为宝宝照片通常偏亮（室内自然光、白色背景），glass panel 用浅暖色调更温馨。

**默认配色**（无用户照片时）：

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | 预设 baby_bg_01 暖色宝宝插画 | 全屏铺满 |
| Glass panel | `linear-gradient(180deg, #c8a070e0, #b09058f8)` | 暖琥珀渐变 |
| Hero 数字 | `#2A2015` | 深棕，固定 |
| 标题/名字 | `#2A2015` | 深棕，固定 |
| 描述 | `rgba(42,32,21,0.60)` | 半透明深棕 |
| 环境光晕 | `rgba(120,160,255,0.12)` | 柔和蓝 |

**预设背景图配色倾向**：

| 预设 | 名称 | 主色调 | 取色结果倾向 |
|------|------|--------|-------------|
| baby_bg_01 | 温馨小屋 | 暖米色 | 米黄 panel |
| baby_bg_02 | 阳光花园 | 明黄绿 | 浅金 panel |
| baby_bg_03 | 梦幻气球 | 粉蓝 | 柔蓝 panel |
| baby_bg_04 | 积木乐园 | 彩色 | 暖橙 panel |
| baby_bg_05 | 童话世界 | 粉紫 | 浅紫 panel |

---

## 三、纪念日 · 假日 (anniversary/holiday)

### 3.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `anniversary_holiday` |
| component_type | `anniversary` |
| theme | `holiday` |
| 数据来源类型 | 用户输入为主 (`UI`) |
| 计算模式 | 倒计时（今天 → target_date 的天数差） |
| Pencil Node ID | `7EC5L` |

### 3.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `target_date` | date | UI | 是 | 否 | — | ✅ | date_picker | ≥今天 | "日期/哪天/什么时候" | 触发倒计时重算 |
| `holiday_name` | string | UI | 是 | 否 | "假期" | ✅ | text_input | ≤8字 | "假期名/什么假/名称" | 融入 copy 文案 |
| `background_image` | image | UI+TD | 否 | 是 | 预设 `holiday_bg_01` | ✅ | image_picker | ≤200KB | "照片/图片/背景" | 替换背景 + 配色引擎 |
| `days_remaining` | number | DV | — | 否 | — | ❌ | — | 自动计算 | — | Hero 大字倒计时 |
| `label` | string | DV+AG | — | 否 | "天就到啦" | ❌ | — | ≤6字 | — | Hero 数字下方的单位描述 |
| `copy` | string | AG | — | 否 | "{holiday_name}，出发！" | ❌ | — | ≤15字 | — | 分隔线下方的文案（融入 holiday_name） |
| `color_tint` | string | DV | — | 否 | 从 background_image 提取 | ❌ | — | hex | — | Glass panel |

### 3.2 文案拼接规则

**label**（Hero 数字后的单位描述）：
规则拼接，随机选取：
- `天就到啦` · `天后出发` · `天，快啦` · `天的等待`
- 里程碑变体：≤3天 → `天！倒计时` ，当天 → 显示 `🎉 今天！`
- 已过期：`天前结束` （自动切换正计时模式）

**copy**（分隔线下方，融入 holiday_name 的个性化文案）：
AI 生成或规则拼接，**必须每次不同**：
- `{holiday_name}去海边冲浪吧` · `{holiday_name}，说走就走` · `期待{holiday_name}的到来` · `{holiday_name}快到碗里来`
- 如果用户提供了更多上下文（如目的地）：`{holiday_name}去{destination}` · `{destination}我来啦`

### 3.3 特殊逻辑

- 当 `days_remaining == 0` 时：Hero 显示"🎉"，label 显示"今天！"
- 当 `target_date` 已过：自动切换为"已过 X 天"模式（正计时），label 变为"天前结束"

### 3.3 色彩方案

**色彩模式**：image-tint（同 Love/Baby）

**文字方向**：浅色文字（light-on-dark），与 Love 一致。假日照片通常偏暗（日落、烟火、雪山）。

**默认配色**（无用户照片时）：

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | 预设 holiday_bg_01 璀璨烟火 | 全屏铺满 |
| Glass panel | `linear-gradient(180deg, #6b3510d0, #4a2008f8)` | 暖棕红渐变 |
| Hero 数字 | `#F5F5F0` | 固定 |
| 环境光晕 | `rgba(80,200,120,0.10)` | 柔和绿 |

**预设背景图配色倾向**：

| 预设 | 名称 | 主色调 | 取色结果倾向 |
|------|------|--------|-------------|
| holiday_bg_01 | 璀璨烟火 | 暖金 | 金棕 panel |
| holiday_bg_02 | 椰林海风 | 蓝绿 | 深青 panel |
| holiday_bg_03 | 雪山晨光 | 冷蓝白 | 深蓝灰 panel |
| holiday_bg_04 | 灯火阑珊 | 暖橙 | 琥珀 panel |
| holiday_bg_05 | 热气球之旅 | 天蓝 | 深蓝 panel |

---

## 三·四、生日倒计时 (birthday)

### 3b.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `anniversary_birthday` |
| component_type | `anniversary` |
| theme | `birthday` |
| 卡片尺寸 | 896×1464 逻辑像素 |
| 面板类型 | glass-panel（image-tint 动态配色）|
| 数据模式 | 手机端 mock → 车端 live |

### 3b.1 字段定义

| 字段 | 类型 | 来源 | 必填 | 可编辑 | 约束 | NL 关键词 |
|------|------|------|------|--------|------|-----------|
| `birthday_date` | date | UI | ✅ | ✅ | date_picker，任意日期 | "生日/日期/哪天" |
| `person_name` | string | UI | ❌ | ✅ | text_input，≤6 字 | "名字/谁/寿星" |
| `background_image` | image | UI+TD | ❌ | ✅ | image_picker，≤200KB | "照片/图片/背景" |
| `days_remaining` | number | DV | ❌ | ❌ | 自动计算到下次生日天数 | — |
| `hero_unit` | string | DV | ❌ | ❌ | "天" 固定 | — |
| `label` | string | DV+AG | ❌ | ❌ | ≤8 字 | — |
| `copy` | string | AG | ❌ | ❌ | ≤15 字，含 person_name | — |
| `color_tint` | string | DV | ❌ | ❌ | color-extract.js 取色 | — |

**来源说明**：UI=用户输入 · DV=派生计算 · AG=AI 生成 · TD=模板默认

### 3b.2 文案拼接规则

**days_remaining 计算逻辑**：
- 计算到**下一次**生日的天数（自动跨年）
- 若今天就是生日 → `days_remaining = 0`
- 若生日刚过 → 计算到明年生日的天数

**label 随机池**（每次生成随机选取）：
| 条件 | 候选 |
|------|------|
| 默认 | `天后就是TA的生日` · `天的期待` · `天后的惊喜` · `天后一起庆祝` |
| 当天（0天） | `今天是TA的生日！` · `生日快乐！` |
| 明天（1天） | `明天就是TA的生日啦` |
| ≤7天 | `天！快准备礼物吧` · `天后的生日派对` |
| 已过（负数显示365-n） | `天后又是TA的生日` |

**copy 随机池**（含 person_name 插值）：
| 条件 | 候选 |
|------|------|
| 有名字 | `给{name}准备一份惊喜吧` · `{name}的专属生日愿望` · `和{name}一起许个愿` · `{name}，生日快乐` · `期待{name}的生日派对` |
| 无名字 | `准备一份特别的惊喜吧` · `许一个美好的生日愿望` · `又长大了一岁` · `生日快乐，愿一切美好` |
| 当天+有名字 | `{name}，今天是属于你的日子` · `祝{name}生日快乐，万事如意` |

### 3b.3 预设背景图

**预设背景图配色倾向**：

| 预设 | 名称 | 主色调 | 取色结果倾向 |
|------|------|--------|-------------|
| birthday_bg_01 | 烛光蛋糕 | 紫金 | 紫色 panel |
| birthday_bg_02 | 彩色气球 | 暖粉 | 粉紫 panel |
| birthday_bg_03 | 礼物盒 | 暖金 | 金棕 panel |
| birthday_bg_04 | 烟花夜空 | 深蓝金 | 深蓝 panel |
| birthday_bg_05 | 花束祝福 | 粉紫 | 薰衣草 panel |

---

## 四、天气 (weather)

### 4.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `weather_realtime` |
| component_type | `weather` |
| theme | `realtime` |
| 数据来源类型 | 云端 API (`CA`) + 用户选城市 (`UI`) |
| Pencil Node ID | `tPVm8` |

### 4.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `city` | string | UI | 是 | 否 | 定位城市 or "北京" | ✅ | city_search | 需匹配城市库 | "城市/哪里/地方" | 触发天气数据重新拉取 |
| `temperature` | number | CA | — | 是 | mock 25°C | ❌ | — | -50~60 | — | Hero 温度大字 |
| `weather_type` | enum | CA | — | 是 | "sunny" | ❌ | — | sunny/cloudy/rainy/snowy/overcast | — | 背景 mesh gradient 配色 + 天气图标 + 粒子效果 |
| `weather_text` | string | CA | — | 是 | "晴" | ❌ | — | — | — | 天气描述文本 |
| `humidity` | number | CA | — | 是 | 50 | ❌ | — | 0~100 | — | 信息行：湿度 |
| `wind_dir` | string | CA | — | 是 | "北风" | ❌ | — | — | — | 信息行：风向 |
| `wind_scale` | string | CA | — | 是 | "2级" | ❌ | — | — | — | 信息行：风力 |
| `aqi` | number | CA | — | 是 | 50 | ❌ | — | 0~500 | — | 信息行：空气质量 |
| `forecast_3d` | list | CA | — | 是 | mock 3天数据 | ❌ | — | 3项 | — | 底部3日预报条 |
| `suggestion` | string | AG | — | 是 | "适合出行" | ❌ | — | ≤15字 | — | AI 穿衣/出行建议 |

### 4.2 数据流

```
用户选 city ──→ POST /api/weather?city={city}
                    │
                    ▼
              QWeather API (30min 缓存)
                    │
                    ▼
              返回完整天气 JSON
                    │
                    ▼
         模板消费所有 CA 字段 + AI 生成 suggestion
```

### 4.3 预览 vs 车端

| 环境 | 数据策略 |
|------|----------|
| 手机预览 | mock 天气数据（晴天 25°C），城市显示用户所选 |
| 车端运行 | 真实 API 拉取，30min 自动刷新 |

### 4.4 色彩方案

**色彩模式**：mood（天气类型自动驱动，用户不可控）

**天气→配色映射**：

| weather_type | 背景 mesh gradient | 光晕色 | 粒子效果 | 情绪 |
|-------------|-------------------|--------|----------|------|
| `sunny` | 天蓝→深蓝 `#87CEEB→#3A6FA0` | 暖金 `rgba(255,200,100,0.15)` | 阳光光斑 | 明亮温暖 |
| `cloudy` | 灰蓝→深灰 `#8899AA→#445566` | 银白 `rgba(200,210,220,0.10)` | 无 | 平静柔和 |
| `overcast` | 铅灰→暗灰 `#667788→#334455` | 冷白 `rgba(180,190,200,0.08)` | 无 | 沉闷压抑 |
| `rainy` | 靛蓝→深靛 `#4A6B8A→#2A3B4A` | 冷蓝 `rgba(100,150,220,0.12)` | 雨滴粒子 | 冷调忧郁 |
| `snowy` | 深紫→靛蓝 `#3A3A6A→#1A1A3A` | 冰蓝 `rgba(180,200,255,0.10)` | 雪花粒子 | 静谧纯净 |

**固定元素颜色**（不随天气变化）：

| 元素 | 颜色 |
|------|------|
| Hero 温度数字 | `#F5F5F0` |
| 天气描述文本 | `rgba(255,255,255,0.55)` |
| 信息行文本 | `rgba(255,255,255,0.30~0.50)` |
| 信息 pill 背景 | `#FFFFFF20` |

---

## 五、音乐 (music)

### 5.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `music_player` |
| component_type | `music` |
| theme | `player` |
| 数据来源类型 | 系统 API (`SA`) — MediaSession |
| Pencil Node ID | `qXG2n` |

### 5.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `visual_style` | enum | UI | 否 | 否 | "glass" | ✅ | style_picker | glass/minimal/material/pixel | "风格/样式/像素/极简" | 切换整体视觉风格 |
| `song_name` | string | SA | — | 是 | "未在播放" | ❌ | — | — | — | 歌名文本（42px/600） |
| `artist` | string | SA | — | 是 | "—" | ❌ | — | — | — | 歌手文本（32px/400） |
| `album_cover` | image | SA | — | 是 | 默认渐变封面 | ❌ | — | — | — | 封面图 + 配色引擎源 |
| `duration` | number | SA | — | 是 | 0 | ❌ | — | 秒 | — | 进度条总长 |
| `position` | number | SA | — | 是 | 0 | ❌ | — | 秒 | — | 进度条当前位置 |
| `is_playing` | boolean | SA | — | 否 | false | ❌ | — | — | — | 播放/暂停按钮状态 |
| `lyrics_line` | string | SA | — | 是 | "" | ❌ | — | 单行 | — | 当前歌词行 |
| `color_tint` | string | DV | — | 否 | 从 album_cover 自动提取 | ❌ | — | hex color | — | 背景渐变色调 |

### 5.2 数据流

```
Bridge.getMediaSession() ──→ 实时播放状态
Bridge.onMediaSessionChange(cb) ──→ 持续监听变化
                                        │
                                        ▼
                                模板实时更新所有 SA 字段
                                album_cover → color-extract → color_tint → 自动配色
```

### 5.3 关键行为

- **音乐卡片几乎没有用户需要预配置的内容**——它是纯实时数据驱动
- 用户能配的只有"视觉风格"，主题色完全从封面自动提取
- 手机预览时显示 mock 音乐数据（示例歌曲 + 封面）

### 5.4 色彩方案

**色彩模式**：mood（从封面图自动取色，用户不可控）

**取色流程**：
```
album_cover ──→ extractDominantColor(img)
                量化为 16 色
                过滤灰色/极暗/极亮像素
                ──→ 主色 hex
                ──→ computePalette(hex, 'mood')
                ──→ 全卡片染色（背景渐变+光晕+强调色）
```

**默认配色**（无封面/未播放时）：

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | 暗紫渐变 | 深沉基调 |
| 频谱柱 | `#DCA050` | 暖橙色，固定不随取色变 |
| 进度条 | `#DCA050 → #E8B870` 渐变 | 固定 |
| 歌名 | `#F5F5F0` | 固定 |
| 歌手 | `#F5F5F060` | 固定 |
| 歌词 | `#F5F5F040` | 固定，斜体 |

**封面取色效果示例**：红色封面→整体偏红暖调；蓝色封面→整体偏冷蓝调；黑白封面→引擎自动补偿到蓝色系（S≥0.20 保底）。

---

## 六、日历 (calendar)

### 6.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `calendar_schedule` |
| component_type | `calendar` |
| theme | `schedule` |
| 数据来源类型 | 用户输入 (`UI`) + 本地存储 |
| Pencil Node ID | `7fKb6` |

### 6.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `accent_color` | string | UI | 否 | 否 | "#3B82F6" | ✅ | color_picker | hex | "颜色/主题色" | 日期数字强调色 + 未分配日程色点 |
| `today_date` | date | DV | — | 否 | new Date() | ❌ | — | — | — | 顶部日期区：日/周/农历 |
| `lunar_date` | string | DV | — | 否 | 从 today_date 转换 | ❌ | — | — | — | 农历文本 |
| `weekday` | string | DV | — | 否 | 从 today_date 转换 | ❌ | — | — | — | 星期文本 |
| `events` | list | UI | — | 是 | mock 3 条日程 | ❌ | — | 最多 8 条 | — | 日程列表渲染（来自用户数据，非创建时配置） |
| `events[].time` | string | — | 是 | 否 | — | ❌ | — | HH:MM | — | 日程时间列 |
| `events[].title` | string | — | 是 | 否 | — | ❌ | — | ≤15字 | — | 日程标题 |
| `events[].color` | string | — | 否 | 是 | 按顺序循环分配 | ❌ | — | 预设 5 色 | — | 左侧色点 |
| `events[].location` | string | — | 否 | 是 | 不显示 | ❌ | — | ≤10字 | — | 日程地点文本 |
| `events[].completed` | boolean | UI | — | 否 | false | ❌ | — | 运行时点击切换 | — | 完成态样式（strikethrough + 0.5 opacity） |

### 6.2 events 数据来源说明

| 环境 | 数据来源 | 说明 |
|------|----------|------|
| 手机预览 | mock 3 条 | 固定示例日程，带"示例数据"标识 |
| 车端运行 | localStorage | 读取用户在手机端创建/推送的日程数据 |

### 6.3 色彩方案

**色彩模式**：clean（仅强调色变化，背景固定亮色）

**注意**：日历是全项目**唯一的亮色卡片**，背景为浅蓝灰 mesh，不可改变。

**accent_color 影响范围**：
```
accent_color ──→ computePalette(hex, 'clean')
             ──→ --dyn-accent      → 顶部日期指示条、当前日程色点光晕
             ──→ --dyn-label-color  → 日程色点发光色
             ──→ --dyn-accent-bg    → 日程行背景高亮
             ──→ --dyn-divider-color → 时间线连接线
```

**推荐色盘**（6 色 · color_picker）：

| 色值 | 名称 | 适用场景 | 视觉感受 |
|------|------|----------|----------|
| `#3B82F6` | 经典蓝 (默认) | 通用 | 专业、稳重 |
| `#64748B` | 石墨灰 | 商务 | 低调、沉稳 |
| `#10B981` | 翠绿 | 自然 | 清新、活力 |
| `#F59E0B` | 琥珀橙 | 活力 | 温暖、积极 |
| `#8B5CF6` | 紫罗兰 | 个性 | 优雅、独特 |
| `#334155` | 深灰 | 极简 | 内敛、高级 |

**固定元素颜色**（不随 accent_color 变化）：

| 元素 | 颜色 |
|------|------|
| 背景 mesh | 浅蓝灰 (固定) |
| 日期 hero 数字 | `#1E293B` |
| 正文文本 | `#1E293B` |
| 次要文本 | `#64748B` |
| 卡片背景 | `rgba(255,255,255,0.85)` |

---

## 七、新闻 (news)

### 7.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `news_daily` |
| component_type | `news` |
| theme | `daily` |
| 数据来源类型 | 云端 API (`CA`) |
| Pencil Node ID | `OMxV7` (首页) / `l5AB7` (列表v2) / `vwhtM` (详情v2) |

### 7.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `topics` | list(enum) | UI | 否 | 否 | ["tech","society"] | ✅ | multi_select | 最多3个 | "关注/领域/话题/类别" | 决定后端 RSS 源 + 新闻筛选 |
| `display_style` | enum | UI | 否 | 否 | "card" | ✅ | segment | card/list | "模式/卡片/列表" | card=摘要卡片, list=仅标题列表 |
| `items` | list | CA | — | 是 | mock 5 条新闻 | ❌ | — | 5~8条 | — | 新闻列表渲染 |
| `items[].title` | string | CA | — | 否 | — | ❌ | — | — | — | 新闻标题 |
| `items[].summary` | string | CA+AG | — | 是 | — | ❌ | — | ≤150字 | — | AI 生成摘要 |
| `items[].source` | string | CA | — | 是 | "未知来源" | ❌ | — | — | — | 来源标签 |
| `items[].category` | enum | CA | — | 否 | "general" | ❌ | — | tech/auto/finance/sports/lifestyle/society/world | — | 分类标签 + 颜色映射 |
| `items[].time` | string | CA | — | 是 | — | ❌ | — | 相对时间 | — | "2小时前" |
| `items[].image_url` | string | CA | — | 是 | 不显示图片 | ❌ | — | URL | — | 新闻配图（hero card） |

### 7.2 topics 枚举值

| id | label | 对应 RSS 源 | nl 关键词 |
|----|-------|-------------|-----------|
| `tech` | 科技 | 36kr, InfoQ | "科技/互联网/AI/数码" |
| `auto` | 汽车 | 汽车之家, AutoHome | "汽车/车/新能源" |
| `finance` | 财经 | 财新, 第一财经 | "财经/股票/经济/金融" |
| `sports` | 体育 | 懒熊体育 | "体育/足球/NBA/运动" |
| `lifestyle` | 生活 | 什么值得买 | "生活/美食/旅游/购物" |
| `society` | 社会 | 澎湃新闻 | "社会/热点/新闻" |
| `world` | 国际 | BBC中文, 路透 | "国际/世界/海外/全球" |

### 7.3 色彩方案

**色彩模式**：mood（分类自动映射，用户不可控）

**分类→颜色映射**：

| 分类 | 标签色 | 分类 pill 背景 | 设计意图 |
|------|--------|---------------|----------|
| 科技 tech | `#4A9EFF` 科技蓝 | `#4A9EFF20` | 理性、前沿 |
| 汽车 auto | `#F59E0B` 工业橙 | `#F59E0B20` | 动力、能量 |
| 财经 finance | `#34D399` 钱绿 | `#34D39920` | 增长、稳健 |
| 体育 sports | `#FB7185` 活力红 | `#FB718520` | 激情、竞技 |
| 生活 lifestyle | `#A78BFA` 生活紫 | `#A78BFA20` | 优雅、多元 |
| 社会 society | `#64748B` 中性灰 | `#64748B20` | 严肃、客观 |
| 国际 world | `#64748B` 中性灰 | `#64748B20` | 全球、广角 |

**背景配色**（固定，不随分类变）：

| 元素 | 颜色 |
|------|------|
| 背景 | `linear-gradient(170deg, #06101f, #163a60, #08162c)` 深海蓝 |
| 光晕 | `rgba(100,150,220,0.08~0.30)` |
| Hero card | 毛玻璃 + 分类主色光晕 |
| 标题文本 | `#F5F5F0` |
| 摘要文本 | `rgba(255,255,255,0.55)` |
| 来源/时间 | `#64748B` |

---

## 八、闹钟 (alarm)

### 8.0 模板概览

| 属性 | 值 |
|------|-----|
| template_id | `alarm_clock` |
| component_type | `alarm` |
| theme | `clock` |
| 数据来源类型 | 用户输入 (`UI`) + 本地存储 |
| Pencil Node ID | `Qb8jr` (列表) / `Kysmf` (左滑删) / `ab3HZ` (时钟) / `qOPTb` (切换) |

### 8.1 数据结构

| field | type | source | required | nullable | fallback | editable | control | constraints | nl_keywords | effect |
|-------|------|--------|----------|----------|----------|----------|---------|-------------|-------------|--------|
| `default_view` | enum | UI | 否 | 否 | "list" | ✅ | segment | list/clock | "列表/表盘/时钟" | 初始视图模式 |
| `accent_color` | string | UI | 否 | 否 | "#4ADE80" | ✅ | color_picker | hex | "颜色/绿色/蓝色" | Toggle 激活色 + 时钟指示点色 |
| `alarms` | list | UI | — | 是 | 3 个示例闹钟 | ❌ | — | 最多 6 个 | — | 闹钟列表渲染（来自用户数据，非创建时配置） |
| `alarms[].time` | string | UI | 是 | 否 | — | ❌ | — | HH:MM | — | 时间大字 |
| `alarms[].label` | string | UI | 否 | 是 | 不显示标签 | ❌ | — | ≤8字 | — | 闹钟标签文本 |
| `alarms[].enabled` | boolean | UI | — | 否 | true | ❌ | — | — | — | Toggle 开关状态 + 行文字透明度 |
| `alarms[].repeat` | list(enum) | UI | 否 | 是 | null (单次) | ❌ | — | Mon~Sun | — | 重复日标签 |

### 8.2 闹钟数据持久化

```
车端运行时 ──→ 用户在卡片内直接增删改闹钟
           ──→ localStorage 持久化
           ──→ Bridge.setAlarm() 注册系统闹钟
```

### 8.3 色彩方案

**色彩模式**：clean（仅强调色变化，背景固定暗色）

**accent_color 影响范围**：
```
accent_color ──→ computePalette(hex, 'clean')
             ──→ --dyn-accent      → Toggle 开关激活态、添加按钮
             ──→ --dyn-accent-bg    → Toggle 背景
             ──→ --dyn-label-color  → 时钟模式指示点、倒计时文字
             ──→ --dyn-divider-color → 行分隔线
```

**推荐色盘**（6 色 · color_picker）：

| 色值 | 名称 | 适用场景 | 视觉感受 |
|------|------|----------|----------|
| `#4ADE80` | 薄荷绿 (默认) | 通用 | 清新、提神 |
| `#3B82F6` | 天空蓝 | 沉稳 | 冷静、可靠 |
| `#F59E0B` | 琥珀橙 | 活力 | 温暖、醒目 |
| `#64748B` | 石墨灰 | 低调 | 内敛、专注 |
| `#8B5CF6` | 薰衣紫 | 个性 | 柔和、独特 |
| `#94A3B8` | 银灰 | 极简 | 轻盈、中性 |

**固定元素颜色**（不随 accent_color 变化）：

| 元素 | 颜色 |
|------|------|
| 背景 | `#1A1A1C` 纯黑（固定） |
| 环境光晕 | `rgba(74,222,128,0.08)` → 随 accent 变化 |
| 时间数字 | `#F5F5F0` |
| 标签文本 | `rgba(245,245,240,0.35)` |
| Toggle 关闭态 | `#333` |
| 左滑删除按钮 | `#FF3B30`（固定红色，不随 accent 变） |

---

## 九、控件类型定义 (Control Types)

以下是 `editable` 字段引用的控件类型及其 UI 行为：

### 9.1 通用控件

| control | UI 表现 | 输入方式 | 产出值 | 使用模板 |
|---------|---------|----------|--------|----------|
| `text_input` | 单行文本框 + placeholder | 键盘输入 | string | 纪念日系列 |
| `date_picker` | 原生日期选择器 | 滚轮/日历选择 | "YYYY-MM-DD" | 纪念日系列 |
| `segment` | 分段选择器（2~3项） | 点击切换 | enum string | 闹钟、新闻 |
| `color_picker` | 6 色圆圈 + 当前高亮 | 点击选择 | hex string | 日历、闹钟 |

### 9.2 场景专用控件

| control | 使用场景 | UI 表现 | 产出值 |
|---------|----------|---------|--------|
| `city_search` | 天气 | 搜索框 + 下拉城市列表 | 城市名 string |
| `image_picker` | 纪念日背景 | 预设缩略图网格(5个) + 相册上传入口 | image URL or dataURL |
| `multi_select` | 新闻话题 | pill 标签 + 选中高亮 | list of enum strings |
| `style_picker` | 音乐风格 | 横向风格卡片预览 | enum string |

---

## 十、自然语言映射规则

### 10.1 模板识别

AI 根据用户输入的关键词判断目标模板：

| 关键词集合 | → 模板 |
|------------|--------|
| 恋爱/在一起/纪念日/对象/女朋友/男朋友/老公/老婆/结婚 | anniversary_love |
| 宝宝/孩子/出生/满月/百天/周岁/儿子/女儿 | anniversary_baby |
| 放假/倒计时/五一/国庆/春节/元旦/暑假/寒假 | anniversary_holiday |
| 天气/温度/穿什么/下雨/热不热/冷不冷 | weather_realtime |
| 音乐/歌/播放/听歌/歌单 | music_player |
| 日程/日历/安排/今天干什么/计划/待办 | calendar_schedule |
| 新闻/资讯/热点/头条/今日要闻 | news_daily |
| 闹钟/早起/提醒/定时/起床 | alarm_clock |

### 10.2 参数提取规则

AI 提取 JSON 时遵循以下规则：

```
规则 1：只提取 Schema 中 editable=true 的字段
规则 2：用户明确说了的 → 填入对应字段值
规则 3：用户没提到的必填字段 → 放入 needsFollowUp（追问一次）
规则 4：用户没提到的非必填字段 → 填 null（走 fallback）
规则 5：用户的模糊描述 → 映射到最近的约束值
         "暖色调" → 从 color_picker 预设中选暖色
         "去年夏天" → 追问具体日期
         "简洁一点" → display_style: "list"（新闻）
规则 6：用户的值超出约束 → 截断 or 追问
         标题 > 8字 → 截断到 8 字 + 提示
         日期在未来（但模板要求 ≤ 今天）→ 追问
```

### 10.3 AI 输出格式

```json
{
  "template_id": "anniversary_love",
  "component_type": "anniversary",
  "theme": "love",
  "params": {
    "start_date": "2023-05-20",
    "title": "在一起",
    "nickname": "小美",
    "background_image": null
  },
  "needs_follow_up": [],
  "ai_generated": {
    "description": "每一天都是最好的一天"
  }
}
```

- `params` → 用户可编辑字段（editable=true），null 表示走 fallback
- `ai_generated` → AI 自动补全的字段（source=AG），用户不可直接编辑
- `needs_follow_up` → 必填但用户没说的字段列表（追问一次）

### 10.4 不支持的请求处理

| 请求类型 | 判断条件 | 响应策略 |
|----------|----------|----------|
| **布局/字体修改** | 涉及 editable=false 的字段（fontSize、padding、layout） | "车载卡片的排版已经过驾驶安全优化。你可以换张背景图或调整配色来改变整体感觉。" |
| **跨模板混搭** | "天气+日历放一起" | "精品模板暂不支持混合，你可以试试'自由创作'模式来实现。" |
| **模板无此字段** | 用户要求的参数不在 Schema 中 | "这个模板目前不支持[X]设置。你可以调整[列出可用的 editable 字段]。" |
| **平台能力外** | 视频播放、车窗控制、打电话等 | "小组件是信息展示卡片，暂不支持[X]功能。你想做一个什么样的信息卡片？" |

---

## 十一、Pencil 设计绑定

### 11.1 字段 → 设计节点映射原则

每个 Schema 字段对应 Pencil 设计稿中一个或多个文本/图片节点。映射关系在各模板章节的 `pencil_bindto` 列中定义。

**设计约束**：
- 当 `nullable=true` 且值为 null 时：对应的 Pencil 节点区域应**隐藏**（非留白），上下元素自然收拢
- 当 `editable=true` 时：Pencil 中该节点应标注为"可变文本"，用 `{{ field_name }}` 占位符标记
- 所有 `source=DV`（计算字段）在 Pencil 中显示为示例值，不可被用户直接编辑

### 11.2 新增模板的 Pencil 流程

当新增一个模板时：

1. 在本文档中定义完整 Schema（数据结构 + 各字段属性）
2. 在 Pencil 中创建设计稿，文本节点使用 Schema 字段名标注
3. 导出 Node ID，填回本文档的 pencil_bindto 列
4. 开发模板代码，按 Schema 消费 `__WIDGET_PARAMS__`
5. 开发 config-panel 配置，按 editable + control 字段渲染控件
6. 更新 AI prompt，加入新模板的参数 Schema

---

## 十二、代码集成指南

### 12.1 对现有代码的影响评估

本 Schema 设计**尽量不破坏现有架构**，变更范围：

| 模块 | 变更类型 | 影响范围 |
|------|----------|----------|
| `prompt.py` | **修改** | TEMPLATES 字典增加 params_schema；NL prompt 引用 Schema 字段 |
| `validator.py` | **修改** | 按 Schema 验证 AI 输出，检查 required/constraints |
| `config-panel.js` | **重构** | 从硬编码场景判断 → 读取 Schema 动态渲染控件 |
| `render-widget.js` | **微调** | buildWidgetParams() 按 Schema 做字段别名统一 |
| 各模板 main.js | **微调** | 字段名统一对齐 Schema（消除当前的别名混乱） |
| 新增 `widget-schema.js` | **新增** | 前端可读的 Schema 定义（从本文档自动生成或手动同步） |

### 12.2 Schema 在代码中的表达

建议在 `src/widget-templates/shared/` 新增 `widget-schema.js`：

```javascript
// widget-schema.js — 自动从 TEMPLATE_SCHEMA.md 同步
// 每个模板的可编辑字段定义，供 config-panel 和 AI prompt 共用

export const WIDGET_SCHEMAS = {
  anniversary_love: {
    template_id: 'anniversary_love',
    component_type: 'anniversary',
    theme: 'love',
    fields: [
      { field: 'start_date',       type: 'date',   required: true,  editable: true,  control: 'date_picker',  constraints: { max: 'today' } },
      { field: 'title',            type: 'string', required: true,  editable: true,  control: 'text_input',   constraints: { maxLength: 8 }, default: '在一起' },
      { field: 'nickname',         type: 'string', required: false, editable: true,  control: 'text_input',   constraints: { maxLength: 6 }, default: null },
      { field: 'background_image', type: 'image',  required: false, editable: true,  control: 'image_picker', constraints: { maxSize: 200*1024 }, default: 'love_bg_01' },
    ]
  },
  weather_realtime: {
    template_id: 'weather_realtime',
    component_type: 'weather',
    theme: 'realtime',
    fields: [
      { field: 'city', type: 'string', required: true, editable: true, control: 'city_search', default: '北京' },
    ]
  },
  music_player: {
    template_id: 'music_player',
    component_type: 'music',
    theme: 'player',
    fields: [
      { field: 'visual_style', type: 'enum', required: false, editable: true, control: 'style_picker', constraints: { values: ['glass','minimal','material','pixel'] }, default: 'glass' },
    ]
  },
  // ... 其他模板同理
};
```

### 12.3 config-panel 改造思路

当前 config-panel.js 用 `if/else` 硬编码每个场景的字段渲染。改造为：

```javascript
// 改造前（当前）
if (this.sceneId === 'love') {
  return `<input type="date">...`;
}

// 改造后（Schema 驱动）
const schema = WIDGET_SCHEMAS[this.templateId];
return schema.fields
  .filter(f => f.editable)
  .map(f => this._renderControl(f))
  .join('');
```

`_renderControl(field)` 根据 `field.control` 类型分发到对应的控件渲染函数。新增模板时只需新增 Schema 定义，不需要改 config-panel 逻辑。

### 12.4 字段名统一清单

当前代码中存在的字段别名混乱，**已确认全部统一**。迁移策略：`buildWidgetParams()` 中保留旧别名的向下兼容映射，逐步在各模块中替换为新名：

| 当前存在的别名 | → 统一为 Schema 字段名 | 涉及文件 |
|----------------|----------------------|----------|
| `date`, `start_date`, `target_date` | anniversary: `start_date` or `target_date`（按模板区分） | prompt.py, render-widget.js, 各 anniversary/main.js |
| `message`, `subtitle`, `description` | → `description` | prompt.py, render-widget.js, 各 anniversary/main.js |
| `alarm_time`, `time` | alarm[]: → `time` | prompt.py, config-panel.js, alarm/main.js |
| `display_style`, `defaultView` | → `default_view` | config-panel.js, alarm/main.js |
| `bg_photo`, `background_image`, `background_image_url` | → `background_image` | config-panel.js, render-widget.js, 各 anniversary/main.js |
| `nickname`, `name_a`, `name_b`, `event_name` | love: → `nickname`; baby: → `baby_name`; holiday: → `title` |
| `category`, `categories` | → `topics` |

`buildWidgetParams()` 在过渡期保留别名兼容，逐步迁移。

---

## 十三、可扩展性设计

### 13.1 新增模板流程

1. 在本文档新增一章（§N），定义完整 Schema
2. 在 `widget-schema.js` 同步新增 Schema 对象
3. 在 Pencil 创建设计稿，记录 Node ID
4. 实现模板 HTML/JS/CSS（`src/widget-templates/{type}/`）
5. `prompt.py` 的 TEMPLATES 字典新增条目 + NL 关键词
6. 无需修改 config-panel（Schema 驱动自动生成控件）

### 13.2 新增字段流程

1. 在本文档对应模板章节的表格中新增行
2. 在 `widget-schema.js` 对应模板的 fields 数组中新增项
3. 如果 editable=true：确保 control 类型已在 §十 中定义
4. 模板 main.js 消费新字段
5. prompt.py 的 Schema 引用自动包含

### 13.3 新增控件类型流程

1. 在本文档 §十 中定义新控件
2. 在 config-panel.js 的 `_renderControl()` 中新增 case
3. 各模板的 Schema 即可引用新控件
