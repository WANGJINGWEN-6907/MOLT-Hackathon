# MOLT 技术方案设计文档

## 1. 目标

本方案用于支撑 Hackathon 阶段的最小可演示版本，优先保证核心链路稳定、部署简单、降级清晰。

## 2. 技术选型

- 应用框架：`Next.js`
- 前端：`React + Tailwind CSS`
- 服务端：`Next.js Route Handlers / Server Actions`
- 数据库：`PostgreSQL（主数据） + Redis（缓存 / 实时状态）`
- AI 服务：`Claude API + OpenAI API`
- 可视化：`D3.js force-directed graph`

## 3. 系统边界

```text
Browser
  -> Next.js App
  -> Route Handlers / Server Actions
  -> PostgreSQL
  -> Redis
  -> Claude API / OpenAI API
```

说明：

- 前端页面和服务端接口统一由 Next.js 承载
- PostgreSQL 存正式业务数据
- Redis 用于缓存 AI 结果、会话态和地图实时状态；Hackathon 阶段直接接入
- Claude API 与 OpenAI API 负责生成式理解和文案输出
- 服务端维护统一的 provider 路由层，根据 `.env` 配置选择调用 Claude 或 OpenAI
- AI 服务使用单一配置入口：
  - `AI_PROVIDER=claude|openai`
  - `AI_API_URL=<provider endpoint>`
  - `AI_API_KEY=<provider key>`
  - `AI_MODEL=<provider model>`
- 外部岗位数据在 Hackathon 阶段以本地快照数据集导入

## 4. 核心模块

### 4.1 对话模块

- 接收用户三幕输入
- 组织上下文
- 调用统一 AI Provider 生成追问，失败时回退模板

### 4.6 AI Provider Router

- 启动时读取 `.env`
- 根据 `AI_PROVIDER` 选择 Claude 或 OpenAI 适配器
- 请求时统一使用 `AI_API_URL`、`AI_API_KEY`、`AI_MODEL`
- 对上层模块暴露统一的 `generateText()` 能力

### 4.2 镜子模块

- 根据用户输入生成镜子确认文案
- 支持半预设样例数据兜底

### 4.3 DISPLACE 结果模块

- 输出压力区间
- 生成结构性 / 个体性拆解
- 输出能力重估与岗位快照引用

### 4.4 Agent 匹配模块

- 职责定位：
  - Agent 是轻量决策层，不是自治多智能体系统
  - Agent 负责候选筛选、匹配理由生成、展示文案生成
- 架构决策：
  - 本项目不采用 `LangGraph`
  - 本项目不采用 `OpenClaw`
  - 本项目采用手写 orchestrator 与 `while` 循环驱动的轻量 Agent Loop
  - Agent Loop 按有限状态推进，并在固定步数内结束
- 运行流程：
```text
load_state
  -> filter_candidates
  -> rank_candidates
  -> select_final_candidate
  -> generate_match_reason
  -> generate_agent_message
  -> finish
```
- LLM 调用矩阵：
  - `load_state`：不调用 LLM
  - `filter_candidates`：不调用 LLM
  - `rank_candidates`：不调用 LLM
  - `select_final_candidate`：调用 LLM
  - `generate_match_reason`：调用 LLM
  - `generate_agent_message`：调用 LLM
  - `finish`：不调用 LLM
- 状态定义：
  - `load_state`：读取用户结构化画像、节点池、外部快照
  - `filter_candidates`：按业务约束过滤候选节点
  - `rank_candidates`：计算特征分并选出 Top K
  - `select_final_candidate`：调用 LLM 从 Top K 候选中选出最终节点
  - `generate_match_reason`：调用 AI 生成结构化匹配理由
  - `generate_agent_message`：将匹配理由压缩为一句展示文案
  - `finish`：返回结果并结束循环
- 终止条件：
  - 达到 `finish`
  - 循环步数达到上限 `6`
  - 没有合适候选人，直接回退默认节点
