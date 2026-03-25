# 设计规范 (Design Specification)

**单一信息源** · 所有视觉设计的规范标准。本文档与 Pencil 设计文件（`UI_pen/card.pen`）保持同步。

**Claude Code 使用指南**：开始任何 UI 相关工作前，必须阅读本文件。涉及设计修改时，需同步更新本文档与 Pencil 设计文件。

---

## 一、全局设计语言

### 1.1 设计原则

**Liquid Glass 设计语言**
- 毛玻璃效果（frosted glass）+ 光晕（glow）+ 动态粒子（particle）+ 翻牌动画（flip）
- 多层叠加渐变（mesh gradient）创造纵深感
- 模糊 + 透明度组合实现沉浸式视觉

**暗色优先**
- 所有卡片默认暗色背景，确保车载环境无炫光
- 例外：日程卡片为亮色，明确区分

**车载 HMI 标准**
- Body 文字最小尺寸：≥24dp（约 32px）
- 触控目标最小尺寸：≥76×76dp
- 观看距离：60-80cm（驾驶员视距）
- 避免过小、过密集的文本和按钮

**2-Second Glanceability Test**
- 卡片核心信息必须在 2 秒内被理解
- Hero 数据（温度、日期、歌名）放在视觉中心
- 避免深层次的信息结构

### 1.2 卡片容器

**尺寸与圆角**
- 卡片逻辑尺寸：896 × 1464 px
- 描述：车端 1/3 屏（竖屏排列）
- 圆角半径：24px（全部四个角）
- 裁剪模式：`clip: true`（超出部分隐藏）

**手机端缩放**
```javascript
// CSS 缩放公式
zoom = containerWidth / 896
```
- 在手机端 Web App 中，通过 CSS `zoom` 属性等比缩小卡片
- 确保在不同手机屏幕宽度下视觉一致

### 1.3 字体体系

**主字体**：MiSans_VF
- 用途：天气、音乐、闹钟、纪念日系列卡片
- Variable Font，支持权重 300-700

**辅助字体**：Inter
- 用途：新闻卡片（现代英文系统）
- 字体文件：公共库引入

**Typography Scale 表**

| 角色 | fontSize | fontWeight | 用途 |
|------|----------|------------|------|
| Hero 数字 | 120-160 | 300 (Light) | 温度、天数、月数 |
| 卡片标题 | 42-56 | 500-600 | "闹钟"、"日程"、"每日简报" |
| 正文 | 28-36 | 400 (normal) | 歌名、新闻标题、事件标题 |
| 辅助文字 | 22-24 | 400 | 来源、时间、重复规则 |
| 字母间距 | hero 用 -2 到 -4, 标签用 +2 到 +4 | | |

**字体应用规则**
- Hero 数字优先使用权重 300（Light），营造轻盈感
- 标题和主信息使用权重 500-600（Medium-Semibold），确保可读性
- 辅助信息使用权重 400，降低视觉权重
- 字母间距（letter-spacing）：大标题收紧 -2px 到 -4px；标签放松 +2px 到 +4px

### 1.4 颜色体系

**暗色卡片文字层级**
```
主色（一级）  : #F5F5F0       (不透明)
次级（二级）  : #F5F5F060     (38% 透明度)
三级（三级）  : #F5F5F040     (25% 透明度)
```

**亮色卡片文字层级**（日程卡片专用）
```
主色（一级）  : #1E293B       (深灰蓝)
次级（二级）  : #64748B       (灰蓝)
三级（三级）  : #94A3B8       (浅灰蓝)
四级（四级）  : #CBD5E1       (超浅灰蓝)
```

**强调色 per Card**

| 卡片 | 强调色 | 用途 |
|------|--------|------|
| 天气 | #FFD700 (金色光晕) | sun-glow 装饰、阳光强调 |
| 音乐 | #8B5CF6 (紫色), #DCA050 (金色) | 光晕、进度条、频谱 |
| 日程 | #3B82F6 (蓝), #F59E0B (橙), #10B981 (绿) | 事件圆点、提醒框 |
| 新闻 | #00D4FF (科技), #4ADE80 (汽车), #FBBF24 (财经), #F87171 (体育) | 分类标签 |
| 闹钟 | #4ADE80 (绿) | toggle、分组标签 |
| 恋爱纪念日 | #FF6B8A 系粉红 | 彩蛋粒子、装饰 |
| 宝宝纪念日 | #F5C842 暖金 | 彩蛋粒子、装饰 |
| 假日纪念日 | #FF8C42 橙色 | 彩蛋粒子、装饰 |

### 1.5 间距体系

**统一间距规则**
- 卡片内边距：64px（所有卡片上下左右统一）
- 内部元素间隔（gap）：12-24px
- Spacer 高度标准值：16 / 24 / 32 / 36 / 40 / 48 / 64 px
- 网格对齐：所有值对齐 4px 基线

**应用场景**
- header 与 hero 数据间：160-200px（大呼吸空间）
- 多行文本间：12-16px（紧凑）
- 卡片分区间：32-48px（中等分隔）
- hero 与 pill/列表间：32-56px

### 1.6 通用组件规范

#### Toggle 开关

**标准尺寸（用于闹钟、日程）**

| 状态 | 背景 | 圆点 | 圆点位置 |
|------|------|------|---------|
| ON | 80×44, r22, fill #4ADE80 | 36×36, r18, fill #FFFFFF | x: 40px, y: 4px |
| OFF | 80×44, r22, fill #FFFFFF20 | 36×36, r18, fill #FFFFFF80 | x: 4px, y: 4px |

**精简尺寸（用于信息列表）**

| 状态 | 背景 | 圆点 | 圆点位置 |
|------|------|------|---------|
| ON | 64×36, r18, fill #4ADE80 | 28×28, r14, fill #FFFFFF | x: 32px, y: 4px |
| OFF | 64×36, r18, fill #FFFFFF20 | 28×28, r14, fill #FFFFFF60 | x: 4px, y: 4px |

**交互**
- 点击转换 0.3s 缓动
- 动画：background-color + transform（圆点位移）

#### FAB 按钮

