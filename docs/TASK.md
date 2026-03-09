cat << 'EOF'
# AI小组件开发任务清单

> 最后更新：2026-03-09

## 已完成 ✅

### 视觉系统（visual.md 符合）

#### Design Tokens 更新
- ✅ 重命名变量以对齐 visual.md 规范
- ✅ 添加缺失字号变量：`--size-category`, `--size-news-title`, `--size-news-meta`, `--size-header`
- ✅ 添加 `--font-hero-line-height: 0.9` 和 `--font-hero-*` 变量
- ✅ 统一间距命名为 `--gap-*`
- ✅ 主题色板完整（love/holiday/baby/warm/news/alarm/util）

#### 动效预设
- ✅ `entrance-fadeIn` - 卡片首次加载淡入
- ✅ `number-pulse` - 数字更新脉冲
- ✅ `slide-in-right/left` - 卡片左右切换
- ✅ 动画时长和缓动函数变量

#### 组件样式更新
- ✅ Love 组件使用新变量名和统一动画
- ✅ Baby 组件使用新变量名和统一动画
- ✅ Holiday 组件使用新变量名和统一动画
- ✅ Alarm 组件使用新变量名和统一动画
- ✅ News 组件使用新变量名和统一动画
- ✅ Warm 组件使用新变量名和统一动画

#### 功能完成
- ✅ 风格预设切换支持（每个组件 6-7 种风格）
- ✅ 数字白色渐变效果
- ✅ 背景光晕和氛围光线效果
- ✅ 主题色板系统（深色/浅色模式）

### Quality Gate（2026-03-09）
- ✅ template_id 白名单校验
- ✅ style_preset 白名单校验（按 component_type/theme 细粒度）
- ✅ 文案超长自动截断（title≤20, subtitle≤30, label≤15）
- ✅ 数值超范围自动 clamp（如 max_items 超过 8 → 8）
- ✅ warm 主题加入 TEMPLATES 和 validator schema
- ✅ 19 项单元测试全部通过

### 端到端联调（2026-03-09）
- ✅ 后端 API 全链路验证：generate → render → widgets → sync → news
- ✅ 非法 style_preset 正确拦截
- ✅ 同步状态从 pending → syncing → success 完整流转
- ✅ 新闻 RSS 源正常返回数据

### 车端基础实现（2026-03-09）
- ✅ 车端模拟器 H5 页面（simulator.html）
- ✅ 896×1464 屏幕模拟 + 响应式缩放
- ✅ 卡片切换器（← → 按钮 + 圆点指示器）
- ✅ 切换动画（左右滑动，300ms）
- ✅ 箭头 3 秒自动隐藏
- ✅ 单组件时隐藏导航控件
- ✅ WebView 容器封装（container.js）
- ✅ 组件管理器（manager.js）— 轮询同步
- ✅ JSBridge mock 实现（bridge.js）

## 开发服务器

### 运行状态
- ✅ 开发服务器运行在 `http://localhost:3000/`
- ✅ Vite 配置代理到后端（端口 8000）
- ✅ Widget 模板服务可用（`/widget-templates/*`）

## 待开发 📋

### P0 - 核心功能

#### 推送车端链路（手机 → 云端 → 车机）
- [x] 后端同步状态管理（sync_service/state.py）
- [x] 推送服务实现（sync_service/push.py）— Demo 用 simulate_push
- [x] 车端组件下载/缓存/管理（car-host/widget-manager/manager.js）
- [x] 车端卡片渲染（car-host/webview/container.js）
- [x] 车端 JSBridge 实现（car-host/jsbridge/bridge.js）
- [x] 车端卡片切换器（car-host/card-switcher/switcher.js）
- [x] 车端模拟器 H5 页面（car-host/simulator.html）
- [x] Quality Gate 实现（validator.py 完整校验规则）
  - [x] 文案长度校验 + 自动截断（title ≤ 20, subtitle ≤ 30）
  - [x] style_preset 白名单校验
  - [x] template_id 白名单校验
  - [ ] 对比度校验（WCAG AA）— P2

#### 浅色模式
- [ ] 浅色模式完整支持
- [ ] 深浅色切换功能（用户设置）
- [ ] 浅色模式下的主题色板

### P1 - 增强
- [ ] 卡片切换动画（slide-transition）
- [ ] 数字更新脉冲动画触发
- [ ] 布局模板系统化（BottomAligned/Centered/ListLayout）
- [ ] 原子组件库扩展（CardBorder, TagBadge 等）

