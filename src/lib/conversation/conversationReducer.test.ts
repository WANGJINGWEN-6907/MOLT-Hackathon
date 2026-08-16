import { describe, expect, it } from 'vitest'
import { canGoNext, conversationReducer, createInitialState } from './conversationReducer'

const sampleCard = {
  id: 'card-1',
  line1: '我会的表达力',
  line2: '像突然贬值了',
  tags: ['文科', 'AI替代焦虑'],
  profileFields: {
    anxiety_type: 'AI替代焦虑',
    major_field: '文科',
    direction: '产品',
  },
  depth: 'surface' as const,
}

describe('conversationReducer v3.3', () => {
  it('creates a Molt session as the initial state', () => {
    const state = createInitialState('A')
    expect(state.session.currentAct).toBe(1)
    expect(state.session.acts).toEqual([])
    expect(state.status).toBe('idle')
  })

  it('loads an act and makes it selectable', () => {
    const state = conversationReducer(createInitialState('A'), {
      type: 'LOAD_ACT_SUCCESS',
      payload: {
        actNumber: 1,
        title: '壳在哪里裂开的',
        cards: [sampleCard],
      },
    })

    expect(state.status).toBe('ready')
    expect(state.session.acts[0]?.title).toBe('壳在哪里裂开的')
    expect(state.session.acts[0]?.cards).toHaveLength(1)
    expect(state.session.acts[0]?.selectedCards).toEqual([])
  })

  it('merges profile fields across multiple selected cards', () => {
    const directionCard = {
      ...sampleCard,
      id: 'card-2',
      line1: '我想先朝产品走一步',
      line2: '哪怕只是先试试看',
      tags: ['产品', '想找过来人聊'],
      profileFields: {
        direction: '产品',
        help_needed: '想找过来人聊',
      },
      depth: 'middle' as const,
    }

    const loaded = conversationReducer(createInitialState('A'), {
      type: 'LOAD_ACT_SUCCESS',
      payload: {
        actNumber: 1,
        title: '壳在哪里裂开的',
        cards: [sampleCard, directionCard],
      },
    })

    const withFirstSelection = conversationReducer(loaded, {
      type: 'SELECT_CARD',
      payload: { actNumber: 1, card: sampleCard },
    })
    const selected = conversationReducer(withFirstSelection, {
      type: 'SELECT_CARD',
      payload: { actNumber: 1, card: directionCard },
    })

    expect(selected.session.profile.anxiety_type).toEqual(['AI替代焦虑'])
    expect(selected.session.profile.major_field).toBe('文科')
    expect(selected.session.profile.direction).toEqual(['产品'])
    expect(selected.session.profile.help_needed).toEqual(['想找过来人聊'])
    expect(selected.session.aggregatedTags).toContain('文科')
    expect(selected.session.acts[0]?.selectedCards).toHaveLength(2)
  })

  it('supports toggling cards off again', () => {
    const loaded = conversationReducer(createInitialState('A'), {
      type: 'LOAD_ACT_SUCCESS',
      payload: {
        actNumber: 1,
        title: '壳在哪里裂开的',
        cards: [sampleCard],
      },
    })

    const selected = conversationReducer(loaded, {
      type: 'SELECT_CARD',
      payload: { actNumber: 1, card: sampleCard },
    })
    const unselected = conversationReducer(selected, {
      type: 'SELECT_CARD',
      payload: { actNumber: 1, card: sampleCard },
    })

    expect(unselected.session.acts[0]?.selectedCards).toEqual([])
    expect(canGoNext(unselected)).toBe(false)
  })

  it('requires custom text before continuing a custom card and clears other selections', () => {
    const customCard = {
      ...sampleCard,
      id: 'custom',
      isCustom: true,
      tags: [],
      profileFields: {},
    }

    const loaded = conversationReducer(createInitialState('A'), {
      type: 'LOAD_ACT_SUCCESS',
      payload: {
        actNumber: 1,
        title: '壳在哪里裂开的',
        cards: [customCard],
      },
    })

    const selectedNormal = conversationReducer(loaded, {
      type: 'SELECT_CARD',
      payload: { actNumber: 1, card: sampleCard },
    })

    const selected = conversationReducer(selectedNormal, {
      type: 'SELECT_CARD',
      payload: { actNumber: 1, card: customCard },
    })

    expect(selected.session.acts[0]?.selectedCards).toEqual([customCard])
    expect(canGoNext(selected)).toBe(false)

    const withText = conversationReducer(selected, {
      type: 'SET_CUSTOM_TEXT',
      payload: { actNumber: 1, customText: '我的裂缝其实在选择太多。' },
    })
    expect(canGoNext(withText)).toBe(true)
  })

  it('stores the synthesized profile and marks the session as done', () => {
    const next = conversationReducer(createInitialState('A'), {
      type: 'SET_PROFILE_DESCRIPTION',
      payload: '这个用户正经历文科转产品的身份迁移。',
    })

    expect(next.status).toBe('confirming-profile')
    expect(next.session.currentAct).toBe('done')
    expect(next.session.profileDescription).toContain('文科转产品')
  })
})
