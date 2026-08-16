import { describe, expect, it } from 'vitest'
import { DEMO_PRESET } from './demoPreset'

describe('DEMO_PRESET', () => {
  it('has exactly 5 qa_pairs', () => {
    expect(DEMO_PRESET.qa_pairs).toHaveLength(5)
  })

  it('each qa_pair has non-empty question and answer', () => {
    for (const pair of DEMO_PRESET.qa_pairs) {
      expect(pair.question.length).toBeGreaterThan(0)
      expect(pair.answer.length).toBeGreaterThan(0)
    }
  })

  it('mirror has all 4 MirrorFields non-empty', () => {
    expect(DEMO_PRESET.mirror.startPoint.length).toBeGreaterThan(0)
    expect(DEMO_PRESET.mirror.turningPoint.length).toBeGreaterThan(0)
    expect(DEMO_PRESET.mirror.currentState.length).toBeGreaterThan(0)
    expect(DEMO_PRESET.mirror.lightMessage.length).toBeGreaterThan(0)
  })

  it('result.readinessScore is 0-100', () => {
    expect(DEMO_PRESET.result.readinessScore).toBeGreaterThanOrEqual(0)
    expect(DEMO_PRESET.result.readinessScore).toBeLessThanOrEqual(100)
  })
})
