import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MemoryImportModal } from '@/components/MemoryImportModal'
import { PathCard } from '@/components/PathCard'
import { Button } from '@/components/ui/button'
import { pathDescriptions } from '@/lib/conversationData'
import type { MemoryImport, PathType } from '@/types'

const MEMORY_STORAGE_KEY = 'molt_memory_import'
const ANIMATION_DURATION_MS = 2000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function readMemoryImport(): MemoryImport | null {
  try {
    const raw = sessionStorage.getItem(MEMORY_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MemoryImport) : null
  } catch {
    return null
  }
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate()
  const [memoryImport, setMemoryImport] = React.useState<MemoryImport | null>(() => readMemoryImport())
  const [isImportOpen, setIsImportOpen] = React.useState(false)
  const [animationProgress, setAnimationProgress] = React.useState(() => (prefersReducedMotion() ? 1 : 0))

  React.useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) {
      setAnimationProgress(1)
      return undefined
    }

    let frameId = 0
    let startTime: number | null = null

    const tick = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / ANIMATION_DURATION_MS, 1)
      setAnimationProgress(progress)
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  const handleImported = (memory: MemoryImport) => {
    setMemoryImport(memory)
    sessionStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory))
  }

  const handleClearMemory = () => {
    setMemoryImport(null)
    sessionStorage.removeItem(MEMORY_STORAGE_KEY)
  }

  const handleSelectPath = (pathType: PathType) => {
    navigate(`/conversation/${pathType}`)
  }

  return (
    <>
      <MemoryImportModal open={isImportOpen} onOpenChange={setIsImportOpen} onImported={handleImported} />

      <div className="shell-stage min-h-screen w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
        <div className="page-container space-y-6 sm:space-y-8">
          <section className="relative overflow-hidden rounded-[1.9rem] border border-primary/20 bg-card/92 px-5 py-8 shadow-[0_24px_70px_hsl(0_0%_0%/0.3)] sm:px-8 sm:py-10">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="section-kicker">MOLT</p>
                <h1 className="max-w-4xl text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  你可以自己开口，也可以让你的 AI 先替你说一句。
                </h1>
                <p className="max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
                  这一步是可选的。导入后，第一幕会基于那段 AI 记忆来生成更贴身的共振卡片；不导入也可以直接开始脱壳。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => setIsImportOpen(true)} className="rounded-full px-6 font-mono">
                  {memoryImport ? '重新导入 AI 记忆' : '导入 AI 记忆'}
                </Button>
                {memoryImport && (
                  <Button type="button" variant="outline" onClick={handleClearMemory} className="rounded-full px-6">
                    清除这段记忆
                  </Button>
                )}
              </div>

              {memoryImport && (
                <div className="rounded-[1.4rem] border border-primary/15 bg-background/60 p-5">
                  <p className="section-kicker">Imported Memory / {memoryImport.sourceAI}</p>
                  <p className="mt-3 text-sm leading-7 text-foreground">{memoryImport.background}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-3 py-1">焦虑：{memoryImport.anxiety}</span>
                    <span className="rounded-full border border-border px-3 py-1">探索：{memoryImport.exploring}</span>
                    <span className="rounded-full border border-border px-3 py-1">优势：{memoryImport.strength}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <PathCard
              pathType="A"
              title={pathDescriptions.A.title}
              mainText={pathDescriptions.A.mainText}
              cta={pathDescriptions.A.cta}
              animationProgress={animationProgress}
              onSelect={() => handleSelectPath('A')}
            />
            <PathCard
              pathType="B"
              title={pathDescriptions.B.title}
              mainText={pathDescriptions.B.mainText}
              cta={pathDescriptions.B.cta}
              animationProgress={animationProgress}
              onSelect={() => handleSelectPath('B')}
            />
            <PathCard
              pathType="C"
              title={pathDescriptions.C.title}
              mainText={pathDescriptions.C.mainText}
              cta={pathDescriptions.C.cta}
              animationProgress={animationProgress}
              onSelect={() => handleSelectPath('C')}
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => handleSelectPath('A')}
              className="rounded-full border border-border bg-card/70 px-5 py-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:text-base"
            >
              都有一点，但又不完全是 →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Onboarding