**闹钟卡片 FAB**
- 尺寸：96×96px
- 圆角：cornerRadius 48px
- 背景：fill #FFFFFF18（半透明白）
- 图标：lucide "plus", 48px, fill #4ADE80
- 位置：absolute, bottom 64px, right 64px

**日程卡片 FAB**
- 尺寸：96×96px
- 圆角：cornerRadius 48px
- 背景：fill #0A84FF30（半透明蓝）
- 图标：lucide "plus", 48px, fill #3B82F6
- 位置：absolute, bottom 64px, right 64px

**交互**
- 悬停：opacity +10%
- 点击：scale 0.95 → 1.0

#### 左滑删除按钮

**规范**
- 宽度：128px
- 高度：与所在行高度一致
- 背景颜色：fill #FF3B30
- 圆角：cornerRadius [0, rowRadius, rowRadius, 0]（右边保持行的圆角，左边无）
- 图标：lucide "trash-2", 44-48px, fill #FFFFFF
- 手势阈值：64px（左滑超过 64px 触发删除）

**位置关系**
- 与所在行（SwipeableRow）绑定，向右滑动时露出
- 垂直居中对齐

#### 毛玻璃面板（纪念日系列）

**位置与尺寸**
- 位置：absolute, bottom 对齐
- Y 坐标：866-884px（卡片底部向上 580-598px）
- 宽度：896px（全卡片宽）
- 高度：580-598px

**视觉层次**
1. **背景渐变**（最底层）
   - mesh_gradient / linear-gradient 多档透明度
   - 关键色：卡片主色系 + 降低饱和度
   - opacity: 0.7

2. **上方暗化层**
   - 高度：600px（从面板顶部向上）
   - linear-gradient 7 色标：透明 → 不透明 → 不透明 → 不透明 → 黑色不透明
   - 作用：遮挡上方卡片内容，创造层次

**内容区**
- 毛玻璃效果：backdrop-filter: blur(20px)
- 内边距：32-48px

---

## 二、卡片模板设计规范

### 2.1 天气卡片 (Card-Weather)

**Pencil 文件引用**：Node ID `tPVm8`

**背景设计**

Mesh Gradient 2×2：
```
["#87CEEB" (左上-天空蓝), 
 "#5BA3D9" (右上-深蓝), 
 "#3A7BD5" (左下-更深蓝), 
 "#2C5F8A" (右下-深灰蓝)]
```

**装饰元素**

