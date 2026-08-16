import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import Result from './Result'

function renderResult(pathType = 'A') {
  return render(
    <MemoryRouter initialEntries={[`/result/${pathType}`]}>
      <Routes>
        <Route path="/result/:pathType" element={<Result />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Result page v3.2', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders the synthesized profile, cluster, and matched node from session storage', async () => {
    sessionStorage.setItem(
      'molt_v32_result_A',
      JSON.stringify({
        session: {
          pathType: 'A',
          acts: [],
          currentAct: 'done',
          profile: {},
          aggregatedTags: ['文科', 'AI替代焦虑', '产品'],
          profileDescription: '这个用户正经历文科转产品的身份迁移。',
          profileEmbedding: [1, 0, 0],
          clusterId: 'cluster-01',
        },
        match: {
          matchScore: 88,
          matchReason: '你们都从文科与 AI 焦虑的裂缝里往产品方向走。',
          agentMessage: '文科没有消失，它只是换了一层壳。',
          cluster: {
            id: 'cluster-01',
            label: '文科AI焦虑 × 产品方向',
            description: '文科或语言类背景，因 AI 冲击而焦虑，正在迁移到产品方向。',
            centroidEmbedding: [1, 0, 0],
            memberCount: 12,
            recoveredCount: 7,
          },
          matchedNode: {
            id: 'lighthouse-001',
            pathType: 'C',
            type: 'lighthouse',
            city: '北京',
            direction: '产品',
            currentState: 'AI 内容产品经理',
            profileDescription: '她从翻译背景走向 AI 内容产品。',
            careerNodes: [],
          },
        },
      }),
    )

    renderResult()

    expect(await screen.findByText('这个用户正经历文科转产品的身份迁移。')).toBeInTheDocument()
    expect(screen.getByText('文科AI焦虑 × 产品方向')).toBeInTheDocument()
    expect(screen.getByText('AI 内容产品经理')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去看这张地图' })).toBeInTheDocument()
  })

  it('shows a restart fallback when no session result exists', async () => {
    renderResult()

    expect(await screen.findByText('这段结果还没生成出来')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新开始' })).toBeInTheDocument()
  })
})
