# MOLT 16k 任务拆解文档

**用途**：将完整 PRD 拆解为可在 16k 上下文模型（百度秒哒）中独立执行的原子任务。  
**拼装方：** 技术团队在各任务输出后做接口对接与 UI 组装。  
**版本**：v1.0 | 2026-03-20 | 王文钦 Ellie

---

## 任务地图总览

```
Group 1 静态文案层
  Task-01  Landing 页文案
  Task-02  Onboarding 三张卡片文案

Group 2 Path A 对话链路（挣扎）
  Task-03  Path A 第一幕问题生成
  Task-04  Path A 第二幕动态追问
  Task-05  Path A 第三幕连接需求识别
  Task-06  Path A 镜子复述生成

Group 3 Path B 对话链路（挣脱）
  Task-07  Path B 三幕对话生成
  Task-08  Path B 镜子诊断摘要生成

Group 4 Path C 轨迹链路（回望）
  Task-09  Path C 轨迹摘要卡生成

Group 5 分析与匹配层
  Task-10  DISPLACE 结果生成（Path A）
  Task-11  DISPLACE 结果生成（Path B）
  Task-12  Agent 匹配文案生成（Path A）
  Task-13  Agent 匹配文案生成（Path B）

Group 6 兜底层
  Task-14  全路径 Fallback 模板库生成
```

---

## 数据流与拼装关系

```
Task-02 → session.pathType ─┬─ A → Task-03 → Task-04 → Task-05 → Task-06 → Task-10 → Task-12
                            ├─ B → Task-07 → Task-08 → Task-11 → Task-13
                            └─ C → Task-09 → [灯塔节点写入地图]
Task-14 → 所有任务的 fallback 兜底
```

---

## 通用约束（所有任务共用，复制到每个 Prompt 开头）

```
【产品定位】MOLT 是面向 AI 时代身份过渡期年轻人的社交社区平台。
【语气原则】锋利但不冷漠，克制但不说教，不撒鸡汤，不绝对化否定。
【输出格式】严格按任务要求的 JSON 结构输出，不加解释性文字，不加 Markdown 代码块标记。
【安全原则】如用户输入含极端情绪或自伤倾向，所有字段输出保守支持文案，flag 字段设为 true。
```

---

---

# GROUP 1｜静态文案层

---

## Task-01｜Landing 页文案生成

**执行人**：王晗宇（前端）  
**触发时机**：项目初始化，静态写死  
**上下文需求**：极低（纯生成任务）  
**预估 token**：prompt ~800 + output ~600 = ~1,400 token

---

### Prompt

```
【产品定位】MOLT 是面向 AI 时代身份过渡期年轻人的社交社区平台。
【语气原则】锋利但不冷漠，克制但不说教，不撒鸡汤，不绝对化否定。
【输出格式】严格按任务要求的 JSON 结构输出，不加解释性文字。

你是 MOLT 的文案策划。请为 Landing 首页生成文案。

要求：
- headline：产品宣言，一句话，有力量感，不能是口号感
- subline：1-2 句承接说明，让用户感到被理解
- cta：开始按钮文字，不超过 6 个字
- meta_desc：用于 SEO 的 120 字以内产品描述

输出 JSON：
{
  "headline": "",
  "subline": "",
  "cta": "",
  "meta_desc": ""
}
```

---

### 参考输出（可直接用于兜底）

```json
{
  "headline": "你不是被时代淘汰的人。你是正在换壳的人。",
  "subline": "有人和你经历过同样的变化，并且走出来了。MOLT 把你们连在一起。",
  "cta": "开始脱壳",
  "meta_desc": "MOLT 是一个面向 AI 时代身份过渡期年轻人的社交社区。通过三幕自白理解你的处境，用真实的人与人连接替代无效内容消费。"
}
```

---

---

## Task-02｜Onboarding 三张卡片文案

**执行人**：王晗宇（前端）  
**触发时机**：项目初始化，静态写死  
**上下文需求**：极低  
**预估 token**：prompt ~600 + output ~500 = ~1,100 token

---

### Prompt

