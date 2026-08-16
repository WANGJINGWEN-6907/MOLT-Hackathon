import { describe, expect, it } from 'vitest'
import { staticMapNodes } from '@/lib/staticData'
import { virtualProfiles } from './virtualProfiles'

describe('virtualProfiles csv import', () => {
  it('parses the checked-in csv rows into virtual user records', () => {
    expect(virtualProfiles.length).toBe(100)
    expect(virtualProfiles[0]?.userId).toBeTruthy()
    expect(virtualProfiles.some((profile) => profile.currentNodeType === 'landed')).toBe(true)
    expect(virtualProfiles.some((profile) => profile.currentNodeType === 'exploring')).toBe(true)
  })

  it('converts csv profiles into static map nodes', () => {
    const virtualNodes = staticMapNodes.filter((node) => node.id.startsWith('virtual-'))
    expect(virtualNodes.length).toBe(100)
    expect(virtualNodes.some((node) => node.type === 'lighthouse')).toBe(true)
    expect(virtualNodes.some((node) => node.type === 'explorer')).toBe(true)
  })
})
