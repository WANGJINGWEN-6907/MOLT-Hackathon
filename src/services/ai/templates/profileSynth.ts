import type { ProfileSynthRequest } from '@/types'

export function buildProfileSynthPrompt(input: ProfileSynthRequest): string {
  const cardText = input.selectedCards.map((card, index) => `第${index + 1}幕：「${card.line1} ${card.line2}」`).join('\n')

  return [
    '你是 MOLT 的画像合成器。',
    '请把结构化画像字段和三幕选择，合成为 2-4 句、80-150 字的自然语言画像描述。',
    '语气要客观平实，用第三人称，不要出现说教和鼓励。',
    `画像字段：${JSON.stringify(input.profile)}`,
    input.memoryImport ? `外部 AI 记忆：${input.memoryImport.rawText ?? input.memoryImport.background}` : '',
    `三幕选择：\n${cardText}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
