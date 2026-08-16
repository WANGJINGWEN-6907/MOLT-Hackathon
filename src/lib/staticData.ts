import { virtualProfiles } from '@/data/virtualProfiles'
import { createProfileEmbedding } from '@/lib/semantic/profileEmbedding'
import type { CareerNodeData, CareerNodeType, MapNode } from '@/types'

interface SeedNode extends Omit<MapNode, 'profileEmbedding' | 'careerNodes'> {
  careerNodes?: Array<Omit<CareerNodeData, 'profileEmbedding'>>
}

const seedNodes: SeedNode[] = [
  {
    id: 'lighthouse-001',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-001',
    city: '北京',
    direction: '产品',
    startPoint: '外语翻译专业，应届时被 AI 翻译工具冲击。',
    turningPoint: '开始把语言敏感度迁移到内容产品，先做案例拆解，再做小项目。',
    currentState: 'AI 内容产品经理',
    lightMessage: '文科没有消失，它只是换了一层壳。',
    resonanceHint: '如果你也在怀疑文科是否还有价值，她走过的就是那段路。',
    visibility: 'full',
    createdAt: '2026-02-10T00:00:00.000Z',
    clusterId: 'cluster-01',
    profileDescription:
      '外语翻译专业应届毕业生，因 AI 翻译普及而对专业前景产生强烈焦虑。先从内容产品拆解开始，再通过小项目完成转型，如今在互联网公司做 AI 内容产品。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-03-01T00:00:00.000Z',
        validUntil: '2025-06-01T00:00:00.000Z',
        tags: ['文科', '翻译', 'AI替代焦虑'],
        anxietyType: 'AI替代焦虑',
        profileDescription: '翻译专业应届毕业生，因 AI 翻译工具普及而对职业前景非常焦虑。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-06-01T00:00:00.000Z',
        validUntil: '2025-09-01T00:00:00.000Z',
        tags: ['学习产品思维', '做项目'],
        direction: '产品',
        profileDescription: '开始通过拆解产品和做小项目，尝试把语言理解迁移到产品工作。',
      },
      {
        nodeType: 'landed',
        validFrom: '2025-09-15T00:00:00.000Z',
        validUntil: null,
        tags: ['内容产品经理', 'AI 产品'],
        direction: '产品',
        profileDescription: '完成转型，成为 AI 内容产品经理。',
      },
    ],
  },
  {
    id: 'lighthouse-002',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-002',
    city: '上海',
    direction: '运营',
    startPoint: '传统广告文案，担心品牌内容被生成式 AI 取代。',
    turningPoint: '把写作和用户洞察迁移到品牌运营与社媒策略。',
    currentState: '品牌运营负责人',
    lightMessage: '先别急着学更多，先认出你最难被替代的部分。',
    resonanceHint: '她也经历过“会写字是不是已经不值钱”的那段时间。',
    visibility: 'full',
    createdAt: '2026-01-26T00:00:00.000Z',
    clusterId: 'cluster-03',
    profileDescription:
      '广告文案背景，在内容生成工具普及后感到职业边界被压缩。她把写作能力升级成品牌判断和社媒运营能力，逐步走到运营负责人位置。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-04-01T00:00:00.000Z',
        validUntil: '2025-07-01T00:00:00.000Z',
        tags: ['内容', '品牌', 'AI替代焦虑'],
        anxietyType: 'AI替代焦虑',
        profileDescription: '传统广告文案，担心内容生成工具会让自己的价值迅速贬值。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-07-01T00:00:00.000Z',
        validUntil: '2025-10-01T00:00:00.000Z',
        tags: ['品牌运营', '社媒策略'],
        direction: '运营',
        profileDescription: '开始做品牌运营和社媒策略，把洞察能力转成更上游的判断。',
      },
    ],
  },
  {
    id: 'lighthouse-003',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-003',
    city: '深圳',
    direction: '技术',
    startPoint: '后端开发，技术栈偏旧，担心自己会被新一轮基础设施升级甩下。',
    turningPoint: '借公司重构机会学习云原生和全栈能力。',
    currentState: '平台工程师',
    lightMessage: '你不是起步晚，你是在换一套更大的工具箱。',
    resonanceHint: '如果你怕旧技术栈过期，他经历过同样的断层感。',
    visibility: 'full',
    createdAt: '2026-01-18T00:00:00.000Z',
    clusterId: 'cluster-02',
    profileDescription:
      '后端开发背景，面对技术栈更新与岗位重组时产生焦虑。借重构项目补齐云原生和平台能力，最后把旧经验转成更稳的技术判断。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-06-01T00:00:00.000Z',
        validUntil: '2025-10-01T00:00:00.000Z',
        tags: ['理工科', '技术', '技能过时'],
        anxietyType: '技能过时',
        profileDescription: '后端开发者，担心旧技术栈过时，害怕自己被基础设施升级淘汰。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-10-01T00:00:00.000Z',
        validUntil: '2026-01-10T00:00:00.000Z',
        tags: ['云原生', '平台工程'],
        direction: '技术',
        profileDescription: '一边做迁移一边学习云原生和平台工程，逐步建立新技术栈。',
      },
    ],
  },
  {
    id: 'lighthouse-004',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-004',
    city: '杭州',
    direction: '内容',
    startPoint: '传统媒体记者，眼看渠道瓦解，不确定自己还剩什么能力。',
    turningPoint: '把采访、选题和叙事能力迁移到短视频内容。',
    currentState: '内容主理人',
    lightMessage: '变的不是你会不会讲故事，变的是故事被放到哪里。',
    resonanceHint: '如果你担心旧媒介不再有效，她能帮你把能力重新命名。',
    visibility: 'partial',
    createdAt: '2026-02-05T00:00:00.000Z',
    clusterId: 'cluster-03',
    profileDescription:
      '传统媒体记者，在纸媒与长内容式微时感到身份动摇。她把采访和叙事能力转向短视频内容策划，最后成为独立内容主理人。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-05-01T00:00:00.000Z',
        validUntil: '2025-08-01T00:00:00.000Z',
        tags: ['内容', '媒体', '方向迷茫'],
        anxietyType: '方向迷茫',
        profileDescription: '传统媒体记者，不确定旧媒介衰退后自己还能做什么。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-08-01T00:00:00.000Z',
        validUntil: '2025-11-01T00:00:00.000Z',
        tags: ['短视频', '内容策划'],
        direction: '内容',
        profileDescription: '把采访和叙事能力迁移到短视频内容策划。',
      },
    ],
  },
  {
    id: 'lighthouse-005',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-005',
    city: '成都',
    direction: '设计',
    startPoint: '建筑设计背景，行业放缓后怀疑自己的专业是否还能通向稳定工作。',
    turningPoint: '把空间思维和建模能力迁移到数字体验设计。',
    currentState: '体验设计师',
    lightMessage: '你的方法论没有过时，只是场景换了。',
    resonanceHint: '如果你正经历“原专业还有没有用”的打击，她是很近的一盏灯。',
    visibility: 'full',
    createdAt: '2026-01-30T00:00:00.000Z',
    clusterId: 'cluster-04',
    profileDescription:
      '建筑设计背景，在行业收缩时对前景感到不安。后来把空间理解、建模和结构思维迁移到数字体验设计，完成跨场景转型。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-04-01T00:00:00.000Z',
        validUntil: '2025-09-01T00:00:00.000Z',
        tags: ['设计', '行业缩招', '专业冷门'],
        anxietyType: '行业缩招',
        profileDescription: '建筑设计背景，在行业收缩时担心专业路径被压缩。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-09-01T00:00:00.000Z',
        validUntil: '2025-12-01T00:00:00.000Z',
        tags: ['交互设计', '体验设计'],
        direction: '设计',
        profileDescription: '把空间和结构思维迁移到数字体验设计。',
      },
    ],
  },
  {
    id: 'lighthouse-006',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-006',
    city: '广州',
    direction: '研究',
    startPoint: '学术研究背景，课题很深但离就业很远。',
    turningPoint: '把研究方法迁移到咨询和商业分析。',
    currentState: '商业研究顾问',
    lightMessage: '深度思考不是负担，它只是需要换个应用场景。',
    resonanceHint: '如果你担心研究能力无法落地，她能提供另一种参照。',
    visibility: 'full',
    createdAt: '2026-02-08T00:00:00.000Z',
    clusterId: 'cluster-04',
    profileDescription:
      '研究型背景，曾因学术路径和就业现实之间的落差而焦虑。后来把资料分析、访谈和推理能力迁移到商业研究与咨询工作。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-03-01T00:00:00.000Z',
        validUntil: '2025-07-01T00:00:00.000Z',
        tags: ['研究', '专业冷门', '方向迷茫'],
        anxietyType: '专业冷门',
        profileDescription: '学术研究背景，担心课题方向无法对应现实就业机会。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-07-01T00:00:00.000Z',
        validUntil: '2025-10-01T00:00:00.000Z',
        tags: ['商业分析', '咨询'],
        direction: '研究',
        profileDescription: '尝试把研究方法迁移到咨询与商业分析工作。',
      },
    ],
  },
  {
    id: 'lighthouse-007',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-007',
    city: '苏州',
    direction: '数据',
    startPoint: '制造业 IT 维护老系统，知道自己会做，但不知道未来还能做什么。',
    turningPoint: '从系统维护转向业务分析，学习数据和指标语言。',
    currentState: '数据分析师',
    lightMessage: '你不是从零开始，只是在把经验翻译成新的语言。',
    resonanceHint: '如果你不是不会做事，而是不知道该把能力放到哪里，他会让那一步更清楚。',
    visibility: 'full',
    createdAt: '2026-02-14T00:00:00.000Z',
    clusterId: 'cluster-02',
    profileDescription:
      '制造业 IT 背景，长期维护老系统，陷入“会做事但不知道还能往哪去”的困境。后来把系统经验迁移到数据分析和业务协同，完成转型。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-06-15T00:00:00.000Z',
        validUntil: '2025-11-15T00:00:00.000Z',
        tags: ['理工科', '方向迷茫', '不知道能做什么'],
        anxietyType: '不知道能做什么',
        profileDescription: '老系统维护岗位，感觉工作熟练却看不到未来方向。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-11-15T00:00:00.000Z',
        validUntil: '2026-01-20T00:00:00.000Z',
        tags: ['数据分析', '业务指标'],
        direction: '数据',
        profileDescription: '开始学习数据分析与指标体系，把系统经验转向业务理解。',
      },
    ],
  },
  {
    id: 'lighthouse-008',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-008',
    city: '南京',
    direction: '产品',
    startPoint: '教师背景，发现自己最强的是解释和陪伴，却不想再留在线下教学里。',
    turningPoint: '把课程设计和陪伴能力迁移到教育产品。',
    currentState: '教育产品经理',
    lightMessage: '你不是离开原来的身份，而是在把它推到更广的场景里。',
    resonanceHint: '如果你想从教育或服务型岗位转向产品，她的路径非常近。',
    visibility: 'full',
    createdAt: '2026-01-22T00:00:00.000Z',
    clusterId: 'cluster-01',
    profileDescription:
      '教师背景，想离开线下教学但不想丢掉自己最强的陪伴与解释能力。后来转向教育产品，把教学经验迁移到产品工作。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-04-10T00:00:00.000Z',
        validUntil: '2025-08-20T00:00:00.000Z',
        tags: ['教育', '方向迷茫'],
        anxietyType: '方向迷茫',
        profileDescription: '教师背景，不想继续原路径，但也不知道能力可以迁移到哪里。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-08-20T00:00:00.000Z',
        validUntil: '2025-12-20T00:00:00.000Z',
        tags: ['课程产品', '用户研究'],
        direction: '产品',
        profileDescription: '把课程设计和用户理解迁移到教育产品经理路径。',
      },
    ],
  },
  {
    id: 'lighthouse-009',
    type: 'lighthouse',
    pathType: 'C',
    user_id: 'demo-user-009',
    city: '武汉',
    direction: '运营',
    startPoint: '金融销售背景，害怕重复性沟通被自动化替代。',
    turningPoint: '从销售转向客户成功和关系运营。',
    currentState: '客户成功负责人',
    lightMessage: '会说服别人只是表层，真正稀缺的是你对人的判断。',
    resonanceHint: '如果你怕“被工具替代”的不是技能而是工作身份，她能讲得很具体。',
    visibility: 'full',
    createdAt: '2026-02-01T00:00:00.000Z',
    clusterId: 'cluster-03',
    profileDescription:
      '金融销售背景，在自动化工具出现后担心自己会被替代。后来转向客户成功，把关系经营和判断力沉淀成长期运营能力。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-05-10T00:00:00.000Z',
        validUntil: '2025-09-10T00:00:00.000Z',
        tags: ['商科', 'AI替代焦虑'],
        anxietyType: 'AI替代焦虑',
        profileDescription: '销售背景，担心重复性沟通与跟进被自动化工具替代。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2025-09-10T00:00:00.000Z',
        validUntil: '2025-12-20T00:00:00.000Z',
        tags: ['客户成功', '关系运营'],
        direction: '运营',
        profileDescription: '开始从销售转向客户成功和关系运营。',
      },
    ],
  },
  {
    id: 'explorer-001',
    type: 'explorer',
    pathType: 'B',
    user_id: 'demo-user-101',
    city: '北京',
    direction: '产品',
    startPoint: '新闻传播专业，开始怀疑写作之外还能去哪里。',
    turningPoint: '正在做产品案例拆解，也在和前辈聊。',
    currentState: '还在探索产品方向',
    lightMessage: '我还没完全走出来，但已经能看见那条路了。',
    resonanceHint: '如果你需要的是一个领先半步的人，她会比“成功学故事”更贴近现实。',
    visibility: 'full',
    createdAt: '2026-03-01T00:00:00.000Z',
    clusterId: 'cluster-01',
    profileDescription:
      '新闻传播背景，因内容行业变化开始重新思考职业方向。正在做产品案例拆解、和前辈交流，处于从文科走向产品的探索阶段。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-10-01T00:00:00.000Z',
        validUntil: '2026-01-20T00:00:00.000Z',
        tags: ['文科', '方向迷茫'],
        anxietyType: '方向迷茫',
        profileDescription: '新闻传播背景，担心旧媒介衰退后自己方向不清。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2026-01-20T00:00:00.000Z',
        validUntil: null,
        tags: ['产品案例', '找前辈聊'],
        direction: '产品',
        profileDescription: '正在拆解产品案例，也在和前辈交流，努力把文科能力迁移到产品。',
      },
    ],
  },
  {
    id: 'explorer-002',
    type: 'explorer',
    pathType: 'B',
    user_id: 'demo-user-102',
    city: '深圳',
    direction: '技术',
    startPoint: 'Java 开发，觉得自己的技术栈正在变旧。',
    turningPoint: '正在边学云服务边做迁移任务。',
    currentState: '技术升级中',
    lightMessage: '我还在路上，但至少已经不是站在原地。',
    resonanceHint: '如果你也在经历“旧栈到新栈”的焦虑，这个节点会更贴近你。',
    visibility: 'full',
    createdAt: '2026-03-10T00:00:00.000Z',
    clusterId: 'cluster-02',
    profileDescription:
      'Java 开发背景，担心技术栈变旧。现在正通过迁移任务补足云服务与平台能力，处在技术升级的中段。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-11-01T00:00:00.000Z',
        validUntil: '2026-01-15T00:00:00.000Z',
        tags: ['理工科', '技能过时'],
        anxietyType: '技能过时',
        profileDescription: 'Java 开发者，感到技术栈变旧，担心岗位竞争力下滑。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2026-01-15T00:00:00.000Z',
        validUntil: null,
        tags: ['云服务', '迁移项目'],
        direction: '技术',
        profileDescription: '正在通过迁移项目补足云服务与平台能力。',
      },
    ],
  },
  {
    id: 'explorer-003',
    type: 'explorer',
    pathType: 'B',
    user_id: 'demo-user-103',
    city: '上海',
    direction: '运营',
    startPoint: '品牌内容岗位，感觉写作能力被工具稀释了。',
    turningPoint: '正在把内容经验迁移到社媒和品牌运营。',
    currentState: '运营转型中',
    lightMessage: '我没有完全确定，但已经能分清哪些能力该留下。',
    resonanceHint: '如果你也在做内容与运营之间的迁移，她会比纯结果更有参考价值。',
    visibility: 'full',
    createdAt: '2026-03-05T00:00:00.000Z',
    clusterId: 'cluster-03',
    profileDescription:
      '品牌内容背景，因工具变化担心写作能力贬值。现在正把内容经验迁移到社媒和品牌运营，处于重新命名能力的阶段。',
    careerNodes: [
      {
        nodeType: 'crisis',
        validFrom: '2025-10-10T00:00:00.000Z',
        validUntil: '2026-01-10T00:00:00.000Z',
        tags: ['内容', 'AI替代焦虑'],
        anxietyType: 'AI替代焦虑',
        profileDescription: '品牌内容岗位，担心写作工作被工具取代。',
      },
      {
        nodeType: 'exploring',
        validFrom: '2026-01-10T00:00:00.000Z',
        validUntil: null,
        tags: ['社媒运营', '品牌策略'],
        direction: '运营',
        profileDescription: '正把内容经验迁移到社媒运营和品牌策略工作。',
      },
    ],
  },
]

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function primaryValue(values: string[]): string | undefined {
  return values.find(Boolean)
}

