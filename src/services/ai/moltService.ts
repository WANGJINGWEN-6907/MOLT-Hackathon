import { z } from 'zod'
import { ACT_TITLES, FALLBACK_ACT1, FALLBACK_ACT2, FALLBACK_ACT3, getFallbackCardsForAct } from '@/data/fallbackCards'
import { matchAgentV32, type MatchResult } from '@/lib/agent'
import { assignCluster } from '@/lib/clustering/semanticCluster'
import { createProfileEmbedding } from '@/lib/semantic/profileEmbedding'
import { staticMapNodes } from '@/lib/staticData'
import type {
  EmbedRequest,
  EmbedResponse,
  MatchV32Request,
  MemoryImport,
  MemoryImportRequest,
  MoltCard,
  MoltCardsRequest,
  MoltCardsResponse,
  MoltExperienceService,
  MoltServiceResponse,
  ProfileSynthRequest,
  ProfileSynthResponse,
  UserProfile,
} from '@/types'

const profileExtractSchema = z.object({
  anxiety_type: z.string().optional(),
  major_field: z.string().optional(),
  career_status: z.string().optional(),
  action_stage: z.string().optional(),
  actions_taken: z.array(z.string()).optional(),
  direction: z.string().optional(),
  help_needed: z.string().optional(),
  education_stage: z.string().optional(),
})

const moltCardSchema = z.object({
  id: z.string(),
  line1: z.string(),
  line2: z.string(),
  tags: z.array(z.string()),
  profileFields: profileExtractSchema,
  isCustom: z.boolean().optional(),
  depth: z.enum(['surface', 'middle', 'deep']).optional(),
})

const cardsResponseSchema = z.object({
  cards: z.array(moltCardSchema).min(4).max(6),
})

