import type { PathType } from '@/types'

export interface DemoMirror {
  startPoint: string
  turningPoint: string
  currentState: string
  lightMessage: string
}

export interface DemoResult {
  corePattern: string
  agentMatch: string
  readinessScore: number
  nextStep: string
}

export interface DemoPreset {
  pathType: PathType
  qa_pairs: { question: string; answer: string }[]
  mirror: DemoMirror
  result: DemoResult
}

export const DEMO_PRESET: DemoPreset = {
  pathType: 'A',
  qa_pairs: [
    {
      question: '在你开始感到不确定之前，有没有一个具体的时刻？',
      answer:
        '是去年Q3的时候，我们产品团队被通知要用AI工具替代三分之一的需求分析工作。我当时坐在会议室里，感觉像是在旁观自己的工作被重新定义。',
    },
    {
      question: '那个时刻之后，你内心发生了什么变化？',
      answer:
        '我开始质疑自己五年积累的方法论是否还有价值。以前我擅长的用户访谈、需求拆解，现在AI几秒钟就能给出框架。我不知道自己的「不可替代性」在哪里。',
    },
    {
      question: '在这段迷茫中，有没有什么让你感到还有方向的事情？',
      answer:
        '有一次我用AI辅助做了一个方案，但客户说「你的判断让这个方案有了温度」。我突然意识到，也许我的价值不在于生产框架，而在于理解人。',
    },
    {
      question: '「理解人」对你现在意味着什么？',
      answer:
        '我开始觉得，产品经理的核心可能不是流程和方法，而是对人性的洞察——AI无法复制那种真实的共情。我想往这个方向重新定义自己。',
    },
    {
      question: '如果给现在的自己一句话，你会说什么？',
      answer:
        '「你的价值不在于你做了什么，而在于你看见了什么。」我想成为那种能看见别人看不见的东西的人。',
    },
  ],
  mirror: {
    startPoint: '五年资深产品经理，方法论扎实，擅长用户研究与需求拆解',
    turningPoint:
      '团队被通知AI将替代三分之一需求分析工作，会议室里感受到职业身份被重新定义',
    currentState:
      '正在从「方法论执行者」向「人性洞察者」转型，发现共情与判断是AI无法复制的核心',
    lightMessage: '你的价值不在于你做了什么，而在于你看见了什么',
  },
  result: {
    corePattern: '从工具型专家向洞察型领导者的身份跃迁',
    agentMatch: '人性理解型 AI 协作者',
    readinessScore: 78,
    nextStep:
      '选择一个真实用户问题，用「AI生成方案 + 你的判断修正」模式做一次完整输出，记录下AI做不到的那部分',
  },
}
