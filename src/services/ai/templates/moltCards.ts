import type { MoltCardsRequest } from '@/types'

export function buildMoltCardsPrompt(input: MoltCardsRequest): string {
  const previous = input.previousSelections
    .map(
      ({ actNumber, selectedCards }) =>
        `第${actNumber}幕：${selectedCards
          .map((selectedCard) => `「${selectedCard.line1} ${selectedCard.line2}」 -> ${JSON.stringify(selectedCard.profileFields)}`)
          .join(' / ')}`,
    )
    .join('\n')

  return [
    '你是 MOLT 的交互设计引擎。',
    `当前是第 ${input.actNumber} 幕。`,
    input.memoryImport
      ? `用户的 AI 助手曾这样理解用户：${input.memoryImport.background} / ${input.memoryImport.anxiety} / ${input.memoryImport.exploring}`
      : '用户没有导入记忆，请给出通用但具体的身份转变场景。',
    previous ? `前两幕已知信息：\n${previous}` : '这是用户第一次做选择。',
    `当前已是第 ${input.regenerationCount ?? 0} 次出牌。`,
    '请输出 5-6 张卡片，每张卡片都要携带 profileFields，帮助系统逐步建立用户画像。',
  ].join('\n\n')
}
