import { cosineSimilarity, createProfileEmbedding } from '@/lib/semantic/profileEmbedding'
import type { Cluster, MapNode, PathType, PressureLevel, UserProfile } from '@/types'

export interface MatchContext {
  pathType: PathType
  profile: Partial<UserProfile>
  profileDescription?: string
  profileEmbedding?: number[]
  aggregatedTags?: string[]
  pressureLevel?: PressureLevel
  direction?: string
  city?: string
}

export interface RankedMatch {
  node: MapNode
  score: number
}

export interface MatchResult {
  matchedNode?: MapNode
  matchScore: number
  matchReason: string
  agentMessage: string
  cluster?: Cluster
  rankedMatches?: RankedMatch[]
}

const FALLBACK_MESSAGES: Record<PathType, { reason: string; message: string }> = {
  A: {
    reason: '还没有找到完全贴合的过来人，但你的轮廓已经开始清晰。',
    message: '先别急着证明自己对不对。继续把轮廓说清，我们会把真正有共鸣的人留给你。',
  },
  B: {
    reason: '暂时没有找到领先半步的同行者，但你的迁移方向已经出现了。',
    message: '现在最重要的不是更快，而是继续把已经开始的尝试做实。',
  },
  C: {
    reason: '你已经是一盏灯了，只是还没碰到最需要这束光的人。',
    message: '把你的经历留在这里，会有人因为这段路径少走一些弯路。',
  },
}

function resolveDirection(context: MatchContext): string | undefined {
  return context.profile?.direction?.[0] ?? context.direction
}

function resolveEmbedding(context: MatchContext): number[] {
  if (context.profileEmbedding && context.profileEmbedding.length > 0) {
    return context.profileEmbedding
  }

  if (context.profileDescription) {
    return createProfileEmbedding(context.profileDescription, context.aggregatedTags ?? [])
  }

  const profile = context.profile ?? {}
  const profileText = [
    profile.major_field,
    profile.career_status,
    ...(profile.anxiety_type ?? []),
    profile.action_stage,
    ...(profile.actions_taken ?? []),
    ...(profile.direction ?? []),
    ...(profile.help_needed ?? []),
  ]
    .filter(Boolean)
    .join(' ')

  return createProfileEmbedding(profileText, context.aggregatedTags ?? [])
}

function collectCandidateEmbeddings(node: MapNode): number[][] {
  const historicalEmbeddings =
    node.careerNodes
      ?.map((careerNode) => careerNode.profileEmbedding)
      .filter((embedding): embedding is number[] => Array.isArray(embedding) && embedding.length > 0) ?? []

  if (historicalEmbeddings.length > 0) {
    return historicalEmbeddings
  }

  if (node.profileEmbedding && node.profileEmbedding.length > 0) {
    return [node.profileEmbedding]
  }

  const fallbackText = node.profileDescription ?? `${node.startPoint ?? ''} ${node.turningPoint ?? ''} ${node.currentState ?? ''}`
  return [createProfileEmbedding(fallbackText, [node.direction ?? ''])]
}

function collectCandidateTags(node: MapNode): string[] {
  return [
    node.direction,
    ...(node.careerNodes?.flatMap((careerNode) => careerNode.tags) ?? []),
  ].filter((value): value is string => Boolean(value))
}

function scoreCandidateByTags(tags: string[], node: MapNode): number {
  if (tags.length === 0) return 0
  const candidateTags = new Set(collectCandidateTags(node))
  const overlap = tags.filter((tag) => candidateTags.has(tag)).length
  return Math.min(50, overlap * 12.5)
}

function monthsDiff(dateLike: string | Date, now = new Date()): number {
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY
  return Math.max(0, (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()))
}

function scoreTemporalCloseness(node: MapNode): number {
  const crisisNode = node.careerNodes?.find((careerNode) => careerNode.nodeType === 'crisis')
  if (!crisisNode?.validUntil) return 0
  const monthsAgo = monthsDiff(crisisNode.validUntil)
  if (monthsAgo <= 3) return 30
  if (monthsAgo <= 6) return 20
  if (monthsAgo <= 12) return 10
  return 0
}

function getCurrentCareerNodeType(node: MapNode) {
  const currentNode =
    node.careerNodes?.find((careerNode) => careerNode.validUntil === null) ??
    node.careerNodes?.[node.careerNodes.length - 1]
  return currentNode?.nodeType
}

function resolveSeekerType(context: MatchContext): 'lighthouse' | 'explorer' {
  if (context.profile?.current_node_type === 'landed' || context.pathType === 'C') {
    return 'lighthouse'
  }
  return 'explorer'
}