Sun-Glow Ellipse：
- 尺寸：500×500px
- 位置：absolute, x: 350px, y: -100px（超出卡片上方）
- 背景：radial-gradient(#FFD70060 → #FFD70000)
- opacity: 0.5
- 作用：模拟太阳光晕

**内容结构**（从上到下，padding 64px）

1. **Header**（h72）
   - 城市名：fontSize 36, fontWeight 500, fill #F5F5F0
   - 日期：fontSize 32, fill #F5F5F0A0，显示在城市名下方或同行右对齐

2. **Spacer**：h160

3. **Hero 区块**
   - 温度数字：fontSize 120, fontWeight 300, letterSpacing -4, fill #F5F5F0
   - 天气描述：fontSize 36, fill #F5F5F0
   - 体感温度：fontSize 28, fill #F5F5F0A0

4. **Spacer**：h32

5. **Pill Row**（3 个 pill，等分排列）
   - 样式：borderRadius 20, fill #FFFFFF15, padding [12, 20]
   - 标题：fontSize 22, fill #F5F5F090
   - 数值：fontSize 32, fontWeight 600, fill #F5F5F0
   - pill 内容示例：湿度 / 风速 / 紫外线指数

6. **Forecast Row**（3 列等分未来 3 天）
   - 日期：fontSize 28
   - 温度范围：fontSize 28, fill #F5F5F060

7. **AI Suggestion Panel**
   - 样式：borderRadius 20, fill #FFFFFF15, padding [28, 32]
   - 文本：fontSize 26, fill #F5F5F0B0
   - 内容：AI 生成的穿衣建议或出行提示

**CSS 实现参考**

```css
.card-weather {
  background: 
    radial-gradient(ellipse at 0% 0%, #87CEEB, transparent 70%),
    radial-gradient(ellipse at 100% 0%, #5BA3D9, transparent 70%),
    radial-gradient(ellipse at 0% 100%, #3A7BD5, transparent 70%),
    radial-gradient(ellipse at 100% 100%, #2C5F8A, transparent 70%);
}

.sun-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  left: 350px;
  top: -100px;
  opacity: 0.5;
  background: radial-gradient(circle, #FFD70060, #FFD70000);
  border-radius: 50%;
}
```

---

### 2.2 音乐卡片 (Card-Music)

**Pencil 文件引用**：Node ID `qXG2n`

**背景设计**

基础 Mesh Gradient 2×2：
```
["#1A1028" (左上-深紫), 
 "#2D1B3D" (右上-紫灰), 
 "#1A1028" (左下-深紫), 
 "#0D0A14" (右下-极深黑紫)]
```

**图层叠加顺序**（从底到上）

1. **Album Background Blur**
   - 使用专辑封面图作为背景 fill
   - 模糊：blur(80px)
   - opacity: 0.4

2. **Dark Overlay**
   - linear-gradient 180°：
     - 0%：#0D0A1480
     - 50%：#1A1028B0
     - 100%：#0D0A14E0
   - 作用：压低背景，凸显前景内容

3. **Glow Decoration（紫色光晕）**
   - 元素：ellipse 500×500
   - 背景：radial-gradient(#8B5CF640 → #8B5CF600)
   - opacity: 0.3
   - 位置：中上方或右上角

**内容结构**（vertical center, padding 64px）

1. **Spacer**：h160

2. **Album Art**
   - 尺寸：560×560px
   - 圆角：borderRadius 28
   - 阴影 Layer 1：blur 60, #00000060, offset (0, 20)
   - 阴影 Layer 2：blur 20, #8B5CF630, offset (0, 4)
   - 图片：fill_container

3. **Spacer**：h56

4. **Song Name**
   - fontSize 56
   - fontWeight 600
   - fill #F5F5F0

5. **Artist**
   - fontSize 36
   - fill #F5F5F060

6. **Lyrics**（歌词摘段）
   - fontSize 32
   - fontStyle italic
   - fill #F5F5F040

7. **Spectrum（频谱条）**
   - 7 根竖条
   - 每根宽度：6px
   - 圆角：borderRadius 3
   - 填充色：#DCA050（金色）
   - 间隔（gap）：6px
   - 高度：20-44px 动态变化

8. **Progress Bar**
   - 高度：8px
   - 圆角：borderRadius 3
   - 背景：#FFFFFF0F
   - 进度填充：linear-gradient(#DCA050 → #E8B870)

9. **Time Row**
   - 当前时间 — 总时长
   - fontSize 32
   - fill #F5F5F060
   - display: space_between

10. **Controls Panel**
    - 尺寸：全宽，高度 148px
    - 圆角：borderRadius 32
    - 背景：fill #FFFFFF08
    - 内边距：[24, 40]
    - **布局**：flex, space_around, align_center
      - 上一曲按钮：56×56, fill #FFFFFFB3
      - 播放按钮：80×80, fill #FFFFFF（中心）
      - 下一曲按钮：56×56, fill #FFFFFFB3

**CSS 实现参考**

```css
.card-music {
  position: relative;
  overflow: hidden;
}

.album-bg-blur {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: var(--album-image);
  background-size: cover;
  filter: blur(80px);
  opacity: 0.4;
  z-index: 1;
}

.dark-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, 
    #0D0A1480 0%, 
    #1A1028B0 50%, 
    #0D0A14E0 100%);
  z-index: 2;
}

.spectrum-bar {
  width: 6px;
  border-radius: 3px;
  background: #DCA050;
  animation: spectrum 0.2s ease-in-out;
}
```

---

### 2.3 日程卡片 (Card-Calendar)

**Pencil 文件引用**：Node ID `7fKb6`

⚠️ **特殊声明**：本卡片为**亮色设计**，打破全局暗色规范，以提高日程信息的可读性。

**背景设计**

Mesh Gradient 2×2：
```
["#F0F4F8" (左上-超浅蓝), 
 "#E2E8F0" (右上-浅蓝), 
 "#D0D8E4" (左下-浅灰蓝), 
 "#C4CED8" (右下-灰蓝)]
```

**内容结构**（padding 64px，vertical layout）

1. **Header**（h72）
   - "日程"标签：fontSize 42, fontWeight 600, fill #1E293B
   - 周几：fontSize 36, fill #64748B（右对齐或同行）

2. **Date Section**
   - 大数字（日期）：fontSize 120, fontWeight 300, letterSpacing -2, fill #1E293B
   - 月份：fontSize 42, fontWeight 500
   - 农历信息：fontSize 28, fill #94A3B8

3. **Spacer**：h48

4. **Divider**
   - 高度：1px
   - 颜色：fill #CBD5E1

5. **Spacer**：h40

6. **Event Row ×3**（每条高 150px）
   - **时间** | 圆点 | 事件信息
     - 时间：fontSize 36, fontWeight 500, fill #94A3B8, 固定宽 120px, textGrowth fixed
     - 圆点：16×16 ellipse，颜色按类别：
       - #3B82F6（蓝，会议）
       - #F59E0B（橙，休闲）
       - #10B981（绿，生活）
     - 信息区（x: 184）：
       - 标题：fontSize 36, fontWeight 500, fill #1E293B
       - 地点/备注：fontSize 32, fill #94A3B8

7. **Next Meeting Panel**
   - 样式：borderRadius 20
   - 背景：fill #0A84FF20
   - 边框：inside stroke 1px #3B82F620
   - 内边距：[28, 32]
   - 文本：fontSize 32, fill #3B82F6

8. **FAB 按钮（新增事件）**
   - 尺寸：96×96px
   - 圆角：borderRadius 48px
   - 背景：fill #0A84FF30
   - 图标：lucide "plus", fontSize 48, fill #3B82F6
   - 位置：absolute, bottom 64px, right 64px

---

### 2.4 新闻卡片 (Card-News)

**多页面设计**，分别对应三个 Pencil Node：

#### 2.4.1 首页 (News Homepage)

**Pencil 文件引用**：Node ID `OMxV7`

**背景设计**

基础 Mesh Gradient 2×2：
```
["#0F172A" (左上-深蓝), 
 "#1E293B" (右上-深灰蓝), 
 "#0F172A" (左下-深蓝), 
 "#162033" (右下-深蓝灰)]
```

**内容叠加**：linear-gradient 170°
```
起点(0%)：#06101f
30% 处：#0e2848
55% 处：#163a60
80% 处：#0c2040
终点(100%)：#08162c
```

**内容结构**（padding 64px）

1. **Header**（h72）
   - 标题"每日简报"：fontSize 42, fontWeight 600, fill #F5F5F0
   - 日期：fontSize 32, fill #F5F5F060

2. **Hero News Card**（主新闻）
   - 尺寸：full width × 510px
   - 圆角：borderRadius 24
   - 裁剪：clip: true
   - **上半区**（h300）：新闻配图，fill_container
   - **下半区**（h210）：信息区，padding [24, 32]
     - 分类标签：
       - 科技：fill #00D4FF
       - 汽车：fill #4ADE80
       - 财经：fill #FBBF24
       - 体育：fill #F87171
       - fontSize 22, fontWeight 700, borderRadius 8, padding [4, 12]
     - 新闻标题：fontSize 32, fontWeight 600, fill #F5F5F0, lineHeight 1.3
     - 来源 + 发布时间：fontSize 22, fill #F5F5F060

3. **Spacer**：h32

4. **Secondary News Cards**（次要新闻，2-3 条）
   - 样式：borderRadius 20, fill #1a4a6830
   - 内边距：[24, 32]
   - 边框：inside stroke 1px #FFFFFF08
   - 分类标签：同上规范
   - 标题：fontSize 32, fontWeight 600, fill #F5F5F0
   - 来源 + 时间：fontSize 22, fill #F5F5F060

---

#### 2.4.2 列表页 v2 (News List)

**Pencil 文件引用**：Node ID `l5AB7`

**背景设计**

linear-gradient 160°：
```
起点(0%)：#0F172A
50% 处：#162033
终点(100%)：#0F172A
```

**Header 改动**
- 字体改为 Inter
- "每日简报"标题：fontSize 42, fontWeight 500, fill #64748B
- 日期：fontSize 32, fill #94A3B8

**Hero Card**（保留）
- 圆角：borderRadius 20
- 图片区：240px 高
- 信息区：background #1E293B, padding [24, 32]
- 标题、标签、时间同首页规范

**News Items**（新闻条目）
- 样式：borderRadius 20, fill #1E293B60, padding 24, gap 24
- 边框：stroke 1px #FFFFFF08
- **布局**：horizontal, space_between
  - **左文区**（flex: 1）
    - 分类标签：fontSize 22, fontWeight 700, fill 按类型
    - 标题：fontSize 32, fontWeight 600, fill #F5F5F0
    - 来源 + 时间：fontSize 22, fill #F5F5F060
  - **右图区**
    - 尺寸：160×120px
    - 圆角：borderRadius 12
    - 图片：fill_container

---

#### 2.4.3 详情页 v2 (News Detail)

**Pencil 文件引用**：Node ID `vwhtM`

**背景设计**

纯色：fill #0A0E14

**内容结构**

1. **返回按钮**
   - 图标："‹"（返回箭头）
   - fontSize 48
   - fill #F5F5F0
   - 位置：top-left，padding 32

2. **Hero Image**
   - 高度：380px
   - 宽度：fill_container（超出内边距）
   - 图片自适应填充

3. **Content Area**（padding [32, 48, 48, 48]，内部 gap 24）

   a. **分类标签**
   - 样式：borderRadius 16, fill #FFFFFF20, padding [6, 14]
   - 文本：fontSize 24, fontWeight 700, fill 按类型（科技/汽车/财经/体育）

   b. **文章标题**
   - fontSize 36
   - fontWeight 700
   - fill #F5F5F0
   - lineHeight 1.35（舒适的标题行距）

   c. **作者/来源/时间**
   - fontSize 22
   - fill #F5F5F060
   - 格式：作者 · 来源 · 发布时间

   d. **正文段落**
   - fontSize 28
   - fill #F5F5F0CC（高对比度）
   - lineHeight 1.7（舒适阅读行距）
   - 段落间隔：margin-bottom 24px

   e. **小标题/章节标题**（如果有）
   - fontSize 32
   - fontWeight 600
   - fill #F5F5F0
   - margin-top 32px, margin-bottom 12px

   f. **嵌入图片**（文中插图）
   - 宽度：100%（减内边距）
   - 高度：auto（保持宽高比）
   - 圆角：borderRadius 12
   - 图片说明（caption）：fontSize 22, fill #64748B, textAlign center, margin-top 12px

   g. **结尾信息**
   - 完整来源链接
   - 发布时间（详细到小时分钟）
   - fontSize 20, fill #94A3B8

---

### 2.5 闹钟卡片 (Card-Alarm)

**Pencil Nodes**: 默认态 `Qb8jr` · 左滑删除 `Kysmf` · 时钟模式 `ab3HZ` · 列表+切换 `qOPTb`

**背景**: `#1a1a1c`（接近纯黑）
**内容区**: padding 64, gap 12, layout vertical

**结构（默认列表模式）**：

| 层级 | 元素 | 属性 |
|------|------|------|
| header | "闹钟" | fontSize 42, fw 600, fill `#F5F5F0` |
| header | 模式切换 | list + clock-4 图标各 36×36, active=`#F5F5F0` / dim=`#F5F5F040` |
| countdown | "X小时X分钟后响铃" | fontSize 36, fill `#F5F5F060` |
| 分组标签 | "作息" | fontSize 24, fw 600, fill `#4ADE80` |
| 分组标签 | "其他" | fontSize 24, fw 600, fill `#F5F5F040` |
| alarm-row | 容器 | r20, fill `#ffffff08`, padding [24,28], h160, alignItems center |
| alarm-row | 时间 | fontSize 48, fw 300, fill `#F5F5F0`, ls -2 |
| alarm-row | 上/下午 | fontSize 24, fw 500, fill `#F5F5F060` |
| alarm-row | 重复规则 | fontSize 22, fill `#F5F5F040` |
| alarm-row | toggle | 标准尺寸 80×44 (见通用组件) |
| disabled | 整行 | opacity: 0.5 |
| FAB | 添加按钮 | 96×96, r48, fill `#FFFFFF18`, "+" `#4ADE80` |

**交互态 — 左滑删除** (`Kysmf`):
- 行内容左移 128px，右侧露出删除按钮
- 删除按钮：128×160, fill `#FF3B30`, trash-2 48px white, cornerRadius [0,20,20,0]
- 手势：touchstart → translateX 跟手 → 超 64px 吸附 → 松手回弹或确认删除

**交互态 — 时钟表盘模式** (`ab3HZ`):
- 表盘：520×520 ellipse, fill `#ffffff06`, stroke inside `#FFFFFF12` 2px
- 刻度数字(12/3/6/9)：fontSize 28, fw 300, fill `#F5F5F060`
- 闹钟标记 ON：20×20 ellipse `#4ADE80` / OFF：`#FFFFFF20`
- 中心点：12×12 ellipse `#4ADE80`
- 下方精简列表：行高 80, r16, fill `#ffffff08`, padding [16,24]
- 精简 toggle：64×36, r18（比标准尺寸小）

---

### 2.6 恋爱纪念卡 (Card-Love)

**Pencil Node**: `UyUeC`

**背景色**: `#2A1520`

**层叠结构（从底到上）**：
1. **photo**: 896×1464, r32, opacity 0.85, object-fit cover
2. **bottom-darken**: 896×600, y:864, gradient 180° 7 色标 `#3a1808` 系:
   `00 → c0(3%) → e8(8%) → f5(15%) → fb(30%) → fd(50%) → ff(100%)`
3. **glass-panel**: 896×580, y:884, r32, padding [40,48], gap 12
   背景 gradient 180° opacity 0.7: `#5c3018d0 → #4a2510e8 → #3a1808f2 → #3a1808f8`

**面板内容（v2.0 统一结构）**：

| 元素 | Node | 属性 | 数据来源 |
|------|------|------|----------|
| ❤️ emoji | `vFO4Q` | fontSize 32 | 固定 |
| 天数大数字 | `cmlYx` | fontSize 160, fw 300, fill `#F5F5F0`, ls -4 | DV: daysDiff(start_date, today) |
| label "天的相伴" | `2529z` | fontSize 42, fw 500, fill `#F5F5F0D0`, ls 2 | AG: 随机选取文案池 |
| 分隔线 | `LuLXr` | 48×1.5, fill `#FFFFFF60` | 固定 |
| copy "与小美相伴的每一天" | `TCbPq` | fontSize 36, fw 500, fill `#F5F5F0` | AG: 融入 nickname |
| 日期区间 | `uQg5P` | fontSize 28, fill `#F5F5F0A0` | DV: 自动格式化 |

> **v2.0 变更**：删除 `title` 字段（用户不再输入标题），`nickname` 融入 copy 文案，label/copy 由 AI 生成（每次不同）。详见 `TEMPLATE_SCHEMA.md §0.6`。

---

### 2.7 宝宝成长卡 (Card-Baby)

**Pencil Node**: `3A9gr`

面板内容结构与恋爱卡**完全统一**，以下是**差异项**：

| 属性 | 恋爱卡 | 宝宝卡 |
|------|--------|--------|
| 背景色 | `#2A1520` | `#2A2015` |
| photo opacity | 0.85 | 0.9 |
| 暗化层色系 | `#3a1808` (棕红) | `#b89060` (暖金) |
| 面板 gradient | `#5c3018d0 →...` | `#c8a070e0 → #bfa068ed → #b89860f5 → #b09058f8` |
| ⚠️ 文字主色 | `#F5F5F0` (白) | **`#3D2510`** (深棕!) |
| 文字次级 | `#F5F5F0D0` | `#3D2510CC` |
| 文字日期 | `#F5F5F0A0` | `#3D2510A0` |
| 分隔线 | `#FFFFFF60` | `#5C3D2060` |
| emoji | ❤️ | ⭐ |
| copy 示例 | "与小美相伴的每一天" | **"星星的成长日记"**（融入 baby_name）|

---

### 2.8 假日倒计时卡 (Card-Holiday)

**Pencil Node**: `7EC5L`

**v2.0 变更**：删除了 tag 胶囊组件（~~`2oXHu`~~），三卡结构统一为 hero+label+divider+copy+date。

布局与恋爱/宝宝卡**统一**，差异：

| 属性 | 假日卡特有值 |
|------|-------------|
| 背景色 | `#0A2A2A` |
| 面板尺寸 | 896×598, y:866 |
| 面板 gradient | `#6b3510d0 → #5a2808e8 → #4a2008f2 → #4a2008f8` |
| 面板 padding | 48 |
| label 示例 | "天就到啦"（vs 恋爱 "天的相伴"） |
| copy 示例 | "五一去海边冲浪吧"（融入 holiday_name） |
| 文字色系 | `#F5F5F0` 白色（同恋爱卡）|

---

### 2.9 生日倒计时 (birthday) — `Card-Birthday`

**Pencil Node ID**: `2LUjp`

**整体结构**（与纪念日三卡统一）：
```
Card-Birthday (2LUjp) — 896×1464, cornerRadius:24, fill:#1A2030
├── photo-area (OVlau) — 896×1464, opacity:0.85, clip, 背景图
├── bottom-darken (pzwXL) — 896×600, y:864, 底部渐暗遮罩
└── glass-panel (jrxeq) — 896×580, y:884, 毛玻璃面板
    ├── numBd (3YvV9) — hero 数字, 160px/300
    ├── labelBd (CBe2T) — label, 42px/500
    ├── divider (jdgL9) — 48×1.5, #FFFFFF60
    ├── copyBd (jxKai) — 文案, 36px/500
    └── dateBd (KESBL) — 日期, 28px/normal
```

**Glass Panel 内容层**：

| 元素 | Node ID | 字号/字重 | 颜色 | 数据来源 | 示例 |
|------|---------|-----------|------|----------|------|
| hero 数字 | `3YvV9` | 160/300 | `#F5F5F0` | DV: days_remaining | `15` |
| label | `CBe2T` | 42/500 | `#F5F5F0D0` | DV+AG: 随机池 | `天后就是TA的生日` |
| 分割线 | `jdgL9` | — | `#FFFFFF60` | — | — |
| copy | `jxKai` | 36/500 | `#F5F5F0` | AG: 含 person_name | `给妈妈准备一份惊喜吧` |
| 日期 | `KESBL` | 28/normal | `#F5F5F0A0` | DV: 格式化日期 | `2026.04.09` |

**配色方案**：

| 属性 | 生日卡值 |
|------|---------|
| 背景色 | `#1A2030`（深蓝紫）|
| 面板尺寸 | 896×580, y:884 |
| 面板 gradient | `#8b5cf6d0 → #7c3aede8 → #6d28d9f2 → #5b21b6f8`（紫罗兰系）|
| 面板 padding | 48 |
| label 示例 | "天后就是TA的生日" |
| copy 示例 | "给妈妈准备一份惊喜吧"（融入 person_name） |
| 文字色系 | `#F5F5F0` 白色（同恋爱卡/假期卡）|

> **v2.0 变更**: 新增模板，纪念日系列扩展为四卡（恋爱/宝宝/假期/生日），共享统一的 glass-panel 结构。

**预设背景图**：5 张（Asset-BirthdayBg-01~05），配色覆盖紫金、暖粉、暖金、深蓝金、粉紫五种倾向，详见 TEMPLATE_SCHEMA.md §3b.3。

---

### 2.10 三方媒体中心 (Card-MediaHub)

**定义**：三方播放内容聚合卡片，将 QQ音乐、小宇宙、B站、喜马拉雅等第三方媒体 App 的核心播控能力集成到车载桌面卡片中。

**Pencil 文件引用**：
- 单 App 满屏：Node ID `G7eeX`
- 双 App 分屏：Node ID `Nka42`

#### 2.10.1 布局模式

| 模式 | 选择 App 数 | 尺寸 | 说明 |
|------|------------|------|------|
| 单 App | 1 | 896×1464 | 完整播控 + 播放列表 |
| 双 App | 2 | 896×732 × 2 | 上下分区，各自独立播控 + 紧凑列表 |

#### 2.10.2 支持的三方 App

| App | 品牌色 | 内容类型 | icon 圆角 |
|-----|--------|---------|----------|
| QQ音乐 | #1DB954 (绿) | 音乐 | 14px |
| 小宇宙 | #EE802C (橙) | 播客 | 14px |
| B站 | #FB7299 (粉) | 视频/音频 | 14px |
| 喜马拉雅 | #F5222D (红) | 有声书/播客 | 14px |

**品牌色用途**：App icon 背景、播放按钮 fill、进度条 fill、"正在播放"标签色。其余 UI 保持统一暗色。

#### 2.10.3 单 App 满屏结构（896×1464）

**背景**：统一暗色 + App 品牌色微调光晕
- 基底：linear-gradient 170° `#0C1A12` → `#06100C`（以 QQ音乐为例）
- 光晕：radial-gradient 品牌色 40% opacity → transparent，ellipse 500×500，右上方
- 原则：不同 App 只改 gradient 色相，不改结构

**内容结构**（padding 64，vertical layout）

1. **Header**（h72）
   - App Icon：56×56，cornerRadius 14，fill 品牌色
   - App Name：fontSize 36，fontWeight 600，fill #F5F5F0
   - 副标题"正在播放/正在收听"：fontSize 24，fill #F5F5F060

2. **Spacer**：h80

3. **Now Playing（正在播放区）**
   - 布局：horizontal，gap 32
   - **封面**：280×280，cornerRadius 20，shadow blur 40 #00000050
   - **信息区**（vertical，gap 8）：
     - 曲名/集名：fontSize 44，fontWeight 600，fill #F5F5F0
     - 歌手/播客名：fontSize 28，fill #F5F5F060
     - 专辑名：fontSize 24，fill #F5F5F040
     - 进度条：h6，cornerRadius 3，bg #FFFFFF15，fill 品牌色
     - 时间行：fontSize 22，fill #F5F5F060，space_between

4. **Controls Panel**
   - 高度：80，cornerRadius 20，fill #FFFFFF08
   - 上一曲：56×56，fill #FFFFFFB3
   - 播放：64×64，cornerRadius 32，fill 品牌色
   - 下一曲：56×56，fill #FFFFFFB3
   - 播客特殊：上一曲 → "↺30s"，下一曲 → "30s↻"

5. **Divider**：h1，fill #FFFFFF10

6. **播放列表 / 最近收听**
   - 标签：fontSize 28，fontWeight 500，fill #F5F5F080
   - 每条：h88，cornerRadius 16，fill #FFFFFF06，horizontal layout
     - 缩略图：64×64，cornerRadius 10
     - 曲名/集名：fontSize 30，fontWeight 500，fill #F5F5F0
     - 歌手/时长：fontSize 22，fill #F5F5F050
   - 最多显示 3 条

#### 2.10.4 双 App 分屏结构（896×1464 = 732 + 2 + 730）

**分区规则**
- 上半区 732px + 分割线 2px + 下半区 730px
- 分割线：fill #FFFFFF10
- 每个区域独立 gradient 背景色（品牌色微调）

**每半区内容结构**（padding 48，紧凑版）

1. **Header**（紧凑）
   - App Icon：44×44，cornerRadius 11
   - App Name：fontSize 30，fontWeight 600
   - 状态标签"正在播放"：fontSize 20，fill 品牌色

2. **Now Playing（紧凑版）**
   - 封面：200×200，cornerRadius 16
   - 曲名：fontSize 36（缩小）
   - 歌手：fontSize 24
   - 进度条：h4，cornerRadius 2
   - Mini Controls：play btn 48×48

3. **列表**（紧凑版）
   - 每条 h56，cornerRadius 10，fill #FFFFFF06
   - 缩略图 40×40，cornerRadius 8
   - 单行信息："曲名 · 歌手"，fontSize 22
   - 最多 2 条

#### 2.10.5 配置面板字段

| 字段 | 控件 | 说明 |
|------|------|------|
| apps | multi_select (max 2) | 选择 1-2 个三方 App |
| （per app）视觉无额外配置 | — | 品牌色自动应用，无需用户选色 |

---

## 三、交互态设计规范

### 3.1 左滑删除（通用手势）

适用场景：闹钟行、日程事件行

| 参数 | 值 |
|------|-----|
| 触发手势 | touchstart + translateX 跟手 |
| 激活阈值 | 64px |
| 吸附位置 | translateX(-128px) |
| 删除按钮 | 128px 宽, fill `#FF3B30` |
| 删除图标 | lucide trash-2, 44-48px, `#FFFFFF` |
| 圆角 | [0, 行圆角, 行圆角, 0] |
| 回弹动画 | transform 0.3s ease |
| 防误触 | Y 轴移动 > X 轴时取消水平滑动 |

```css
.swipeable-row { position: relative; overflow: hidden; }
.row-content { transition: transform 0.3s ease; }
.row-content.swiped { transform: translateX(-128px); }
.delete-btn {
  position: absolute; right: 0; top: 0;
  width: 128px; height: 100%;
  background: #FF3B30;
}
```

### 3.2 日程事件完成态

Pencil 参考：`NYtT7` 第一行

| 属性 | 默认态 | 完成态 |
|------|--------|--------|
| 整行 opacity | 1 | 0.5 |
| 圆点 | 原色(蓝/橙/绿) | `#10B981` 绿色 |
| check 图标 | 无 | lucide check 24×24 `#10B981` 叠加在圆点位置 |
| 标题 | fill `#1E293B` | fill `#94A3B8` + strikethrough |
| 时间/地点 | fill `#94A3B8` | fill `#CBD5E1` |

### 3.3 纪念日彩蛋粒子效果

Pencil 规格页：`4Vqo5`

| 卡片 | 粒子 | 数量/次 | 大小 | 颜色 | 动画 | 时长 |
|------|------|---------|------|------|------|------|
| 恋爱 | ❤️ | 5-8 | 24-48px | `#FF6B8A` / `#FF8FAB` / `#FFB3C6` | 上飘+左右摆→渐隐 | 1.2s ease-out |
| 宝宝 | ⭐🧸(3:1) | 5-8 | 20-40px | `#F5C842` / `#FFD700` / `#FFA500` | 四散+旋转→渐隐 | 1.5s ease-out |
| 假日 | 🎉🎊+纸屑 | 8-12 | 8-40px | `#FF8C42`/`#FFD700`/`#4ADE80`/`#60A5FA`/`#F472B6` | 抛物线+旋转→渐隐 | 2.0s |
| 生日 | 🎂🎁🎈(2:1:2) | 6-10 | 20-44px | `#8B5CF6`/`#A78BFA`/`#FFD700`/`#FF6B8A`/`#60A5FA` | 上弹+摇摆旋转→渐隐 | 1.5s ease-out |

**通用参数**: 触发=点击 glass-panel · 防抖 300ms · z-index 在 panel 之上 card overflow:hidden 之内 · 实现文件 `shared/easter-egg.js` · requestAnimationFrame + CSS transform

---

## 四、手机端页面设计

### 4.1 预览页 (preview)
- 卡片按 `CSS zoom = containerWidth / 896` 等比缩放
- **「示例数据」提醒在卡片外部**（上方独立提示条），不在卡片内显示
- 底部操作栏：编辑配置 + 推送到车

### 4.2 配置面板 (config-panel)
- 每个模板有独立配置项
  - 纪念日：日期 + 名字 + 背景图
  - 天气：城市
  - 闹钟：时间列表
- 背景图选择器：5 预设缩略图 + 1 自定义上传（6 格布局）

---

## 五、车端设计

### 5.1 显示态
- 全屏渲染当前卡片，左右滑动切换
- 底部 dot 指示器（显示卡片数量和位置）
- CSS zoom 自适应，移除卡片圆角（全屏填充）

### 5.2 编辑态（长按触发）
- 卡片缩小至 80%，露出操作 UI
- 右上角 ✕ 删除按钮（点击弹出确认）
- 长按拖动调换顺序

### 5.3 接收确认弹窗
- 收到新卡片后弹出：📲 + 卡片类型名 + 取消/接收
- 5 秒自动接收

---

## 六、Pencil 设计稿页面索引

> **设计文件**：`UI_pen/card.pen`
> **命名规范**：`[前缀]-[模板名]-[状态/变体名]`

### 6.0 命名前缀体系

| 前缀 | 含义 | 开发关注度 |
|------|------|-----------|
| `Card-` | 主页面（首屏默认渲染态） | ⭐⭐⭐ 必须实现 |
| `Sub-` | 模板子页面（弹窗、新增、详情等） | ⭐⭐ 按需实现 |
| `State-` | 交互态（手势/操作触发，**默认隐藏**） | ⭐⭐⭐ 必须实现但不在首屏渲染 |
| `Variant-` | 配色/天况变体（同模板不同主题色） | ⭐ 仅供参考，代码通过 color-engine 动态生成 |
| `Car-` | 车端宿主屏幕 | ⭐⭐ 车端实现 |
| `Asset-` | 背景图素材（预设可选图片） | 素材资源，非 UI 页面 |
| `Spec-` | 规格说明页（动效参数等） | 仅供参考 |

### 6.1 Card · 主页面（8 张）

首屏默认渲染的卡片。开发时以这些页面为基准还原。

| 页面名 | Node ID | 模板 | 说明 |
|--------|---------|------|------|
| Card-Weather | `tPVm8` | 天气 | 晴天默认态，mood 配色 |
| Card-Music | `qXG2n` | 音乐 | 播放中态，glass 视觉风格 |
| Card-Calendar | `7fKb6` | 日历 | 亮色主题，蓝色强调（默认） |
| Card-News | `OMxV7` | 新闻 | 暗色编辑风，hero + 3 条分类 |
| Card-Alarm | `Qb8jr` | 闹钟 | 暗色列表态，绿色强调（默认） |
| Card-Love | `UyUeC` | 恋爱纪念 | 照片 + glass panel，image-tint 配色 |
| Card-Baby | `3A9gr` | 宝宝成长 | 照片 + glass panel，暖琥珀色调 |
| Card-Holiday | `7EC5L` | 放假倒计时 | 照片 + glass panel，节日主题 |

### 6.2 Sub · 子页面（7 张）

模板内的操作页面，由用户主动触发进入。

| 页面名 | Node ID | 触发条件 | 说明 |
|--------|---------|----------|------|
| Sub-Weather-CityPicker | `gmj9b` | 点击城市名 | 城市搜索列表 |
| Sub-Music-EmptyState | `OLLkg` | 无播放内容时 | 音乐无内容兜底页 |
| Sub-Calendar-AddEvent | `6eWNV` | 点击 FAB「+」按钮 | 新增日程表单 |
| Sub-News-ArticleDetail | `D2HUa` | 点击新闻条目 | 全文阅读页 |
| Sub-Alarm-AddAlarm | `2Hly6` | 点击 FAB「+」按钮 | 新增闹钟时间选择器 |
| Sub-News-v2-List | `l5AB7` | — | 新闻 v2 图文并排列表（备选方案） |
| Sub-News-v2-Detail | `vwhtM` | 点击新闻条目 | 新闻 v2 图文混排详情（备选方案） |

### 6.3 State · 交互态（4 张）

⚠️ **关键约束**：这些页面展示的 UI 元素（如删除按钮）**默认隐藏，不在首屏渲染**。
仅在用户手势触发后动态显示。开发时切勿将交互态元素直接画在主页面上。

| 页面名 | Node ID | 触发手势 | 说明 |
|--------|---------|----------|------|
| State-Alarm-SwipeDelete | `Kysmf` | 闹钟行**左滑 ≥64px** | 行右侧露出红色删除按钮（128×行高） |
| State-Alarm-ClockMode | `ab3HZ` | 点击模式切换按钮 | 表盘视图 + 精简列表 |
| State-Alarm-ListMode | `qOPTb` | 点击模式切换按钮 | 列表视图 + list/clock 切换图标 |
| State-Calendar-SwipeDelete | `NYtT7` | 日程行**左滑 ≥64px** | 行右侧露出红色删除按钮（128×行高） |

### 6.4 Variant · 配色变体（12 张）

展示同一模板在不同主题色/天况下的视觉效果。代码中通过 `color-engine.js` 动态计算，无需逐个硬编码。

**天气天况变体**（mood 模式，由 weather API 返回值自动决定）：

| 页面名 | Node ID | 天况 | 背景主色 |
|--------|---------|------|----------|
| Variant-Weather-Cloudy | `1VE60` | 多云 | 灰蓝 mesh (#8B9DAF → #5A7088) |
| Variant-Weather-Rainy | `ixHgP` | 中雨 | 靛蓝 mesh (#3A4A6B → #1A2744) |

**日历强调色变体**（clean 模式，用户通过 color_picker 选择）：

| 页面名 | Node ID | 色名 | 强调色 |
|--------|---------|------|--------|
| Variant-Calendar-Graphite | `R5Hts` | 石墨灰 | #64748B |
| Variant-Calendar-Emerald | `K2BHp` | 翠绿 | #10B981 |
| Variant-Calendar-Amber | `Fw58N` | 琥珀 | #F59E0B |
| Variant-Calendar-Violet | `be0Zy` | 紫罗兰 | #8B5CF6 |
| Variant-Calendar-DarkGray | `9GK7n` | 深灰 | #334155 |

**闹钟强调色变体**（clean 模式，用户通过 color_picker 选择）：

| 页面名 | Node ID | 色名 | 强调色 |
|--------|---------|------|--------|
| Variant-Alarm-SkyBlue | `FLLJq` | 天空蓝 | #3B82F6 |
| Variant-Alarm-Amber | `xHMfe` | 琥珀橙 | #F59E0B |
| Variant-Alarm-Graphite | `BOLeE` | 石墨灰 | #64748B |
| Variant-Alarm-Lavender | `zkqLd` | 薰衣紫 | #8B5CF6 |
| Variant-Alarm-Silver | `gpN8h` | 银灰 | #94A3B8 |

### 6.5 Car · 车端屏幕（4 张）

| 页面名 | Node ID | 场景 |
|--------|---------|------|
| Car-ConfirmDialog | `gFa49` | 收到推送后的接收确认弹窗 |
| Car-CardRendered | `KXjUX` | 卡片在车端全屏渲染效果 |
| Car-CardSwitch | `0smUc` | 左右滑动切换卡片 |
| Car-EditMode | `ABEYf` | 长按进入编辑态（缩小 + 删除按钮） |

### 6.6 Spec · 规格说明（1 张）

| 页面名 | Node ID | 内容 |
|--------|---------|------|
| Spec-EasterEgg | `4Vqo5` | 纪念日三卡彩蛋粒子动效参数 |

### 6.7 Asset · 背景图素材（15 张）

纪念日三卡的预设背景图，每模板 5 张可选。

| 素材组 | Node IDs | 数量 |
|--------|----------|------|
| Asset-LoveBg-01~05 | `gERXB` `xYvZQ` `z4Kaa` `3bVv8` `GqQaM` | 5 |
| Asset-BabyBg-01~05 | `EPDJ7` `CjCc5` `5F4W9` `707Qk` `0ve2g` | 5 |
| Asset-HolidayBg-01~05 | `K6EgS` `JpO0P` `Lp170` `Ugkxh` `fSfQV` | 5 |

### 6.8 画布布局

```
y:520  ━━ Card · 主页面 ━━
y:600  [Weather] [Music] [Calendar] [News] [Alarm] [Love] [Baby] [Holiday]

y:2150 ━━ Sub · 子页面 ━━
y:2200 [CityPicker] [EmptyState] [AddEvent] [ArticleDetail] [AddAlarm] [v2-List] [v2-Detail]

y:3950 ━━ State · 交互态（⚠️默认隐藏）━━
y:4000 [Alarm-Swipe] [Alarm-Clock] [Alarm-List] [Calendar-Swipe] [EasterEgg]

y:5750 ━━ Variant · 配色变体 ━━
y:5800 [W-Cloudy] [W-Rainy] [C-Graphite] [C-Emerald] [C-Amber] [C-Violet] [C-DarkGray] [A-Blue] [A-Amber] [A-Graphite] [A-Lavender] [A-Silver]

y:7550 ━━ Car · 车端屏幕 ━━
y:7600 [ConfirmDialog] [CardRendered] [CardSwitch] [EditMode]

y:9350 ━━ Asset · 背景图素材 ━━
y:9400 [LoveBg×5] [BabyBg×5] [HolidayBg×5]
```

---

## 七、Claude Code 实现规则

1. **以本文件为唯一设计参考** — 不要凭想象添加设计稿中不存在的 UI 元素
2. **颜色精确到 hex+alpha** — 如 `#F5F5F060`，不可用近似 `rgba(255,255,255,0.4)`
3. **字号/字重严格对应** Token 表 — hero 160+300, 标题 42+600, 正文 28-36+400
4. **padding 64px 不可随意改小** — 这是全局卡片内边距
5. **修改 UI 前** 通过 Pencil MCP `batch_get(nodeId, readDepth=3)` 查询最新属性
6. **修改 UI 后** 通过 Pencil MCP `get_screenshot(nodeId)` 截图验证还原度
7. **交互态完整覆盖** — 不仅实现默认态，还需实现所有交互态（第三章）
8. **示例数据提醒** 放在卡片外部（预览页的独立提示条），不在卡片内显示

