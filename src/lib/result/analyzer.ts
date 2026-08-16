/**
 * Result Analyzer - 结果分析管线
 * 纯函数实现，易于测试
 */

import type { PathType, PressureLevel } from '@/types';
import type {
  AnalysisResult,
  ConversationInput,
  PathAAnalysis,
  PathBAnalysis,
  PressureAnalysisParams,
} from './types';

/**
 * 准备对话输入数据
 */
function prepareConversationInput(answers: string[]): ConversationInput {
  const totalLength = answers.join('').length;
  const questionCount = answers.length;
  const averageLength = questionCount > 0 ? totalLength / questionCount : 0;

  return {
    answers,
    questionCount,
    averageLength,
    totalLength,
  };
}

/**
 * 分析压力等级
 */
function analyzePressureLevel(params: PressureAnalysisParams): PressureLevel {
  const { totalLength, answerCount } = params;

  if (answerCount === 0) return 'medium';

  const avgLength = totalLength / answerCount;

  // 高压力：长篇回答 (人均 > 50 字) 或总长度很长 (> 200 字)
  if (avgLength > 50 || totalLength > 200) {
    return 'high';
  }

  // 低压力：非常简短回答 (人均 < 8 字) 且总长度短 (< 25 字)
  if (avgLength < 8 && totalLength < 25) {
    return 'low';
  }

  return 'medium';
}

/**
 * 提取关键词（简单实现）
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lowercaseText = text.toLowerCase();

  const emotionKeywords = ['焦虑', '困惑', '迷茫', '害怕', '不安', '压力', '担心'];
  const actionKeywords = ['尝试', '学习', '行动', '实验', '测试', '探索'];
  const directionKeywords = ['方向', '目标', '计划', '想法', '转行', '转型'];

  for (const keyword of [...emotionKeywords, ...actionKeywords, ...directionKeywords]) {
    if (lowercaseText.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

/**
 * 分析 Path A - 挣扎路径
 */
export function analyzePathA(answers: string[]): PathAAnalysis {
  if (answers.length === 0) {
    return createPathAFallback();
  }

  const input = prepareConversationInput(answers);
  const allText = answers.join(' ');
  const keywords = extractKeywords(allText);

  const pressureLevel = analyzePressureLevel({
    totalLength: input.totalLength,
    answerCount: input.questionCount,
    keywords,
  });

  // 结构性压力分析
  const structuralPressure = {
    economicFactors: keywords.includes('压力') || keywords.includes('焦虑')
      ? ['经济环境变化带来的不确定性', '收入稳定性担忧']
      : [],
    industryChanges: keywords.includes('方向') || keywords.includes('转行')
      ? ['行业快速迭代', '技能贬值压力']
      : [],
    personalCircumstances: keywords.includes('困惑') || keywords.includes('迷茫')
      ? ['个人职业定位不清', '转型路径模糊']
      : [],
  };

  // 个体行动建议
  const individualActions = {
    emotionalSupport:
      pressureLevel === 'high'
        ? [
            '寻找信任的朋友或咨询师，倾诉你的感受',
            '加入支持性社群，与同样经历转型的人交流',
          ]
        : ['定期与朋友交流，分享你的进展'],
    smallSteps:
      pressureLevel === 'high'
        ? [
            '每天花 10 分钟记录自己的感受和想法',
            '尝试做一件小事，哪怕只是整理房间',
          ]
        : ['设定一个本周可完成的小目标', '每天留出时间思考和规划'],
    reflectionPrompts: [
      '什么时刻你感到最有活力？',
      '过去哪些经历让你感到自豪？',
      '如果没有任何限制，你会做什么？',
    ],
  };

  // 生成压力描述
  let pressureDescription = '';
  if (pressureLevel === 'high') {
    pressureDescription =
      '你正处于高压力状态，感受到强烈的困顿和不确定。这是正常的，很多人在换壳初期都会经历这个阶段。重要的是，这种压力是可以被理解和承接的。';
  } else if (pressureLevel === 'medium') {
    pressureDescription =
      '你处于中等压力状态，虽然感到迷茫，但还保持着一定的行动力。这个阶段需要温和地面对自己的感受，同时采取小步行动。';
  } else {
    pressureDescription =
      '你的压力相对较低，这是一个好的起点。保持对自己状态的觉察，继续探索适合自己的节奏。';
  }

  return {
    pressureLevel,
    pressureDescription,
    abilities: ['自我觉察能力', '情绪表达能力', '反思能力'],
    marketSignals:
      '当前市场正在经历快速变化，但同时也在创造新的机会。你的困境可能正是转型的信号。重要的是理解：这不仅是个人问题，而是结构性变化带来的普遍挑战。',
    actionSuggestions: [
      ...individualActions.emotionalSupport.slice(0, 1),
      ...individualActions.smallSteps.slice(0, 1),
      individualActions.reflectionPrompts[0],
    ],
    structuralPressure,
    individualActions,
    isFallback: false,
  };
}

