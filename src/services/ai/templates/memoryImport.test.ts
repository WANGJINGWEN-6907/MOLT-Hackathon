import { describe, expect, it } from 'vitest'
import { buildMemoryImportPrompt, getMemoryImportReversePrompt } from './memoryImport'

describe('memory import prompts', () => {
  it('returns different reverse prompts for different source AI', () => {
    const chatgptPrompt = getMemoryImportReversePrompt('ChatGPT')
    const claudePrompt = getMemoryImportReversePrompt('Claude')
    const doubaoPrompt = getMemoryImportReversePrompt('豆包')

    expect(chatgptPrompt).toContain('长期保留的印象')
    expect(claudePrompt).toContain('克制、具体、第三人称')
    expect(doubaoPrompt).toContain('聊天印象')
    expect(chatgptPrompt).not.toEqual(claudePrompt)
    expect(claudePrompt).not.toEqual(doubaoPrompt)
  })

  it('builds parser prompts with provider-specific parsing hints', () => {
    const chatgptPrompt = buildMemoryImportPrompt({
      sessionId: 'session-1',
      sourceAI: 'ChatGPT',
      rawText: '这个用户正在尝试转产品。',
    })
    const claudePrompt = buildMemoryImportPrompt({
      sessionId: 'session-1',
      sourceAI: 'Claude',
      rawText: '这个用户正在尝试转产品。',
    })
    const doubaoPrompt = buildMemoryImportPrompt({
      sessionId: 'session-1',
      sourceAI: '豆包',
      rawText: '这个用户正在尝试转产品。',
    })

    expect(chatgptPrompt).toContain('长期自我画像')
    expect(claudePrompt).toContain('更抽象、更克制')
    expect(doubaoPrompt).toContain('更口语')
  })
})
