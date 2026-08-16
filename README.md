# MOLT

**AI 时代身份过渡期叙事引擎。** 通过三条路径引导用户回答问题，生成结构化的 AI 镜像摘要与结果分析，并可公开建档展示在力导向地图上。

---

## 产品路径

| 路径 | 主题 | 说明 |
|------|------|------|
| A — 挣扎 | 压力诊断 | 识别当前职业压力来源与压力等级 |
| B — 挣脱 | 突围行动 | 提炼可迁移能力与市场机会 |
| C — 回望 | 轨迹建档 | 记录职业历程，生成可公开的建档节点 |

---

## 技术栈

- **前端：** React 18 + TypeScript + Vite
- **样式：** Tailwind CSS + 自定义 CSS token（Cyber-Minimalism 设计系统）
- **数据库：** Supabase（未配置时自动降级为 localStorage）
- **AI：** Claude API（通过 Vite proxy 转发，支持自定义 LLM 网关）
- **测试：** Vitest

---

## 本地启动

### 环境要求

- Node.js ≥ 20
- pnpm ≥ 9（推荐）或 npm ≥ 10

### 步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 VITE_LLM_API_KEY 等（见下方说明）

# 3. 启动开发服务器
npm start
# 或
pnpm dev
```

启动后访问 `http://localhost:5173`

---

## 环境变量

复制 `.env.example` 为 `.env`，按需填写：

| 变量 | 必填 | 说明 |
|------|------|------|
| `VITE_LLM_BASE_URL` | 是 | LLM 网关地址（Claude API 兼容） |
| `VITE_LLM_API_KEY` | 是 | API Key |
| `VITE_AI_MODEL` | 否 | 模型名称，默认 `claude-haiku-4-5-20251001` |
| `VITE_DEMO_MODE` | 否 | `true` 启用 Demo 模式 |
| `VITE_SUPABASE_URL` | 否 | Supabase 项目地址，不填则用 localStorage |
| `VITE_SUPABASE_ANON_KEY` | 否 | Supabase 匿名 Key |

> **不配置 Supabase** 也能完整运行，数据存在浏览器 localStorage 中。

---

## 项目结构

```
src/
├── pages/          # 页面：Landing / Onboarding / Conversation / Mirror / Result / Archive / Map
├── components/     # 通用组件（ForceGraph、ShareCard 等）
├── lib/
│   └── conversation/   # 对话状态机（conversationReducer）
├── services/ai/    # AI Provider（EdgeFunctionAIProvider）
├── db/             # 数据库抽象（Supabase + localStorage 双模式）
└── types/          # 全局类型定义
```

---

## 开发命令

```bash
npm start          # 启动开发服务器
npm test           # 运行单元测试（Vitest）
npm run typecheck  # TypeScript 类型检查
npm run lint       # 完整检查链路（typecheck + biome）
npm run build      # 构建生产产物
```

---

## 设计系统

视觉方向为 **Cyber-Minimalism（赛博极简）**，完整规范见 [`DESIGN.md`](./DESIGN.md)。

所有颜色通过 CSS token 引用（禁止硬编码 hex），核心色板：

- `--primary`：荧光绿 `#7CFF6B` — CTA、AI 确认
- `--accent-blue`：冰裂蓝 `#5BE7FF` — 系统状态、交互元素
- `--background`：深黑 `#0A0A0A`
