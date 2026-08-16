import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createOrGetUser, getConversationsByUser } from '@/db/api'
import { getOrCreateAnonymousId } from '@/lib/anonymousUser'
import { createLogEvent, logEvent } from '@/lib/logging'
import { EdgeFunctionAIProvider } from '@/services/ai/providers/edgeFunction'
import type { PathType } from '@/types'
import type { MirrorFields } from '@/types/ai'

const aiProvider = new EdgeFunctionAIProvider()

/**
 * Mirror 镜像确认页
 */
const Mirror: React.FC = () => {
  const { pathType } = useParams<{ pathType: PathType }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [mirror, setMirror] = useState<MirrorFields | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!pathType) {
        setFailed(true)
        setIsLoading(false)
        return
      }

      try {
        logEvent(createLogEvent({ scope: 'mirror', action: 'load', status: 'started', payload: { pathType } }))
        const anonymousId = getOrCreateAnonymousId()
        const user = await createOrGetUser(anonymousId)
        if (!user) throw new Error('failed to initialize user')

        const conversations = await getConversationsByUser(user.id, pathType)

        // Store conversation history in localStorage for downstream pages
        try {
          localStorage.setItem(`molt_conversation_${pathType}`, JSON.stringify(conversations))
        } catch { /* localStorage full — non-critical */ }

        // Use real AI to generate mirror content
        const history = conversations
          .slice()
          .sort((a, b) => a.question_index - b.question_index)
          .map((c) => ({ question: c.question_text, answer: c.answer_text }))

        const result = await aiProvider.generateMirror(pathType, history)
        setMirror(result.data)

        // Save to localStorage for Result page
        try {
          localStorage.setItem(`molt_mirror_${pathType}`, JSON.stringify(result.data))
        } catch { /* non-critical */ }

        logEvent(createLogEvent({
          scope: 'mirror',
          action: 'generate-summary',
          status: 'succeeded',
          payload: { pathType },
        }))
      } catch (error) {
        setFailed(true)
        logEvent(createLogEvent({
          scope: 'mirror',
          action: 'load',
          status: 'failed',
          message: error instanceof Error ? error.message : 'unknown error',
          payload: { pathType },
        }))
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [pathType])

  const handleContinue = () => {
    if (!pathType) return
    if (pathType === 'C') {
      navigate('/archive')
    } else {
      navigate(`/result/${pathType}`)
    }
  }

  // Positive fallback when AI fails
  const displayMirror: MirrorFields = failed || !mirror
    ? {
        startPoint: null,
        turningPoint: null,
        currentState: null,
        lightMessage: '你正在经历的，是一次真实的蜕变',
      }
    : mirror

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'hsl(var(--background))', animation: 'mirrorFadeIn 500ms ease forwards' }}
    >
      <div className="max-w-2xl w-full space-y-8">
        {/* lightMessage hero — skeleton while loading */}
        {isLoading ? (
          <div className="space-y-3">
            {[95, 75].map((w) => (
              <div
                key={w}
                data-testid="skeleton-bar"
                className="skeleton-bar"
                style={{
                  width: `${w}%`,
                  height: 28,
                  background: 'hsl(var(--primary))',
                  borderRadius: 4,
                  opacity: 0.35,
                  animation: 'shimmer 1.8s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : (
          <p
            className="text-2xl sm:text-3xl font-semibold neon-glow"
            style={{ color: 'hsl(var(--primary))', lineHeight: 1.5 }}
          >
            {displayMirror.lightMessage ?? ''}
          </p>
        )}

        {/* MirrorCard: Glass card with fields — skeleton while loading */}
        {isLoading ? (
          <div
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div className="space-y-5">
              {[100, 80].map((w) => (
                <div
                  key={w}
                  style={{
                    width: `${w}%`,
                    height: 14,
                    background: 'hsl(var(--muted-foreground))',
                    borderRadius: 4,
                    opacity: 0.2,
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderTopColor: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div className="space-y-5">
              {(displayMirror.startPoint ?? '') !== '' && (
                <MirrorField label="起点" value={displayMirror.startPoint ?? ''} />
              )}
              {(displayMirror.turningPoint ?? '') !== '' && (
                <MirrorField label="转折" value={displayMirror.turningPoint ?? ''} />
              )}
              {(displayMirror.currentState ?? '') !== '' && (
                <MirrorField label="当前" value={displayMirror.currentState ?? ''} />
              )}
            </div>
          </div>
        )}

        {/* CTA — always visible, label changes during loading */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: 8,
              minHeight: 44,
              border: 'none',
              padding: '0 32px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              opacity: isLoading ? 0.55 : 1,
              transition: 'opacity 300ms ease',
            }}
          >
            {isLoading ? '生成中…' : '继续'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes mirrorFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

/** Single mirror field display */
function MirrorField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'hsl(var(--muted-foreground))',
          fontSize: 11,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p style={{ color: 'hsl(var(--foreground))', lineHeight: 1.6 }}>{value}</p>
    </div>
  )
}

export default Mirror
