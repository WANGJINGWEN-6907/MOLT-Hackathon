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

export class UnavailableAIProvider implements AIProvider {
  providerName = 'unavailable'

  private unavailable(method: string): never {
    throw new Error(`${this.providerName} provider unavailable for ${method}`)
  }

  async generateConversationTurn(
    _input: ConversationTurnInput
  ): Promise<AIServiceResponse<ConversationTurnData>> {
    this.unavailable('conversation')
  }

  async generateMirrorSummary(
    _input: MirrorSummaryInput
  ): Promise<AIServiceResponse<MirrorSummary>> {
    this.unavailable('mirror')
  }

  async analyzeResult(
    _input: ResultAnalysisInput
  ): Promise<AIServiceResponse<PathAAnalysis | PathBAnalysis>> {
    this.unavailable('result')
  }

  async matchAgent(
    _input: AgentMatchInput
  ): Promise<AIServiceResponse<MatchResult>> {
    this.unavailable('agent')
  }
}
