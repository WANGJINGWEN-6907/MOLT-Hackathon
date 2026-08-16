import { matchAgent } from '@/lib/agent'
import type { AgentMatchInput } from '@/types'

export function buildAgentFallback(input: AgentMatchInput) {
  return matchAgent(input.context, input.nodes)
}
