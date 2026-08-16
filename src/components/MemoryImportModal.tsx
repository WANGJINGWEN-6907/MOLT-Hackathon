import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { defaultMoltService } from '@/services/ai'
import { getMemoryImportReversePrompt } from '@/services/ai/templates/memoryImport'
import type { MemoryImport } from '@/types'

interface MemoryImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (memory: MemoryImport) => void
}

const SOURCES = ['ChatGPT', 'Claude', '豆包', '其他'] as const

export function MemoryImportModal({ open, onOpenChange, onImported }: MemoryImportModalProps) {
  const [sourceAI, setSourceAI] = React.useState<(typeof SOURCES)[number]>('ChatGPT')
  const [rawText, setRawText] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setError(null)
      setCopied(false)
    }
  }, [open])

  const reversePrompt = React.useMemo(() => getMemoryImportReversePrompt(sourceAI), [sourceAI])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard?.writeText(reversePrompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const handleImport = async () => {
    if (!rawText.trim()) {
      setError('先把你的 AI 对你的那段总结贴进来。')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await defaultMoltService.importMemory({
        sessionId: 'onboarding',
        sourceAI,
        rawText,
      })
      onImported(result.data)
      onOpenChange(false)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : '导入失败，请稍后再试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[1.8rem] border border-primary/20 bg-card px-0 shadow-[0_32px_90px_hsl(0_0%_0%/0.45)]">
        <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-border/70 px-6 py-6 md:border-b-0 md:border-r md:px-7">
            <DialogHeader>
              <DialogTitle className="text-2xl text-foreground">让你的 AI 先替你开口</DialogTitle>
            </DialogHeader>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>你不必从零开始自我介绍。把这段 prompt 发给你常聊的 AI，让它用 200 字以内概括对你的理解。</p>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <p className="section-kicker">Reverse Prompt / {sourceAI}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/90">{reversePrompt}</p>
              </div>
              <Button type="button" variant="outline" className="rounded-full" onClick={handleCopyPrompt}>
                {copied ? '已复制' : `复制 ${sourceAI} 版 Prompt`}
              </Button>
            </div>
          </div>

          <div className="px-6 py-6 md:px-7">
            <div className="space-y-4">
              <div>
                <p className="section-kicker">Source AI</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SOURCES.map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setSourceAI(source)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${sourceAI === source ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-kicker">Paste Back</p>
                <Textarea
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                  placeholder="把 AI 对你的那段总结粘贴到这里。MOLT 会先把它解析成结构化画像，再作为第一幕出题的上下文。"
                  className="mt-3 min-h-[240px] rounded-[1.25rem] border-border/80 bg-background/70 px-4 py-4 text-sm leading-7"
                />
              </div>

              {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">{error}</p>}

              <Button type="button" onClick={handleImport} disabled={isSubmitting} className="h-auto min-h-[52px] rounded-full px-8 py-4 font-mono text-base">
                {isSubmitting ? '正在解析这段记忆...' : '导入这段 AI 记忆'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
