# MOLT 当前实现问题清单与修改方案

## 1. Path C 公开建档直接暴露原始敏感内容

### 问题

当前 Path C 建档流程不是在生成“可公开摘要”，而是把用户原始问答直接拼接后保存并展示：

- `Archive.tsx` 将 `question_text + answer_text` 直接拼接成 `trajectorySummary`
- `saveArchive(...)` 将其存入 `trajectory_summary`
- `archiveToNode(...)` 再映射为地图节点的 `summary`
- `Map.tsx` 最终直接渲染 `selectedNode.summary`

这会把用户在 Path C 中写下的原始内容几乎原样暴露到公开地图上，和“用户自白默认视为敏感文本，未经确认不得公开展示”的约束直接冲突。

### 相关文件

- `src/pages/Archive.tsx`
- `src/db/api.ts`
- `src/lib/map/archiveToNode.ts`
- `src/pages/Map.tsx`

### 修改方案

1. 将 `archives.trajectory_summary` 从“原始问答拼接文本”改为“经过脱敏和抽象后的公开摘要”。
2. 原始 Path C 问答只保留在 `conversations`，不要再作为公开地图展示来源。
3. 为 Path C 增加一个独立的“公开摘要生成”步骤：
   - 输入：原始回答
   - 输出：`startPoint`、`turningPoint`、`currentState`、`lightMessage` 这类结构化公共字段
4. 地图页只展示结构化公共字段，不展示原始长文本。
5. 如果当前阶段还没有真实 AI，可先做本地 deterministic 摘要，但必须保证它输出的是抽象描述而不是原文直出。

## 2. Supabase RLS 对敏感表近乎全开放

### 问题

当前 RLS 策略允许匿名客户端读取敏感表中的内容：

- `users`：任意可查
- `conversations`：任意可查
- `results`：任意可查
- `signals`：任意可查

这不是普通的“后续优化项”，而是已经导致敏感数据越权访问。

### 相关文件

- `supabase/migrations/00002_create_rls_policies.sql`

### 修改方案

1. 删除所有 `USING (true)` 的敏感读策略。
2. 对 `conversations`、`results`、`signals`、`archives` 改为基于用户身份的行级隔离。
3. 如果当前产品仍采用匿名用户模式，就必须明确匿名身份与表内记录的绑定方式，避免任何人通过前端 SDK 枚举读取其他人的记录。
4. `archives` 只允许读取 `is_public = true` 的脱敏公共字段，不应允许读取原始用户上下文。
5. 上线前补一轮最小安全验证：
   - 用户 A 不能查到用户 B 的对话
   - 用户 A 不能查到用户 B 的结果
   - 用户 A 不能查到与自己无关的信号

## 3. 对话主流程没有接入 AI service

### 问题

当前主流程中的 `Conversation.tsx` 根本没有使用 AI 对话生成接口。它只是：

1. 读取固定题库
2. 保存当前回答
3. 直接进入下一道预设问题

这意味着 `generateConversationTurn(...)` 虽然存在接口定义，但并没有进入用户主链路。

### 相关文件

- `src/pages/Conversation.tsx`
- `src/lib/conversationData.ts`
- `src/services/ai/templates/conversation.ts`
- `src/types/ai.ts`

### 修改方案

1. 明确当前阶段策略：
   - 如果继续走 MVP fallback-only 路线，就把“固定题库式对话”明确产品化，不再伪装成内容感知式 AI 对话。
   - 如果进入真实 AI 阶段，就让 `Conversation.tsx` 接入统一 `AIService.generateConversationTurn(...)`。
2. 无论选哪条路线，都要把当前状态写清楚：
   - 页面文案不要暗示系统正在实时理解并生成追问
   - fallback 状态必须在实现和文档中明确
3. 若接入 AI，对话返回结果必须结构化，不能只返回自由文本。

## 4. `defaultAIService` 实际上始终走本地 fallback

### 问题

当前 `defaultAIService` 的配置是：

- `primaryProvider = UnavailableAIProvider`
- `fallbackProvider = LocalFallbackAIProvider`

这意味着默认行为并不是“有真实 provider，异常时 fallback”，而是本质上始终 fallback。

### 相关文件

- `src/services/ai/index.ts`
- `src/services/ai/providers/unavailable.ts`
- `src/services/ai/providers/fallback.ts`

### 修改方案

1. 不要再让 `UnavailableAIProvider` 作为默认主 provider 长期存在。
2. 改成明确的两种运行模式之一：
   - `mock/local` 模式：明确告诉调用方当前是本地 fallback 模式
   - `live` 模式：接入真实 provider
