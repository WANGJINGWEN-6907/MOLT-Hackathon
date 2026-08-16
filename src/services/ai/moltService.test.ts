import { describe, expect, it } from 'vitest'
import type { MoltCard } from '@/types'
import { LocalMoltExperienceService } from './moltService'

const service = new LocalMoltExperienceService()

const act1Selection: MoltCard = {
  id: 'act1-sample',
  line1: '我会的表达力',
  line2: '像突然贬值了',
  tags: ['文科', 'AI替代焦虑'],
  profileFields: {
    anxiety_type: 'AI替代焦虑',
    major_field: '文科',
  },
  depth: 'surface',
}

const act2Selection: MoltCard = {
  id: 'act2-sample',
  line1: '你不是没能力',
  line2: '是旧能力还没被重命名',
  tags: ['探索'],
  profileFields: {
    action_stage: '刚开始探索',
    actions_taken: ['找前辈聊'],
  },
  depth: 'middle',
}

describe('LocalMoltExperienceService v3.4', () => {
  it('returns 6 cards for act 2', async () => {
    const response = await service.generateMoltCards({
      actNumber: 2,
      pathType: 'A',
      previousSelections: [
        {
          actNumber: 1,
          selectedCards: [act1Selection],
        },
      ],
    })

    expect(response.data.cards).toHaveLength(6)
    expect(response.data.cards.some((card) => card.isCustom)).toBe(true)
  })

  it('returns 6 cards for act 3', async () => {
    const response = await service.generateMoltCards({
      actNumber: 3,
      pathType: 'A',
      previousSelections: [
        {
          actNumber: 1,
          selectedCards: [act1Selection],
        },
        {
          actNumber: 2,
          selectedCards: [act2Selection],
        },
      ],
    })

    expect(response.data.cards).toHaveLength(6)
    expect(response.data.cards.some((card) => card.isCustom)).toBe(false)
  })
})
