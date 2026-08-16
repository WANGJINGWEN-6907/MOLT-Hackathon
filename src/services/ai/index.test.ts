import { describe, expect, it } from 'vitest'
import type { AIServiceResponse, Conversation, MapNode } from '@/types'
import {
  createAIService,
  LocalFallbackAIProvider,
  MockAIProvider,
  UnavailableAIProvider,
} from './index'

const conversations: Conversation[] = [
  {
    id: '1',
    user_id: 'u1',
    path_type: 'A',
    question_index: 0,
    question_text: 'Q1',
    answer_text: '我最近有点迷茫，也在焦虑下一步。',
    created_at: new Date().toISOString(),
  },
]

const nodes: MapNode[] = [
  {
    id: 'node-1',
    type: 'lighthouse',
    pathType: 'C',
    direction: '产品',
    currentState: '资深产品经理',
    createdAt: new Date('2025-01-01'),
  },
]

describe('AI service abstraction', () => {
  it('returns fallbackUsed = true when the primary provider is unavailable', async () => {
    const service = createAIService({
      primaryProvider: new UnavailableAIProvider(),
      fallbackProvider: new LocalFallbackAIProvider(),
    })

    const [conversation, mirror, result, agent] = await Promise.all([
      service.generateConversationTurn({
        pathType: 'A',
        conversations,
      }),
      service.generateMirrorSummary({
        pathType: 'A',
        conversations,
      }),
      service.analyzeResult({
        pathType: 'A',
        conversations,
      }),
      service.matchAgent({
        context: {
          pathType: 'A',
          pressureLevel: 'medium',
          direction: '产品',
        },
        nodes,
      }),
    ])

    for (const response of [conversation, mirror, result, agent]) {
      expect(response.fallbackUsed).toBe(true)
      expect(response.provider).toBe('local-fallback')
      expect(response.error).toContain('unavailable')
    }
  })

  it('returns a consistent envelope for conversation, mirror, result, and agent', async () => {
    const service = createAIService({
      primaryProvider: new MockAIProvider(),
      fallbackProvider: new LocalFallbackAIProvider(),
    })

    const conversation = await service.generateConversationTurn({
      pathType: 'A',
      conversations,
    })
    const mirror = await service.generateMirrorSummary({
      pathType: 'A',
      conversations,
    })
    const analysis = await service.analyzeResult({
      pathType: 'A',
      conversations,
    })
    const match = await service.matchAgent({
      context: {
        pathType: 'A',
        pressureLevel: analysis.data.pressureLevel,
        direction: '产品',
      },
      nodes,
    })

    const responses = [conversation, mirror, analysis, match]

    for (const response of responses) {
      assertEnvelopeShape(response)
      expect(response.fallbackUsed).toBe(false)
      expect(response.provider).toBe('mock')
      expect(response.error).toBeUndefined()
    }

    expect(conversation.kind).toBe('conversation')
    expect(conversation.data.nextPrompt).toBe('mock-next-prompt')
    expect(mirror.kind).toBe('mirror')
    expect(mirror.data.pathType).toBe('A')
    expect(analysis.kind).toBe('result')
    expect(analysis.data.pressureLevel).toBe('medium')
    expect(match.kind).toBe('agent')
    expect(match.data.matchReason).toContain('mock')
  })
})

function assertEnvelopeShape<T>(response: AIServiceResponse<T>) {
  expect(response).toHaveProperty('kind')
  expect(response).toHaveProperty('data')
  expect(response).toHaveProperty('fallbackUsed')
  expect(response).toHaveProperty('provider')
}
