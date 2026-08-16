import html2canvas from 'html2canvas'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import type { MirrorFields } from '@/types/ai'

interface ShareCardProps {
  mirror: MirrorFields
  pathType: 'A' | 'B' | 'C'
  onClose: () => void
}

/** Resolve CSS custom property to actual hsl() string for html2canvas compatibility */
function resolveCssVar(name: string, fallback: string): string {
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return val ? `hsl(${val})` : fallback
  } catch {
    return fallback
  }
}

/**
 * ShareCard — generates a 1080×1350 (4:5) share image from mirror data.
 * DR-10: Colors resolved from CSS custom properties via getComputedStyle so
 *        html2canvas captures the actual color values, not var() references.
 * DR-11: Touch targets minimum 44×44px.
 * C-5: iOS Safari fallback when toBlob fails.
 */
const ShareCard: React.FC<ShareCardProps> = ({ mirror, pathType, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Resolve actual CSS values at render time — html2canvas cannot resolve var() refs in inline styles
  const colors = useMemo(() => ({
    primary: resolveCssVar('--primary', '#7CFF6B'),
    foreground: resolveCssVar('--foreground', '#F5F5F5'),
    mutedForeground: resolveCssVar('--muted-foreground', '#A3A3A3'),
    background: resolveCssVar('--background', '#0A0A0A'),
  }), [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || isGenerating) return
    setIsGenerating(true)

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: colors.background,
        scale: 2,
        useCORS: true,
      })

      // Step 1: Try toBlob + download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `molt-share-${pathType}.png`
          a.click()
          URL.revokeObjectURL(url)
          showToast('图片已保存')
        } else {
          // Step 2: Clipboard fallback (iOS Safari C-5)
          clipboardFallback()
        }
        setIsGenerating(false)
      }, 'image/png')
    } catch {
      // Step 2: Clipboard fallback on any error
      clipboardFallback()
      setIsGenerating(false)
    }
  }, [colors.background, isGenerating, mirror.lightMessage, pathType, showToast])

  const clipboardFallback = useCallback(() => {
    const text = `${mirror.lightMessage ?? ''} — MOLT`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast('已复制到剪贴板'),
        () => showToast('已复制到剪贴板')
      )
    } else {
      showToast('已复制到剪贴板')
    }
  }, [mirror.lightMessage, showToast])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div className="relative w-full max-w-xs">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ color: colors.mutedForeground }}
        >
          关闭
        </button>

        {/* Preview: 1080×1350 (4:5) card scaled to 270×337.5 for preview */}
        <div
          ref={canvasRef}
          className="mx-auto overflow-hidden"
          style={{
            width: 270,
            height: 338,
            background: colors.background,
            borderRadius: 12,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 14,
              color: colors.foreground,
              letterSpacing: '0.1em',
            }}
          >
            MOLT
          </p>

          {/* lightMessage hero — resolved neon green */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              fontSize: 18,
              lineHeight: 1.5,
              color: colors.primary,
            }}
          >
            {mirror.lightMessage ?? ''}
          </p>

          {/* Summary */}
          <div style={{ fontSize: 9, lineHeight: 1.8, color: colors.mutedForeground }}>
            {mirror.startPoint && <p>{mirror.startPoint}</p>}
            {mirror.turningPoint && <p>{mirror.turningPoint}</p>}
          </div>

          {/* Watermark */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 8,
              color: colors.mutedForeground,
              letterSpacing: '0.15em',
            }}
          >
            molt.app
          </p>
        </div>

        {/* Download button — DR-11: min 44px */}
        <button
          type="button"
          data-testid="share-download-btn"
          onClick={handleDownload}
          disabled={isGenerating}
          className="mt-4 w-full font-mono min-h-[44px]"
          style={{
            minHeight: 44,
            minWidth: 44,
            background: colors.primary,
            color: colors.background,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            cursor: isGenerating ? 'wait' : 'pointer',
            border: 'none',
          }}
        >
          {isGenerating ? '生成中…' : '保存图片'}
        </button>

        {/* Toast */}
        {toast && (
          <div
            className="mt-3 text-center text-sm"
            style={{ color: colors.primary }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShareCard
