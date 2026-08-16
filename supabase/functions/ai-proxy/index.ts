import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// NOTE: In-memory rate limiting is best-effort only — Edge Function instances are stateless
// and each cold start resets the map. For production, use Supabase KV or Upstash Redis.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 60_000

// Input limits (DoS protection)
const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_ITEMS = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function sanitizeMessage(text: string): string {
  return String(text).slice(0, MAX_MESSAGE_LENGTH).trim()
}

function sanitizeMessages(messages: unknown[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .slice(0, MAX_MESSAGES)
    .filter((m): m is { role: string; content: string } =>
      typeof m === 'object' && m !== null && 'role' in m && 'content' in m
    )
    .map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: sanitizeMessage(String(m.content)),
    }))
}

// Schema validation for mirror response — rejects unknown fields, enforces string types
function validateMirrorFields(obj: unknown): { startPoint: string; turningPoint: string; currentState: string; lightMessage: string } {
  if (typeof obj !== 'object' || obj === null) throw new Error('Mirror response is not an object')
  const o = obj as Record<string, unknown>
  return {
    startPoint: typeof o.startPoint === 'string' ? o.startPoint.slice(0, 500) : '',
    turningPoint: typeof o.turningPoint === 'string' ? o.turningPoint.slice(0, 500) : '',
    currentState: typeof o.currentState === 'string' ? o.currentState.slice(0, 500) : '',
    lightMessage: typeof o.lightMessage === 'string' ? o.lightMessage.slice(0, 200) : '',
  }
}

// Schema validation for result response
function validateResultFields(obj: unknown): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) throw new Error('Result response is not an object')
  const o = obj as Record<string, unknown>
  return {
    corePattern: typeof o.corePattern === 'string' ? o.corePattern.slice(0, 500) : '',
    agentMatch: typeof o.agentMatch === 'string' ? o.agentMatch.slice(0, 200) : null,
    readinessScore: typeof o.readinessScore === 'number' ? Math.max(0, Math.min(100, o.readinessScore)) : 50,
    evidenceSnapshots: Array.isArray(o.evidenceSnapshots)
      ? o.evidenceSnapshots.slice(0, 3).map((e: unknown) => {
          if (typeof e !== 'object' || e === null) return null
          const ev = e as Record<string, unknown>
          return {
            claim: typeof ev.claim === 'string' ? ev.claim.slice(0, 300) : '',
            source: typeof ev.source === 'string' ? ev.source.slice(0, 100) : '',
            quote: typeof ev.quote === 'string' ? ev.quote.slice(0, 300) : '',
            year: typeof ev.year === 'number' ? ev.year : 2024,
          }
        }).filter(Boolean)
      : [],
    nextStep: typeof o.nextStep === 'string' ? o.nextStep.slice(0, 500) : '',
  }
}

