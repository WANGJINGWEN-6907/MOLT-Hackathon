import { describe, expect, it } from 'vitest'
import { staticMapNodes } from '@/lib/staticData'
import { filterCandidates, getFallbackMatch, matchAgent, rankCandidates, selectBestMatch, type MatchContext } from './agentMatcher'

const literaryProductContext: MatchContext = {
  pathType: 'A',
  profile: {
    anxiety_type: ['AI替代焦虑'],
    major_field: '文科',
    direction: ['产品'],
    help_needed: ['想找过来人聊'],
  },
  profileDescription: '文科翻译背景，因为 AI 替代焦虑而想转产品，最想先找一个走过这条路的人聊聊。',
  aggregatedTags: ['文科', 'AI替代焦虑', '产品'],
}

describe('agentMatcher v3.4', () => {
  it('filters lighthouses for explorer-side matching', () => {
    const candidates = filterCandidates(staticMapNodes, literaryProductContext)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every((candidate) => candidate.type === 'lighthouse')).toBe(true)
  })

  it('keeps explorer users matching only against lighthouses', () => {
    const candidates = filterCandidates(staticMapNodes, {
      pathType: 'B',
      profile: { direction: ['技术'] },
      profileDescription: '技术栈升级焦虑，正在做迁移任务。',
      aggregatedTags: ['技术', '技能过时'],
    })
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every((candidate) => candidate.type === 'lighthouse')).toBe(true)
  })

  it('keeps lighthouse users matching only against explorers', () => {
    const candidates = filterCandidates(staticMapNodes, {
      pathType: 'C',
      profile: { current_node_type: 'landed', direction: ['产品'] },
      profileDescription: '已经落地产品方向，想回头看看谁正站在我刚走过的位置上。',
      aggregatedTags: ['产品'],
    })

    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates.every((candidate) => candidate.type === 'explorer')).toBe(true)
  })

  it('ranks the translator-to-product lighthouse first for literary product anxiety', () => {
    const ranked = rankCandidates(filterCandidates(staticMapNodes, literaryProductContext), literaryProductContext)
    expect(ranked[0]?.id).toBe('lighthouse-001')
    expect(selectBestMatch(ranked)?.direction).toBe('产品')
  })

  it('matches a lighthouse for explorer-side Path B tech-upgrade context', () => {
    const result = matchAgent(
      {
        pathType: 'B',
        profile: {
          anxiety_type: ['技能过时'],
          major_field: '理工科',
          direction: ['技术'],
        },
        profileDescription: 'Java 开发背景，觉得自己的技术栈在过期，正在补云服务和平台能力。',
        aggregatedTags: ['理工科', '技术', '技能过时'],
      },
      staticMapNodes,
    )

    expect(result.matchedNode?.type).toBe('lighthouse')
    expect(result.matchedNode?.direction).toBe('技术')
    expect(result.matchScore).toBeGreaterThan(0)
  })

  it('returns fallback copy when there are no candidates', () => {
    const result = getFallbackMatch('A')
    expect(result.matchedNode).toBeUndefined()
    expect(result.matchReason).toBeTruthy()
    expect(result.agentMessage).toBeTruthy()
  })
})
