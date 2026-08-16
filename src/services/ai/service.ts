import { createLogEvent, logEvent, serializeError } from '@/lib/logging'
import type {
  AgentMatchInput,
  AIProvider,
  AIService,
  AIServiceResponse,
  ConversationTurnInput,
  MirrorSummaryInput,
  ResultAnalysisInput,
} from '@/types'
import { LocalFallbackAIProvider } from './providers/fallback'

interface AIServiceOptions {
  primaryProvider: AIProvider
  fallbackProvider?: AIProvider
}

async function runWithFallback<T>(
  scope: string,
  action: string,
  primaryCall: () => Promise<AIServiceResponse<T>>,
  fallbackCall: () => Promise<AIServiceResponse<T>>
): Promise<AIServiceResponse<T>> {
  try {
    const primaryResult = await primaryCall()
    return {
      ...primaryResult,
      fallbackUsed: primaryResult.fallbackUsed ?? false,
    }
  } catch (error) {
    const serializedError = serializeError(error)
    logEvent(
      createLogEvent({
        scope,
        action,
        status: 'fallback',
        message: serializedError.message,
        payload: serializedError,
      })
    )

    const fallbackResult = await fallbackCall()
    return {
      ...fallbackResult,
      fallbackUsed: true,
      error: serializedError.message,
    }
  }
}

export function createAIService(options: AIServiceOptions): AIService {
  const fallbackProvider = options.fallbackProvider ?? new LocalFallbackAIProvider()

  return {
    generateConversationTurn(input: ConversationTurnInput) {
      return runWithFallback(
        'ai',
        'conversation',
        () => options.primaryProvider.generateConversationTurn(input),
        () => fallbackProvider.generateConversationTurn(input)
      )
    },
    generateMirrorSummary(input: MirrorSummaryInput) {
      return runWithFallback(
        'ai',
        'mirror',
        () => options.primaryProvider.generateMirrorSummary(input),
        () => fallbackProvider.generateMirrorSummary(input)
      )
    },
    analyzeResult(input: ResultAnalysisInput) {
      return runWithFallback(
        'ai',
        'result',
        () => options.primaryProvider.analyzeResult(input),
        () => fallbackProvider.analyzeResult(input)
      )
    },
    matchAgent(input: AgentMatchInput) {
      return runWithFallback(
        'ai',
        'agent',
        () => options.primaryProvider.matchAgent(input),
        () => fallbackProvider.matchAgent(input)
      )
    },
  }
}