```
【产品定位】MOLT 是面向 AI 时代身份过渡期年轻人的社交社区平台。
【语气原则】锋利但不冷漠，克制但不说教。
【输出格式】严格 JSON，不加解释。

你是 MOLT 的文案策划。请生成 Onboarding 三张卡片的文案。

三张卡片对应三种用户状态：
- path_a：知道方向要变但不知道下一步（卡片名：挣扎）
- path_b：已经在行动但不确定方向对不对（卡片名：挣脱）
- path_c：已走出过渡期，愿意将轨迹留给后来者（卡片名：回望）

每张卡片包含：
- name：卡片名（已给定）
- body：2 行情绪描述，用户认出自己的那段话，不超过 30 字
- cta：点击按钮文字，不超过 10 字

同时生成一个兜底入口：
- fallback_text：「都有一点，但又不完全是」的入口文字

输出 JSON：
{
  "cards": [
    {"path": "A", "name": "挣扎", "body": "", "cta": ""},
    {"path": "B", "name": "挣脱", "body": "", "cta": ""},
    {"path": "C", "name": "回望", "body": "", "cta": ""}
  ],
  "fallback": {"text": "", "path": "A"}
}
```

---

### 参考输出（可直接用于兜底）

```json
{
  "cards": [
    {
      "path": "A",
      "name": "挣扎",
      "body": "我知道自己的专业要消失了\n但我不知道下一步在哪里",
      "cta": "我有点像这个 →"
    },
    {
      "path": "B",
      "name": "挣脱",
      "body": "我已经在行动了，但不确定\n自己走的方向对不对",
      "cta": "我有点像这个 →"
    },
    {
      "path": "C",
      "name": "回望",
      "body": "我走出来了，但我想让\n后来的人少走弯路",
      "cta": "我有点像这个 →"
    }
  ],
  "fallback": {
    "text": "都有一点，但又不完全是",
    "path": "A"
  }
}
```

---

---

# GROUP 2｜Path A 对话链路（挣扎）

---

## Task-03｜Path A 第一幕问题生成

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户选择「挣扎」卡片后立即调用  
**输入**：`session_id`、`path_type = "A"`  
**输出**：第一幕问题文本  
**上下文需求**：极低（纯生成，无用户输入）  
**预估 token**：prompt ~500 + output ~200 = ~700 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】慢、温、不催促。系统在陪你，不是在处理你。
【输出格式】严格 JSON，不加解释。

用户刚选择了「挣扎」路径，表示「知道自己的专业要消失了，但不知道下一步在哪里」。

请生成第一幕的引导问题。要求：
- 不问「你的专业是什么」
- 从一个具体时刻切入，让用户感到被理解
- 附上一句副文字降低输入门槛

输出 JSON：
{
  "question": "",
  "hint": ""
}
```

---

### 参考输出（兜底模板 A-01）

```json
{
  "question": "在你开始感到不确定之前，有没有一个具体的时刻？",
  "hint": "可以是一条新闻，一次对话，一个夜晚。不需要完整，说一句就够。"
}
```

---

---

## Task-04｜Path A 第二幕动态追问

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户提交第一幕输入后调用  
**输入**：`user_input_1`（用户第一幕原文）  
**输出**：第二幕问题（嵌入用户原话）+ 情绪标签  
**上下文需求**：低（只需携带用户第一幕输入）  
**预估 token**：prompt ~700 + user_input ~200 + output ~300 = ~1,200 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】慢、温。把用户原话嵌入问题，让用户感到被听见。
【输出格式】严格 JSON，不加解释。
【安全原则】如用户输入含极端情绪或自伤倾向，high_risk 设为 true，question 输出保守支持文案。

用户在第一幕输入了以下内容：
---
{{user_input_1}}
---

请完成以下任务：
1. 从用户原话中提取 1 个核心词或短语（不超过 10 字）
2. 生成第二幕问题：把核心词嵌入「你说了『___』——那个时候，你最想知道的是什么？」这个句式
3. 提取情绪标签（1-3 个）
4. 提取初步身份线索（专业方向或职业状态，可为空）

输出 JSON：
{
  "core_phrase": "",
  "question": "",
  "emotion_tags": [],
  "identity_hint": "",
  "high_risk": false
}
```

