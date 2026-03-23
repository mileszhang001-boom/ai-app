# AI 小组件 v2.0 迭代路线图

> 生成时间：2026-03-23 | 基于用户反馈 37 项 + 代码审计

## 核心判断

v1.0 跑通了"AI 生成 → 预览 → 推送"的完整流程，但在 **数据真实性、交互完整性、设计精度** 三个维度还不到产品级。v2.0 的目标是从"能看"升级到"能用"。

## Sprint 规划（4 个 Sprint）

| Sprint | 主题 | 问题数 | 依赖关系 |
|--------|------|--------|----------|
| **S1** | 基础架构 | 4 | 无，最高优先级 |
| **S2** | 数据与核心功能 | 12 | 依赖 S1 的 ID 体系和数据分层 |
| **S3** | 交互打磨 | 10 | 依赖 S2 的数据可用 |
| **S4** | 设计对齐 | 11 | 依赖 S2/S3 功能稳定后统一刷新 |

---

## Sprint 1：基础架构（阻塞级）

### S1-1：手势交互体系定义

**问题**：缺少 high-level 手势规范，各卡片交互设计各自为政。
**方案**：定义 6 种手势语义，输出 `docs/GESTURE_SPEC.md` 作为后续功能设计参考。

| 手势 | 语义 | 场景 |
|------|------|------|
| 点击 | 主操作 / 进入详情 | 卡片进入"显示态"、按钮触发、新闻展开 |
| 左右滑 | 切换内容 | 车端卡片切换、新闻流翻页 |
| 上下滑 | 滚动内容 | 新闻流滚动、日程列表滚动 |
| 长按 | 进入编辑态 / 删除 | 车端进入编辑态、闹钟/日程删除 |
| 长按拖动 | 排序 | 车端卡片排序 |
| 双指缩放 | 无（车载不适用） | — |

**参考规范**：Apple HIG (iOS 17 Gestures), Google Material Design 3 (Gestures), Android Automotive Design Guidelines

**交付物**：`docs/GESTURE_SPEC.md`
**工作量**：S（文档定义，不涉及编码）

---

### S1-2：卡片唯一标识体系

**问题**：同一张卡片可被重复推送到车机。
**根因**：
- `MetadataStore.create()` 每次生成新 `widget_id`（`widget_{12hex}`）
- 但推送时 `_device_states[device_id][widget_id] = sync_id` 覆盖旧记录
- 前端 `preview.js` 每次推送都调用 `api.saveWidget()` 创建新 widget，即使是同一张卡片
- `car-simulator.html` 的 `knownWidgetIds` Set 只在运行时去重，刷新后重置

**方案**：

1. **Widget 内容指纹**：`widget_id = hash(component_type + theme + JSON.stringify(params))`
   - 相同参数 = 相同 ID = 推送时覆盖而非新增
2. **车端持久化已接收列表**：`localStorage` 存储 `accepted_widget_ids`
3. **推送冲突检测**：
   - 如果 widget_id 已存在于车端 → 提示"更新已有卡片"而非"接收新卡片"
   - 如果同类型卡片已存在 → 提示"替换现有的 X 卡片？"
4. **服务端去重**：`POST /api/sync` 检查 device 已有同 widget_id → 返回 `action: "update"` 而非 `"create"`

**涉及文件**：
- `src/server/storage/metadata.py` — widget_id 生成逻辑
- `src/server/sync_service/state.py` — 推送状态管理
- `src/server/main.py` — /api/sync 端点
- `src/mobile-web/src/pages/preview.js` — 推送流程
- `src/mobile-web/public/car-simulator.html` — 接收逻辑

**工作量**：M

---

### S1-3：手机端 / 车端数据分层

**问题**：手机端和车端共用同一套数据逻辑，互相影响。手机端天气显示 mock 26°C，用户以为是真实数据。
**根因**：
- 天气模板 `weather/index.html` 有 `mockWeather` 对象，也有 `/api/weather` fetch
- 但 mock 模式和真实模式切换逻辑不清晰（API key 缺失时 silent fallback to mock）
- 日程 `calendar/index.html` 完全基于 `localStorage`，无真实日历数据
- 闹钟同上