- 输入：
```ts
interface AgentInput {
  sessionId: string;
  mirrorSummary: string;
  abilityTags: string[];
  fearTags: string[];
  motivationTags: string[];
  displacementRange: [number, number];
  city?: string;
  direction?: string;
  candidates: GraphNodeCandidate[];
}

interface GraphNodeCandidate {
  nodeId: string;
  city: string;
  direction: string;
  stage: string;
  summary: string;
  isPublic: boolean;
  isSample: boolean;
}
```
- 工具设计：
  - `filterCandidates()`：按公开性、字段完整性、可展示性过滤
  - `buildRankingFeatures()`：计算方向相似度、城市相关度、压力邻近度、轨迹完整度
  - `rankCandidates()`：按配置权重计算分数并排序
  - `getUserProfile()`：读取用户结构化画像
  - `getTopKCandidates()`：读取初排后的 Top K 候选
  - `getMarketSnapshots()`：读取当前方向相关的快照摘要
  - `saveAgentDecision()`：保存最终结果
  - `loadFallbackMatch()`：读取默认节点与预设文案
- 服务端内部工具：
  - `filterCandidates()`
  - `buildRankingFeatures()`
  - `rankCandidates()`
  - `getUserProfile()`
  - `getTopKCandidates()`
  - `getMarketSnapshots()`
  - `saveAgentDecision()`
  - `loadFallbackMatch()`
  - `buildMatchReasonInput()`
- Orchestrator 执行顺序：
```text
服务端 load_state
  -> 服务端 filterCandidates
  -> 服务端 rankCandidates
  -> 服务端 getUserProfile
  -> 服务端 getTopKCandidates
  -> 服务端 getMarketSnapshots
  -> LLM select_final_candidate
  -> LLM generate_match_reason
  -> LLM generate_agent_message
  -> 服务端 saveAgentDecision
```
- Orchestrator 约束：
  - LLM 不进行 tool calling
  - 服务端在进入 LLM 阶段前准备好上下文
  - `select_final_candidate` 只接收 Top K 候选，不接收全量节点池
  - `generate_match_reason` 只接收已选节点与快照摘要
  - `generate_agent_message` 只接收 `matchReason`
  - 所有调用链路都必须输出详细终端日志
  - 终端日志至少包含 `step`、`provider`、`model`、输入摘要、耗时、重试次数、fallback 原因、最终输出摘要
  - 发生降级时必须打印明确原因，禁止静默 fallback
- Skills 设计：
  - `candidate-ranking-skill`：封装候选筛选与排序规则
  - `candidate-rerank-skill`：封装 Top K rerank 的提示词与输出格式
  - `match-copy-skill`：封装 Agent 文案语气与长度约束
  - skills 由服务端内部调用，不暴露给前端
- 硬过滤规则：
  - `isPublic=true`
  - `summary`、`direction`、`city` 不为空
  - 节点必须属于当前公开连接池
  - 节点摘要必须可用于结果页展示
- 特征计算：
  - `directionSimilarity`：`0~1`
  - `cityRelevance`：`0~1`
  - `pressureCloseness`：`0~1`
  - `trajectoryCompleteness`：`0~1`
- 排序策略：
  - 排序阶段不在代码中写死数值
  - 所有权重、阈值、Top K 都从应用配置文件读取
  - 先按线性组合计算 `rankingScore`
  - 再取 Top K 交给 LLM 执行 `select_final_candidate`
- 评分公式：
```ts
rankingScore =
  directionSimilarity * config.agentRanking.directionWeight +
  cityRelevance * config.agentRanking.cityWeight +
  pressureCloseness * config.agentRanking.pressureWeight +
  trajectoryCompleteness * config.agentRanking.trajectoryWeight;
```
- 配置项：
```ts
interface AgentRankingConfig {
  topK: number;
  directionWeight: number;
  cityWeight: number;
  pressureWeight: number;
  trajectoryWeight: number;
}
```
- AI 输出策略：
  - LLM 先在 Top K 候选中执行 `select_final_candidate`
  - AI 先输出 `matchReason`
  - 再基于 `matchReason` 输出 `agentMessage`
  - 展示文案长度控制在 `1 句`