---

### 兜底模板 A-02

```json
{
  "core_phrase": "不确定",
  "question": "你说了「不确定」——那个时候，你最想知道的是什么？",
  "emotion_tags": ["迷茫", "焦虑"],
  "identity_hint": "",
  "high_risk": false
}
```

---

---

## Task-05｜Path A 第三幕连接需求识别

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户提交第二幕输入后调用  
**输入**：`user_input_1`、`user_input_2`  
**输出**：第三幕问题 + 连接类型识别  
**上下文需求**：低  
**预估 token**：prompt ~700 + inputs ~400 + output ~300 = ~1,400 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】慢、温。第三幕要识别用户真正需要的连接类型。
【输出格式】严格 JSON，不加解释。
【安全原则】如输入含高风险表达，high_risk 设为 true。

用户前两幕输入：
第一幕：{{user_input_1}}
第二幕：{{user_input_2}}

请完成：
1. 第三幕问题固定为：「如果现在有一个人，六个月前和你站在完全一样的地方，你最想问她一句什么话？」
2. 从前两幕输入综合判断用户最需要的连接类型：
   - emotional：需要情感支持与被理解
   - path：需要看到别人的转型路径
   - skill：需要具体技能建议
3. 提取恐惧标签（1-2 个）和动力标签（1-2 个）

输出 JSON：
{
  "question": "如果现在有一个人，六个月前和你站在完全一样的地方，你最想问她一句什么话？",
  "connection_type": "",
  "fear_tags": [],
  "motivation_tags": [],
  "high_risk": false
}
```

---

### 兜底模板 A-03

```json
{
  "question": "如果现在有一个人，六个月前和你站在完全一样的地方，你最想问她一句什么话？",
  "connection_type": "path",
  "fear_tags": ["方向缺失", "被替代"],
  "motivation_tags": ["想找到出路"],
  "high_risk": false
}
```

---

---

## Task-06｜Path A 镜子复述生成

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户提交第三幕输入后调用  
**输入**：`user_input_1`、`user_input_2`、`user_input_3`、`emotion_tags`、`fear_tags`  
**输出**：镜子复述三段文本  
**上下文需求**：中（携带三幕输入 + 标签）  
**预估 token**：prompt ~800 + inputs ~600 + output ~400 = ~1,800 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】用用户自己说过的词复述，不做简历式总结，是情绪镜子。
【输出格式】严格 JSON，不加解释。
【安全原则】如 high_risk 为 true，mirror_line_3 输出保守支持文案，不做社交推荐。

用户三幕输入：
第一幕：{{user_input_1}}
第二幕：{{user_input_2}}
第三幕：{{user_input_3}}

已提取标签：
情绪标签：{{emotion_tags}}
恐惧标签：{{fear_tags}}
高风险：{{high_risk}}

请生成镜子复述，格式固定为三行：
- mirror_line_1：「你说你___」（直接引用或改写用户原话片段，不超过 20 字）
- mirror_line_2：「你说你不知道___」（提取核心困惑，不超过 20 字）
- mirror_line_3：「你问的那个问题，其实是：___」（系统重构真实问题，不超过 25 字）

输出 JSON：
{
  "mirror_line_1": "",
  "mirror_line_2": "",
  "mirror_line_3": "",
  "confirm_button": "是的，继续",
  "reject_button": "有些不对",
  "fallback_used": false
}
```

---

### 兜底模板 A-Mirror

```json
{
  "mirror_line_1": "你说你感觉自己学的东西在缩水",
  "mirror_line_2": "你说你不知道这些训练还值不值钱",
  "mirror_line_3": "你问的那个问题，其实是：我还能站在哪里？",
  "confirm_button": "是的，继续",
  "reject_button": "有些不对",
  "fallback_used": true
}
```

---

---

# GROUP 3｜Path B 对话链路（挣脱）

---

