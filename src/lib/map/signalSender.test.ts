import { describe, expect, it } from 'vitest'
import type { MapNode } from '@/types'
import { canReceiveSignal, getSignalButtonState, validateSignalContent } from './signalSender'

describe('canReceiveSignal', () => {
  const baseNode: MapNode = {
    id: 'node-1',
    pathType: 'C',
    type: 'lighthouse',
  }

  it('returns true when node has a different user_id', () => {
    expect(canReceiveSignal({ ...baseNode, user_id: 'user-123' }, 'current-user')).toBe(true)
  })

  it('returns false without a user_id or when sending to self', () => {
    expect(canReceiveSignal(baseNode, 'current-user')).toBe(false)
    expect(canReceiveSignal({ ...baseNode, user_id: 'same-user' }, 'same-user')).toBe(false)
  })
})

describe('validateSignalContent', () => {
  it('allows empty content for signal-only first touch', () => {
    expect(validateSignalContent('')).toEqual({ valid: true })
    expect(validateSignalContent('   ')).toEqual({ valid: true })
  })

  it('still rejects messages longer than 50 chars', () => {
    const longContent = '一二三四五六七八九十'.repeat(5) + '多'
    const result = validateSignalContent(longContent)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('信号内容不能超过 50 字')
  })
})

describe('getSignalButtonState', () => {
  const baseNode: MapNode = {
    id: 'node-1',
    pathType: 'C',
    type: 'lighthouse',
    user_id: 'target-user',
  }

  it('allows sending when node is reachable and unsent', () => {
    const result = getSignalButtonState(baseNode, 'current-user', new Set())
    expect(result.canSend).toBe(true)
    expect(result.isSent).toBe(false)
  })

  it('returns sent state for previously signaled nodes', () => {
    const result = getSignalButtonState(baseNode, 'current-user', new Set(['target-user']))
    expect(result.canSend).toBe(false)
    expect(result.isSent).toBe(true)
  })
})
