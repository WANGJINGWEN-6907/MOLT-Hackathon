import type { PathType, Question } from '@/types';

/**
 * 对话数据定义
 * 包含三条路径（A/B/C）的问题列表
 */

// Path A - 挣扎路径
export const pathAQuestions: Question[] = [
  {
    index: 0,
    text: '在你开始感到不确定之前，有没有一个具体的时刻？',
    placeholder: '可以是工作、生活、或者内心的感受...'
  },
  {
    index: 1,
    text: '你觉得自己现在卡在哪里了？',
    placeholder: '试着描述那种"动弹不得"的感觉...'
  },
  {
    index: 2,
    text: '如果可以，你最想改变的是什么？',
    placeholder: '不用考虑可行性，只是想象一下...'
  },
  {
    index: 3,
    text: '有什么是你现在还能做的，哪怕很小？',
    placeholder: '可能是一个念头，一个行动，或者一个选择...'
  }
];

// Path B - 挣脱路径
export const pathBQuestions: Question[] = [
  {
    index: 0,
    text: '你现在手里有什么？',
    placeholder: '技能、资源、经验、人脉...'
  },
  {
    index: 1,
    text: '你想去哪里？',
    placeholder: '可以是具体的目标，也可以是模糊的方向...'
  },
  {
    index: 2,
    text: '你已经做了什么尝试？',
    placeholder: '哪怕是很小的行动，都值得记录...'
  },
  {
    index: 3,
    text: '现在最大的不确定是什么？',
    placeholder: '是方向、资源、还是信心？'
  }
];

// Path C - 回望路径
export const pathCQuestions: Question[] = [
  {
    index: 0,
    text: '你是从哪个时刻开始感觉到转变的？',
    placeholder: '可能是一个决定，一次对话，或者一个瞬间...'
  },
  {
    index: 1,
    text: '在过渡期最困难的时候，是什么支撑你走下来的？',
    placeholder: '可以是人、事、或者内心的某种力量...'
  },
  {
    index: 2,
    text: '现在回头看，你觉得那段经历给你带来了什么？',
    placeholder: '可能是成长、认知、或者新的可能性...'
  },
  {
    index: 3,
    text: '如果可以对当时的自己说一句话，你会说什么？',
    placeholder: '一句鼓励、一个提醒、或者一个拥抱...'
  },
  {
    index: 4,
    text: '你希望用什么方式帮助到正在经历类似过渡的人？',
    placeholder: '分享经验、提供建议、或者只是陪伴...'
  }
];

/**
 * 根据路径类型获取问题列表
 */
export function getQuestionsByPath(pathType: PathType): Question[] {
  switch (pathType) {
    case 'A':
      return pathAQuestions;
    case 'B':
      return pathBQuestions;
    case 'C':
      return pathCQuestions;
    default:
      return [];
  }
}

/**
 * 路径描述
 */
export const pathDescriptions = {
  A: {
    title: '挣扎',
    mainText: '「我知道自己的专业要消失了\n但我不知道下一步在哪里」',
    cta: '我有点像这个',
    tone: '慢、温、情绪承接'
  },
  B: {
    title: '挣脱',
    mainText: '「我已经在行动了，但不确定\n自己走的方向对不对」',
    cta: '我有点像这个',
    tone: '快、平等、务实'
  },
  C: {
    title: '回望',
    mainText: '「我走出来了，但我想让\n后来的人少走弯路」',
    cta: '我有点像这个',
    tone: '郑重、受邀、采访感'
  }
};