function isMatchableExplorer(node: MapNode): boolean {
  return node.type === 'explorer' && getCurrentCareerNodeType(node) !== 'crisis'
}

export function filterCandidates(nodes: MapNode[], context: MatchContext): MapNode[] {
  const seekerType = resolveSeekerType(context)

  if (seekerType === 'explorer') {
    return nodes.filter((node) => node.type === 'lighthouse')
  }

  return nodes.filter(isMatchableExplorer)
}

function computeScore(node: MapNode, context: MatchContext): number {
  const direction = resolveDirection(context)
  const embedding = resolveEmbedding(context)

  let score = 0
  if (embedding.length > 0) {
    const bestSemantic = Math.max(
      ...collectCandidateEmbeddings(node).map((candidateEmbedding) => cosineSimilarity(embedding, candidateEmbedding)),
    )
    score += Math.max(0, bestSemantic) * 50
  } else {
    score += scoreCandidateByTags(context.aggregatedTags ?? [], node)
  }

  score += scoreTemporalCloseness(node)

  if (direction && node.direction === direction) {
    score += 20
  }

  if ((context.profile?.help_needed ?? []).includes('想找过来人聊') && node.type === 'lighthouse') {
    score += 5
  }

  return score
}

export function rankCandidates(candidates: MapNode[], context: MatchContext): MapNode[] {
  return [...candidates].sort((left, right) => computeScore(right, context) - computeScore(left, context))
}

export function selectBestMatch(rankedCandidates: MapNode[]): MapNode | undefined {
  return rankedCandidates[0]
}

export function getFallbackMatch(pathType: PathType): MatchResult {
  const fallback = FALLBACK_MESSAGES[pathType]
  return {
    matchedNode: undefined,
    matchScore: 0,
    matchReason: fallback.reason,
    agentMessage: fallback.message,
    rankedMatches: [],
  }
}

function generateMatchReason(node: MapNode, context: MatchContext): string {
  const direction = resolveDirection(context)
  const anxiety = context.profile?.anxiety_type?.[0]
  const crisisNode = node.careerNodes?.find((careerNode) => careerNode.nodeType === 'crisis')
  const isExplorer = node.type === 'explorer'

  if (anxiety && crisisNode?.anxietyType === anxiety) {
    return isExplorer
      ? `你们不只是方向相近，你现在的“${anxiety}”也是对方最近正在穿过的那段路。`
      : `你们不只是方向相近，你现在的“${anxiety}”也是对方曾经真实走过的那段路。`
  }

  if (direction && node.direction === direction) {
    return isExplorer
      ? `你正在靠近的 ${direction} 方向，正是对方正在往前踩实的一段路径。`
      : `你正在靠近的 ${direction} 方向，正是对方已经从焦虑中走通的一段路径。`
  }

  if (node.profileDescription) {
    return isExplorer ? '你现在的状态，与对方这段仍在进行中的转折有很强的语义重合。' : '你现在的状态，与对方曾经的转折前夜有很强的语义重合。'
  }

  return '对方的过去节点，和你现在的困惑形成了清晰的前后呼应。'
}

function generateAgentMessage(node: MapNode, context: MatchContext): string {
  if (node.lightMessage) {
    return node.lightMessage
  }

  const direction = resolveDirection(context)
  if (direction && node.direction === direction) {
    return node.type === 'explorer'
      ? `你现在靠近的不是一个标签，而是一段正在被 ${node.currentState ?? '这个人'} 一点点踩实的路径。`
      : `你现在靠近的不是一个标签，而是一段已经被 ${node.currentState ?? '这位过来人'} 走通过的路径。`
  }

  return `${node.currentState ?? '这位过来人'} 并不是更早知道答案，而是更早把自己的能力重新命名了。`
}

export function matchAgentV32(context: MatchContext, nodes: MapNode[]): MatchResult {
  const filtered = filterCandidates(nodes, context)
  if (filtered.length === 0) {
    return getFallbackMatch(context.pathType)
  }

  const scored: RankedMatch[] = filtered.map((node) => ({ node, score: computeScore(node, context) }))
  const rankedMatches = scored.sort((left, right) => right.score - left.score)
  const best = rankedMatches[0]

  if (!best || best.score < 10) {
    return getFallbackMatch(context.pathType)
  }

  return {
    matchedNode: best.node,
    matchScore: Math.round(best.score),
    matchReason: generateMatchReason(best.node, context),
    agentMessage: generateAgentMessage(best.node, context),
    rankedMatches,
  }
}

export const matchAgent = matchAgentV32