## Task-07｜Path B 三幕对话生成

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户选择「挣脱」卡片后，每幕提交时依次调用  
**输入**：`scene_index`（1/2/3）、`user_input`（当前幕输入）、`prev_outputs`（前几幕提取结果）  
**输出**：下一幕问题 + 标签提取  
**上下文需求**：低-中  
**预估 token**：prompt ~900 + inputs ~500 + output ~400 = ~1,800 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path B 节奏快、平等、务实。系统在帮你校准，不是在安慰你。
【输出格式】严格 JSON，不加解释。
【安全原则】如 high_risk 为 true，输出保守文案。

当前幕数：{{scene_index}}（1=方向描述 / 2=校准信号 / 3=需求类型）

【第一幕规则】scene_index=1 时，忽略 user_input，直接输出固定第一幕问题：
「你在往哪个方向走？用一句话描述你现在正在尝试的事。」
hint：「不需要说成一个成熟的计划，说正在做的动作就够了。」
提取字段：direction_tag（方向标签）, stage_tag（当前阶段）均为空。

【第二幕规则】scene_index=2 时，携带第一幕 user_input：
{{user_input}}
基于用户方向描述，生成追问：
「你怎么判断自己走对了还是走偏了？有没有一个你拿不准的具体信号？」
（问题固定，不做动态修改）
提取：direction_tag（产品/运营/技术/内容/研究/其他）, stage_tag（学习/实习/求职/在职转型/其他）

【第三幕规则】scene_index=3 时，携带前两幕输入：
前两幕：{{prev_outputs}}
当前输入：{{user_input}}
输出固定第三幕问题及两个选项按钮：
问题：「在这条路上，你最需要的是什么？」
提取 need_type：根据前两幕语义判断倾向（data / person），作为按钮的推荐预选

输出 JSON（scene_index=1）：
{
  "scene": 1,
  "question": "",
  "hint": "",
  "direction_tag": "",
  "stage_tag": "",
  "high_risk": false
}

输出 JSON（scene_index=2）：
{
  "scene": 2,
  "question": "",
  "direction_tag": "",
  "stage_tag": "",
  "uncertainty_signal": "",
  "high_risk": false
}

输出 JSON（scene_index=3）：
{
  "scene": 3,
  "question": "在这条路上，你最需要的是什么？",
  "option_data": "给我数据",
  "option_person": "给我一个人",
  "recommended_need_type": "",
  "high_risk": false
}
```

---

### 兜底模板 B-01/02/03

```json
// scene 1
{
  "scene": 1,
  "question": "你在往哪个方向走？用一句话描述你现在正在尝试的事。",
  "hint": "不需要说成一个成熟的计划，说正在做的动作就够了。",
  "direction_tag": "",
  "stage_tag": "",
  "high_risk": false
}

// scene 2
{
  "scene": 2,
  "question": "你怎么判断自己走对了还是走偏了？有没有一个你拿不准的具体信号？",
  "direction_tag": "运营",
  "stage_tag": "求职",
  "uncertainty_signal": "",
  "high_risk": false
}

// scene 3
{
  "scene": 3,
  "question": "在这条路上，你最需要的是什么？",
  "option_data": "给我数据",
  "option_person": "给我一个人",
  "recommended_need_type": "person",
  "high_risk": false
}
```

---

---

## Task-08｜Path B 镜子诊断摘要生成

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户提交 Path B 第三幕选择后调用  
**输入**：`direction_tag`、`stage_tag`、`uncertainty_signal`、`need_type`（用户选择的 data/person）  
**输出**：方向诊断摘要三字段  
**预估 token**：~1,400 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path B 镜子是方向诊断摘要，不是情绪镜子，像一份简洁的分析报告。
【输出格式】严格 JSON，不加解释。

输入数据：
方向标签：{{direction_tag}}
当前阶段：{{stage_tag}}
拿不准的信号：{{uncertainty_signal}}
用户选择的需求类型：{{need_type}}（data=给我数据 / person=给我一个人）

请生成镜子诊断摘要三字段：
- doing：你正在做的事（15 字以内）
- uncertain：你拿不准的信号（20 字以内）
- need：你需要的验证类型（直接输出「数据」或「人」）

输出 JSON：
{
  "doing": "",
  "uncertain": "",
  "need": "",
  "confirm_button": "是的，继续",
  "reject_button": "我来修正",
  "fallback_used": false
}
```

