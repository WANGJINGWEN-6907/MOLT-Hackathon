export { EdgeFunctionAIProvider } from './providers/edgeFunction'
export { LocalFallbackAIProvider } from './providers/fallback'
export { MockAIProvider } from './providers/mock'
export { defaultMoltService, deriveProfileFromSelection, getActTitle, LocalMoltExperienceService } from './moltService'
export { UnavailableAIProvider } from './providers/unavailable'
export { createAIService } from './service'

import { LocalFallbackAIProvider } from './providers/fallback'
import { UnavailableAIProvider } from './providers/unavailable'
import { createAIService } from './service'

// NOTE: EdgeFunctionAIProvider doesn't implement the AIProvider interface
// (different method signatures). Mirror/Result use defaultAIService with local fallback.
// Conversation.tsx calls EdgeFunctionAIProvider directly for real AI SSE.
export const defaultAIService = createAIService({
  primaryProvider: new UnavailableAIProvider(),
  fallbackProvider: new LocalFallbackAIProvider(),
})