function createResponse<T>(
  kind: MoltServiceResponse<T>['kind'],
  data: T,
  options?: Partial<Pick<MoltServiceResponse<T>, 'fallbackUsed' | 'dataMode' | 'error' | 'provider'>>,
): MoltServiceResponse<T> {
  return {
    kind,
    data,
    provider: options?.provider ?? 'local-molt',
    fallbackUsed: options?.fallbackUsed ?? false,
    dataMode: options?.dataMode ?? 'mock',
    error: options?.error,
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function clip(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

const MAJOR_KEYWORDS = [
  { value: '文科', keywords: ['文科', '翻译', '语言', '新闻', '编辑', '老师', '传播', '媒体', '教育'] },
  { value: '理工科', keywords: ['理工', '技术', '开发', '工程', '算法', '后端', '前端', '云', '平台'] },
  { value: '商科', keywords: ['商科', '运营', '品牌', '营销', '销售', '电商', '客户成功', '咨询'] },
  { value: '艺术', keywords: ['艺术', '设计', '建筑', '视频', '创作', '视觉'] },
]

const CAREER_STATUS_KEYWORDS = [
  { value: '在校求职中', keywords: ['在校', '找实习', '找校招'] },
  { value: '实习中', keywords: ['实习', 'intern'] },
  { value: '已工作想转型', keywords: ['转型', '跳槽', '已经工作', '在职'] },
  { value: '待业中', keywords: ['待业', '失业', '没工作', '离职'] },
]

const EDUCATION_STAGE_KEYWORDS = [
  { value: '大一大二', keywords: ['大一', '大二'] },
  { value: '大三大四', keywords: ['大三', '大四'] },
  { value: '研究生在读', keywords: ['研究生', '研一', '研二'] },
  { value: '应届毕业', keywords: ['应届', '毕业', '校招'] },
  { value: '毕业1-3年', keywords: ['毕业一年', '毕业两年', '毕业三年', '工作两年'] },
]

const ANXIETY_KEYWORDS = [
  { value: 'AI替代焦虑', keywords: ['AI 替代', 'AI替代', '被 AI 取代', '被AI取代', '自动化', '工具冲击', 'AI翻译'] },
  { value: '投简历没回音', keywords: ['投简历', '没回音', '没回复', '已读不回', '海投'] },
  { value: '面试过不了', keywords: ['面试过不了', '面试挂了', '终面'] },
  { value: '专业冷门', keywords: ['专业冷门', '课题冷门', '行业太窄'] },
  { value: '行业缩招', keywords: ['缩招', 'hc 少', '岗位变少', '行业下行'] },
  { value: '技能过时', keywords: ['技能过时', '技术栈旧', '过期'] },
  { value: '方向迷茫', keywords: ['方向迷茫', '不知道方向', '选错'] },
  { value: '同辈压力', keywords: ['同辈压力', '别人都在', '同龄人'] },
  { value: '不知道能做什么', keywords: ['不知道能做什么', '不知道该找什么', '什么都不会'] },
]

const ACTION_KEYWORDS = [
  { value: '学新技能', keywords: ['学', '课程', '补课', '训练营'] },
  { value: '投简历', keywords: ['投简历', '投递', '海投'] },
  { value: '做项目', keywords: ['做项目', '作品集', '案例拆解'] },
  { value: '找前辈聊', keywords: ['前辈', '过来人', '聊聊', '1对1'] },
  { value: '参加社群', keywords: ['社群', '群里', '社区'] },
  { value: '考证', keywords: ['考证', '证书'] },
  { value: '做副业', keywords: ['副业', '接单', '接案'] },
]

const DIRECTION_KEYWORDS = [
  { value: '产品', keywords: ['产品', '产品经理'] },
  { value: '运营', keywords: ['运营', '品牌', '增长', '社媒'] },
  { value: '技术', keywords: ['技术', '工程', '开发', '平台'] },
  { value: '设计', keywords: ['设计', 'UX', 'UI', '交互'] },
  { value: '内容', keywords: ['内容', '写作', '编辑', '视频', '创作'] },
  { value: '研究', keywords: ['研究', '咨询', '分析'] },
  { value: '数据', keywords: ['数据', '分析师', 'BI'] },
  { value: '教育', keywords: ['教育', '教学', '课程'] },
  { value: '咨询', keywords: ['咨询', '顾问'] },
  { value: '自由职业', keywords: ['自由职业', '独立', '接案'] },
]

const HELP_KEYWORDS = [
  { value: '想找过来人聊', keywords: ['过来人', '前辈', '聊聊', '有人带'] },
  { value: '想看同类人去向', keywords: ['同类人', '去了哪里', '类似的人'] },
  { value: '想要方向建议', keywords: ['方向建议', '第一步', '该往哪走'] },
  { value: '想要信心确认', keywords: ['确认', '走得通', '信心', '被看见'] },
]

function inferSingle(text: string, dictionary: Array<{ value: string; keywords: string[] }>, fallback?: string): string | undefined {
  const source = normalizeText(text)
  const hit = dictionary.find((entry) => entry.keywords.some((keyword) => source.includes(keyword)))
  return hit?.value ?? fallback
}

function inferMulti(text: string, dictionary: Array<{ value: string; keywords: string[] }>): string[] {
  const source = normalizeText(text)
  return unique(
    dictionary
      .filter((entry) => entry.keywords.some((keyword) => source.includes(keyword)))
      .map((entry) => entry.value),
  )
}

function inferPersonality(text: string): string[] {
  const source = normalizeText(text)
  const personality = unique([
    source.includes('谨慎') || source.includes('慢') ? '谨慎' : '',
    source.includes('自省') || source.includes('反思') ? '自省' : '',
    source.includes('执行') || source.includes('行动') ? '有执行力' : '',
    source.includes('敏感') || source.includes('细腻') ? '敏感细腻' : '',
    source.includes('内向') ? '偏内向' : '',
  ])

  return personality.length > 0 ? personality : ['自省', '谨慎']
}

function inferStrength(text: string, majorField?: string, direction?: string): string {
  if (direction === '产品') return '能把零散的信息整理成对人有帮助的结构'
  if (direction === '运营') return '对人和内容之间的连接关系很敏感'
  if (direction === '技术') return '能把复杂问题拆开，一步步补齐能力'
  if (direction === '设计') return '能把感受和结构同时看见'
  if (majorField === '文科') return '表达、理解和共情能力仍然很有价值'
  if (majorField === '理工科') return '分析、搭建和解决问题的能力仍然稳固'
  return sourceIncludes(text, ['长期主义', '稳定'])
    ? '愿意慢慢把事情做实'
    : '能在变化里继续观察自己真正擅长什么'
}

function sourceIncludes(source: string, keywords: string[]): boolean {
  return keywords.some((keyword) => source.includes(keyword))
}

function inferConfidence(text: string): number {
  const source = normalizeText(text)
  let score = 55
  if (sourceIncludes(source, ['很慌', '焦虑', '害怕', '没底'])) score -= 12
  if (sourceIncludes(source, ['已经开始', '试过', '做了', '正在'])) score += 10
  if (sourceIncludes(source, ['还是想', '仍然想', '希望'])) score += 5
  return Math.max(25, Math.min(85, score))
}

function inferActionStage(text: string, actionsTaken: string[]): string {
  const source = normalizeText(text)
  if (sourceIncludes(source, ['快落地', '已经拿到', '准备入职'])) return '接近落地'
  if (actionsTaken.includes('做项目') || actionsTaken.includes('投简历')) return '已有具体行动'
  if (actionsTaken.length > 0) return '刚开始探索'
  return '还没开始'
}

function inferCurrentNodeType(actionStage?: string): UserProfile['current_node_type'] {
  if (actionStage === '接近落地') return 'landed'
  if (actionStage === '已有具体行动') return 'acting'
  if (actionStage === '刚开始探索') return 'exploring'
  return 'crisis'
}

function formatCardText(card: MoltCard): string {
  return `${card.line1} ${card.line2}`.trim()
}

function flattenSelections(input: MoltCardsRequest): MoltCard[] {
  return input.previousSelections.flatMap((selection) => selection.selectedCards)
}

function finalizeCards(cards: MoltCard[], actNumber: 1 | 2 | 3, regenerationCount = 0): MoltCard[] {
  const customCard = cards.find((card) => card.isCustom)
  const deduped = cards.filter((card, index, collection) => {
    const key = `${card.line1}|${card.line2}`
    return collection.findIndex((candidate) => `${candidate.line1}|${candidate.line2}` === key) === index
  })

  const normalCards = deduped.filter((card) => !card.isCustom)
  const visibleCount = actNumber === 1 ? 5 : actNumber === 2 ? 5 : 6
  const startIndex = normalCards.length > visibleCount ? (regenerationCount * visibleCount) % normalCards.length : 0
  const rotatedCards =
    normalCards.length > visibleCount
      ? [...normalCards.slice(startIndex), ...normalCards.slice(0, startIndex)].slice(0, visibleCount)
      : normalCards.slice(0, visibleCount)

  if (actNumber === 1) {
    return [...rotatedCards, customCard ?? FALLBACK_ACT1[FALLBACK_ACT1.length - 1]]
  }
  if (actNumber === 2) {
    return [...rotatedCards, customCard ?? FALLBACK_ACT2[FALLBACK_ACT2.length - 1]]
  }
  return rotatedCards
}

function suggestDirections(majorField?: string, memoryText = ''): string[] {
  const inferred = inferSingle(memoryText, DIRECTION_KEYWORDS)
  if (inferred) return [inferred]
  if (majorField === '文科') return ['产品', '内容', '运营']
  if (majorField === '理工科') return ['技术', '数据', '产品']
  if (majorField === '商科') return ['运营', '产品', '咨询']
  if (majorField === '艺术') return ['设计', '内容', '产品']
  return ['还没确定', '产品', '运营']
}

function makeAct1Cards(input: MoltCardsRequest): MoltCard[] {
  const memoryText = [input.memoryImport?.background, input.memoryImport?.anxiety, input.memoryImport?.rawText]
    .filter(Boolean)
    .join(' ')
  const majorField = inferSingle(memoryText, MAJOR_KEYWORDS)
  const careerStatus = inferSingle(memoryText, CAREER_STATUS_KEYWORDS)
  const anxietyType = inferSingle(memoryText, ANXIETY_KEYWORDS, input.pathType === 'B' ? '方向迷茫' : 'AI替代焦虑')

  const contextualCards: MoltCard[] = []
  if (majorField === '文科') {
    contextualCards.push({
      id: 'act1-literary',
      line1: '我会的表达力',
      line2: '像突然贬值了',
      tags: ['文科', anxietyType ?? 'AI替代焦虑'],
      profileFields: { anxiety_type: anxietyType, major_field: '文科', career_status: careerStatus },
      depth: 'surface',
    })
  }
  if (majorField === '理工科') {
    contextualCards.push({
      id: 'act1-stem',
      line1: '会的那套技术',
      line2: '像在慢慢过期',
      tags: ['理工科', '技能过时'],
      profileFields: { anxiety_type: '技能过时', major_field: '理工科', career_status: careerStatus },
      depth: 'surface',
    })
  }
  if (majorField === '商科') {
    contextualCards.push({
      id: 'act1-business',
      line1: '懂流程和沟通',
      line2: '却不知道还值不值钱',
      tags: ['商科', '方向迷茫'],
      profileFields: { anxiety_type: anxietyType ?? '方向迷茫', major_field: '商科', career_status: careerStatus },
      depth: 'middle',
    })
  }
  if (majorField === '艺术') {
    contextualCards.push({
      id: 'act1-arts',
      line1: '审美和创作力',
      line2: '好像被工具追上了',
      tags: ['艺术', 'AI替代焦虑'],
      profileFields: { anxiety_type: anxietyType ?? 'AI替代焦虑', major_field: '艺术', career_status: careerStatus },
      depth: 'middle',
    })
  }
  if (input.pathType === 'B') {
    contextualCards.push({
      id: 'act1-moving',
      line1: '我已经在行动了',
      line2: '却还是不确定对不对',
      tags: ['方向迷茫'],
      profileFields: { anxiety_type: '方向迷茫', career_status: careerStatus },
      depth: 'deep',
    })
  }

  const alternateCards: MoltCard[] = [
    {
      id: 'act1-wrong-road',
      line1: '最怕的不是慢',
      line2: '是越走越像走错了',
      tags: [anxietyType ?? '方向迷茫'],
      profileFields: { anxiety_type: anxietyType ?? '方向迷茫', major_field: majorField, career_status: careerStatus },
      depth: 'deep',
    },
    {
      id: 'act1-no-slot',
      line1: '不是我没有能力',
      line2: '是能力暂时没位置',
      tags: [majorField ?? '身份转向', anxietyType ?? '方向迷茫'],
      profileFields: { anxiety_type: anxietyType, major_field: majorField, career_status: careerStatus },
      depth: 'middle',
    },
    {
      id: 'act1-empty-answer',
      line1: '别人问我想做什么',
      line2: '我脑子会瞬间空白',
      tags: ['方向迷茫'],
      profileFields: { anxiety_type: '方向迷茫', major_field: majorField, career_status: careerStatus },
      depth: 'surface',
    },
    {
      id: 'act1-era-shift',
      line1: '我不是没努力',
      line2: '是世界换得太快了',
      tags: [anxietyType ?? '同辈压力'],
      profileFields: { anxiety_type: anxietyType ?? '同辈压力', major_field: majorField, career_status: careerStatus },
      depth: 'middle',
    },
  ]

  if (anxietyType === '投简历没回音') {
    alternateCards.push({
      id: 'act1-resume-blackhole',
      line1: '投出去的每一份简历',
      line2: '都像掉进黑洞里',
      tags: ['投简历没回音'],
      profileFields: { anxiety_type: '投简历没回音', major_field: majorField, career_status: careerStatus },
      depth: 'surface',
    })
  }

  if (anxietyType === '同辈压力') {
    alternateCards.push({
      id: 'act1-peer-gap',
      line1: '最刺人的不是失败',
      line2: '是别人已经往前走了',
      tags: ['同辈压力'],
      profileFields: { anxiety_type: '同辈压力', major_field: majorField, career_status: careerStatus },
      depth: 'deep',
    })
  }

  const genericCards = FALLBACK_ACT1.map((card) => ({
    ...card,
    profileFields: {
      ...card.profileFields,
      major_field: card.profileFields.major_field ?? majorField,
      career_status: card.profileFields.career_status ?? careerStatus,
    },
  }))

  return finalizeCards([...contextualCards, ...alternateCards, ...genericCards], 1, input.regenerationCount)
}

function makeAct2Cards(input: MoltCardsRequest): MoltCard[] {
  const previousCards = flattenSelections(input)
  const memoryText = [input.memoryImport?.rawText, ...previousCards.map((card) => formatCardText(card))].join(' ')
  const actionsTaken = unique([...inferMulti(memoryText, ACTION_KEYWORDS), ...previousCards.flatMap((card) => card.profileFields.actions_taken ?? [])])
  const actionStage = inferActionStage(memoryText, actionsTaken)
  const educationStage = inferSingle(memoryText, EDUCATION_STAGE_KEYWORDS)
  const majorField = previousCards.find((card) => card.profileFields.major_field)?.profileFields.major_field ?? inferSingle(memoryText, MAJOR_KEYWORDS)

  const contextualCards: MoltCard[] = [
    {
      id: 'act2-stage',
      line1: actionStage === '还没开始' ? '你不是没想过' : '你其实已经开始了',
      line2: actionStage === '还没开始' ? '只是还没敢真的动' : '只是还没把线连起来',
      tags: [actionStage],
      profileFields: {
        action_stage: actionStage,
        actions_taken: actionsTaken.length > 0 ? actionsTaken : ['还没行动'],
        education_stage: educationStage,
      },
      depth: 'surface',
    },
    {
      id: 'act2-ability',
      line1: majorField === '文科' ? '你不是没能力' : '你不是没基础',
      line2: majorField === '文科' ? '是旧能力还没被重命名' : '是旧经验还没被迁移',
      tags: ['探索'],
      profileFields: {
        action_stage: actionStage === '还没开始' ? '刚开始探索' : actionStage,
        actions_taken: actionsTaken.length > 0 ? actionsTaken : ['还没行动'],
        education_stage: educationStage,
      },
      depth: 'middle',
    },
    {
      id: 'act2-relations',
      line1: '你会反复搜别人',
      line2: '却还没真正开口问',
      tags: ['找前辈聊'],
      profileFields: {
        action_stage: actionStage === '还没开始' ? '刚开始探索' : actionStage,
        actions_taken: unique([...actionsTaken, '找前辈聊']),
        education_stage: educationStage,
      },
      depth: 'deep',
    },
  ]

  if (actionsTaken.includes('做项目')) {
    contextualCards.push({
      id: 'act2-project',
      line1: '你已经做过一点',
      line2: '只是还不敢算数',
      tags: ['做项目'],
      profileFields: {
        action_stage: '已有具体行动',
        actions_taken: unique([...actionsTaken, '做项目']),
        education_stage: educationStage,
      },
      depth: 'middle',
    })
  }

  const alternateCards: MoltCard[] = [
    {
      id: 'act2-preparing',
      line1: '你一直在准备',
      line2: '却不敢把准备算行动',
      tags: ['还没行动'],
      profileFields: {
        action_stage: actionStage === '还没开始' ? '刚开始探索' : actionStage,
        actions_taken: actionsTaken.length > 0 ? actionsTaken : ['还没行动'],
        education_stage: educationStage,
      },
      depth: 'middle',
    },
    {
      id: 'act2-collecting',
      line1: '你收藏了很多路径',
      line2: '却还没给自己试错许可',
      tags: ['探索', '方向迷茫'],
      profileFields: {
        action_stage: '刚开始探索',
        actions_taken: actionsTaken.length > 0 ? actionsTaken : ['还没行动'],
        education_stage: educationStage,
      },
      depth: 'deep',
    },
    {
      id: 'act2-reference',
      line1: '你不是没方向感',
      line2: '是缺一个真实参照',
      tags: ['找前辈聊'],
      profileFields: {
        action_stage: actionStage === '还没开始' ? '刚开始探索' : actionStage,
        actions_taken: unique([...actionsTaken, '找前辈聊']),
        education_stage: educationStage,
      },
      depth: 'surface',
    },
    {
      id: 'act2-scattered',
      line1: '你已经做了几步',
      line2: '只是每一步都太分散',
      tags: ['已有具体行动'],
      profileFields: {
        action_stage: actionsTaken.length > 0 ? '已有具体行动' : actionStage,
        actions_taken: actionsTaken.length > 0 ? actionsTaken : ['还没行动'],
        education_stage: educationStage,
      },
      depth: 'middle',
    },
  ]

  if (majorField === '文科') {
    alternateCards.push({
      id: 'act2-rename',
      line1: '你会的不是没用',
      line2: '只是还没换成新名字',
      tags: ['探索'],
      profileFields: {
        action_stage: actionStage === '还没开始' ? '刚开始探索' : actionStage,
        actions_taken: actionsTaken.length > 0 ? actionsTaken : ['还没行动'],
        education_stage: educationStage,
      },
      depth: 'middle',
    })
  }

  const fallbackCards = FALLBACK_ACT2.map((card) => ({
    ...card,
    profileFields: {
      ...card.profileFields,
      action_stage: card.profileFields.action_stage ?? actionStage,
      education_stage: educationStage,
    },
  }))

  return finalizeCards([...contextualCards, ...alternateCards, ...fallbackCards], 2, input.regenerationCount)
}

function makeAct3Cards(input: MoltCardsRequest): MoltCard[] {
  const previousCards = flattenSelections(input)
  const memoryText = [input.memoryImport?.rawText, ...previousCards.map((card) => formatCardText(card))].join(' ')
  const majorField = previousCards.find((card) => card.profileFields.major_field)?.profileFields.major_field ?? inferSingle(memoryText, MAJOR_KEYWORDS)
  const [primaryDirection = '还没确定', secondaryDirection = '产品'] = suggestDirections(majorField, memoryText)

  const cards: MoltCard[] = [
    {
      id: 'act3-mentor',
      line1: '找一个走过这路的人',
      line2: '先听一句真话',
      tags: ['想找过来人聊', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想找过来人聊' },
      depth: 'surface',
    },
    {
      id: 'act3-outcome',
      line1: '看看像我的人',
      line2: '最后都去了哪里',
      tags: ['想看同类人去向', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想看同类人去向' },
      depth: 'surface',
    },
    {
      id: 'act3-direction',
      line1: primaryDirection === '还没确定' ? '先给我一条更窄的路' : `先朝${clip(primaryDirection, 4)}走一步`,
      line2: '哪怕只确定第一步',
      tags: ['想要方向建议', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想要方向建议' },
      depth: 'middle',
    },
    {
      id: 'act3-confidence',
      line1: '先有人告诉我',
      line2: '这条路走得通',
      tags: ['想要信心确认', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想要信心确认' },
      depth: 'middle',
    },
    {
      id: 'act3-secondary',
      line1: `如果不是${clip(primaryDirection, 4)}`,
      line2: `那就看看${clip(secondaryDirection, 4)}`,
      tags: ['想找过来人聊', secondaryDirection],
      profileFields: { direction: secondaryDirection, help_needed: '想找过来人聊' },
      depth: 'deep',
    },
    {
      id: 'act3-no-myth',
      line1: '先看最近的样本',
      line2: '别让我只看成功神话',
      tags: ['想看同类人去向', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想看同类人去向' },
      depth: 'deep',
    },
    {
      id: 'act3-reframe',
      line1: '帮我把旧能力',
      line2: '接到一个新去处',
      tags: ['想要方向建议', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想要方向建议' },
      depth: 'middle',
    },
    {
      id: 'act3-half-step',
      line1: '我想见一个领先半步的人',
      line2: '不是听完美答案',
      tags: ['想找过来人聊', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想找过来人聊' },
      depth: 'surface',
    },
    {
      id: 'act3-rule-out',
      line1: '先帮我排掉一条错路',
      line2: '这样我才敢往前',
      tags: ['想要信心确认', primaryDirection],
      profileFields: { direction: primaryDirection, help_needed: '想要信心确认' },
      depth: 'deep',
    },
  ]

  return finalizeCards([...cards, ...FALLBACK_ACT3], 3, input.regenerationCount)
}

function buildProfileDescription(input: ProfileSynthRequest): string {
  const majorField = input.profile.major_field
  const careerStatus = input.profile.career_status
  const educationStage = input.profile.education_stage
  const anxiety = input.profile.anxiety_type?.[0] ?? input.memoryImport?.anxiety ?? '身份变化带来的不确定'
  const actionStage = input.profile.action_stage ?? '还没开始'
  const direction = input.profile.direction?.[0] ?? inferSingle(input.memoryImport?.exploring ?? '', DIRECTION_KEYWORDS) ?? '还没确定'
  const helpNeeded = input.profile.help_needed?.[0] ?? '想找一个真实参照'
  const strength = input.memoryImport?.strength ?? inferStrength(input.memoryImport?.rawText ?? '', majorField, direction)
  const personality = input.memoryImport?.personality?.[0]

  const backgroundParts = [majorField, educationStage, careerStatus].filter(Boolean)
  const backgroundText =
    input.memoryImport?.background ??
    (backgroundParts.length > 0 ? `${backgroundParts.join('，')}的人` : '这个正处在身份迁移期的用户')

  const sentence1 = `${backgroundText}，最近的裂缝主要落在${anxiety}上。`
  const sentence2 =
    actionStage === '还没开始'
      ? '目前还停在辨认和犹豫的阶段，知道自己必须动起来，却还没找到足够稳的落点。'
      : actionStage === '刚开始探索'
        ? '目前已经开始试探性地行动，在收集信息、补能力和观察别人的路径之间来回确认。'
        : actionStage === '已有具体行动'
          ? '目前已经做出了一些具体动作，只是还需要把零散尝试连成更稳定的方向。'
          : '目前已经非常接近落地，更需要的是最后一步的确认和支撑。'
  const sentence3 =
    direction === '还没确定'
      ? `他/她最需要的不是立刻下结论，而是看见类似的人最终去了哪里。`
      : `他/她对${direction}方向有明显兴趣，最希望得到的是${helpNeeded}。`
  const sentence4 = `${strength}，这仍然是这次转型里最值得保留的一部分${personality ? `，也带着一点${personality}的气质` : ''}。`

  const combined = [sentence1, sentence2, sentence3, sentence4].join('')
  if (combined.length <= 150) {
    return combined
  }

  return clip(combined, 150)
}

export class LocalMoltExperienceService implements MoltExperienceService {
  async importMemory(input: MemoryImportRequest): Promise<MoltServiceResponse<MemoryImport>> {
    const source = normalizeText(input.rawText)
    const majorField = inferSingle(source, MAJOR_KEYWORDS)
    const direction = inferSingle(source, DIRECTION_KEYWORDS)

    const memoryImport: MemoryImport = {
      id: createId('memory'),
      userId: input.sessionId,
      sourceAI: input.sourceAI,
      background: clip(source.split(/[。！？]/)[0] || '这个用户已经和 AI 积累了一段长期对话。', 48),
      anxiety: inferSingle(source, ANXIETY_KEYWORDS, '方向迷茫') ?? '方向迷茫',
      personality: inferPersonality(source),
      exploring: direction ? `正在试探 ${direction} 方向是否适合自己。` : '还在试探下一步往哪里走更合适。',
      strength: inferStrength(source, majorField, direction),
      confidence: inferConfidence(source),
      rawText: input.rawText.trim(),
      createdAt: new Date().toISOString(),
    }

    return createResponse('memory-import', memoryImport)
  }

  async generateMoltCards(input: MoltCardsRequest): Promise<MoltServiceResponse<MoltCardsResponse>> {
    try {
      const cards =
        input.actNumber === 1
          ? makeAct1Cards(input)
          : input.actNumber === 2
            ? makeAct2Cards(input)
            : makeAct3Cards(input)

      const parsed = cardsResponseSchema.parse({ cards })
      return createResponse('molt-cards', parsed)
    } catch (error) {
      const fallbackCards = finalizeCards(getFallbackCardsForAct(input.actNumber), input.actNumber, input.regenerationCount)
      return createResponse(
        'molt-cards',
        { cards: fallbackCards },
        {
          // fallback: using checked-in card pool when dynamic generation fails
          fallbackUsed: true,
          dataMode: 'snapshot',
          error: error instanceof Error ? error.message : 'failed to generate cards',
        },
      )
    }
  }

  async synthesizeProfile(input: ProfileSynthRequest): Promise<MoltServiceResponse<ProfileSynthResponse>> {
    return createResponse('profile-synth', {
      profileDescription: buildProfileDescription(input),
    })
  }

  async embedText(input: EmbedRequest): Promise<MoltServiceResponse<EmbedResponse>> {
    return createResponse('embed', {
      embedding: createProfileEmbedding(input.text),
    })
  }

  async matchProfile(input: MatchV32Request): Promise<MoltServiceResponse<MatchResult>> {
    const match = matchAgentV32(
      {
        pathType: input.pathType,
        profile: input.profile,
        profileDescription: input.profileDescription,
        profileEmbedding: input.profileEmbedding,
        aggregatedTags: input.aggregatedTags,
      },
      staticMapNodes,
    )

    const cluster = assignCluster(
      input.profileEmbedding.length > 0 ? input.profileEmbedding : createProfileEmbedding(input.profileDescription, input.aggregatedTags),
    )

    return createResponse('match-v32', {
      ...match,
      cluster,
    })
  }
}

export const defaultMoltService = new LocalMoltExperienceService()

export function deriveProfileFromSelection(profile: Partial<UserProfile>, card: MoltCard, aggregatedTags: string[]) {
  const nextAnxiety = unique([...(profile.anxiety_type ?? []), ...(card.profileFields.anxiety_type ? [card.profileFields.anxiety_type] : [])])
  const nextDirections = unique([...(profile.direction ?? []), ...(card.profileFields.direction ? [card.profileFields.direction] : [])])
  const nextHelpNeeded = unique([...(profile.help_needed ?? []), ...(card.profileFields.help_needed ? [card.profileFields.help_needed] : [])])
  const nextActionsTaken = unique([...(profile.actions_taken ?? []), ...(card.profileFields.actions_taken ?? [])])
  const nextTags = unique([...aggregatedTags, ...card.tags])
  const actionStage = card.profileFields.action_stage ?? profile.action_stage

  return {
    profile: {
      ...profile,
      anxiety_type: nextAnxiety,
      major_field: card.profileFields.major_field ?? profile.major_field,
      career_status: card.profileFields.career_status ?? profile.career_status,
      education_stage: card.profileFields.education_stage ?? profile.education_stage,
      action_stage: actionStage,
      actions_taken: nextActionsTaken,
      direction: nextDirections,
      help_needed: nextHelpNeeded,
      current_node_type: inferCurrentNodeType(actionStage),
      aggregated_tags: nextTags,
    } satisfies Partial<UserProfile>,
    aggregatedTags: nextTags,
  }
}

export function getActTitle(actNumber: 1 | 2 | 3): string {
  return ACT_TITLES[actNumber]
}
