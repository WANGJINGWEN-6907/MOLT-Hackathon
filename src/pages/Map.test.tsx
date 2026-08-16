import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Map from './Map'

const createOrGetUser = vi.fn()
const getPublicArchives = vi.fn()

vi.mock('@/lib/anonymousUser', () => ({
  getOrCreateAnonymousId: () => 'anon-1',
}))

vi.mock('@/db/api', async () => {
  const actual = await vi.importActual<object>('@/db/api')
  return {
    ...actual,
    createOrGetUser: (...args: unknown[]) => createOrGetUser(...args),
    getPublicArchives: (...args: unknown[]) => getPublicArchives(...args),
  }
})

vi.mock('@/components/ForceGraph', () => ({
  ForceGraph: ({ nodes }: { nodes: Array<{ id: string }> }) => (
    <div data-testid="force-graph">{nodes.length}</div>
  ),
}))

describe('Map page', () => {
  beforeEach(() => {
    createOrGetUser.mockResolvedValue({ id: 'user-1' })
    getPublicArchives.mockResolvedValue([])
  })

  it('shows a demo-data notice when only static nodes are available', async () => {
    render(
      <MemoryRouter>
        <Map />
      </MemoryRouter>,
    )

    expect(await screen.findByText('当前展示的是 demo 地图节点，真实公开档案暂时为空。')).toBeInTheDocument()
    expect(screen.getByTestId('force-graph')).toBeInTheDocument()
  })
})