- LLM 输入输出定义：
```ts
interface GenerateMatchReasonInput {
  mirrorSummary: string;
  abilityTags: string[];
  fearTags: string[];
  motivationTags: string[];
  displacementRange: [number, number];
  candidate: GraphNodeCandidate;
  marketEvidence: string[];
}

interface SelectFinalCandidateInput {
  mirrorSummary: string;
  abilityTags: string[];
  fearTags: string[];
  motivationTags: string[];
  displacementRange: [number, number];
  profile: string;
  candidates: Array<{
    nodeId: string;
    rankingScore: number;
    direction: string;
    city: string;
    summary: string;
  }>;
  marketEvidence: string[];
}

interface SelectFinalCandidateOutput {
  targetNodeId: string;
}

interface GenerateMatchReasonOutput {
  matchReason: string;
}

interface GenerateAgentMessageInput {
  matchReason: string;
}

interface GenerateAgentMessageOutput {
  agentMessage: string;
}
```
- 调用伪代码：
```ts
while (state.step !== "finish" && state.loopCount < 6) {
  if (state.step === "load_state") {
    state.input = loadAgentInput(sessionId);
    state.step = "filter_candidates";
    continue;
  }

  if (state.step === "filter_candidates") {
    state.candidates = filterCandidates(state.input.candidates, state.input);
    state.step = state.candidates.length > 0 ? "rank_candidates" : "finish";
    continue;
  }

  if (state.step === "rank_candidates") {
    state.ranked = rankCandidates(state.candidates, state.input, config.agentRanking);
    state.topK = state.ranked.slice(0, config.agentRanking.topK);
    state.profile = getUserProfile(sessionId);
    state.snapshots = getMarketSnapshots(sessionId);
    state.step = state.topK.length > 0 ? "select_final_candidate" : "finish";
    continue;
  }

  if (state.step === "select_final_candidate") {
    state.selected = await generateText({
      task: "select_final_candidate",
      input: buildSelectFinalCandidateInput(
        state.input,
        state.profile,
        state.topK,
        state.snapshots
      ),
    });
    state.step = state.selected ? "generate_match_reason" : "finish";
    continue;
  }

  if (state.step === "generate_match_reason") {
    state.matchReason = await generateText({
      task: "generate_match_reason",
      input: buildMatchReasonInput(state.input, state.selected),
    });
    state.step = "generate_agent_message";
    continue;
  }

  if (state.step === "generate_agent_message") {
    state.agentMessage = await generateText({
      task: "generate_agent_message",
      input: { matchReason: state.matchReason },
    });
    saveAgentDecision(sessionId, state.selected, state.matchReason, state.agentMessage);
    state.step = "finish";
  }
}
```
- 输出：
```ts
interface AgentDecision {
  targetNodeId: string;
  rankingScore: number;
  matchReason: string;
  agentMessage: string;
  fallbackUsed: boolean;
}
```
- Fallback：
  - 无候选人：返回默认灯塔节点
  - AI 失败：返回预生成 `matchReason` 与 `agentMessage`
  - 节点数据不足：返回样例公开轨迹节点
  - Demo 账号：直接返回预设 `matchReason` 与 `agentMessage`
  - 每次 fallback 必须向终端打印触发步骤、触发原因、替代输出来源
- 监控点：
  - `candidate_count`
  - `selected_node_id`
  - `agent_loop_steps`
  - `fallback_used`
  - `provider_name`
  - `terminal_log_step_count`
  - `terminal_log_fallback_count`

### 4.5 地图模块

