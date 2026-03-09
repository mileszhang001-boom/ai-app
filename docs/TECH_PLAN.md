# AI小组件 v0.1 Demo 技术规划文档

> 本文档记录项目的技术实现细节、开发进度、待解决问题。随开发过程持续更新。

---

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        手机端 (创建)                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  模板市场 → 参数配置 → AI生成 → 预览 → 同步    │    │
│  │  Vite 构建 | Vanilla JS | 无框架              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                           │ HTTPS                            │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                        云端服务                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  FastAPI (Python)                              │    │
│  │  ├─ AI生成: LLM API (Qwen3.5-Plus)         │    │
│  │  ├─ 渲染: 模板引擎 (参数注入)            │    │
│  │  ├─ 存储: 内存存储 (Demo)                  │    │
│  │  └─ 同步: 轮询推送 (Demo 降级)          │    │
│  └────────────────────────────────────────────────────┘    │
│                           │ 轮询/MQTT                   │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                        车端 (运行)                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Android App + WebView (Chromium)              │    │
│  │  ├─ JSBridge (白名单API)                    │    │
│  │  ├─ 组件管理: 下载/缓存                    │    │
│  │  └─ 卡片切换: ← → 手动切换               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、技术决策记录

| 决策项 | 选择 | 理由 | 状态 |
|---------|------|------|------|
| AI 生成方案 | L1 纯模板参数化 | AI只输出JSON，前端模板渲染，速度快质量稳 | ✅ 已确定 |
| 车端渲染 | H5 + WebView | 跨平台，轻量，复用Web技术栈 | ✅ 已确定 |
| 手机端 | H5 Web App | 最快交付速度，无需Native开发 | ✅ 已确定 |
| LLM 模型 | qwen-plus (阿里云通义千问) | 国内访问，速度快，中文质量高 | ✅ 已验证 |
| 模板引擎 | Vanilla JS | 最轻量，无框架依赖 | ✅ 已确定 |
| 设计规范 | Design Tokens | CSS变量，主题切换方便 | ✅ 已确定 |

---

## 三、Figma 设计规范导入

### 3.1 现有 Design Tokens

**文件位置**: `src/widget-templates/shared/tokens.css`

**已包含的规范**:
- 12种风格预设（渐变背景）
- 完整色彩体系（主色/文字色/功能色）
- 车载专用字号（hero: 72px）
- 间距系统（xs/sm/md/lg/xl）
- 安全约束（最小触控面积 88px）

### 3.2 从 Figma 导入的步骤

**方式一：使用 Figma Tokens 插件（推荐）**

```
1. 安装 Figma Tokens 插件
2. 在 Figma 中选中组件库的所有变量
3. 导出为 CSS 格式
4. 复制内容到 src/widget-templates/shared/tokens.css
5. 确保变量名与现有代码一致
```

**方式二：Style Dictionary 自动化**

```bash
npm install -g style-dictionary-cli

# 创建配置文件 style-dictionary.config.json
{
  "source": ["figma-tokens.json"],
  "platforms": {
    "css": {
      "transformGroup": {
        "attributes": "category",
        "baseAttributes": "theme"
      }
    }
  }
}

# 生成 CSS 文件
style-dictionary build
```

**方式三：手动映射（最快）**

1. 打开 Figma 组件库
2. 逐个复制关键值（颜色、字号、圆角）
3. 手动更新 tokens.css

---

## 四、AI 生成配置

### 4.1 模型选择

| 模型 | 用途 | 成本/1K tokens | 速度 | 中文质量 |
|-------|------|----------------|------|----------|
| gpt-4o-mini | 生产推荐 | $0.0015 | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| gpt-4o | 高质量选项 | $0.015 | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| claude-3-5-sonnet | 备选 | $0.003 | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| claude-3-haiku | 最低成本 | $0.00025 | ⚡⚡⚡ | ⭐⭐⭐ |

### 4.2 API 配置

**环境变量**:
```bash
# .env
OPENAI_API_KEY=sk-proj-xxx          # OpenAI 系列
ANTHROPIC_API_KEY=sk-ant-xxx      # Claude 系列

# 无 API Key 时自动使用 Mock 模式
```

**模型切换**:
```python
# src/server/ai_generator/generator.py
config = GenerateConfig(
    model="claude-3-5-sonnet"  # 在这里切换
)
```

