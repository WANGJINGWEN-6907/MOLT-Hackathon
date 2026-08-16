import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Onboarding from './Onboarding'

describe('Onboarding page', () => {
  it('renders the memory-import entry and three path cards', () => {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>,
    )

    expect(screen.getByText('你可以自己开口，也可以让你的 AI 先替你说一句。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入 AI 记忆' })).toBeInTheDocument()
    expect(screen.getByLabelText('「我知道自己的专业要消失了 但我不知道下一步在哪里」')).toBeInTheDocument()
    expect(screen.getByLabelText('「我已经在行动了，但不确定 自己走的方向对不对」')).toBeInTheDocument()
    expect(screen.getByLabelText('「我走出来了，但我想让 后来的人少走弯路」')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '都有一点，但又不完全是 →' })).toBeInTheDocument()
  })
})