function normalizeIsoDate(input?: string, fallback = '2026-01-01T00:00:00.000Z'): string {
  if (!input) return fallback
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toISOString()
}

function shiftMonths(input: string, months: number): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

function resolveMapNodeType(nodeType: CareerNodeType): NonNullable<MapNode['type']> {
  return nodeType === 'landed' ? 'lighthouse' : 'explorer'
}

function resolvePathType(nodeType: CareerNodeType): MapNode['pathType'] {
  return nodeType === 'landed' ? 'C' : 'B'
}

function resolveVisibility(nodeType: CareerNodeType): NonNullable<MapNode['visibility']> {
  if (nodeType === 'landed') return 'full'
  if (nodeType === 'crisis') return 'minimal'
  return 'partial'
}

function buildStartPoint(profile: (typeof virtualProfiles)[number]): string {
  const background = [profile.educationStage, profile.majorName || profile.majorField, profile.careerStatus]
    .filter(Boolean)
    .join('，')
  const anxiety = primaryValue(profile.anxietyType) ?? profile.pressureAttribution ?? '正在经历身份转向'
  return background ? `${background}，最早卡住的地方是${anxiety}。` : `最早卡住的地方是${anxiety}。`
}

function buildTurningPoint(profile: (typeof virtualProfiles)[number]): string {
  const actions = profile.actionsTaken.slice(0, 2).join('、')
  const directions = profile.direction.slice(0, 2).join(' / ')

  if (actions && directions) {
    return `开始通过${actions}，试着朝${directions}方向挪动。`
  }
  if (actions) {
    return `开始通过${actions}，慢慢把下一步从想法变成动作。`
  }
  if (directions) {
    return `开始把注意力移向${directions}，想确认这是不是下一层壳。`
  }
  if (profile.helpNeeded.length > 0) {
    return `还在通过${profile.helpNeeded.slice(0, 2).join('、')}，试着让这条路更清楚一点。`
  }
  return '还在把零散感受拼成一条能往前走的线。'
}