### 4.3 Prompt 策略

**System Prompt 结构**:
- 角色定义
- 输出规则（只JSON，无markdown）
- 模板清单（4种组件×主题）
- 参数 schema 约束
- 文案生成风格指引

**User Prompt 动态构建**:
- 用户选择的组件类型+主题
- 用户已填参数
- 风格偏好（可选）
- 请求 AI 补全缺失字段

---

## 五、测试策略

### 5.1 测试金字塔

```
                  ┌──────────────────┐
                  │    E2E 测试    │  ← 完整用户流程
                  └──────────────────┘
                         │
           ┌───────────────────┼──────────────────┐
           │                   │                  │
    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
    │  视觉回归测试 │    │  单元测试      │    │  性能测试   │
    └─────────────┘    └──────────────┘    └─────────────┘
```

### 5.2 测试用例清单

#### AI 生成测试
- [ ] 恋爱纪念主题 × 5组参数，JSON 合法率 ≥ 99%
- [ ] 宝宝成长主题 × 5组参数，JSON 合法率 ≥ 99%
- [ ] 放假���计时主题 × 5组参数，JSON 合法率 ≥ 99%
- [ ] 新闻组件 × 5组参数，JSON 合法率 ≥ 99%
- [ ] 闹钟组件 × 5组参数，JSON 合法率 ≥ 99%

#### 视觉品质测试
- [ ] 暗色模式下所有组件×风格无错乱
- [ ] 亮色模式下所有组件×风格无错乱
- [ ] 超长标题正确截断（不破版）
- [ ] 动效流畅（60fps）
- [ ] 896×1464 尺寸准确

#### 性能测试
- [ ] AI 生成时间 ≤ 2s (P95)
- [ ] 模板渲染时间 ≤ 1s
- [ ] 总生成到预览 ≤ 5s
- [ ] H5 首屏渲染 ≤ 2s
- [ ] 内存占用 ≤ 50MB

#### 车端测试
- [ ] WebView 加载 H5 组件成功
- [ ] JSBridge 调用正常
- [ ] 连续运行8小时无崩溃
- [ ] 内存无泄漏

#### 同步链路测试
- [ ] 车机在线，同步 ≤ 5s
- [ ] 车机离线，提示正确
- [ ] 重新上线自动获取
- [ ] 网络波动重试有效

---

## 六、开发进度

### Phase 1: 项目架构 ✅ 已完成

| 任务 | 状态 | 完成时间 |
|------|------|----------|
| 创建目录结构 | ✅ | - |
| package.json | ✅ | - |
| .gitignore | ✅ | - |
| 基础配置文件 | ✅ | - |

### Phase 2: H5 组件模板 ✅ 已完成

| 任务 | 状态 | 完成时间 |
|------|------|----------|
| Design Tokens | ✅ | - |
| JSBridge 封装 | ✅ | - |
| 纪念日 - 恋爱主题 | ✅ | - |
| 纪念日 - 宝宝成长 | ✅ | - |
| 纪念日 - 放假倒计时 | ✅ | - |
| 每日新闻 | ✅ | - |
| 闹钟 | ✅ | - |
| 模板引擎 | ✅ | - |

### Phase 3: AI 生成 Pipeline ✅ 已完成 (Qwen API 已验证)

| 任务 | 状态 | 完成时间 |
|------|------|----------|
| prompt.py - System Prompt 管理 | ✅ | - |
| generator.py - LLM API 调用 (qwen-plus, OpenAI兼容模式) | ✅ | - |
| validator.py - JSON 校验 | ✅ | - |
| main.py - FastAPI 服务 | ✅ | - |
| requirements.txt | ✅ | - |

### Phase 4: 手机端 Web App ✅ 已完成

| 任务 | 状态 | 完成时间 |
|------|------|----------|
| index.html | ✅ | - |
| main.css | ✅ | - |
| main.js | ✅ | - |
| api.js | ✅ | - |
| router.js | ✅ | - |
| pages/market.js | ✅ | - |
| pages/config.js | ✅ | - |
| pages/preview.js | ✅ | - |
| pages/my-widgets.js | ✅ | - |
| pages/sync.js | ✅ | - |
| package.json + vite.config.js | ✅ | - |

### Phase 5: 跨端同步链路 ✅ 已完成

