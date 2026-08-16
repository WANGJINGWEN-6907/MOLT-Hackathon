import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Conversation from './Conversation'

const generateMoltCards = vi.fn()
const synthesizeProfile = vi.fn()
const embedText = vi.fn()
const matchProfile = vi.fn()

vi.mock('@/services/ai', async () => {
  const actual = await vi.importActual<typeof import('@/services/ai')>('@/services/ai')
  return {
    ...actual,
    defaultMoltService: {
      generateMoltCards: (...args: unknown[]) => generateMoltCards(...args),
      synthesizeProfile: (...args: unknown[]) => synthesizeProfile(...args),
      embedText: (...args: unknown[]) => embedText(...args),
      matchProfile: (...args: unknown[]) => matchProfile(...args),
    },
  }
})

vi.mock('@/db/api', () => ({
  createOrGetUser: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
  saveConversation: vi.fn().mockResolvedValue({ id: 'test-conv-id' }),
  deleteConversationsByUserAndPath: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/anonymousUser', () => ({
  getOrCreateAnonymousId: vi.fn().mockReturnValue('test-anonymous-id'),
}))

function renderConversation(pathType = 'A') {
  return render(
    <MemoryRouter initialEntries={[`/conversation/${pathType}`]}>
      <Routes>
        <Route path="/conversation/:pathType" element={<Conversation />} />
        <Route path="/result/:pathType" element={<div>Result</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderConversationInStrictMode(pathType = 'A') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/conversation/${pathType}`]}>
        <Routes>
          <Route path="/conversation/:pathType" element={<Conversation />} />
          <Route path="/result/:pathType" element={<div>Result</div>} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
}

describe('Conversation Page v3.3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    generateMoltCards.mockImplementation(async ({ actNumber, regenerationCount = 0 }: { actNumber: number; regenerationCount?: number }) => {
      if (actNumber === 1) {
        return {
          kind: 'molt-cards',
          provider: 'test',
          fallbackUsed: false,
          dataMode: 'mock',
          data: {
            cards: [
              {
                id: regenerationCount > 0 ? 'act1-refresh' : 'act1',
                line1: regenerationCount > 0 ? '最怕的不是慢' : '我会的表达力',
                line2: regenerationCount > 0 ? '是越走越像走错了' : '像突然贬值了',
                tags: ['文科', 'AI替代焦虑'],
                profileFields: { anxiety_type: 'AI替代焦虑', major_field: '文科' },
                depth: 'surface',
              },
              {
                id: regenerationCount > 0 ? 'act1-refresh-2' : 'act1-alt',
                line1: regenerationCount > 0 ? '别人问我下一步' : '我知道该动了',
                line2: regenerationCount > 0 ? '我脑子会瞬间空白' : '却不知道先动哪一格',
                tags: ['方向迷茫'],
                profileFields: { anxiety_type: '方向迷茫', major_field: '文科' },
                depth: 'middle',
              },
            ],
          },
        }
      }

      if (actNumber === 2) {
        return {
          kind: 'molt-cards',
          provider: 'test',
          fallbackUsed: false,
          dataMode: 'mock',
          data: {
            cards: [
              {
                id: 'act2',
                line1: '你不是没能力',
                line2: '是旧能力没改名',
                tags: ['探索'],
                profileFields: { action_stage: '刚开始探索', actions_taken: ['找前辈聊'] },
                depth: 'middle',
              },
              {
                id: 'act2-alt',
                line1: '你一直在准备',
                line2: '却不敢把准备算行动',
                tags: ['还没行动'],
                profileFields: { action_stage: '刚开始探索', actions_taken: ['还没行动'] },
                depth: 'surface',
              },
            ],
          },
        }
      }

      return {
        kind: 'molt-cards',
        provider: 'test',
        fallbackUsed: false,
        dataMode: 'mock',
        data: {
          cards: [
            {
              id: 'act3',
              line1: '找一个走过这路的人',
              line2: '先听一句真话',
              tags: ['想找过来人聊', '产品'],
              profileFields: { direction: '产品', help_needed: '想找过来人聊' },
              depth: 'surface',
            },
          ],
        },
      }
    })

    synthesizeProfile.mockResolvedValue({
      kind: 'profile-synth',
      provider: 'test',
      fallbackUsed: false,
      dataMode: 'mock',
      data: {
        profileDescription: '这个用户正经历文科转产品的身份迁移，最想找一个走过这段路的人聊聊。',
      },
    })

    embedText.mockResolvedValue({
      kind: 'embed',
      provider: 'test',
      fallbackUsed: false,
      dataMode: 'mock',
      data: { embedding: [1, 0, 0] },
    })

    matchProfile.mockResolvedValue({
      kind: 'match-v32',
      provider: 'test',
      fallbackUsed: false,
      dataMode: 'mock',
      data: {
        matchedNode: {
          id: 'lighthouse-001',
          pathType: 'C',
          type: 'lighthouse',
          currentState: 'AI 内容产品经理',
        },
        matchScore: 88,
        matchReason: '你们都从文科与 AI 焦虑的裂缝里往产品方向走。',
        agentMessage: '文科没有消失，它只是换了一层壳。',
      },
    })
  })

  it('loads the first act cards on mount', async () => {
    renderConversation()

    expect(await screen.findByText('壳在哪里裂开的')).toBeInTheDocument()
    expect(screen.getByText('我会的表达力')).toBeInTheDocument()
    expect(generateMoltCards).toHaveBeenCalledWith(
      expect.objectContaining({ actNumber: 1, pathType: 'A' }),
    )
  })

  it('still bootstraps correctly in React StrictMode', async () => {
    renderConversationInStrictMode()

    expect(await screen.findByText('壳在哪里裂开的')).toBeInTheDocument()
    expect(screen.getByText('我会的表达力')).toBeInTheDocument()
  })

  it('advances to act 2 after selecting an act 1 card', async () => {
    renderConversation()

    fireEvent.click(await screen.findByTestId('molt-card-act1'))
    fireEvent.click(screen.getByRole('button', { name: '下一幕' }))

    expect(await screen.findByText('壳下面是什么')).toBeInTheDocument()
    expect(screen.getByText('你不是没能力')).toBeInTheDocument()
    expect(generateMoltCards).toHaveBeenCalledWith(
      expect.objectContaining({ actNumber: 2 }),
    )
  })

  it('passes multi-selected cards into the next act request', async () => {
    renderConversation()

    fireEvent.click(await screen.findByTestId('molt-card-act1'))
    fireEvent.click(screen.getByTestId('molt-card-act1-alt'))
    fireEvent.click(screen.getByRole('button', { name: '下一幕' }))

    expect(await screen.findByText('壳下面是什么')).toBeInTheDocument()
    expect(generateMoltCards).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        actNumber: 2,
        previousSelections: [
          expect.objectContaining({
            actNumber: 1,
            selectedCards: expect.arrayContaining([
              expect.objectContaining({ id: 'act1' }),
              expect.objectContaining({ id: 'act1-alt' }),
            ]),
          }),
        ],
      }),
    )
  })

  it('supports regenerating a new group of cards in the same act', async () => {
    renderConversation()

    expect(await screen.findByText('我会的表达力')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '换一组' }))

    expect(await screen.findByText('最怕的不是慢')).toBeInTheDocument()
    expect(generateMoltCards).toHaveBeenLastCalledWith(
      expect.objectContaining({ actNumber: 1, regenerationCount: 1 }),
    )
  })

  it('shows the synthesized profile after three confirmed acts', async () => {
    renderConversation()

    fireEvent.click(await screen.findByTestId('molt-card-act1'))
    fireEvent.click(screen.getByRole('button', { name: '下一幕' }))
    fireEvent.click(await screen.findByTestId('molt-card-act2'))
    fireEvent.click(screen.getByRole('button', { name: '下一幕' }))
    fireEvent.click(await screen.findByTestId('molt-card-act3'))
    fireEvent.click(screen.getByRole('button', { name: '下一幕' }))

    expect(await screen.findByText('壳已经脱落了。这是我看到的你。')).toBeInTheDocument()
    expect(screen.getByText(/文科转产品的身份迁移/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '是的，这就是我' })).toBeInTheDocument()
  })
})
