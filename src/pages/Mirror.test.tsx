import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Mirror from './Mirror'

// Mock EdgeFunctionAIProvider
const generateMirror = vi.fn()

vi.mock('@/services/ai/providers/edgeFunction', () => {
  function EdgeFunctionAIProvider() {}
  EdgeFunctionAIProvider.prototype.generateMirror = (...args: unknown[]) => generateMirror(...args)
  return { EdgeFunctionAIProvider }
})

vi.mock('@/lib/anonymousUser', () => ({
  getOrCreateAnonymousId: () => 'anon-1',
}))

vi.mock('@/db/api', () => ({
  createOrGetUser: vi.fn().mockResolvedValue({ id: 'user-1', anonymous_id: 'anon-1', created_at: '' }),
  getConversationsByUser: vi.fn().mockResolvedValue([
    { id: '1', user_id: 'user-1', path_type: 'C', question_index: 0, question_text: 'Q1', answer_text: 'A1', created_at: '' },
  ]),
}))

function renderMirror(pathType = 'C') {
  return render(
    <MemoryRouter initialEntries={[`/mirror/${pathType}`]}>
      <Routes>
        <Route path="/mirror/:pathType" element={<Mirror />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Mirror page', () => {
  beforeEach(() => {
    generateMirror.mockReset()
    localStorage.clear()
  })

  it('shows skeleton shimmer while loading', () => {
    // Never resolve — keep loading
    generateMirror.mockReturnValue(new Promise(() => {}))

    const { container } = renderMirror()

    const skeletonBars = container.querySelectorAll('[data-testid="skeleton-bar"]')
    expect(skeletonBars.length).toBeGreaterThanOrEqual(1)
  })

  it('renders lightMessage as text-2xl font-semibold when AI returns data', async () => {
    generateMirror.mockResolvedValue({
      data: {
        startPoint: '从产品经理开始',
        turningPoint: 'AI浪潮',
        currentState: '探索中',
        lightMessage: '你正在蜕变',
      },
      dataMode: 'live',
    })

    renderMirror()

    const lightMsg = await screen.findByText('你正在蜕变')
    expect(lightMsg).toBeInTheDocument()
    expect(lightMsg.classList.contains('text-2xl') || lightMsg.className.includes('text-2xl')).toBe(true)
    expect(lightMsg.classList.contains('font-semibold') || lightMsg.className.includes('font-semibold')).toBe(true)
  })

  it('all 4 MirrorFields render with ?? "" null protection (no crash on null fields)', async () => {
    generateMirror.mockResolvedValue({
      data: {
        startPoint: null,
        turningPoint: null,
        currentState: null,
        lightMessage: null,
      },
      dataMode: 'live',
    })

    // Should not throw
    const { container } = renderMirror()

    // Wait for loading to finish
    await screen.findByText('继续')
    // Page rendered without crash
    expect(container).toBeTruthy()
  })

  it('shows positive fallback text when AI call fails', async () => {
    generateMirror.mockRejectedValue(new Error('AI unavailable'))

    renderMirror()

    const fallback = await screen.findByText('你正在经历的，是一次真实的蜕变')
    expect(fallback).toBeInTheDocument()
  })
})