| 任务 | 状态 | 预计时间 |
|------|------|----------|
| sync_service/push.py | ✅ | - |
| sync_service/state.py | ✅ | - |
| storage/metadata.py | ✅ | - |
| storage/assets.py | ✅ | - |

### Phase 5: 跨端同步链路 ✅ 已完成

| 任务 | 状态 | 完成时间 |
|------|------|----------|
| sync_service/push.py | ✅ | 2026-03-06 |
| sync_service/state.py | ✅ | 2026-03-06 |
| storage/metadata.py | ✅ | 2026-03-06 |
| storage/assets.py | ✅ | 2026-03-06 |
| main.py - API 集成 | ✅ | 2026-03-06 |

## 新增文件

src/server/sync_service/
├── __init__.py              # 模块初始化 ✅
├── push.py                   # 推送通知服务 ✅
└── state.py                  # 同步状态管理 ✅

src/server/storage/
├── __init__.py              # 模块初始化 ✅
├── metadata.py               # 组件元数据存储 ✅
└── assets.py                 # H5产物存储 ✅



---

## 七、已创建文件清单

```
src/widget-templates/shared/
├── tokens.css                 # Design Tokens ✅
└── bridge.js                  # JSBridge 封装 ✅

src/widget-templates/anniversary/
├── love/
│   ├── index.html             ✅
│   ├── style.css              ✅
│   └── main.js               ✅
├── baby/
│   ├── index.html             ✅
│   ├── style.css              ✅
│   └── main.js               ✅
└── holiday/
    ├── index.html             ✅
    ├── style.css              ✅
    └── main.js               ✅

src/widget-templates/news/
├── index.html                 ✅
├── style.css                  ✅
└── main.js                   ✅

src/widget-templates/alarm/
├── index.html                 ✅
├── style.css                  ✅
└── main.js                   ✅

src/widget-templates/template-engine/
├── renderer.js               ✅
└── index.js                  ✅

src/server/
├── main.py                    ✅
├── requirements.txt           ✅
└── ai_generator/
    ├── prompt.py              ✅
    ├── generator.py           ✅
    └── validator.py          ✅

src/mobile-web/
├── package.json               ✅
├── vite.config.js            ✅
├── index.html                ✅
└── src/
    ├── styles/main.css        ✅
    ├── main.js               ✅
    ├── api.js               ✅
    ├── router.js             ✅
    └── pages/
        ├── market.js          ✅
        ├── config.js          ✅
        ├── preview.js          ✅
        ├── my-widgets.js      ✅
        └── sync.js            ✅
```

---

## 八、待解决问题

| 问题 | 优先级 | 负责人 | 状态 |
|------|---------|---------|------|
| 从 Figma 导入真实设计 Tokens | P0 | 设计师 | ⏳ |
| 配置真实的 LLM API Key | P0 | 后端 | ⏳ |
| 实现跨端同步服务 | P1 | 后端 | ⏳ |
| 开发车端 Android 宿主 | P2 | 车端 | ⏳ |

---

## 九、环境启动

### 云端服务

```bash
cd src/server

# 安装依赖
pip install -r requirements.txt

# 配置环境变量（可选）
export OPENAI_API_KEY="your-key-here"

# 启动服务
python main.py

# 或使用 uvicorn
uvicorn main:app --reload --port 8000
```

访问：http://localhost:8000
API 文档：http://localhost:8000/docs

### 手机端

```bash
cd src/mobile-web

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

访问：http://localhost:3000

---

## 十、验收标准（Demo 演示前）

### 必须通过项

- [ ] **AI 生成**：25组测试样本，JSON 合法率 ≥ 99%
- [ ] **生成速度**：点击生成→预览 ≤ 5s (P95)
- [ ] **视觉品质**：所有组件×风格在暗/亮色下无错乱
- [ ] **首屏渲染**：H5 组件 ≤ 2s
- [ ] **预览一致性**：手机端预览与车端一致
- [ ] **同步速度**：手机→车端 ≤ 5s（在线）
- [ ] **稳定性**：车端连续运行8小时无崩溃

### Demo 演示准备

- [ ] 准备 3-5 个预生成精品组件
- [ ] 准备演示脚本（3分钟流程）
- [ ] 准备不同场景的用户故事

---

## 十一、变更日志

| 日期 | 变更内容 | 负责人 |
|------|----------|---------|
| 2025-03-05 | 初始技术规划文档创建 | - |
