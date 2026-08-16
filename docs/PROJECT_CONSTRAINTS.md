# MOLT 工程规范与约束

## 1. 文档目的

本文档定义 MOLT 项目的工程规范、架构约束、AI 使用规则、安全边界与代码质量要求。

这些内容是项目级约束，不是建议。除非有明确的架构决策记录，否则不应偏离。本规范随项目迭代持续更新，当前基线版本面向 Hackathon MVP 交付阶段（`2026-03-20`）。

---

## 2. 项目定位约束

- MOLT 的定位是**面向 AI 时代身份过渡期年轻人的社交社区平台**，不是通用求职工具，不是大模型对话界面的包装。
- 产品核心价值必须体现在**"被理解 → 被定位 → 被连接"**三段式流程上，任何功能扩展不应打破这个主干叙事。
- Hackathon MVP 必须优先保障**最小 Happy Path** 的闭环稳定性，而非功能的广度。
- 未被列入 In-Scope 的功能，在 MVP 阶段不得引入，包括但不限于：完整 IM 系统、多端原生 App、招聘平台正式 API 接入、复杂推荐算法。
- 产品语气必须坚守"锋利但不冷漠，克制但不说教"，任何对话文案、UI 文本、系统提示均不得出现绝对化否定表达。

---

## 3. 技术架构约束

- 应用框架：`Next.js`，前端标准：`React + Tailwind CSS`
- 服务端仅使用 `Next.js Route Handlers / Server Actions`，不引入独立 Express/Fastify 层
- 主数据库：`PostgreSQL`；缓存层：`Redis`（Hackathon MVP 阶段为可选项，依部署环境决定是否启用）
- 地图可视化固定使用 `D3.js force-directed graph`，不引入 `Three.js`（后续版本升级方向保留）
- 所有平台差异和 Provider 差异必须通过 adapter/配置层隔离，不得泄漏到业务核心逻辑

---

## 4. AI Provider 约束

### 4.1 Provider 配置规则（纯 .env 切换）

**核心原则：切换 AI Provider 是一个纯配置操作，不允许修改任何代码。**

- 所有 AI 调用必须经过统一的 LLM Adapter 层，业务代码对 Provider 完全无感知
- AI 服务通过 `.env` 中以下四个字段统一确定，所有字段均不得硬编码到代码中：

  ```env
  # 使用 Claude API 时：
  AI_PROVIDER=claude
  AI_API_URL=https://api.anthropic.com/v1/messages
  AI_API_KEY=sk-ant-...
  AI_MODEL=claude-sonnet-4-5

  # 切换为 OpenAI API 时（只改这四行，代码不动）：
  AI_PROVIDER=openai
  AI_API_URL=https://api.openai.com/v1/chat/completions
  AI_API_KEY=sk-...
  AI_MODEL=gpt-4o
  ```

- 超时与重试同样通过 `.env` 控制，不在代码中写死：

  ```env
  AI_TIMEOUT_MS=8000
  AI_MAX_RETRIES=1
  ```

- **禁止**在业务逻辑、Prompt 构建、响应解析等任何环节出现 `if (provider === 'claude')` 类条件分支
- Prompt 必须对两套 API 均有效，如有 Provider 特有差异（如 `system` 字段格式），仅允许在 Adapter 内部处理

### 4.2 LLM 调用规则

- 语义理解类问题默认采用 LLM-first，规则只能做 fallback
- Fallback 必须在代码和注释中被明确标注（如 `// fallback: using mock template`），不得伪装为主逻辑
- 禁止使用字符串包含、固定关键词匹配等方式判断 LLM 输出语义
- 所有驱动业务动作的模型输出都必须结构化，推荐使用 JSON + schema 校验
- 模型输出进入处理逻辑前必须经过：schema 校验、枚举值约束、内容安全检查
- Prompt 中不得使用会污染输出分布的具体数值作为示例答案
- Prompt 必须明确：哪些字段允许 `unknown / unavailable`，哪些字段必须给出结构化结果

### 4.3 超时与降级策略

- 每个 AI 节点超时阈值为 `8 秒`，最多重试 `1 次`，超时后立即触发 Fallback
- 每条核心链路节点（追问、镜子、压力指数、Agent 匹配）必须预置至少 `3 组` Fallback 样本模板
- Fallback 样本模板必须纳入代码仓库管理，不得仅放在文档中
- Demo 模式下（`DEMO_MODE=true`），指定测试账号（`DEMO_PRESET_ACCOUNT`）直接返回预设结果，跳过真实 AI 调用

---

## 5. 数据约束

### 5.1 外部数据

- Hackathon MVP 阶段，外部市场数据固定使用**手工整理的 20 条岗位快照数据集**，不接入任何第三方实时 API
- 快照数据必须包含以下字段：`snapshot_id`、`source_name`、`captured_at`、`job_title`、`city`、`skill_tags[]`、`salary_range`、`trend_note`、`evidence_quote`
- 所有基于快照数据生成的结论，必须在 UI 上标注"当前为样例推演"

