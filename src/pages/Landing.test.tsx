import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Landing from './Landing'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Landing page', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    )
    vi.stubEnv('VITE_DEMO_MODE', 'false')
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders the doc-aligned manifesto and primary CTA', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '你不是被时代淘汰的人你是正在换壳的人' })).toBeInTheDocument()
    expect(screen.getByText('这里不替你决定去哪里，只陪你把正在发生的变化慢慢看清。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始脱壳' })).toBeInTheDocument()
  })

  it('keeps the second headline line as a single centered line', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    const lockedLine = container.querySelectorAll('.whitespace-nowrap')[1]

    expect(lockedLine).toHaveTextContent('你是正在换壳的人')
  })

  it('keeps the first headline line unbroken', () => {
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    const noWrapLines = Array.from(container.querySelectorAll('.whitespace-nowrap'))
    const firstLine = noWrapLines.find((node) => node.textContent?.includes('你不是被时代淘汰的人'))

    expect(firstLine).toHaveTextContent('你不是被时代淘汰的人')
  })

  describe('demo mode', () => {
    it('keyboard sequence d→e→m→o triggers demo activation when VITE_DEMO_MODE is true', () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true')
      document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)

      render(
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      )

      for (const key of ['d', 'e', 'm', 'o']) {
        fireEvent.keyDown(window, { key })
      }

      expect(mockNavigate).toHaveBeenCalledWith('/conversation/A?demo=1')
    })

    it('keyboard sequence does NOT trigger when active element is an input', () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true')

      render(
        <MemoryRouter>
          <Landing />
          <input data-testid="trap" />
        </MemoryRouter>
      )

      const input = screen.getByTestId('trap')
      input.focus()

      for (const key of ['d', 'e', 'm', 'o']) {
        fireEvent.keyDown(window, { key })
      }

      expect(mockNavigate).not.toHaveBeenCalledWith('/conversation/A?demo=1')
    })

    it('?demo=1 URL param triggers demo activation when VITE_DEMO_MODE is true', () => {
      vi.stubEnv('VITE_DEMO_MODE', 'true')
      document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)

      // Set URL search params before render
      Object.defineProperty(window, 'location', {
        value: { ...window.location, search: '?demo=1' },
        writable: true,
      })

      render(
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/conversation/A?demo=1')
    })
  })
})
