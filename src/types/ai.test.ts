import { describe, expect, it } from 'vitest'
import type {
  AIServiceResponse,
  ConversationTurnData,
  EvidenceSnapshot,
  MirrorFields,
} from './ai'

describe('Type system extensions', () => {
  it('MirrorFields has required fields', () => {
    const mirror: MirrorFields = {
      startPoint: 'test',
      turningPoint: 'test',
      currentState: 'test',
      lightMessage: 'test',
    }
    expect(mirror).toBeDefined()
  })

  it('MirrorFields allows null values', () => {
    const mirror: MirrorFields = {
      startPoint: null,
      turningPoint: null,
      currentState: null,
      lightMessage: null,
    }
    expect(mirror).toBeDefined()
  })

  it('EvidenceSnapshot has required fields', () => {
    const snapshot: EvidenceSnapshot = {
      claim: 'test claim',
      source: 'test source',
      quote: 'test quote',
      year: 2024,
    }
    expect(snapshot).toBeDefined()
  })

  it('ConversationTurnData has empathy_note field', () => {
    const data: ConversationTurnData = {
      nextPrompt: 'test',
      promptIndex: 0,
      completed: false,
      empathy_note: null,
    }
    expect(data.empathy_note).toBeNull()
  })

  it('AIServiceResponse has dataMode field', () => {
    const response = {
      kind: 'conversation' as const,
      data: {
        nextPrompt: 'test',
        promptIndex: 0,
        completed: false,
        empathy_note: null,
      },
      fallbackUsed: false,
      provider: 'test',
      dataMode: 'live' as const,
    } satisfies AIServiceResponse<ConversationTurnData>

    expect(response.dataMode).toBe('live')
  })

  it('dataMode accepts snapshot and mock values', () => {
    const r1 = {
      kind: 'conversation' as const,
      data: {
        nextPrompt: null,
        promptIndex: 0,
        completed: false,
        empathy_note: null,
      },
      fallbackUsed: false,
      provider: 'test',
      dataMode: 'snapshot' as const,
    } satisfies AIServiceResponse<ConversationTurnData>
    const r2 = {
      kind: 'conversation' as const,
      data: {
        nextPrompt: null,
        promptIndex: 0,
        completed: false,
        empathy_note: null,
      },
      fallbackUsed: false,
      provider: 'test',
      dataMode: 'mock' as const,
    } satisfies AIServiceResponse<ConversationTurnData>

    expect(r1.dataMode).toBe('snapshot')
    expect(r2.dataMode).toBe('mock')
  })
})