### 5.2 地图与节点数据

- Hackathon 阶段地图节点统一使用预填充静态数据，不做真实实时写入
- 静态节点数据必须纳入仓库管理（`/data/` 或 `/fixtures/` 目录），不得仅存在于数据库

### 5.3 用户数据

- 用户自白内容默认视为敏感文本，未经用户确认不得公开展示
- 地图中默认展示抽象节点，不展示真实姓名、完整履历、联系方式
- 用户默认不进入公开匹配，匹配推荐必须透明说明匹配依据
- 高风险情绪表达（如自伤倾向）仅输出保守支持文案，不触发社交推荐与公开节点生成

---

## 6. 置换压力指数约束

- 压力结果**不展示精确分数**，统一以区间形式呈现（如 `70 ~ 80`）
- 结果页必须附"综合研判"说明，强调此结果为"LLM 综合研判 + 外部岗位快照交叉分析"，不是确定性算法诊断
- 结果拆解说明中至少引用 `1~2` 条外部岗位或技能趋势快照数据，增强说服力
- 解读语言必须"锋利但不羞辱"，不允许出现绝对化否定表达

---

## 7. 安全与隐私约束

- `.env` 中所有 key 均不得提交至仓库，仅 `.env.example` 可提交
- 敏感信息（API Key、数据库密码、用户原始自白）不得出现在日志输出中
- 用户会话数据的保留策略必须有分类管理，不允许所有信息统一永久保存
- 用户必须有退出当前对话、清除本次会话缓存的能力

---

## 8. 接口与类型约束

- 核心接口必须有 TypeScript `interface` 定义（详见 PRD 附录接口契约）
- 接口定义中涉及 AI 调用的响应体，必须包含 `fallbackUsed: boolean` 字段，便于埋点和监控
- `dataMode` 字段必须三值区分：`"live" | "snapshot" | "mock"`，不允许用布尔值简化
- 所有接口输入输出必须显式声明，禁止使用 `any` 类型

---

## 9. 性能约束

- 单轮 AI 回复建议控制在 `3~8 秒`，超过 `8 秒` 必须触发降级
- 结果页首屏加载控制在 `2 秒` 以内
- 地图交互需保证基础拖拽、缩放流畅，不出现明显掉帧
- `backdrop-filter` 背景模糊效果（Glassmorphism）在移动端可选择性降级或关闭

---

## 10. UI 与前端规范

- 设计规范以 `MOLT_UI_Design_Guide.md` 为基准，UI 实现不得在无设计决策记录的前提下擅自偏离
- 核心色值变量必须以 CSS Custom Properties 或 Tailwind Config Token 管理，禁止在组件中硬编码色值
- 动效必须有实际交互意义，禁止纯装饰性的大量动画（详见 UI Guide 第 7 节）
- 移动端适配首屏核心文案控制在 5 行以内，关键结论必须在首屏可见
- 禁止使用明亮渐变治愈风、过度拟物聊天气泡、复杂顶部导航

---

## 11. 埋点约束

- 关键转化节点必须有埋点：Landing PV、开始按钮点击、每幕提交、镜子确认、镜子成功、结果页展示、能力重估展示、地图节点查看、信号发送、Agent 匹配生成
- 埋点**不上报用户原始文本**，只上报 `text_length`、`scene_index` 等非敏感元信息
- 所有 AI 调用节点需记录 `fallbackUsed` 字段，便于路演后分析真实调用成功率

---

## 12. 测试约束

- 不能只测"能不能跑"，必须对核心链路做 `3 次以上` 端到端压测，包括使用 Fallback 模板的场景
- Fallback 路径必须被显式测试，保证路演时模板切换流畅无界面异常
- Demo 模式（`DEMO_MODE=true`）下的全流程走一遍必须在路演前完成 **Dry Run**
- 路演当天不做第一次全链路联调

---

## 13. Code Review 强制检查项

每次 Code Review 至少检查以下问题：

- AI Provider / API URL / API Key 是否存在硬编码？
- Fallback 逻辑是否被明确标注并可独立测试？
- 是否存在字符串匹配判断 LLM 输出语义的代码？
- 接口响应体是否携带 `fallbackUsed` 和 `dataMode` 字段？
- 是否存在无来源的魔术数字（尤其是评分权重、阈值）？
- 敏感信息是否可能被打印到日志？
- UI 组件中是否存在硬编码色值？
- 是否引入了 Out-of-Scope 功能？

---

## 14. 偏离流程

如果实现需要偏离本文档中的约束，必须先记录明确决策，包括：

- 偏离了哪条约束
- 为什么偏离
- 风险是什么
- 替代约束是什么
- 如何验证偏离后仍可控

未经明确记录，不应默认突破这些约束。