**方案**：

| 卡片 | 手机端（预览/编辑） | 车端（运行） |
|------|---------------------|-------------|
| 天气 | Mock 精品数据（多种天气类型可选），标注"示例数据" | 真实 API 数据（和风天气） |
| 新闻 | Mock 精品新闻（固定高质量样本），标注"示例内容" | 真实 RSS + AI 摘要 |
| 日程 | Mock 示例日程，标注"推送后显示真实日程" | 车端系统日历 API（JSBridge） |
| 闹钟 | Mock 示例闹钟 | 车端系统闹钟 API（JSBridge） |
| 音乐 | Mock 播放状态（固定封面+曲目） | 真实 MediaSession |
| 纪念日 | 用户输入数据（手机端即真实数据） | 同手机端参数 |

**实现**：
1. 模板统一增加 `data-mode="preview|live"` 属性
2. `preview` 模式：使用内置精品 mock 数据 + 显示"示例数据"角标
3. `live` 模式：调用真实 API / JSBridge
4. 手机端 `render-widget.js` 注入 `mode=preview`
5. 车端 `car-simulator.html` 注入 `mode=live`

**涉及文件**：
- 所有 widget-templates 的 `index.html`（增加模式判断）
- `src/mobile-web/src/utils/render-widget.js`（注入 preview 模式）
- `src/mobile-web/public/car-simulator.html`（注入 live 模式）
- `src/server/main.py`（天气/新闻端点增加 mock 参数）

**工作量**：L

---

### S1-4：车端"编辑态"

**问题**：车端收到卡片过多会堆积，无法删除、排序、切换。
**根因**：`car-simulator.html` 目前只有"显示态"（轮播 + 左右滑切换），无编辑能力。

**方案**：

双态设计：
- **显示态**（默认）：全屏卡片 + 左右滑切换 + 点击进入卡片交互（现有功能）
- **编辑态**（长按触发）：卡片缩小到 80% + 底部操作栏

编辑态功能：
1. **删除卡片**：卡片右上角显示 ✕ 按钮，点击确认删除
2. **调换顺序**：长按拖动卡片左右移动
3. **左右滑动**：缩略图级别快速翻阅
4. **退出编辑**：点击卡片区域回到"显示态"

手势映射（参考 S1-1 手势体系）：
- 显示态 → 长按 → 编辑态
- 编辑态 → 点击卡片 → 显示态
- 编辑态 → 长按拖动 → 排序
- 编辑态 → 点击 ✕ → 删除

**涉及文件**：
- `src/mobile-web/public/car-simulator.html`（重构，约 +300 行）

**工作量**：L

---

## Sprint 2：数据与核心功能

### S2-1：天气 — 城市搜索 + 动态数据 (C1, C2)

**问题**：搜索"张家口"无法生效；切换城市后天气不变。
**根因**：
- `weather/index.html` 的 `CITIES` 数组只有 6 个城市（北京/上海/广州/深圳/杭州/成都）
- 选择城市后调用 `/api/weather?city=X`，但 API 未配置 key 时 silent fallback 到 mock（所有城市返回 temp=26）
- mock 数据 `service.py:164-182` 所有城市返回相同温度

**方案**：
1. 前端城市搜索改为调用 `/api/weather/city-search?q=张家口`
2. 后端新增端点，调用和风天气 GeoAPI `lookup_city()` 返回匹配城市列表
3. Mock 模式下：内置 50+ 城市的 mock 天气数据（不同城市不同温度）
4. API 失败时明确返回 `{ error: "API未配置", mock: true }` 前端显示提示

**涉及文件**：
- `src/widget-templates/weather/index.html` — 城市搜索重构
- `src/server/weather_service/service.py` — mock 数据丰富化
- `src/server/main.py` — 新增 /api/weather/city-search

**工作量**：M

---

### S2-2：音乐 — MediaSession 真实对接 (C9, C10)

**问题**：无法获取正在播放的内容，也不能控制播放；车端/手机端颜色不同。
**根因**：
- `bridge.js` 有完整 MediaSession API（`getMediaSession`, `mediaControl`, `onMediaSessionChange`）
- 但 `isCarEnvironment()` 检测 `window.XiaomiCar` 等标志，模拟器中不存在
- Mock 模式始终激活，返回固定的模拟数据
- 颜色问题：`music/index.html` 颜色优先取 `primary_color` 参数，其次取封面取色；但 sync 时参数可能未完整传递

**方案**：
1. 车端模拟器设置 `window.__CAR_WIDGET__ = true`（bridge.js 已支持此标志）
2. 模拟器实现 `window.miCarBridge.getMediaSession()` 返回真实或高仿数据
3. 推送时确保 `primary_color` 包含在 sync 数据中
4. 手机端预览模式：使用精品 mock（固定封面+曲目+颜色），标注"示例"

**涉及文件**：
- `src/mobile-web/public/car-simulator.html` — 注入车端标志 + 模拟 Bridge
- `src/widget-templates/music/index.html` — 颜色参数读取修复
- `src/widget-templates/shared/bridge.js` — 确认环境检测逻辑

**工作量**：M

---

### S2-3：新闻 — 内容质量 + 图片 + 刷新 + 滚动 (C24, C25, C26)

**问题**：内容太短没有价值；不支持图片显示；不支持刷新；无头图时显示差。
**根因**：
- 服务端 RSS fetcher 未解析 `<enclosure>` 和 `<media:content>` 标签中的图片
- AI 摘要长度由 LLM 自行决定（temperature=0.7），通常 1-3 句
- 前端 `news/index.html` 固定 4 条新闻，无刷新按钮，无滚动
- 有 hero 卡 + 3 条列表，但无图时用 emoji 占位，效果差

**方案**：
1. **RSS 图片提取**：解析 `<enclosure>`, `<media:content>`, `<img>` in description
2. **AI 摘要增强**：System Prompt 要求 150-300 字 + 提取关键观点
3. **有图/无图双容器**：
   - 有图：图文并排（左图右文）或大图+标题
   - 无图：纯文字卡片，增大标题字号+显示摘要前 2 行
4. **新闻流 + 滚动**：改为纵向新闻流，支持上下滑动浏览（≥8 条）
5. **下拉刷新**：顶部下拉触发 `POST /api/news/refresh` + 重新加载

**涉及文件**：
- `src/server/news_service/` — RSS 图片提取 + 摘要 Prompt 增强
- `src/widget-templates/news/index.html` — 重构为滚动新闻流 + 双容器
- `src/server/main.py` — 确认 refresh 端点

**工作量**：L

---

### S2-4：日程 — 颜色选择 + 完成功能 (C5, C6)

**问题**：新建日程弹窗颜色无法选中；不支持完成功能。
**根因**：
- `calendar/index.html` 新建事件 overlay 中颜色选择器的点击事件可能未正确绑定（需确认 DOM 结构）
- `WidgetStorage` 支持 `update(id, patch)` 但无 `completed` 字段

**方案**：
1. 修复颜色选择器绑定（检查 overlay 创建时机 vs 事件绑定时机）
2. 事件 schema 增加 `completed: boolean` 字段
3. 事件行增加 ✅ 按钮，点击标记完成
4. 完成的事件灰色+删除线显示，或直接从列表移除（可配置）

**涉及文件**：
- `src/widget-templates/calendar/index.html`

**工作量**：S

---

### S2-5：微调反馈机制 (B3, C3)

**问题**：微调指令不生效也不报错（如"不想显示多日天气"）。
**根因**：
- `generator.py` 把微调指令作为 LLM prompt 的一部分，但不验证 LLM 是否执行
- `validator.py` 只做白名单+截断，不检查用户意图是否被满足
- 前端无反馈机制告知用户"这个修改不支持"

**方案**：
1. **LLM 输出增加 `changes_applied` 字段**：列出实际执行的修改
2. **Diff 检测**：对比 base_data 和 new_data，如果无变化 → 返回提示"未能理解您的修改意图"
3. **前端展示**：微调结果页显示"已修改：配色、布局"或"无法理解：'不想显示多日天气'"
4. **不支持的修改**：维护模板级 supported_modifications 列表，提前拦截