function buildCurrentState(profile: (typeof virtualProfiles)[number]): string {
  const direction = primaryValue(profile.direction)
  if (profile.currentNodeType === 'landed') {
    return direction ? `已在${direction}方向落地` : profile.careerStatus || '已经找到新的落点'
  }
  if (profile.currentNodeType === 'acting') {
    return direction ? `正在把${direction}方向做实` : profile.actionStage || '已经开始行动'
  }
  if (profile.currentNodeType === 'exploring') {
    return direction ? `还在探索${direction}方向` : profile.actionStage || '还在探索'
  }
  return profile.actionStage || '还在辨认裂缝'
}

function buildLightMessage(profile: (typeof virtualProfiles)[number]): string {
  const direction = primaryValue(profile.direction)
  if (profile.currentNodeType === 'landed') {
    return direction
      ? `我不是更早知道答案，只是先把旧能力接到了${direction}这条路上。`
      : '我不是突然想明白的，只是先把旧能力重新命名了。'
  }
  if (profile.currentNodeType === 'acting') {
    return direction
      ? `我还没完全走出去，但已经开始把自己往${direction}方向推了。`
      : '我还在路上，但已经不是站在原地了。'
  }
  if (profile.currentNodeType === 'exploring') {
    return '我也还在试，但已经能分清哪些感受是真正该留下来的。'
  }
  return '我还在这层壳里，但至少知道裂缝是怎么开始的。'
}