---

### 兜底模板 B-Mirror

```json
{
  "doing": "尝试转向 AI 产品运营方向",
  "uncertain": "不知道没有技术背景能不能被认可",
  "need": "人",
  "confirm_button": "是的，继续",
  "reject_button": "我来修正",
  "fallback_used": true
}
```

---

---

# GROUP 4｜Path C 轨迹链路（回望）

---

## Task-09｜Path C 轨迹摘要卡生成

**执行人**：曹梦怡（AI 层）  
**触发时机**：用户提交 Path C Q3 后调用  
**输入**：`q1_input`、`q2_input`、`q3_input`  
**输出**：轨迹摘要卡四字段 + 灯塔留言  
**预估 token**：prompt ~800 + inputs ~500 + output ~400 = ~1,700 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path C 是采访感，郑重、有仪式感。不做成功学叙事，只做「从这里，到那里」。
【输出格式】严格 JSON，不加解释。

用户三问输入：
Q1（过渡前在哪里）：{{q1_input}}
Q2（转折是怎么发生的）：{{q2_input}}
Q3（对六个月前的自己说一句话）：{{q3_input}}

请生成：
- start_point：从 Q1 提取起点描述（20 字以内）
- turning_point：从 Q2 提取转折描述（25 字以内）
- current_state：基于 Q1/Q2 整体推断现状（20 字以内，不要过度美化）
- light_message：直接使用 Q3 原话，不修改（这句话将显示在地图节点上）
- direction_tag：从全部输入提取方向标签（如：AI产品/内容运营/算法研究 等）

输出 JSON：
{
  "start_point": "",
  "turning_point": "",
  "current_state": "",
  "light_message": "",
  "direction_tag": "",
  "confirm_button": "是的，这就是我的路",
  "reject_button": "我来补充一些细节",
  "fallback_used": false
}
```

---

### 兜底模板 C-Summary

```json
{
  "start_point": "英语翻译专业在校生，开始感到专业价值受冲击",
  "turning_point": "主动旁听 NLP 课程，开始接触 AI 从业者",
  "current_state": "已进入 AI 行业，在做品牌与社区运营",
  "light_message": "傲慢是最贵的入场券，放下它，世界大了很多。",
  "direction_tag": "AI产品运营",
  "confirm_button": "是的，这就是我的路",
  "reject_button": "我来补充一些细节",
  "fallback_used": true
}
```

---

---

# GROUP 5｜分析与匹配层

---

## Task-10｜DISPLACE 结果生成（Path A）

**执行人**：曹梦怡（AI 层）  
**触发时机**：Path A 用户完成镜子确认后调用  
**输入**：`mirror_summary`（镜子三行拼接文本）、`emotion_tags`、`fear_tags`、`market_snapshot`（20条岗位数据摘要）  
**输出**：压力区间 + 结构性/个体性拆解 + 能力重估  
**上下文需求**：中（需携带市场快照摘要）  
**预估 token**：prompt ~1,000 + mirror ~300 + market_snapshot ~2,000 + output ~800 = ~4,100 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path A 结果页语气更温：结构性压力说明以「这不是你一个人的问题」开头；
            个体行动说明以「但有一部分，是你还没有发现自己的隐性资产」开头。
            锋利但不羞辱，不出现绝对化否定表达。
【输出格式】严格 JSON，不加解释。
【数据声明】所有结果标注 data_mode="snapshot"，页面显示「当前为样例推演」。
【安全原则】如 high_risk 为 true，所有字段输出保守支持文案。

用户镜子摘要：
{{mirror_summary}}

情绪标签：{{emotion_tags}}
恐惧标签：{{fear_tags}}

市场快照数据（20条）：
{{market_snapshot}}

请完成：
1. 综合判断置换压力区间：输出两个整数，如 [70, 80]，不得输出精确单一分数
2. 结构性压力说明（Path A 语气，60 字以内）
3. 个体行动区间说明（嵌入用户镜子摘要中的关键词，60 字以内）
4. 正在贬值的能力列表（1-3 条，每条 15 字以内）
5. 被低估的能力列表（1-3 条，每条 15 字以内，至少引用 1 条市场快照数据）
6. 岗位方向匹配（1-3 条）
7. 本周最小行动建议（1 条，具体可执行，25 字以内）
8. 能力重估模块标题固定为：「你以为没用的，其实值多少」

输出 JSON：
{
  "displacement_range": [0, 0],
  "structure_summary": "",
  "personal_summary": "",
  "skill_revaluation_title": "你以为没用的，其实值多少",
  "declining_skills": [],
  "undervalued_skills": [],
  "job_matches": [
    {"title": "", "salary_range": "", "reason": ""}
  ],
  "weekly_action": "",
  "citations": [],
  "data_mode": "snapshot"
}
```

