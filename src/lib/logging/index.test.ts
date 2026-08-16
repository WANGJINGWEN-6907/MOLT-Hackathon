import { describe, expect, it, vi } from 'vitest'
import { createLogEvent, logEvent, serializeError } from './index'

describe('logging utilities', () => {
  it('creates a stable log event payload', () => {
    const event = createLogEvent({
      scope: 'result',
      action: 'load',
      status: 'failed',
      message: 'analysis failed',
      payload: { pathType: 'A' },
    })

    expect(event.scope).toBe('result')
    expect(event.action).toBe('load')
    expect(event.status).toBe('failed')
    expect(event.message).toBe('analysis failed')
    expect(event.payload).toEqual({ pathType: 'A' })
    expect(typeof event.timestamp).toBe('string')
  })

  it('serializes unknown errors safely', () => {
    expect(serializeError(new Error('boom'))).toMatchObject({
      name: 'Error',
      message: 'boom',
    })
    expect(serializeError('plain error')).toMatchObject({
      message: 'plain error',
    })
  })

  it('logs to the matching console method', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logEvent(
      createLogEvent({
        scope: 'mirror',
        action: 'fallback',
        status: 'fallback',
        level: 'warn',
        message: 'fallback used',
      })
    )

    expect(warnSpy).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })
})
