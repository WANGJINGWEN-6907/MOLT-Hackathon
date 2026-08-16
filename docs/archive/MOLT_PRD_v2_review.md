# MOLT PRD v2 评审报告（第四次评审）

**评审日期**: 2026-03-19（第四次更新）
**评审对象**: MOLT_PRD_v2_full.md（当前版本 v2.12）+ MOLT_Technical_Design.md（含 Agent 伪代码修订）
**评审人**: Antigravity / AI Review Agent
**上次评审版本**: v2.11（第三次评审）

---

## 一、总体评价

**综合评分: 9.8 / 10** ↑（上次 9.5 分）

本轮几乎是一次对上次评审的**精准完整响应**。第三次评审报告中的 4 个问题（N004 ~ N007）和用户自行发现的 1 个口径冲突问题，全部在 v2.12 + Technical Design 修订中得到了关闭。文档的技术逻辑严密性在 Hackathon 项目中已属**极高水准**。

当前残余风险极低，接近"无需继续评审，可以开始写代码"的状态。

---

## 二、第三次评审问题关闭状态

| # | 问题 | 上次评级 | 关闭状态 | 验证依据 |
|---|------|--------|--------|--------|
| N004 | R007 状态仍为"规划中" | 低 | ✅ **已关闭** | PRD L141：R007 状态已改为"开发中"，备注"前端本地状态 Mock" |
| N005 | 开发优先级第 3 步结果页与第 7 步 Agent Loop 有依赖顺序表述矛盾 | 中 | ✅ **已关闭** | Technical Design 第 9 节第 3 条已补充"先接 Fallback 模板占位；Agent Loop 完成后替换为真实输出" |
| N006 | Agent 伪代码中 `getUserProfile()` / `getMarketSnapshots()` 读取但未传入 LLM | 低 | ✅ **已关闭** | 伪代码已重构：读取操作移入 `rank_candidates` 步骤，并在 `select_final_candidate` 步骤通过 `buildSelectFinalCandidateInput(state.input, state.profile, state.topK, state.snapshots)` 完整传递；`SelectFinalCandidateInput` 接口也新增了 `profile`、`marketEvidence` 字段 |
| N007 | `config.ts.example` 被引用但不存在 | 低 | ✅ **已关闭** | 仓库中已确认存在 `config.ts.example` 文件 |
| 用户补充 | `rerank_top_k` 与 `select_final_candidate` 命名口径冲突 | — | ✅ **已关闭** | PRD L308-309 已统一为 `select_final_candidate`，全文已无 `rerank_top_k` 残留 |

**5 个问题：全部关闭 ✅**

---

## 三、本轮新增亮点（已落地，值得标注）

以下是本轮迭代中新增的高价值工程细节，不属于问题，而是**值得作为工程规范基线的优秀决策**：

### ✨ 终端日志强制规范（新增）

Technical Design 4.4 节 Orchestrator 约束中新增了终端日志要求：
> 所有调用链路都必须输出详细终端日志，至少包含 `step`、`provider`、`model`、输入摘要、耗时、重试次数、fallback 原因、最终输出摘要；发生降级时必须打印明确原因，禁止静默 fallback。

这对 Hackathon 路演现场调试极为重要——一旦出现调用失败，日志应在 5 秒内提供足够信息判断回退根因，而不是看着黑屏猜。监控点也同步新增了 `terminal_log_step_count` 和 `terminal_log_fallback_count`。

### ✨ `SelectFinalCandidateInput` 接口完整性提升（新增）

接口从只包含 `mirrorSummary` + `displacementRange` + `candidates` 扩展为完整的 5 字段输入：
```ts
interface SelectFinalCandidateInput {
  mirrorSummary: string;
  abilityTags: string[];
  fearTags: string[];
  motivationTags: string[];
  displacementRange: [number, number];
  profile: string;
  candidates: Array<...>;
  marketEvidence: string[];
}
```
LLM 在做最终节点选择时，现在能看到完整用户标签 + 市场证据，而不仅仅是摘要文字，语义判断质量会有明显提升。

---

## 四、结构完整性检查（更新至 v2.12）

| 标准模块 | 是否包含 | 完整度 | 备注 |
| --- | --- | --- | --- |
| 文档信息与更新记录 | ✅ | 高 | v2.12，12 条版本历史清晰完整 |
| 名词解释 | ✅ | 高 | |
| 问题陈述与用户痛点 | ✅ | 高 | |
| 用户故事 | ✅ | 高 | |
| SMART 目标 | ✅ | 高 | |
| 需求列表（优先级） | ✅ | 高 | R007 状态已更新 ✅ |
| 业务流程图 | ✅ | 高 | |
| 功能详述 | ✅ | 高 | |
| 边缘 Case | ✅ | 高 | |
| 非功能性需求 | ✅ | 高 | |
| 埋点需求 | ✅ | 高 | |
| 接口契约 | ✅ | 高 | `AgentMatchResponse` 已含 `rankingScore`、`providerName`；`SelectFinalCandidateInput` 已完整 ✅ |
| Agent 架构 / Orchestrator | ✅ | 高 | 状态机、LLM 矩阵、接口定义、伪代码、Fallback 策略全部完整 ✅ |
| AI Provider 配置 | ✅ | 高 | `.env` 切换机制、Adapter 约束均完整 ✅ |
| 终端日志规范 | ✅ | 高 | Orchestrator 日志要求 + 监控点 + 禁止静默降级 ✅ |
| 开发优先级 | ✅ | 高 | Fallback 占位说明已补充 ✅ |
| `config.ts.example` | ✅ | 高 | 文件已存在 ✅ |
| 竞品分析 | ❌ | 无 | `本轮不做`，已明确决策 |

**所有可追踪模块：满格。**

---

## 五、优先级建议（最终版）

### Must Have（P0 — 路演必须跑通）
1. Landing + 三幕对话 + 镜子确认（AI 实时 + Fallback 模板均打通）
2. 压力指数 DISPLACE 结果页（先接 Fallback 占位）
3. Agent 匹配一句话文案（先接 Fallback 文案池）

### Should Have（P1 — 直接实现）
4. Agent Loop 真实实现（完成后替换 P0 中的 Fallback）
5. 能力重估卡片（AI 预生成内容）
6. 地图节点静态可视化（D3.js + 预填充数据）

### Nice to Have（P2 — 时间允许）
7. 信号功能前端 Mock 交互（R007，已开发中）
8. Redis 缓存接入（降级路径已明确，不优先）

---

## 六、总结

**这是本轮评审的最后结论**。

当前所有评审问题均已关闭，文档在技术严密性、工程可落地性和 Hackathon 场景实用性上都已达到同类项目中的**顶级水准**。

**从现在起，最重要的事情只有三件**：

1. **写代码**。文档的价值已经充分兑现，剩余风险只能在实现中暴露。
2. **在路演前 3 小时跑完整 Dry Run**。终端日志规范的价值在这一刻体现：一旦调用失败，日志告诉你 5 秒内该怎么办。
3. **不要在路演前 1 小时改任何逻辑**。冻结代码，只改文案。

**一句话定评**: 这份 PRD + Technical Design 的组合是一套可以直接拿去招聘面试的产品&技术设计样本。