---

### 兜底模板 A-DISPLACE

```json
{
  "displacement_range": [70, 80],
  "structure_summary": "这不是你一个人的问题——整个外语翻译方向都在经历结构性收缩，你感到的压力是真实的行业变化。",
  "personal_summary": "但有一部分，是你还没有发现自己的隐性资产。你说你「能感知到别人没说出口的意思」，这件事在简历上完全消失了。",
  "skill_revaluation_title": "你以为没用的，其实值多少",
  "declining_skills": ["标准化文本翻译", "人工同传辅助"],
  "undervalued_skills": ["跨文化语义判断", "用户需求转译能力", "多语言内容质量把控"],
  "job_matches": [
    {"title": "AI 本地化审校", "salary_range": "15k-25k", "reason": "外语背景+语义理解是核心门槛"},
    {"title": "跨境内容运营", "salary_range": "12k-20k", "reason": "海外用户洞察是技术工具无法替代的部分"}
  ],
  "weekly_action": "找一个在 AI 公司做内容的人，发一条消息，就说：可以请教你 15 分钟吗？",
  "citations": ["Boss直聘数据：AI本地化审校岗位90天内增长41%"],
  "data_mode": "snapshot"
}
```

---

---

## Task-11｜DISPLACE 结果生成（Path B）

**执行人**：曹梦怡（AI 层）  
**触发时机**：Path B 用户完成镜子确认后调用  
**输入**：`direction_tag`、`stage_tag`、`uncertainty_signal`、`need_type`、`market_snapshot`  
**输出**：压力区间 + 市场信号 + 距离测量 + 阶段轨迹  
**预估 token**：prompt ~1,000 + inputs ~400 + market_snapshot ~2,000 + output ~900 = ~4,300 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path B 结果页更务实：压力区间附注「你已经在移动，区间比起点的人低」；
            优先展示市场信号和距离测量，而非情绪安慰。
【输出格式】严格 JSON，不加解释。
【数据声明】data_mode="snapshot"，显示「当前为样例推演」。

方向标签：{{direction_tag}}
当前阶段：{{stage_tag}}
拿不准的信号：{{uncertainty_signal}}
需求类型：{{need_type}}（data / person）

市场快照数据：
{{market_snapshot}}

请完成：
1. 置换压力区间（比 Path A 平均低 10-15 分）+ 附注文字
2. 市场信号（基于 direction_tag 和市场快照，2 句以内）
3. 能力距离测量：用户有什么 / 还缺什么 / 最快补位方式
4. 走这条路的人通常经历的 3-4 个阶段（每阶段 10 字以内）
5. 本周最小行动建议
6. 根据 need_type 设置 priority_section：data 则岗位数据置顶，person 则 agent 匹配置顶