// Parse JSON from LLM — strips markdown code fences if present
function parseLLMJson(text: string): unknown {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

const SYSTEM_PROMPTS: Record<string, string> = {
  A: 'You are a warm, empathetic conversational guide. Go slow, go deeper into emotional experience. Ask one question at a time. Never give advice. Respond in Chinese.',
  B: 'You are a direct, equal, pragmatic conversational partner. Focus on concrete actions and practical steps. Ask one question at a time. Respond in Chinese.',
  C: 'You are a solemn, interview-like documenter. You are documenting history with precision and respect. Ask one question at a time. Respond in Chinese.',
}

function structuredLog(data: Record<string, unknown>) {
  console.log(JSON.stringify(data))
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const pathname = url.pathname
  const userId = req.headers.get('x-user-id') || 'anonymous'
  const startTime = Date.now()

  if (!checkRateLimit(userId)) {
    structuredLog({ route: pathname, userId, latencyMs: Date.now() - startTime, status: 429 })
    return new Response(
      JSON.stringify({ error: 'rate_limit_exceeded' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // --- /ai-proxy/conversation (SSE streaming) ---
    if (pathname.endsWith('/conversation')) {
      const body = await req.json()
      const { pathType, messages, userMessage, model } = body as {
        pathType: string
        messages: unknown[]
        userMessage: string
        model?: string
      }

      const systemPrompt = SYSTEM_PROMPTS[pathType] || SYSTEM_PROMPTS.A
      const sanitizedMessage = sanitizeMessage(String(userMessage || ''))
      const sanitizedMessages = sanitizeMessages(Array.isArray(messages) ? messages : [])
      const selectedModel = model || 'claude-haiku-4-5-20251001'

      const anthropic = new Anthropic()
      const stream = await anthropic.messages.stream({
        model: selectedModel,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [...sanitizedMessages, { role: 'user' as const, content: sanitizedMessage }],
      })

      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'chunk', text: event.delta.text }) + '\n\n'))
              }
            }
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'final', is_final: true, empathy_note: null }) + '\n\n'))
            controller.close()
          } catch (error) {
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'error', message: String(error) }) + '\n\n'))
            controller.close()
          }
        },
      })

      structuredLog({ route: pathname, pathType, userId, latencyMs: Date.now() - startTime, status: 200 })
      return new Response(readableStream, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      })
    }

    // --- /ai-proxy/mirror (JSON) ---
    if (pathname.endsWith('/mirror')) {
      const body = await req.json()
      const { pathType, conversationHistory, model: mirrorModel } = body as { pathType: string; conversationHistory: unknown[]; model?: string }
      const selectedModel = mirrorModel || 'claude-haiku-4-5-20251001'

      const history = (Array.isArray(conversationHistory) ? conversationHistory : [])
        .slice(0, MAX_HISTORY_ITEMS)
        .filter((h): h is { question: string; answer: string } =>
          typeof h === 'object' && h !== null && 'question' in h && 'answer' in h
        )
        .map((h) => ({ question: String(h.question).slice(0, MAX_MESSAGE_LENGTH), answer: String(h.answer).slice(0, MAX_MESSAGE_LENGTH) }))

      const anthropic = new Anthropic()
      const result = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 1024,
        system: 'You are a mirror analyst. Extract 4 fields from the conversation as JSON: { startPoint, turningPoint, currentState, lightMessage }. lightMessage must be max 20 words, powerful, capturing the core insight. Respond ONLY with valid JSON, no markdown.',
        messages: [{ role: 'user', content: history.map((h) => 'Q: ' + h.question + '\nA: ' + h.answer).join('\n\n') }],
      })

      const textContent = result.content.find((c: { type: string }) => c.type === 'text')
      const rawText = (textContent as { type: string; text: string } | undefined)?.text || '{}'
      const validated = validateMirrorFields(parseLLMJson(rawText))

      structuredLog({ route: pathname, pathType, userId, latencyMs: Date.now() - startTime, status: 200 })
      return new Response(
        JSON.stringify({ data: validated, dataMode: 'live' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- /ai-proxy/result (JSON) ---
    if (pathname.endsWith('/result')) {
      const body = await req.json()
      const { pathType, mirror, conversationHistory, model: resultModel } = body as {
        pathType: string
        mirror: Record<string, string>
        conversationHistory: unknown[]
        model?: string
      }
      const selectedModel = resultModel || 'claude-haiku-4-5-20251001'

      const history = (Array.isArray(conversationHistory) ? conversationHistory : [])
        .slice(0, MAX_HISTORY_ITEMS)
        .filter((h): h is { question: string; answer: string } =>
          typeof h === 'object' && h !== null && 'question' in h && 'answer' in h
        )
        .map((h) => ({ question: String(h.question).slice(0, MAX_MESSAGE_LENGTH), answer: String(h.answer).slice(0, MAX_MESSAGE_LENGTH) }))

      const mirrorText = 'Mirror: startPoint=' + (String(mirror?.startPoint || '').slice(0, 200)) +
        ', turningPoint=' + (String(mirror?.turningPoint || '').slice(0, 200)) +
        ', currentState=' + (String(mirror?.currentState || '').slice(0, 200)) +
        ', lightMessage=' + (String(mirror?.lightMessage || '').slice(0, 200))

      const anthropic = new Anthropic()
      const result = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: 2048,
        system: 'You are a career transition analyst. Analyze the conversation and mirror data, then return JSON: { corePattern: string, agentMatch: string | null, readinessScore: number (0-100), evidenceSnapshots: Array<{claim, source, quote, year}> (2-3 items), nextStep: string }. Respond ONLY with valid JSON, no markdown.',
        messages: [{ role: 'user', content: mirrorText + '\n\n' + history.map((h) => 'Q: ' + h.question + '\nA: ' + h.answer).join('\n\n') }],
      })

      const textContent = result.content.find((c: { type: string }) => c.type === 'text')
      const rawText = (textContent as { type: string; text: string } | undefined)?.text || '{}'
      const validated = validateResultFields(parseLLMJson(rawText))

      structuredLog({ route: pathname, pathType, userId, latencyMs: Date.now() - startTime, status: 200 })
      return new Response(
        JSON.stringify({ data: validated, dataMode: 'live' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    structuredLog({ route: pathname, userId, latencyMs: Date.now() - startTime, status: 500, error: String(error) })
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