function buildResonanceHint(profile: (typeof virtualProfiles)[number]): string {
  const background = profile.majorName || profile.majorField || '这段背景'
  const anxiety = primaryValue(profile.anxietyType) ?? '身份转向'
  const direction = primaryValue(profile.direction)
  if (direction) {
    return `${background}背景、经历过${anxiety}，并且正在把自己往${direction}方向迁移。`
  }
  return `${background}背景，正在经历和你相近的${anxiety}。`
}

function buildCrisisDescription(profile: (typeof virtualProfiles)[number]): string {
  const background = [profile.majorName || profile.majorField, profile.careerStatus].filter(Boolean).join('，')
  const anxiety = primaryValue(profile.anxietyType) ?? profile.pressureAttribution ?? '身份转向'
  return background ? `${background}，当时最强烈的感受是${anxiety}。` : `当时最强烈的感受是${anxiety}。`
}

function buildCareerNodes(profile: (typeof virtualProfiles)[number]): Array<Omit<CareerNodeData, 'profileEmbedding'>> {
  const since = normalizeIsoDate(profile.currentNodeSince)
  const anxiety = primaryValue(profile.anxietyType)
  const direction = primaryValue(profile.direction)
  const crisisTags = unique([profile.majorField, profile.majorName, anxiety, ...profile.aggregatedTags.slice(0, 3)])
  const currentTags = unique([
    direction,
    anxiety,
    ...profile.actionsTaken.slice(0, 3),
    ...profile.helpNeeded.slice(0, 2),
    ...profile.targetCompanyType.slice(0, 1),
    ...profile.aggregatedTags.slice(0, 4),
  ])

  if (profile.currentNodeType === 'crisis') {
    return [
      {
        nodeType: 'crisis',
        validFrom: since,
        validUntil: null,
        tags: crisisTags,
        anxietyType: anxiety,
        profileDescription: buildCrisisDescription(profile),
      },
    ]
  }

  return [
    {
      nodeType: 'crisis',
      validFrom: shiftMonths(since, -3),
      validUntil: since,
      tags: crisisTags,
      anxietyType: anxiety,
      profileDescription: buildCrisisDescription(profile),
    },
    {
      nodeType: profile.currentNodeType,
      validFrom: since,
      validUntil: null,
      tags: currentTags,
      anxietyType: undefined,
      direction,
      profileDescription: profile.profileDescription,
    },
  ]
}