输出 JSON：
{
  "displacement_range": [0, 0],
  "range_note": "你已经在移动，区间比起点的人低",
  "market_signal": "",
  "has_skills": [],
  "lacks_skills": [],
  "fastest_path": "",
  "trajectory_stages": [],
  "weekly_action": "",
  "priority_section": "",
  "citations": [],
  "data_mode": "snapshot"
}
```

---

### 兜底模板 B-DISPLACE

```json
{
  "displacement_range": [55, 65],
  "range_note": "你已经在移动，区间比起点的人低",
  "market_signal": "AI产品运营方向过去90天岗位需求增长28%，核心需求技能是：用户洞察、内容策划、跨团队协作。",
  "has_skills": ["用户同理心", "跨文化表达", "内容感知力"],
  "lacks_skills": ["基础产品工具（Figma/Notion）", "数据分析思维"],
  "fastest_path": "找一份哪怕不完全对口的 AI 内容实习，用 3 个月换到真实的产品认知",
  "trajectory_stages": ["感到迷茫，开始探索", "找到第一个不对口但感兴趣的实习", "从用户变成参与者", "找到自己的生态位"],
  "weekly_action": "今天打开 Figma，完成一个任意页面的低保真原型，哪怕是你自己的简历页。",
  "priority_section": "person",
  "citations": ["Boss直聘数据：AI产品运营岗位90天增长28%"],
  "data_mode": "snapshot"
}
```

---

---

## Task-12｜Agent 匹配文案生成（Path A）

**执行人**：曹梦怡（AI 层）  
**触发时机**：Task-10 完成后，orchestrator 完成候选节点筛选和排名后调用  
**输入**：`match_reason`（orchestrator 生成的匹配理由）  
**输出**：展示给用户的那一句话 + 信号按钮文案  
**上下文需求**：极低（只需 match_reason）  
**预估 token**：prompt ~600 + match_reason ~200 + output ~200 = ~1,000 token

---

### 说明

> Task-12 只负责最后一步：把 orchestrator 生成的结构化 `match_reason` 压缩为用户看到的那一句话。
> 候选节点筛选（filter/rank/select）由 orchestrator 手写规则完成，不在此任务中。

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path A 匹配的是灯塔节点（走出来的人）。
            这句话要让 Path A 用户感到：有一个真实的人，曾经和我一样，现在走出来了，她愿意和我说话。
【输出格式】严格 JSON，不加解释。
【格式约束】agent_message 严格控制在 1 句话，不超过 50 字。

orchestrator 生成的匹配理由：
{{match_reason}}

请将 match_reason 压缩为一句展示给用户的话，格式参考：
「我们找到了一个人。___个月前，她的处境和你几乎一样：___。她现在在做___。她愿意和你说一句话。」

同时输出信号按钮文案（固定）。

输出 JSON：
{
  "agent_message": "",
  "signal_button_text": "我想听她说的那句话",
  "fallback_used": false
}
```

---

### 兜底模板 A-Agent

```json
{
  "agent_message": "我们找到了一个人。六个月前，她也是外语专业学生，不知道下一步在哪里。她现在在北京做 AI 产品运营，她愿意和你说一句话。",
  "signal_button_text": "我想听她说的那句话",
  "fallback_used": true
}
```

---

---

## Task-13｜Agent 匹配文案生成（Path B）

**执行人**：曹梦怡（AI 层）  
**触发时机**：Task-11 完成后，orchestrator 完成候选节点筛选后调用  
**输入**：`match_reason`  
**输出**：展示给用户的那一句话 + 信号按钮文案  
**预估 token**：~1,000 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】Path B 匹配的是同路先行者（走在前面半步的人）。
            这句话要让 Path B 用户感到：有个人在走和我几乎一样的路，他比我早了一点，他愿意和我说话。
【输出格式】严格 JSON，不加解释。
【格式约束】agent_message 严格控制在 1 句话，不超过 50 字。

orchestrator 生成的匹配理由：
{{match_reason}}

请将 match_reason 压缩为一句展示给用户的话，格式参考：
「有个人正在走和你几乎一样的路：___。他比你早了___个月，现在到了___这个节点。他愿意和你说一句话。」

