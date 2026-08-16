import type { MapNode } from '@/types'
import type { MatchContext } from '@/lib/agent'

export function buildMatchReasonPrompt(node: MapNode, context: MatchContext): string {
  return [
    '你是 MOLT 的连接解释器。',
    '请用 1-2 句解释为什么这个候选人与用户共鸣，不要出现打分细节。',
    `用户画像描述：${context.profileDescription ?? ''}`,
    `用户方向：${context.profile.direction?.join(' / ') ?? context.direction ?? '未知'}`,
    `候选人经历：${node.profileDescription ?? `${node.startPoint} -> ${node.currentState}`}`,
  ].join('\n\n')
}