/**
 * 分析 Path B - 挣脱路径
 */
export function analyzePathB(answers: string[]): PathBAnalysis {
  if (answers.length === 0) {
    return createPathBFallback();
  }

  const input = prepareConversationInput(answers);
  const allText = answers.join(' ');
  const keywords = extractKeywords(allText);

  // Path B 压力等级判断（行动导向，压力相对较低）
  const pressureLevel: PressureLevel = input.totalLength > 100 ? 'medium' : 'low';

  // 方向验证
  const hasDirection = keywords.includes('方向') || keywords.includes('目标');
  const hasAction = keywords.includes('尝试') || keywords.includes('学习') || keywords.includes('行动');

  const directionValidation = {
    currentDirection: hasDirection
      ? '你已经开始探索多个方向，这是好的开始'
      : '方向还在探索中，建议通过小规模实验来验证',
    alignmentScore: hasDirection && hasAction ? 70 : hasAction ? 50 : 30,
    adjustmentNeeded: !hasAction,
  };

  // 最小可行行动
  const minimalActions = {
    immediateSteps: [
      '列出你已有的资源和技能清单',
      '选择 1-2 个感兴趣的方向，做 7 天小规模测试',
    ],
    resourceMapping: [
      '技能：盘点你的核心技能和可迁移技能',
      '人脉：找出可以提供建议或机会的 3-5 个关键联系人',
      '时间：每天分配 1-2 小时用于新方向探索',
    ],
    experimentIdeas: [
      '写 5 篇相关主题的文章或帖子，测试市场反应',
      '参加 2-3 个相关行业活动或线上社群',
      '做 3 个小项目或案例，建立作品集',
    ],
  };

  // 生成压力描述
  let pressureDescription = '';
  if (pressureLevel === 'medium') {
    pressureDescription =
      '你已经开始行动，虽然方向还不完全清晰，但这份勇气值得肯定。现在需要的是通过快速迭代来验证方向。';
  } else {
    pressureDescription = '你的状态不错，保持这份行动力，方向会逐渐清晰。关键是持续实验和调整。';
  }

  return {
    pressureLevel,
    pressureDescription,
    abilities: ['行动力', '资源整合能力', '学习能力', '适应能力'],
    marketSignals:
      '市场正在奖励那些敢于尝试和快速迭代的人。你的探索精神是宝贵的资产。当前环境虽然充满不确定性，但也意味着更多的机会窗口。',
    actionSuggestions: [
      ...minimalActions.immediateSteps,
      '加入 1-2 个相关社群，与同行者交流',
    ],
    directionValidation,
    minimalActions,
    isFallback: false,
  };
}

/**
 * 通用分析函数（路由到具体路径）
 */
export function analyzeConversation(
  answers: string[],
  pathType: PathType,
): PathAAnalysis | PathBAnalysis {
  if (pathType === 'A') {
    return analyzePathA(answers);
  }

  if (pathType === 'B') {
    return analyzePathB(answers);
  }

  // Path C 或其他：返回 fallback
  return createPathAFallback(); // 默认返回 Path A 结构
}

/**
 * 创建 Path A fallback 数据
 */
function createPathAFallback(): PathAAnalysis {
  return {
    pressureLevel: 'medium',
    pressureDescription: '我们还需要更多信息来进行分析。请完成对话流程。',
    abilities: ['自我觉察能力'],
    marketSignals: '市场环境正在变化，需要更多信息来提供具体分析。',
    actionSuggestions: ['完成对话流程以获得个性化建议'],
    structuralPressure: {
      economicFactors: [],
      industryChanges: [],
      personalCircumstances: [],
    },
    individualActions: {
      emotionalSupport: [],
      smallSteps: [],
      reflectionPrompts: [],
    },
    isFallback: true,
  };
}

/**
 * 创建 Path B fallback 数据
 */
function createPathBFallback(): PathBAnalysis {
  return {
    pressureLevel: 'medium',
    pressureDescription: '我们还需要更多信息来进行分析。请完成对话流程。',
    abilities: ['行动力'],
    marketSignals: '市场环境正在变化，需要更多信息来提供具体分析。',
    actionSuggestions: ['完成对话流程以获得个性化建议'],
    directionValidation: {
      currentDirection: '方向待确定',
      alignmentScore: 0,
      adjustmentNeeded: true,
    },
    minimalActions: {
      immediateSteps: [],
      resourceMapping: [],
      experimentIdeas: [],
    },
    isFallback: true,
  };
}