输出 JSON：
{
  "agent_message": "",
  "signal_button_text": "我们走的是同一条路",
  "fallback_used": false
}
```

---

### 兜底模板 B-Agent

```json
{
  "agent_message": "有个人正在走和你几乎一样的路：从外语转向 AI 内容运营。他比你早了三个月，现在刚拿到第一份相关实习。他愿意和你说一句话。",
  "signal_button_text": "我们走的是同一条路",
  "fallback_used": true
}
```

---

---

# GROUP 6｜兜底层

---

## Task-14｜全路径 Fallback 模板库生成

**执行人**：王文钦 Ellie（产品）  
**触发时机**：项目初始化，写入代码仓库 `/data/fallback_templates.json`  
**用途**：所有任务 AI 调用失败时的回退内容，必须纳入代码仓库管理  
**上下文需求**：极低（纯生成任务）  
**预估 token**：prompt ~800 + output ~2,000 = ~2,800 token

---

### Prompt

```
【产品定位】MOLT，面向 AI 时代身份过渡期年轻人的社交社区。
【语气原则】锋利但不冷漠，克制但不说教。
【输出格式】严格 JSON，不加解释。

请为 MOLT 生成各关键节点的 Fallback 模板，每个节点至少 3 套，按 index 区分（0/1/2）。

需要覆盖的节点：
- path_a_q1：Path A 第一幕问题
- path_a_q2：Path A 第二幕问题（通用版，不嵌入用户原话）
- path_a_q3：Path A 第三幕问题
- path_a_mirror：Path A 镜子复述（三行版）
- path_b_q1：Path B 第一幕问题
- path_b_q2：Path B 第二幕问题
- path_b_q3：Path B 第三幕（含两个选项）
- path_b_mirror：Path B 诊断摘要
- path_c_summary：Path C 轨迹摘要卡
- agent_a：Path A Agent 匹配文案
- agent_b：Path B Agent 匹配文案

输出 JSON：
{
  "path_a_q1": [{"index": 0, "question": "", "hint": ""}, ...],
  "path_a_q2": [{"index": 0, "question": ""}, ...],
  "path_a_q3": [{"index": 0, "question": ""}],
  "path_a_mirror": [{"index": 0, "line1": "", "line2": "", "line3": ""}, ...],
  "path_b_q1": [{"index": 0, "question": "", "hint": ""}, ...],
  "path_b_q2": [{"index": 0, "question": ""}, ...],
  "path_b_q3": [{"index": 0, "question": "", "option_data": "给我数据", "option_person": "给我一个人"}],
  "path_b_mirror": [{"index": 0, "doing": "", "uncertain": "", "need": ""}, ...],
  "path_c_summary": [{"index": 0, "start_point": "", "turning_point": "", "current_state": "", "light_message": ""}, ...],
  "agent_a": [{"index": 0, "message": ""}, ...],
  "agent_b": [{"index": 0, "message": ""}, ...]
}
```

---

---

# 技术拼装说明

## 关键字段传递链

```
session.pathType          → 所有后续任务的路由依据
Task-04.emotion_tags      → Task-06 输入
Task-05.fear_tags         → Task-06、Task-10 输入
Task-05.connection_type   → Task-12 中 orchestrator 匹配权重
Task-06.mirror_summary    → Task-10 输入
Task-07.direction_tag     → Task-08、Task-11、Task-13 输入
Task-07.need_type         → Task-08、Task-11 输入（结果页布局决策）
Task-08.mirror_summary    → Task-11 输入
Task-09.light_message     → 地图节点展示字段（直接写入 graph_nodes 表）
Task-10/11 输出           → 结果页渲染
Task-12/13 输出           → Agent 推荐卡渲染
```

## 接口复用原则

- Task-03/04/05 可合并为单一 `/api/dialogue/turn` 接口，用 `scene_index` 区分调用分支
- Task-07 三幕可合并为同一接口，Path B 专属参数通过 `pathType` 区分
- Task-12/13 统一由 `/api/agent-match` 接口处理，`pathType` 决定文案语气

## Fallback 触发规则

- AI 超时（> 8秒）或报错 → 立即触发对应节点的 Fallback 模板
- Fallback 模板按 `index = Math.floor(Math.random() * 3)` 随机取，保证多样性
- Demo 模式（`DEMO_MODE=true`）→ 所有节点直接返回 `index=0` 的模板，跳过 AI 调用
- 每次 Fallback 触发必须向终端输出触发原因，禁止静默降级

---

*MOLT Task Decomposition v1.0 | 2026-03-20 | 王文钦 Ellie*
*「把一件大事，拆成十四件小事。拼起来，还是那件大事。」*
