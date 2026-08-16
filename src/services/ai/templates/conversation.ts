import { getQuestionsByPath } from '@/lib/conversationData'
import type { ConversationTurnData, ConversationTurnInput } from '@/types'

export function buildConversationFallback(
  input: ConversationTurnInput
): ConversationTurnData {
  const questions = getQuestionsByPath(input.pathType)
  const promptIndex = input.conversations.length
  const question = questions[promptIndex]

  return {
    nextPrompt: question?.text ?? null,
    promptIndex,
    completed: promptIndex >= questions.length,
    empathy_note: null,
  }
}
