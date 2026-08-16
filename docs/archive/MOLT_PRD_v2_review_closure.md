# MOLT PRD v2 评审问题 Closure

**Closure 日期**: `2026-03-19`  
**对应评审文档**: `MOLT_PRD_v2_review.md`  
**对应 PRD 版本**: `MOLT_PRD_v2_full.md v2.12 Full`

---

## 一、结论

评审报告中的核心风险项已完成文档级闭环，当前 PRD 已达到 Hackathon 开发与路演使用标准。

但仍有少量事项属于“部分解决”而非“完全完成”，主要集中在：

- 交互原型和 UI 设计目前为说明文档，不是高保真稿
- 竞品分析、市场调研、用户访谈仍未单独产出
- 技术方案是 Hackathon 级落地方案，不是生产级架构文档

---

## 二、逐条 Closure

### 2.1 [高风险] MVP 范围与 Hackathon 时间不匹配

- 状态：`已解决`
- 处理结果：
  - 已将 Hackathon 核心路径明确收敛为“三幕自白 -> 镜子确认 -> 置换压力区间 -> Agent 匹配一句话文案”
  - 已将能力重估、地图、信号下调为加分项，并明确采用静态/预设实现
- 证据位置：
  - [MOLT_PRD_v2_full.md:95](./MOLT_PRD_v2_full.md#L95)
  - [MOLT_PRD_v2_full.md:104](./MOLT_PRD_v2_full.md#L104)
  - [MOLT_PRD_v2_full.md:157](./MOLT_PRD_v2_full.md#L157)

### 2.2 [高风险] AI API 单点依赖

- 状态：`已解决`
- 处理结果：
  - 已为三幕追问、镜子确认、Agent 匹配补充 fallback 模板/文案池
  - 已将 AI 服务调整为 Claude API 与 OpenAI API 双兼容
  - 已明确通过 `.env` 中的 `AI_PROVIDER`、`AI_API_URL`、`AI_API_KEY`、`AI_MODEL` 决定实际 Provider
  - 已明确 AI Provider 超时阈值 `8 秒`、最多重试 `1 次`
  - 已在路演模式下为 Demo 账号返回预设结果
- 证据位置：
  - [MOLT_PRD_v2_full.md:236](./MOLT_PRD_v2_full.md#L236)
  - [MOLT_PRD_v2_full.md:296](./MOLT_PRD_v2_full.md#L296)
  - [MOLT_Technical_Design.md](../MOLT_Technical_Design.md)

### 2.3 [中风险] 置换压力指数的“伪科学”风险

- 状态：`已解决`
- 处理结果：
  - 已将展示形式改为压力区间，不再展示精确分数
  - 已明确表述为“LLM 综合研判 + 外部岗位快照交叉分析”
  - 已要求结果拆解中至少引用 `1~2` 条外部数据快照
- 证据位置：
  - [MOLT_PRD_v2_full.md:255](./MOLT_PRD_v2_full.md#L255)
  - [MOLT_PRD_v2_full.md:263](./MOLT_PRD_v2_full.md#L263)
  - [MOLT_PRD_v2_full.md:273](./MOLT_PRD_v2_full.md#L273)

### 2.4 [中风险] 外部数据接入方案不明确

- 状态：`已解决`
- 处理结果：
  - 已将方案改为手工整理的 `20` 条岗位快照数据集
  - 已补充快照字段结构
  - 技术方案中明确 Hackathon 阶段使用本地快照导入
- 证据位置：
  - [MOLT_PRD_v2_full.md:134](./MOLT_PRD_v2_full.md#L134)
  - [MOLT_PRD_v2_full.md:404](./MOLT_PRD_v2_full.md#L404)
  - [MOLT_Technical_Design.md](../MOLT_Technical_Design.md)

### 2.5 [低风险] 地图可视化技术选型未确认

- 状态：`已解决`
- 处理结果：
  - 已明确选型为 `D3.js force-directed graph`
  - 已明确 `Three.js` 不进入本轮 MVP
- 证据位置：
  - [MOLT_PRD_v2_full.md:293](./MOLT_PRD_v2_full.md#L293)
  - [MOLT_PRD_v2_full.md:405](./MOLT_PRD_v2_full.md#L405)

### 2.6 [低风险] 缺少接口契约定义

- 状态：`已解决`
- 处理结果：
  - 已补充 Draft 级 TypeScript interface
  - 已补充技术方案中的 API 建议与数据表建议
- 证据位置：
  - [MOLT_PRD_v2_full.md:416](./MOLT_PRD_v2_full.md#L416)
  - [MOLT_Technical_Design.md](../MOLT_Technical_Design.md)

### 2.7 [新增] Agent LLM 调用边界不明确

- 状态：`已解决`
- 处理结果：
  - 已明确 Agent Loop 中 `filter_candidates` 与 `rank_candidates` 不调用 LLM
  - 已明确 `select_final_candidate`、`generate_match_reason` 与 `generate_agent_message` 调用 LLM
  - 已将打分方案从硬编码权重改为配置化特征评分，并引入 Top K rerank
  - 已补充 Agent Loop 伪代码、输入输出定义、fallback 逻辑与终端详细日志要求
- 证据位置：
  - [MOLT_PRD_v2_full.md:295](./MOLT_PRD_v2_full.md#L295)
  - [MOLT_Technical_Design.md](../MOLT_Technical_Design.md)

### 2.8 [新增] Agent 编排方式不明确

- 状态：`已解决`
- 处理结果：
  - 已明确采用手写 orchestrator，不采用 LangGraph 与动态 tool calling
  - 已明确服务端内部工具负责取数、过滤、排序、保存
  - 已明确 LLM 只执行 `select_final_candidate`、`generate_match_reason`、`generate_agent_message`
  - 已明确所有调用链路、重试与 fallback 都必须输出详细终端日志
- 证据位置：
  - [MOLT_PRD_v2_full.md:304](./MOLT_PRD_v2_full.md#L304)
  - [MOLT_Technical_Design.md](../MOLT_Technical_Design.md)

---

## 三、结构完整性 Closure

### 3.1 已补齐

- 项目立项书：
  - [MOLT_Hackathon_Project_Charter.md](../MOLT_Hackathon_Project_Charter.md)
- 交互原型说明：
  - [MOLT_Interaction_Wireframes.md](../MOLT_Interaction_Wireframes.md)
- UI 设计说明：
  - [MOLT_UI_Design_Guide.md](../MOLT_UI_Design_Guide.md)
- 技术方案设计文档：
  - [MOLT_Technical_Design.md](../MOLT_Technical_Design.md)

### 3.2 仍为部分解决

- `UI设计稿均为待补充`
  - 现状：已补 UI 设计说明，但不是 Figma 级高保真稿
  - 判定：`部分解决`

- `竞品分析`
  - 现状：仍未单独撰写
  - 判定：`暂不处理`

- `市场调研报告 / 用户研究`
  - 现状：仍未单独撰写
  - 判定：`暂不处理`

- `A/B 测试方案 Hackathon 实际价值有限`
  - 现状：保留为后续封测预案，并明确路演阶段不开启
  - 判定：`已处理`

---

## 四、最终判断

如果目标是：

- 让 PRD 可以支撑 Hackathon 开发和路演：`已达到`
- 让 PRD 变成正式商业化产品全套文档：`尚未达到`

因此，本次评审问题的最终状态建议定义为：

- 核心风险项：`全部关闭`
- 配套完整性项：`大部分关闭`
- 非 Hackathon 必需项：`保留到后续版本`
