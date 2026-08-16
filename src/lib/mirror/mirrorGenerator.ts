import type { Conversation, PathType } from '@/types';

/**
 * Path A 镜像数据结构（情绪式复述）
 */
export interface PathAMirror {
  line1: string; // "你说你___"
  line2: string; // "你说你不知道___"
  line3: string; // "你问的那个问题，其实是：___"
}

/**
 * Path B 镜像数据结构（方向诊断摘要）
 */
export interface PathBMirror {
  doing: string; // 正在做的事
  uncertain: string; // 不确定的点
  need: string; // 需要的支持
}

/**
 * Path C 镜像数据结构（轨迹摘要确认）
 */
export interface PathCMirror {
  startPoint: string; // 起点
  turningPoint: string; // 转折点
  currentState: string; // 当前状态
  lightMessage: string; // 灯塔留言
}

/**
 * 镜像摘要结果（统一接口）
 */
export interface MirrorSummary {
  pathType: PathType;
  data: PathAMirror | PathBMirror | PathCMirror | null;
  fallbackUsed: boolean; // 是否使用了兜底模板
}

/**
 * 提取文本的关键信息（简单的文本摘要）
 */
function extractKeyPhrase(text: string, maxLength: number): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // 移除常见的冗余词汇
  const cleaned = text
    .replace(/我觉得|我认为|可能|大概|应该|好像/g, '')
    .trim();

  // 如果超长，截取前 N 个字符
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }

  return cleaned;
}

/**
 * 生成 Path A 的情绪式复述
 */
export function generatePathAMirror(conversations: Conversation[]): PathAMirror {
  // 兜底模板
  const fallback: PathAMirror = {
    line1: '你说你感觉有些迷茫',
    line2: '你说你不知道该怎么办',
    line3: '你问的那个问题，其实是：我还能站在哪里？',
  };

  if (conversations.length === 0) {
    return fallback;
  }

  // 提取第一个回答的核心内容（Q1: 不确定的时刻）
  const answer1 = conversations.find((c) => c.question_index === 0)?.answer_text || '';
  const line1Text = extractKeyPhrase(answer1, 20);
  const line1 = line1Text ? `你说你${line1Text}` : fallback.line1;

  // 提取第二个回答的核心困惑（Q2: 卡在哪里）
  const answer2 = conversations.find((c) => c.question_index === 1)?.answer_text || '';
  const line2Text = extractKeyPhrase(answer2, 20);
  const line2 = line2Text ? `你说你不知道${line2Text}` : fallback.line2;

  // 提取第三个回答，重构真实问题（Q3: 想改变什么）
  const answer3 = conversations.find((c) => c.question_index === 2)?.answer_text || '';
  const line3Text = extractKeyPhrase(answer3, 25);

  // 尝试将用户的愿望转化为问题形式
  let line3 = fallback.line3;
  if (line3Text) {
    // 如果包含"想"、"希望"等词，转化为"我如何..."的问题形式
    if (line3Text.includes('想') || line3Text.includes('希望')) {
      const wish = line3Text.replace(/想|希望/g, '').trim();
      line3 = `你问的那个问题，其实是：我如何${wish}？`;
    } else {
      line3 = `你问的那个问题，其实是：${line3Text}`;
    }
  }

  return { line1, line2, line3 };
}

/**
 * 生成 Path B 的方向诊断摘要
 */
export function generatePathBMirror(conversations: Conversation[]): PathBMirror {
  // 兜底模板
  const fallback: PathBMirror = {
    doing: '尝试探索新方向',
    uncertain: '不确定这条路是否可行',
    need: '需要更清晰的方向指引',
  };

  if (conversations.length === 0) {
    return fallback;
  }

  // 提取 Q1: 现在手里有什么（资源）
  const answer1 = conversations.find((c) => c.question_index === 0)?.answer_text || '';
  // 提取 Q2: 想去哪里（方向）
  const answer2 = conversations.find((c) => c.question_index === 1)?.answer_text || '';
  // 提取 Q3: 已经做了什么尝试（行动）
  const answer3 = conversations.find((c) => c.question_index === 2)?.answer_text || '';

  // doing: 综合 Q2 和 Q3，描述正在做的事
  let doing = fallback.doing;
  if (answer2 && answer3) {
    const direction = extractKeyPhrase(answer2, 15);
    const action = extractKeyPhrase(answer3, 15);
    doing = `尝试${direction}，${action}`;
  } else if (answer2) {
    doing = `想要${extractKeyPhrase(answer2, 30)}`;
  } else if (answer3) {
    doing = extractKeyPhrase(answer3, 40);
  }

  // uncertain: 提取 Q4: 最大的不确定（如果有的话，否则从 Q2 中提取）
  const answer4 = conversations.find((c) => c.question_index === 3)?.answer_text || '';
  let uncertain = fallback.uncertain;
  if (answer4) {
    uncertain = extractKeyPhrase(answer4, 40);
    if (!uncertain.includes('不确定') && !uncertain.includes('不知道')) {
      uncertain = `不确定${uncertain}`;
    }
  } else if (answer2.includes('不确定') || answer2.includes('不知道')) {
    uncertain = extractKeyPhrase(answer2, 40);
  }

  // need: 基于不确定性推断需求
  let need = fallback.need;
  if (uncertain.includes('方向') || uncertain.includes('路径')) {
    need = '需要更清晰的方向指引';
  } else if (uncertain.includes('资源') || uncertain.includes('背景') || uncertain.includes('经验')) {
    need = '需要资源或经验的支持';
  } else if (uncertain.includes('能力') || uncertain.includes('技能')) {
    need = '需要提升相关能力';
  } else if (answer1) {
    // 从现有资源中推断缺失
    need = `需要将${extractKeyPhrase(answer1, 15)}转化为可行路径`;
  }

  return {
    doing: doing.length > 50 ? doing.substring(0, 47) + '...' : doing,
    uncertain: uncertain.length > 50 ? uncertain.substring(0, 47) + '...' : uncertain,
    need: need.length > 50 ? need.substring(0, 47) + '...' : need,
  };
}