const csvSeedNodes: SeedNode[] = virtualProfiles.map((profile) => {
  const direction = primaryValue(profile.direction)
  return {
    id: `virtual-${profile.userId}`,
    type: resolveMapNodeType(profile.currentNodeType),
    pathType: resolvePathType(profile.currentNodeType),
    user_id: `virtual-${profile.userId}`,
    city: profile.city,
    direction,
    startPoint: buildStartPoint(profile),
    turningPoint: buildTurningPoint(profile),
    currentState: buildCurrentState(profile),
    lightMessage: buildLightMessage(profile),
    resonanceHint: buildResonanceHint(profile),
    visibility: resolveVisibility(profile.currentNodeType),
    createdAt: normalizeIsoDate(profile.currentNodeSince),
    profileDescription: profile.profileDescription,
    careerNodes: buildCareerNodes(profile),
  }
})

function enrichCareerNodes(careerNodes?: Array<Omit<CareerNodeData, 'profileEmbedding'>>): CareerNodeData[] | undefined {
  return careerNodes?.map((careerNode) => ({
    ...careerNode,
    profileEmbedding: careerNode.profileDescription
      ? createProfileEmbedding(careerNode.profileDescription, careerNode.tags)
      : createProfileEmbedding(careerNode.tags.join(' ')),
  }))
}

export const staticMapNodes: MapNode[] = [...seedNodes, ...csvSeedNodes].map((node) => {
  const careerNodes = enrichCareerNodes(node.careerNodes)
  return {
    ...node,
    careerNodes,
    profileEmbedding: createProfileEmbedding(node.profileDescription ?? '', [node.direction ?? '', ...(careerNodes?.flatMap((careerNode) => careerNode.tags) ?? [])]),
  }
})
