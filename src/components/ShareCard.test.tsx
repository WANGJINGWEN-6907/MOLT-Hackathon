import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MirrorFields } from '@/types/ai'
import ShareCard from './ShareCard'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(new Blob(['fake'], { type: 'image/png' }))
      }),
    })
  ),
}))

const mockMirror: MirrorFields = {
  startPoint: '从传统产品经理开始',
  turningPoint: 'AI 工具让我重新思考价值',
  currentState: '正在探索 AI 产品方向',
  lightMessage: '每一次迷茫都是蜕变的前奏',
}

describe('ShareCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with mirror props', () => {
    render(
      <ShareCard mirror={mockMirror} pathType="C" onClose={vi.fn()} />
    )

    expect(screen.getByText('每一次迷茫都是蜕变的前奏')).toBeInTheDocument()
    expect(screen.getByText(/从传统产品经理开始/)).toBeInTheDocument()
  })

  it('download button has minimum 44px height (DR-11)', () => {
    const { container } = render(
      <ShareCard mirror={mockMirror} pathType="A" onClose={vi.fn()} />
    )

    const downloadBtn = container.querySelector('[data-testid="share-download-btn"]')
    expect(downloadBtn).toBeTruthy()
    const style = downloadBtn?.getAttribute('style') || ''
    const className = downloadBtn?.getAttribute('class') || ''
    // Check min-height via style or class
    expect(
      style.includes('min-height') ||
        className.includes('min-h-[44px]') ||
        (downloadBtn as HTMLElement)?.style.minHeight === '44px'
    ).toBe(true)
  })

  it('on iOS Safari where toBlob fails, clipboard fallback is called', async () => {
    // Override html2canvas mock to return canvas where toBlob gives null
    const html2canvas = (await import('html2canvas')).default as unknown as ReturnType<typeof vi.fn>
    html2canvas.mockResolvedValueOnce({
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(null)
      }),
    })

    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })

    render(
      <ShareCard mirror={mockMirror} pathType="C" onClose={vi.fn()} />
    )

    const downloadBtn = screen.getByTestId('share-download-btn')
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('每一次迷茫都是蜕变的前奏')
      )
    })
  })
})