**涉及文件**：
- `src/server/ai_generator/generator.py` — 输出结构增强
- `src/server/ai_generator/validator.py` — diff 检测
- `src/mobile-web/src/pages/preview.js` — 显示修改反馈

**工作量**：M

---

### S2-6：颜色参数推送一致性 (B4, C4, C10)

**问题**：天气微调成黄色推到车端变蓝色；音乐车端紫色手机端黄色。
**根因**：
- `preview.js` 推送时调用 `api.saveWidget()` → `api.syncToCar()`
- widget 参数含 `primary_color`，但 `car-simulator.html` 接收后可能未正确注入
- 车端 `renderWidget()` 从 `/api/widgets/{id}` 获取参数，但 `__WIDGET_PARAMS__` 注入时可能丢失 color 字段

**方案**：
1. **完整参数审计**：在 sync 链路每个环节 log 参数，定位丢失点
2. **车端渲染确认**：确保 `__WIDGET_PARAMS__` 包含 `primary_color`、`style_preset`
3. **模板验证**：确保每个模板在 `initWidget()` 时读取并应用 `primary_color`

**涉及文件**：
- `src/mobile-web/src/pages/preview.js` — 推送参数完整性
- `src/mobile-web/public/car-simulator.html` — 参数注入验证
- 所有 widget-templates — 颜色参数读取一致性

**工作量**：M

---

## Sprint 3：交互打磨

### S3-1：纪念日 — 图片修复 + 彩蛋优化 + 上传压缩 (C13, C14, C15)

**问题**：
- 午后咖啡/樱花小径图片弄混
- 彩蛋太大太固定
- 自定义上传出现空图片

**根因**：
- C13：`love/backgrounds/` 目录下文件名与 config-panel 的 bg.id 映射不一致
- C14：`easter-egg.js` 粒子数 15-25，canvas 全屏 896×1464，效果偏"爆炸"而非"微动效"
- C15：`config-panel.js` 的 `FileReader` 读取后 resize 到 max 800px/JPEG 0.7，但 DataURL 可能仍然很大（>500KB），iframe srcdoc 有长度限制

**方案**：
1. **修复图片映射**：核对 bg.id 与实际文件名
2. **彩蛋微动效化**：
   - 粒子数降到 5-8
   - 尺寸缩小 50%
   - 从点击位置辐射而非全屏随机
   - 增加渐隐（opacity 在生命周期最后 60% 线性衰减）
   - 根据场景差异化：恋爱=小爱心漂浮、放假=彩带飘散、宝宝=小鸭子/积木弹跳
3. **图片压缩 + 错误处理**：
   - max 600px（降低）+ JPEG 0.5
   - 如果 DataURL > 200KB → 进一步压缩或提示"图片过大"
   - 加载失败时显示 placeholder 而非空白

**涉及文件**：
- `src/widget-templates/anniversary/love/backgrounds/` — 图片文件核对
- `src/widget-templates/shared/easter-egg.js` — 微动效重构
- `src/mobile-web/src/components/config-panel.js` — 压缩策略升级

**工作量**：M

---

### S3-2：闹钟大改 — 简化分类 + 删除 + 时钟模式重做 (C19-C23)

**问题**：分类无意义；不支持删除（实际长按可删但不可发现）；时钟模式基本不可用。
**根因**：
- 4 个分类（作息/工作/其他/自定义）增加了操作复杂度但无实际价值
- 长按删除存在但没有视觉暗示（无 swipe-to-delete 或删除图标）
- 时钟模式只有 SVG 表盘 + 数字时间 + 下一闹钟倒计时，无法操作单个闹钟
- 列表/时钟切换按钮是"三点"图标，不直观

**方案**：
1. **去掉分类**：闹钟列表按时间排序，不再分组
2. **显式删除**：左滑显示删除按钮（参考 iOS 风格）
3. **时钟模式重做**：
   - 表盘上标注闹钟时间点（弧线标记）
   - 下方闹钟列表（精简版，含开关 toggle）
   - 支持点击闹钟行 → 展开编辑/删除
4. **切换按钮重设计**：列表图标 ↔ 时钟图标（两个明确的 icon toggle）
5. **功能对齐**：时钟模式 = 列表模式的所有功能 + 表盘可视化

**涉及文件**：
- `src/widget-templates/alarm/index.html` — 大幅重构

**工作量**：L

---

### S3-3：日程 — 添加按钮优化 (C8)

**问题**：FAB 添加按钮太小，可见性差。
**方案**：FAB 尺寸从当前值增大到 min 76×76dp（HMI 标准），增加阴影/光晕突出显示。

**涉及文件**：`src/widget-templates/calendar/index.html`
**工作量**：XS

---

## Sprint 4：设计对齐

### S4-1：纪念日三卡对齐 + 名字显示 + 图标优化 (C16, C17, C18, B5)

**问题**：三张纪念日卡片对齐不一致；名字未体现；❤️/✈️ 图标太小。
**根因**：
- 三个模板（love/baby/holiday）独立开发，glass-panel 结构不完全一致
- `subtitle` 字段用于 milestone 文案，用户名字无独立显示位
- emoji 图标作为内联文本，受 font-size 限制

**方案**：
1. **统一布局结构**：三张卡共享同一 glass-panel 模板（顶部标签 → 图标+名字行 → 大数字 → 副标题）
2. **名字显示**：新增独立的名字行，如"小明 & 小红 的恋爱纪念"
3. **图标优化**：改用 SVG icon（≥48dp），与文字同行而非单独一行
4. **同步 Pencil 设计**：确保三张卡在 Pencil 中的布局完全一致

**涉及文件**：
- `src/widget-templates/anniversary/love/index.html`
- `src/widget-templates/anniversary/baby/index.html`
- `src/widget-templates/anniversary/holiday/index.html`
- Pencil `card.pen` — 更新设计稿

**工作量**：M

---

### S4-2：日程/音乐使用 Pencil 最新设计 (B1, C7, C11)

**问题**：未使用 Pencil 中最新的 UI 框架显示。
**方案**：从 Pencil 设计稿导出最新设计 token，更新模板 CSS。使用 pencil-design-system v2 的 Code Linkage 功能做 Design-Code Verification。

**涉及文件**：
- `src/widget-templates/calendar/index.html`
- `src/widget-templates/music/index.html`
- Pencil `card.pen`

**工作量**：M

---

### S4-3：全局 Icon 系统 — Emoji → SVG (B2, C12)

**问题**：按钮使用文字 emoji（▶ ⏸ ⏮ ⏭ ❤️ ✈️ ⭐）而非原生 icon。
**方案**：
1. 创建 `shared/icons/` 目录，放置 SVG icon 文件
2. 统一 icon 组件：`<svg class="icon icon-play">` + CSS sizing
3. 所有模板替换 emoji → SVG 引用
4. Icon 尺寸标准：操作按钮 ≥48dp，装饰图标 ≥32dp

**涉及文件**：
- `src/widget-templates/shared/icons/` — 新增
- 所有使用 emoji 按钮的模板

**工作量**：M

---

## 依赖关系图

```
S1-1 手势定义 ──────────────────────────────┐
S1-2 卡片ID ──→ S2-6 颜色推送一致性          │
S1-3 数据分层 ─→ S2-1 天气动态数据           │
               ─→ S2-2 音乐MediaSession       ├→ S4 设计对齐
               ─→ S2-3 新闻内容增强           │
S1-4 车端编辑态                               │
                                              │
S2-4 日程修复 ─→ S3-3 添加按钮优化 ──────────┘
S2-5 微调反馈
S3-1 纪念日修复 ─→ S4-1 纪念日设计对齐
S3-2 闹钟大改 ──→ S4-2 使用最新设计
```

## 文档更新计划

| 文档 | 更新内容 |
|------|----------|
| `CLAUDE.md` | 版本升至 v2.0，更新项目结构、新增模块说明 |
| `docs/SPEC.md` | 新增手势规范、编辑态、数据分层策略 |
| `docs/TECH_PLAN.md` | 更新 Sprint 进度跟踪 |
| `docs/GESTURE_SPEC.md` | 新增：完整手势交互规范 |
| `docs/iterations/v2.0-roadmap.md` | 本文件 |