/**
 * 生成 Path C 的轨迹摘要确认
 */
export function generatePathCMirror(conversations: Conversation[]): PathCMirror {
  // 兜底模板
  const fallback: PathCMirror = {
    startPoint: '开始探索新的方向',
    turningPoint: '经历了一些转折',
    currentState: '正在继续前行',
    lightMessage: '希望能帮助到和我有相似经历的人',
  };

  if (conversations.length === 0) {
    return fallback;
  }

  // Q1: 转变的时刻（起点）
  const answer1 = conversations.find((c) => c.question_index === 0)?.answer_text || '';
  const startPoint = extractKeyPhrase(answer1, 50) || fallback.startPoint;

  // Q2: 最困难时的支撑（转折点）
  const answer2 = conversations.find((c) => c.question_index === 1)?.answer_text || '';
  const turningPoint = answer2
    ? `支撑我的是：${extractKeyPhrase(answer2, 40)}`
    : fallback.turningPoint;

  // Q3: 那段经历带来的收获（当前状态）
  const answer3 = conversations.find((c) => c.question_index === 2)?.answer_text || '';
  const currentState = extractKeyPhrase(answer3, 50) || fallback.currentState;

  // Q5: 帮助别人的方式（灯塔留言）
  const answer5 = conversations.find((c) => c.question_index === 4)?.answer_text || '';
  const lightMessage = extractKeyPhrase(answer5, 70) || fallback.lightMessage;

  return {
    startPoint: startPoint.length > 60 ? startPoint.substring(0, 57) + '...' : startPoint,
    turningPoint: turningPoint.length > 60 ? turningPoint.substring(0, 57) + '...' : turningPoint,
    currentState: currentState.length > 60 ? currentState.substring(0, 57) + '...' : currentState,
    lightMessage: lightMessage.length > 80 ? lightMessage.substring(0, 77) + '...' : lightMessage,
  };
}

/**
 * 统一接口：根据路径类型生成镜像摘要
 *
 * 注意：此函数为本地 deterministic 版本，未来可替换为 AI 生成版本。
 * AI 版本接口保持一致，但会调用后端 API。
 */
export function generateMirrorSummary(
  pathType: PathType,
  conversations: Conversation[]
): MirrorSummary {
  const fallbackUsed = conversations.length === 0;

  switch (pathType) {
    case 'A':
      return {
        pathType,
        data: generatePathAMirror(conversations),
        fallbackUsed,
      };
    case 'B':
      return {
        pathType,
        data: generatePathBMirror(conversations),
        fallbackUsed,
      };
    case 'C':
      return {
        pathType,
        data: generatePathCMirror(conversations),
        fallbackUsed,
      };
    default:
      return {
        pathType,
        data: null,
        fallbackUsed: true,
      };
  }
}

/**
 * AI 版本生成接口（预留，暂未实现）
 *
 * 此函数未来将调用后端 API，使用 LLM 生成更精准的镜像摘要。
 * 接口签名保持与 generateMirrorSummary 一致。
 */
export async function generateMirrorSummaryWithAI(
  pathType: PathType,
  conversations: Conversation[]
): Promise<MirrorSummary> {
  // TODO: 实现 AI 版本
  // 1. 调用后端 API /api/mirror/generate
  // 2. 传入 pathType 和 conversations
  // 3. 解析返回的结构化数据
  // 4. 如果 API 失败，fallback 到本地版本

  console.warn('AI 版本暂未实现，使用本地版本');
  return generateMirrorSummary(pathType, conversations);
}