### P2 - 品质监控
- [ ] 品质监控面板
- [ ] 每周品质报告生成
- [ ] 用户行为数据收集
- [ ] 生成成功率统计

## 待测试/验收 🧪

### 设计系统验收
- [ ] Design Tokens 变量值正确
- [ ] 动效流畅无卡顿
- [ ] 主题色板明显且有场景特征
- [ ] 字号对比度符合要求（数字:副标题 ≥ 6:1）
- [ ] 间距符合呼吸感要求

### 组件验收
- [ ] Love 组件各风格切换正常
- [ ] Baby 组件各风格切换正常
- [ ] Holiday 组件各风格切换正常
- [ ] Alarm 组件各风格切换正常
- [ ] News 组件各风格切换正常
- [ ] Warm 组件各风格切换正常

### 功能验收
- [ ] 组件正确加载（HTML/CSS/JS）
- [ ] 数据正确注入到组件
- [ ] API 调用成功返回正确 JSON
- [ ] 预览页面正确显示组件
- [ ] **推送车端链路完整**（手机 → 云端 → 车机）

## 技术债务 🔧

### 已知问题
- ❌ Quality Gate 尚未实现，缺乏 AI 输出校验
- ❌ 浅色模式支持不完整
- ❌ 动效未完整应用到卡片切换

### 设计系统待完善
- ⚠️ 布局模板尚未系统化
- ⚠️ 原子组件库扩展有限
- ⚠️ 品质监控系统未建立

---

## 设计规范参考

遵循文档：`docs/visual.md`

### 核心原则
> AI 的自由度沿"内容轴"扩展，永远不沿"样式轴"扩展

### 三层架构
```
设计系统层（锁死）→ AI 决策层（受限选择）→ 品质守门层（校验）
```

### Design Tokens 核心变量
```css
/* 字体 */
--font-hero-family: 'DIN Alternate', 'SF Pro Display', 'Helvetica Neue', system-ui;
--font-hero-weight: 300;
--font-hero-letter-spacing: -3px;
--font-hero-line-height: 0.9;

--font-en-family: 'SF Pro Display', 'Helvetica Neue', system-ui;
--font-cn-family: 'SF Pro Text', 'Noto Sans SC', system-ui;

/* 字号 */
--size-hero-lg: 104px;   /* 居中布局 */
--size-hero-md: 88px;    /* 底部对齐 */
--size-hero-sm: 80px;    /* 闹钟 */
--size-category: 11px;   /* 顶部英文类别 */
--size-unit: 11px;
--size-subtitle: 15px;
--size-caption: 12px;
--size-news-title: 14px;
--size-news-meta: 11px;
--size-header: 14px;

/* 间距 */
--card-padding-v: 32px;
--card-padding-h: 28px;
--card-radius: 20px;
--gap-hero-to-unit: 6px;
--gap-unit-to-divider: 28px;
--gap-divider-to-subtitle: 14px;
--gap-subtitle-caption: 5px;
--gap-category-to-hero: 20px;
--gap-unit-hero: 4px;
--gap-hero-divider: 32px;
--divider-width: 24px;
--divider-width-centered: 20px;
--ambient-line-width-half: 50%;
```

### 主题色板
- Love（玫瑰）：`--love-bg-dark`, `--love-glow`, `--love-ambient`
- Holiday（翠绿）：`--holiday-bg-dark`, `--holiday-glow`, `--holiday-ambient`
- Baby（靛蓝）：`--baby-bg-dark`, `--baby-glow`, `--baby-ambient`
- Warm（琥珀）：`--warm-bg-dark`, `--warm-glow`, `--warm-ambient`
- News（科技蓝）：`--news-bg-dark`, `--news-glow`, `--news-ambient`
- Alarm（小米橙）：`--alarm-bg-dark`, `--alarm-glow`, `--alarm-ambient`

### 动效预设
```css
@keyframes entrance-fadeIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
--anim-entrance-duration: 0.6s;
--anim-entrance-easing: ease-out;

@keyframes number-pulse {
  0% { transform: scale(0.96); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
--anim-pulse-duration: 0.4s;
--anim-pulse-easing: cubic-bezier(0.34, 1.56, 0.64, 1);

@keyframes slide-in-right {
  0% { opacity: 0; transform: translateX(30px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-left {
  0% { opacity: 0; transform: translateX(-30px); }
  100% { opacity: 1; transform: translateX(0); }
}
--anim-slide-duration: 0.3s;
--anim-slide-easing: ease-out;
```
'TASK_NEW'
