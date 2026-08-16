import type { MirrorFields, PathType } from '@/types'

export interface ConversationError {
  code:
    | 'TIMEOUT'
    | 'NETWORK_ERROR'
    | 'RATE_LIMIT'
    | 'INVALID_REQUEST'
    | 'PARSE_ERROR'
  message: string
  retryable: boolean
}

export interface SendConversationResult {
  response: string
  empathy_note: string | null
}

const SYSTEM_PROMPTS: Record<string, string> = {
  A: '你是一个温暖、有共情力的对话引导者。放慢节奏，引导用户深入情感体验。一次只问一个问题。不给建议。用中文回复。请用纯文字回复，不使用任何 Markdown 格式。',
  B: '你是一个直接、平等、务实的对话伙伴。聚焦具体行动和实际步骤。一次只问一个问题。用中文回复。请用纯文字回复，不使用任何 Markdown 格式。',
  C: '你是一个庄重的采访者，在记录历史。精准、尊重地提问。一次只问一个问题。用中文回复。请用纯文字回复，不使用任何 Markdown 格式。',
}

export class EdgeFunctionAIProvider {
  private apiUrl: string
  private headers: Record<string, string>
  private model: string

  constructor() {
    const apiKey = import.meta.env.VITE_LLM_API_KEY as string | undefined
    // 通过 Vite dev proxy /claude-api → VITE_LLM_BASE_URL
    this.apiUrl = '/claude-api/v1/messages'
    this.headers = {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    }
    this.model = (import.meta.env.VITE_AI_MODEL as string | undefined) || 'claude-haiku-4-5-20251001'
  }

  async sendConversationMessage(
    pathType: PathType,
    messages: Array<{ role: string; content: string }>,
    userMessage: string,
    onChunk: (text: string) => void,
    timeoutMs = 30000,
    externalSignal?: AbortSignal
  ): Promise<SendConversationResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    // 将外部 abort 信号桥接到内部 controller（用于用户主动终止）
    const onExternalAbort = () => controller.abort()
    externalSignal?.addEventListener('abort', onExternalAbort)

    try {
      const apiMessages = [
        ...messages.map((m) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: String(m.content).slice(0, 2000),
        })),
        { role: 'user' as const, content: String(userMessage).slice(0, 2000) },
      ].slice(-20) // max 20 messages

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: SYSTEM_PROMPTS[pathType] || SYSTEM_PROMPTS.A,
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      })

      if (response.status === 429) {
        throw { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true } satisfies ConversationError
      }
      if (response.status === 422 || response.status === 400) {
        throw { code: 'INVALID_REQUEST', message: 'Invalid request', retryable: false } satisfies ConversationError
      }
      if (!response.ok) {
        throw { code: 'NETWORK_ERROR', message: `HTTP ${response.status}`, retryable: true } satisfies ConversationError
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw { code: 'NETWORK_ERROR', message: 'Missing response body', retryable: true } satisfies ConversationError
      }

      const decoder = new TextDecoder()
      let fullText = ''
      let consecutiveParseErrors = 0
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr || jsonStr === '[DONE]') continue

          try {
            const parsed = JSON.parse(jsonStr)
            consecutiveParseErrors = 0

            // Anthropic SSE: content_block_delta with text_delta
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta' &&
              parsed.delta?.text
            ) {
              fullText += parsed.delta.text
              onChunk(parsed.delta.text)
            } else if (parsed.type === 'message_stop') {
              return { response: fullText, empathy_note: null }
            } else if (parsed.type === 'error') {
              throw { code: 'NETWORK_ERROR', message: parsed.error?.message || 'Stream error', retryable: true } satisfies ConversationError
            }
          } catch (error) {
            if (isConversationError(error)) throw error
            consecutiveParseErrors += 1
            if (consecutiveParseErrors >= 3) {
              throw { code: 'PARSE_ERROR', message: '3 consecutive JSON parse failures', retryable: false } satisfies ConversationError
            }
          }
        }
      }

      return { response: fullText, empathy_note: null }
    } catch (error) {
      if (isConversationError(error)) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        // 区分用户主动终止和超时
        if (externalSignal?.aborted) {
          throw { code: 'TIMEOUT', message: 'User aborted', retryable: false } satisfies ConversationError
        }
        throw { code: 'TIMEOUT', message: 'Request timed out', retryable: true } satisfies ConversationError
      }
      if (error instanceof TypeError) {
        throw { code: 'NETWORK_ERROR', message: error.message, retryable: true } satisfies ConversationError
      }
      throw { code: 'NETWORK_ERROR', message: String(error), retryable: true } satisfies ConversationError
    } finally {
      clearTimeout(timeout)
      externalSignal?.removeEventListener('abort', onExternalAbort)
    }
  }

  async generateMirror(
    pathType: PathType,
    history: Array<{ question: string; answer: string }>,
    timeoutMs = 30000
  ): Promise<{ data: MirrorFields; dataMode: 'live' }> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const historyText = history
        .slice(0, 10)
        .map((h) => `Q: ${h.question.slice(0, 500)}\nA: ${h.answer.slice(0, 500)}`)
        .join('\n\n')

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: '你是一个镜像分析师。从对话中提取4个字段，以JSON格式返回：{ startPoint, turningPoint, currentState, lightMessage }。lightMessage最多20字，有力地抓住核心洞察。只返回合法JSON，不要markdown。',
          messages: [{ role: 'user', content: historyText || '(无对话记录)' }],
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Mirror request failed: ${response.status}`)
      const result = await response.json()
      const text = result.content?.[0]?.text || '{}'
      const parsed = parseLLMJson(text)
      const data: MirrorFields = {
        startPoint: typeof parsed.startPoint === 'string' ? parsed.startPoint.slice(0, 500) : '',
        turningPoint: typeof parsed.turningPoint === 'string' ? parsed.turningPoint.slice(0, 500) : '',
        currentState: typeof parsed.currentState === 'string' ? parsed.currentState.slice(0, 500) : '',
        lightMessage: typeof parsed.lightMessage === 'string' ? parsed.lightMessage.slice(0, 200) : '',
      }
      return { data, dataMode: 'live' }
    } finally {
      clearTimeout(timeout)
    }
  }

  async generateResult(
    pathType: PathType,
    mirror: MirrorFields,
    history: Array<{ question: string; answer: string }>,
    timeoutMs = 30000
  ): Promise<{ data: Record<string, unknown>; dataMode: 'live' }> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const historyText = history
        .slice(0, 10)
        .map((h) => `Q: ${h.question.slice(0, 500)}\nA: ${h.answer.slice(0, 500)}`)
        .join('\n\n')
      const mirrorText = `起点: ${mirror.startPoint}\n转折: ${mirror.turningPoint}\n现状: ${mirror.currentState}\n洞察: ${mirror.lightMessage}`

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          system: '你是一个职业转型分析师。分析对话和镜像数据，返回JSON: { corePattern: string, agentMatch: string | null, readinessScore: number (0-100), evidenceSnapshots: Array<{claim, source, quote, year}> (2-3条), nextStep: string }。只返回合法JSON，不要markdown。',
          messages: [{ role: 'user', content: `${mirrorText}\n\n${historyText}` }],
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Result request failed: ${response.status}`)
      const result = await response.json()
      const text = result.content?.[0]?.text || '{}'
      const parsed = parseLLMJson(text)
      return { data: parsed as Record<string, unknown>, dataMode: 'live' }
    } finally {
      clearTimeout(timeout)
    }
  }
}

function parseLLMJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(stripped) as Record<string, unknown>
  } catch {
    return {}
  }
}

function isConversationError(error: unknown): error is ConversationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}
