# AI小组件 · 视觉系统 — Liquid Glass

> 最后更新：2026-03-21

---

## 一、设计语言：Liquid Glass

### 命名由来

对标 Apple CarPlay iOS 26 的 Liquid Glass 设计语言，结合 Glassmorphism 趋势，为车载暗色环境定制。

### 核心视觉特征

| 特征 | 实现 | 设计意图 |
|------|------|---------|
| 毛玻璃卡片 | `backdrop-filter: blur(20px) saturate(1.8)` | 层次深度，信息区与背景分离 |
| 折射边框 | `rgba(255,255,255, 0.08)` 边框 + 内发光 | 模拟玻璃边缘光 |
| 呼吸光晕 | 三层径向渐变，主光晕 4s 呼吸动画 | 空间氛围感，避免静态死板 |
| 粒子系统 | Canvas 2D，15-25 粒子/帧，主题色 | 情感化表达（心形/星星/彩纸/萤火虫/天气） |
| 数字翻牌 | 3D `rotateX` 翻转 + easeOut | 数据变化的仪式感 |
| 高光扫过 | 60px 光带，3s 周期 | 暗示玻璃材质的光线折射 |
| 深度阴影 | 三层 box-shadow (2px/8px/24px) | 真实深度感 |
| 氛围光线 | 底部 2px 渐变线，50% 宽度 | 底部锚定，空间感 |

### 色彩体系

6 套主题色，每套包含完整的深色/浅色模式变量：

| 主题 | 主色 | 用途 |
|------|------|------|
| 玫瑰 (love) | `rgba(200, 120, 180)` | 恋爱纪念 |
| 翠绿 (holiday) | `rgba(80, 200, 120)` | 放假倒计时 |
| 靛蓝 (baby) | `rgba(120, 160, 255)` | 宝宝成长 |
| 琥珀 (warm) | `rgba(255, 140, 60)` | 暖橙纪念 |
| 科技蓝 (news) | `rgba(100, 150, 220)` | 新闻 |
| 小米橙 (alarm) | `rgba(255, 106, 0)` | 闹钟 |

新增模板的独立配色：
- 天气: clear-blue / twilight / warm-sun
- 音乐: dark-vinyl / neon-purple / minimal-light
- 日历: business-gray / nature-green / elegant-white

---

## 二、架构原则：AI 不碰样式

```
品质保障策略：

  设计系统层 (人工打磨，锁死)
    ↓ 提供 Design Tokens + 模板 + 粒子 + 动画
  AI 决策层 (受控选择)
    ↓ 从枚举中选模板/风格，自由创作文案
  渲染层 (模板引擎)
    ↓ 参数注入，原样渲染
```

| AI 可以做的 | AI 不能做的 |
|-------------|-------------|
| 选择模板类型 | 修改 CSS |
| 选择风格预设 | 自定义颜色 |
| 生成文案（标题/副标题） | 调整字号/间距 |
| 选择日期/时间 | 修改布局结构 |
| 匹配情感关键词→风格 | 生成任何代码 |

---

## 三、Design Tokens 索引

文件：`src/widget-templates/shared/tokens.css`（580+ 行）

### 字号层级

| Token | 值 | 用途 |
|-------|-----|------|
| `--size-hero-lg` | 104px | 居中大数字（倒计时） |
| `--size-hero-md` | 88px | 底对齐数字（恋爱/宝宝） |
| `--size-hero-sm` | 80px | 时间显示（闹钟） |
| `--size-subtitle` | 15px | 中文副标题 |
| `--size-category` | 11px | 英文类别标注 |
| `--size-caption` | 12px | 辅助信息 |

### 字体

| Token | 值 | 用途 |
|-------|-----|------|
| `--font-hero-family` | DIN Alternate, Bebas Neue | 核心数字 |
| `--font-cn-family` | SF Pro Text, Noto Sans SC | 中文内容 |
| `--font-en-family` | SF Pro Display, Helvetica Neue | 英文标注 |

### Glassmorphism

| Token | 值 |
|-------|-----|
| `--glass-blur` | `blur(20px)` |
| `--glass-blur-heavy` | `blur(40px)` |
| `--glass-saturate` | `saturate(1.8)` |
| `--glass-bg` | `rgba(255, 255, 255, 0.03)` |
| `--glass-border` | `1px solid rgba(255, 255, 255, 0.08)` |
| `--glass-inner-glow` | `inset 0 1px 0 rgba(255, 255, 255, 0.06)` |

### 动画

| 动画 | 时长 | 用途 |
|------|------|------|
| `entrance-fadeIn` | 0.6s | 卡片首次加载 |
| `breathing-glow` | 4s | 光晕脉动 |
| `digit-flip-in/out` | 0.3s | 数字翻牌 |
| `stagger-fadeIn` | 0.5s + delay | 列表项依次出现 |
| `light-sweep` | 3s | 高光扫过 |
| `float-drift` | 8s | 粒子漂浮 |
| `progress-ring-draw` | 1s | 进度环绘制 |

---

## 四、粒子系统规范

每个模板有独立的粒子主题，通过 Canvas 2D 实现：

| 模板 | 粒子类型 | 方向 | 数量 | 特殊效果 |
|------|---------|------|------|---------|
| love | 心形 (30%) + 圆形 | 上升 | ~20 | 心形路径公式 |
| baby | 五角星 (35%) + 圆形 | 上升 | ~20 | 星星旋转 |
| holiday | 彩纸条/钻石/闪光点 | 下落 | ~20 | 多色彩纸旋转 |
| warm | 萤火虫光晕 | 全向漂浮 | ~15 | 径向渐变光晕 + 呼吸闪烁 |
| weather | 雨滴/雪花/光点/云团 | 取决于天气 | 8-60 | 天气类型自适应 |

### 粒子性能约束

- 最大粒子数：60（雨天）
- 帧率目标：30fps+
- 全部使用 `requestAnimationFrame`
- 响应 `resize` 事件
- `pointer-events: none` 避免交互干扰

---

## 五、WebView 兼容策略

每个模板都包含三级降级：

```css
/* 1. backdrop-filter 不支持 → 不透明背景 */
@supports not ((-webkit-backdrop-filter: blur(20px)) or (backdrop-filter: blur(20px))) {
  .glass-card { background: rgba(30, 20, 35, 0.85); }
}

/* 2. background-clip: text 不支持 → 纯白文字 */
@supports not (-webkit-background-clip: text) {
  .hero-number { color: #ffffff; }
}

/* 3. filter: blur 不支持 → 降低透明度 */
@supports not (filter: blur(50px)) {
  .glow-primary { opacity: 0.5; }
}
```

---

## 六、风格预设映射

AI 根据情感关键词推荐风格：

| 情感 | 推荐风格 | 适用模板 |
|------|---------|---------|
| 甜蜜/恋爱 | sweet-pink | anniversary |
| 活力/假期 | vibrant-orange | anniversary, alarm |
| 柔和/宝宝 | soft-purple | anniversary |
| 极简/科技 | minimal-dark | anniversary, alarm |
| 清新/海洋 | ocean-blue | anniversary, alarm |
| 温暖/阳光 | warm-yellow | anniversary |
| 自然/绿色 | forest-green | anniversary, alarm |
| 霓虹/数码 | digital-neon | alarm |
| 晴朗 | clear-blue | weather |
| 暮色 | twilight | weather |
| 暖阳 | warm-sun | weather |
| 唱片/经典 | dark-vinyl | music |
| 霓虹/潮流 | neon-purple | music |
| 商务 | business-gray | calendar |
| 自然 | nature-green | calendar |
| 素雅 | elegant-white | calendar |
