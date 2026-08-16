import { analyzeConversation } from '@/lib/result'
import type { ResultAnalysisInput } from '@/types'

export function buildResultFallback(input: ResultAnalysisInput) {
  return analyzeConversation(
    input.conversations.map((conversation) => conversation.answer_text),
    input.pathType
  )
}
