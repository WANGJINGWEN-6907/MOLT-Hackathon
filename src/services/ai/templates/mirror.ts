import { generateMirrorSummary } from '@/lib/mirror/mirrorGenerator'
import type { MirrorSummaryInput } from '@/types'

export function buildMirrorFallback(input: MirrorSummaryInput) {
  return generateMirrorSummary(input.pathType, input.conversations)
}