- 用 D3.js 渲染节点与关系
- 首版使用预填充静态节点数据

## 5. 数据模型建议

### 5.1 sessions

```sql
id uuid primary key
created_at timestamptz
updated_at timestamptz
status text
```

### 5.2 dialogue_turns

```sql
id uuid primary key
session_id uuid
scene_index int
user_input text
ai_question text
fallback_used boolean
created_at timestamptz
```

### 5.3 mirror_results

```sql
id uuid primary key
session_id uuid
mirror_summary text
fallback_used boolean
created_at timestamptz
```

### 5.4 displace_results

```sql
id uuid primary key
session_id uuid
range_min int
range_max int
structure_summary text
personal_summary text
weekly_action text
data_mode text
created_at timestamptz
```

### 5.5 graph_nodes

```sql
id uuid primary key
node_type text
city text
direction text
summary text
is_sample boolean
created_at timestamptz
```

## 6. 接口建议

- `POST /api/dialogue/turn`
  - 输入：当前幕数、用户输入、sessionId
  - 输出：下一问、标签、是否使用 fallback

- `POST /api/mirror`
  - 输入：sessionId
  - 输出：镜子文案、是否使用 fallback

- `POST /api/displace`
  - 输入：sessionId
  - 输出：压力区间、能力重估、引用依据

- `POST /api/agent-match`
  - 输入：sessionId
  - 输出：目标节点、匹配理由、Agent 文案

## 6.1 Agent 接口契约

```ts
interface AgentMatchRequest {
  sessionId: string;
  city?: string;
  direction?: string;
}

interface AgentMatchResponse {
  targetNodeId: string;
  rankingScore: number;
  matchReason: string;
  agentMessage: string;
  fallbackUsed: boolean;
  providerName: "claude" | "openai";
}
```

- `GET /api/graph/nodes`
  - 输出：静态样例节点列表

## 7. 降级与容错

- AI Provider 超时阈值：`8 秒`
- 每个 AI 节点最多重试：`1 次`
- 超时后优先回退模板，不阻塞主流程
- 地图数据加载失败时，回退到本地样例 JSON
- PostgreSQL 不可用时，路演模式使用内置 mock 数据继续展示
- Redis 不可用时，服务端以内存态继续承载缓存与会话状态

## 8. 部署建议

- 首选平台：`Vercel`
- 数据库：托管 `PostgreSQL`
- 缓存 / 实时层：`Redis`
- 环境变量：
  - `AI_PROVIDER`
  - `AI_API_URL`
  - `AI_API_KEY`
  - `AI_MODEL`
  - `DATABASE_URL`
  - `REDIS_URL`
  - `APP_ENV`

- `.env` 示例：
```env
AI_PROVIDER=claude
AI_API_URL=https://api.anthropic.com/v1/messages
AI_API_KEY=your_provider_key
AI_MODEL=claude-sonnet-4-5
DATABASE_URL=postgres://...
REDIS_URL=redis://...
APP_ENV=demo
```

- 配置读取规范：
  - 统一通过 `config.ts` 读取 `.env`
  - 统一导出 `config.ai / config.database / config.redis / config.demo`
  - `AI_PROVIDER` 只接受 `claude` 与 `openai`
  - 缺失关键环境变量时，启动阶段直接报错
  - Agent 排序参数通过 `config.ts` 内部配置对象维护，不通过 `.env` 配置
  - 示例文件见：`config.ts.example`

## 9. 开发优先级

1. Landing + 对话链路
2. 镜子确认
3. 结果页与 Agent 文案
   说明：先接 Fallback 模板占位；Agent Loop 完成后替换为真实输出
4. PostgreSQL 持久化
5. 地图样例页
6. Redis 缓存 / 实时状态接入
7. Agent Loop 与工具层

## 10. 非目标

以下内容不进入本轮技术实现：

- 即时通讯系统
- 复杂推荐算法
- 多角色权限系统
- 多端同步
