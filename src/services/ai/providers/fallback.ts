import type { MatchResult } from '@/lib/agent'
import type { MirrorSummary } from '@/lib/mirror/mirrorGenerator'
import type { PathAAnalysis, PathBAnalysis } from '@/lib/result'
import type {
  AgentMatchInput,
  AIProvider,
  AIServiceResponse,
  ConversationTurnData,
  ConversationTurnInput,
  MirrorSummaryInput,
  ResultAnalysisInput,
} from '@/types'
import { buildAgentFallback } from '../templates/agent'
import { buildConversationFallback } from '../templates/conversation'
import { buildMirrorFallback } from '../templates/mirror'
import { buildResultFallback } from '../templates/result'

function createResponse<T>(
  kind: AIServiceResponse<T>['kind'],
  data: T,
  provider: string,
  fallbackUsed: boolean,
  error?: string
): AIServiceResponse<T> {
  return {
    kind,
    data,
    provider,
    fallbackUsed,
    error,
  }
}

export class LocalFallbackAIProvider implements AIProvider {
  providerName = 'local-fallback'

  async generateConversationTurn(
    input: ConversationTurnInput
  ): Promise<AIServiceResponse<ConversationTurnData>> {
    return createResponse(
      'conversation',
      buildConversationFallback(input),
      this.providerName,
      true
    )
  }

  async generateMirrorSummary(
    input: MirrorSummaryInput
  ): Promise<AIServiceResponse<MirrorSummary>> {
    return createResponse(
      'mirror',
      buildMirrorFallback(input),
      this.providerName,
      true
    )
  }

  async analyzeResult(
    input: ResultAnalysisInput
  ): Promise<AIServiceResponse<PathAAnalysis | PathBAnalysis>> {
    return createResponse(
      'result',
      buildResultFallback(input),
      this.providerName,
      true
    )
  }

  async matchAgent(
    input: AgentMatchInput
  ): Promise<AIServiceResponse<MatchResult>> {
    return createResponse(
      'agent',
      buildAgentFallback(input),
      this.providerName,
      true
    )
  }
}
