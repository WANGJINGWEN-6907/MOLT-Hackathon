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

function createResponse<T>(
  kind: AIServiceResponse<T>['kind'],
  data: T,
  provider: string
): AIServiceResponse<T> {
  return {
    kind,
    data,
    provider,
    fallbackUsed: false,
  }
}

export class MockAIProvider implements AIProvider {
  providerName = 'mock'

  async generateConversationTurn(
    input: ConversationTurnInput
  ): Promise<AIServiceResponse<ConversationTurnData>> {
    return createResponse(
      'conversation',
      {
        nextPrompt: 'mock-next-prompt',
        promptIndex: input.conversations.length,
        completed: false,
        empathy_note: null,
      },
      this.providerName
    )
  }

  async generateMirrorSummary(
    input: MirrorSummaryInput
  ): Promise<AIServiceResponse<MirrorSummary>> {
    return createResponse(
      'mirror',
      {
        pathType: input.pathType,
        fallbackUsed: false,
        data: {
          line1: 'mock-line-1',
          line2: 'mock-line-2',
          line3: 'mock-line-3',
        },
      },
      this.providerName
    )
  }

  async analyzeResult(
    _input: ResultAnalysisInput
  ): Promise<AIServiceResponse<PathAAnalysis | PathBAnalysis>> {
    return createResponse(
      'result',
      {
        pressureLevel: 'medium',
        pressureDescription: 'mock-analysis',
        abilities: ['mock-ability'],
        marketSignals: 'mock-signal',
        actionSuggestions: ['mock-action'],
        isFallback: false,
        structuralPressure: {
          economicFactors: ['mock-economic'],
          industryChanges: ['mock-industry'],
          personalCircumstances: ['mock-personal'],
        },
        individualActions: {
          emotionalSupport: ['mock-support'],
          smallSteps: ['mock-step'],
          reflectionPrompts: ['mock-reflection'],
        },
      },
      this.providerName
    )
  }

  async matchAgent(
    input: AgentMatchInput
  ): Promise<AIServiceResponse<MatchResult>> {
    return createResponse(
      'agent',
      {
        matchScore: 72,
        matchedNode: input.nodes[0],
        matchReason: 'mock-match-reason',
        agentMessage: 'mock-agent-message',
      },
      this.providerName
    )
  }
}