3. 让默认 provider 来源于配置，而不是写死在代码里。
4. 如果当前阶段还不接真实 AI，就把 service 命名和文档改清楚，避免形成“已经接了 AI，只是偶尔 fallback”的误导。

## 5. AI Provider 配置没有接入运行时

### 问题

文档和 `.env.example` 里已经声明了：

- `AI_PROVIDER`
- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL`

但运行时代码实际上并没有使用这些字段。当前运行时只消费了 Supabase 相关 env。

### 相关文件

- `.env.example`
- `config.ts.example`
- `src/services/ai/index.ts`
- `src/db/runtime.ts`
- `src/db/supabase.ts`

### 修改方案

1. 增加真正的 runtime config 模块，专门解析 AI 相关 env。
2. 在启动 AI service 时根据配置选择 provider，而不是写死 provider 类。
3. Provider 差异只允许封装在 adapter 层，不能渗透到业务层。
4. 若当前迭代不实现真实 provider，就暂时删掉误导性配置，或明确标注为“未来实现占位”。

## 6. 结果分析仍是启发式分类，不符合结构化分析约束

### 问题

当前结果分析主要依赖：

- 回答长度
- 回答平均长度
- 少量关键词匹配

输出中的能力、市场信号、行动建议仍然以模板为主，没有真正做到“基于用户语义 + 外部证据”的结构化分析。

### 相关文件

- `src/services/ai/templates/result.ts`
- `src/lib/result/analyzer.ts`
- `src/pages/Result.tsx`

### 修改方案

1. 不要再把当前逻辑包装成“真实分析结果”，应在产品和代码层面明确它是 fallback / heuristic。
2. 引入结构化分析输出模型，至少拆成：
   - 压力判断
   - 证据来源
   - 能力判断
   - 行动建议
3. 在接入真实 AI 前，先让 fallback 输出结构和未来真实输出保持一致。
4. 压力判断逻辑中需要移除纯长度驱动的粗糙规则，避免明显误判。

## 7. 缺少岗位快照数据集与证据链路

### 问题

约束要求 MVP 使用固定的岗位快照数据集，并在结果页中引用证据字段。但当前仓库中没有发现实际运行时使用的快照数据，也没有结果页证据展示链路。

### 相关文件

- `docs/PROJECT_CONSTRAINTS.md`
- `src/lib/result/analyzer.ts`
- `src/pages/Result.tsx`

### 修改方案

1. 在仓库中加入固定快照数据集，放入 `data/` 或 `fixtures/` 目录。
2. 数据字段应满足约束要求：
   - `snapshot_id`
   - `source_name`
   - `captured_at`
   - `job_title`
   - `city`
   - `skill_tags[]`
   - `salary_range`
   - `trend_note`
   - `evidence_quote`
3. 结果页增加“引用证据”区块，至少展示 1~2 条快照依据。
4. 即使当前分析仍是 fallback，也要把证据引用链路先搭起来。

## 8. `dataMode` 接口契约缺失

### 问题

约束要求涉及 AI 的接口响应必须显式区分：

- `fallbackUsed`
- `dataMode: "live" | "snapshot" | "mock"`

当前类型定义里只有 `fallbackUsed`，没有 `dataMode`。

### 相关文件

- `src/types/ai.ts`
- `src/services/ai/service.ts`

### 修改方案

1. 在 `AIServiceResponse<T>` 中增加 `dataMode`。
2. 本地 fallback 输出明确标记为 `mock` 或 `snapshot`，不要混用。
3. 未来真实 provider 输出标记为 `live`。
4. 前端页面根据 `dataMode` 决定提示文案，而不是只看 `fallbackUsed`。

## 9. Demo 预设账号机制没有实现

### 问题

`.env.example` 中定义了：

- `DEMO_MODE`
- `DEMO_PRESET_ACCOUNT`

但代码里没有实际使用这些变量。

### 相关文件

- `.env.example`
- `src/db/runtime.ts`
- `scripts/start.mjs`

### 修改方案

1. 明确 Demo 模式入口条件。
2. 为指定 demo 账号提供固定预设结果，跳过真实 AI。
3. 所有关键链路在 Demo 模式下返回稳定、可演示的数据。
4. 增加一条专门的 demo dry-run 校验脚本或测试流程。

## 10. 镜像生成虽然统一走了 service，但本质仍是本地模板拼装

### 问题

当前镜像页虽然通过 `defaultAIService.generateMirrorSummary(...)` 调用统一入口，但底层仍是本地 deterministic 模板，不是真实摘要生成。

### 相关文件

- `src/pages/Mirror.tsx`
- `src/lib/mirror/mirrorGenerator.ts`
- `src/services/ai/templates/mirror.ts`

### 修改方案

1. 保留当前结构化镜像数据接口，不要推翻。
2. 将“本地模板版”和“真实 AI 版”明确分层。
3. 对外输出保持统一结构，方便未来替换实现。
4. 当前阶段至少补一个更严格的“去原文直出”策略，避免镜像页复述过于贴近用户原话。

## 11. Agent 匹配仍是静态规则，且与产品表述存在落差

### 问题

当前 Agent 匹配主要依赖：

- 方向关键词
- 静态节点池
- 可见性和时间排序

这和“理解用户上下文后生成连接建议”的产品表述仍有明显落差。

### 相关文件

- `src/pages/Result.tsx`
- `src/lib/agent/agentMatcher.ts`
- `src/lib/staticData.ts`

### 修改方案

1. 如果当前阶段继续使用规则匹配，就把它明确定位成“规则推荐”而不是“Agent 推理”。
2. 为匹配结果增加结构化解释字段，而不是只给文案。
3. 后续若接 AI，再把“候选筛选”和“最终文案生成”拆成两层。
4. 保留静态节点作为 MVP 数据源，但不要把静态排序包装成语义级匹配。

## 12. 关键埋点覆盖不完整

### 问题

当前有一套轻量 `logEvent(...)`，但关键转化节点并没有全覆盖，至少缺失：

- Landing PV
- Landing 主按钮点击
- 镜像确认成功
- 地图节点查看
- 若干约束文档中明确要求的关键节点

### 相关文件

- `src/lib/logging/index.ts`
- `src/pages/Landing.tsx`
- `src/pages/Mirror.tsx`
- `src/pages/Map.tsx`
- `src/pages/Result.tsx`

### 修改方案

1. 建立统一的事件命名表。
2. 先补齐 MVP 必需事件，不必一开始就做完整埋点平台。
3. 严格避免上报原始用户文本，只上报长度、索引、路径类型等非敏感元信息。
4. AI 相关事件统一带上 `fallbackUsed` 和后续新增的 `dataMode`。

## 13. 前端存在 design token 违规和 `any`

### 问题

目前仍有前端代码直接硬编码颜色，且至少存在一个显式 `any`：

- 图谱颜色直接写 `hsl(...)`
- 地图局部样式直接写色值
- `ForceGraph.tsx` 里存在 `d: any`

### 相关文件

- `src/components/ForceGraph.tsx`
- `src/pages/Map.tsx`

### 修改方案

1. 将图谱和地图中的核心颜色收敛到 CSS variables 或统一 token。
2. 去掉 `any`，为 D3 节点类型补显式类型定义。
3. 不要在页面组件里继续扩散硬编码色值。

## 14. Landing 文案与语气约束存在冲突

### 问题

当前 Landing 文案：

- “你不是被时代淘汰的人”

虽然有力量，但它仍是强否定句式，与“不得出现绝对化否定表达”的约束存在冲突。

### 相关文件

- `src/pages/Landing.tsx`

### 修改方案

1. 产品侧先明确到底保留这句还是修改语气约束。
2. 如果保留，就应在约束文档中记录这是经过确认的偏离。
3. 如果不保留，建议改成更少否定色彩但仍保留力度的表达。

## 15. 当前文档、配置、实现三者不一致

### 问题

现在仓库存在一个结构性问题：

- 文档里已经写了很多未来约束
- 配置样板里也已经出现了未来字段
- 但运行时实现还停留在 fallback-first demo 阶段

这会导致团队在判断“什么已完成、什么只是目标设计”时持续混乱。

### 相关文件

- `docs/PROJECT_CONSTRAINTS.md`
- `.env.example`
- `config.ts.example`
- `src/services/ai/*`

### 修改方案

1. 将“当前已实现”和“未来目标约束”明确分层。
2. 对还未实现的约束标注状态：
   - 已实现
   - 部分实现
   - 未实现
3. 对会误导读者的配置项，补充说明或暂时下沉到设计文档中。
4. 后续每次改造时，优先保证文档、配置、实现三者同步。

## 建议执行顺序

1. 先处理 Path C 原始内容公开问题
2. 再处理 Supabase RLS
3. 再补 `dataMode`、Demo preset、岗位快照数据
4. 再决定 AI provider 接入策略
5. 最后补埋点、token、类型清理和文案口径统一
