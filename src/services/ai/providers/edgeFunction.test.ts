import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EdgeFunctionAIProvider } from './edgeFunction'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createSSEStream(
  chunks: Array<{
    type: string
    delta?: { type: string; text?: string }
    text?: string
    is_final?: boolean
    empathy_note?: string | null
  }>
) {
  const encoder = new TextEncoder()
  const lines = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
  const fullText = lines.join('')
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(fullText))
      controller.close()
    },
  })
  return stream
}

describe('EdgeFunctionAIProvider', () => {
  let provider: EdgeFunctionAIProvider

  beforeEach(() => {
    provider = new EdgeFunctionAIProvider()
    vi.useFakeTimers()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('T13: sendConversationMessage calls onChunk for each SSE chunk', async () => {
    vi.useRealTimers()
    const stream = createSSEStream([
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } },
      { type: 'message_stop' },
    ])
    mockFetch.mockResolvedValueOnce(new Response(stream, { status: 200 }))

    const chunks: string[] = []
    await provider.sendConversationMessage('A', [], 'test', (chunk) =>
      chunks.push(chunk)
    )
    expect(chunks).toEqual(['Hello', ' world'])
  })

  it('T14: sendConversationMessage resolves with full text on final event', async () => {
    vi.useRealTimers()
    const stream = createSSEStream([
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } },
      { type: 'message_stop' },
    ])
    mockFetch.mockResolvedValueOnce(new Response(stream, { status: 200 }))

    const result = await provider.sendConversationMessage(
      'A',
      [],
      'test',
      () => {}
    )
    expect(result.response).toBe('Hello world')
    expect(result.empathy_note).toBeNull()
  })

  it('T15: 30s timeout rejects with TIMEOUT code', async () => {
    vi.useRealTimers()
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(
                new DOMException('The operation was aborted', 'AbortError')
              ),
            100
          )
        })
    )

    try {
      await provider.sendConversationMessage('A', [], 'test', () => {}, 100)
      expect.fail('Should have thrown')
    } catch (e: any) {
      expect(e.code).toBe('TIMEOUT')
    }
  })

  it('T16: HTTP 429 rejects with RATE_LIMIT code', async () => {
    vi.useRealTimers()
    mockFetch.mockResolvedValueOnce(new Response('rate limited', { status: 429 }))

    try {
      await provider.sendConversationMessage('A', [], 'test', () => {})
      expect.fail('Should have thrown')
    } catch (e: any) {
      expect(e.code).toBe('RATE_LIMIT')
    }
  })

  it('T17: HTTP 422 rejects with INVALID_REQUEST code', async () => {
    vi.useRealTimers()
    mockFetch.mockResolvedValueOnce(new Response('invalid', { status: 422 }))

    try {
      await provider.sendConversationMessage('A', [], 'test', () => {})
      expect.fail('Should have thrown')
    } catch (e: any) {
      expect(e.code).toBe('INVALID_REQUEST')
    }
  })

  it('T18: TypeError (network error) rejects with NETWORK_ERROR code', async () => {
    vi.useRealTimers()
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    try {
      await provider.sendConversationMessage('A', [], 'test', () => {})
      expect.fail('Should have thrown')
    } catch (e: any) {
      expect(e.code).toBe('NETWORK_ERROR')
    }
  })

  it('T19: 3 consecutive JSON parse failures reject with PARSE_ERROR code', async () => {
    vi.useRealTimers()
    const encoder = new TextEncoder()
    const badData =
      'data: not-json\n\ndata: also-not-json\n\ndata: still-not-json\n\n'
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(badData))
        controller.close()
      },
    })
    mockFetch.mockResolvedValueOnce(new Response(stream, { status: 200 }))

    try {
      await provider.sendConversationMessage('A', [], 'test', () => {})
      expect.fail('Should have thrown')
    } catch (e: any) {
      expect(e.code).toBe('PARSE_ERROR')
    }
  })
})
