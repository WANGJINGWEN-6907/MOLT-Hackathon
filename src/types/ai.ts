import type { MatchContext, MatchResult } from '@/lib/agent'
import type { MirrorSummary } from '@/lib/mirror/mirrorGenerator'
import type { PathAAnalysis, PathBAnalysis } from '@/lib/result'
import type {
  Conversation,
  MapNode,
  MemoryImport,
  MoltActSelection,
  MoltCard,
  PathType,
  UserProfile,
} from './types'

export type AIResponseKind = 'conversation' | 'mirror' | 'result' | 'agent'

export type MoltResponseKind =
  | 'molt-cards'
  | 'profile-synth'
  | 'embed'
  | 'memory-import'
  | 'match-v32'

export interface AIServiceResponse<T> {
  kind: AIResponseKind
  data: T
  fallbackUsed: boolean
  provider: string
  dataMode?: 'live' | 'snapshot' | 'mock'
  error?: string
}

export interface MoltServiceResponse<T> {
  kind: MoltResponseKind
  data: T
  fallbackUsed: boolean
  provider: string
  dataMode: 'live' | 'snapshot' | 'mock'
  error?: string
}

export interface AIResponseMap {
  conversation: ConversationTurnData
  mirror: MirrorSummary
  result: PathAAnalysis | PathBAnalysis
  agent: MatchResult
}

export interface ConversationTurnInput {
  pathType: PathType
  conversations: Conversation[]
}

export interface ConversationTurnData {
  nextPrompt: string | null
  promptIndex: number
  completed: boolean
  empathy_note: string | null
}

export interface MirrorSummaryInput {
  pathType: PathType
  conversations: Conversation[]
}

export interface ResultAnalysisInput {
  pathType: PathType
  conversations: Conversation[]
}

export interface MoltCardsRequest {
  actNumber: 1 | 2 | 3
  pathType: PathType
  previousSelections: MoltActSelection[]
  memoryImport?: MemoryImport
  regenerationCount?: number
}

export interface MoltCardsResponse {
  cards: MoltCard[]
}

export interface ProfileSynthRequest {
  profile: Partial<UserProfile>
  memoryImport?: MemoryImport
  selectedCards: MoltCard[]
}

export interface ProfileSynthResponse {
  profileDescription: string
}

export interface EmbedRequest {
  text: string
}

export interface EmbedResponse {
  embedding: number[]
}

export interface MatchV32Request {
  pathType: PathType
  profile: Partial<UserProfile>
  profileDescription: string
  profileEmbedding: number[]
  aggregatedTags: string[]
}

export interface MemoryImportRequest {
  sessionId: string
  sourceAI: string
  rawText: string
}

export interface EvidenceSnapshot {
  claim: string
  source: string
  quote: string
  year: number
}

export interface MirrorFields {
  startPoint: string | null
  turningPoint: string | null
  currentState: string | null
  lightMessage: string | null
}

export interface AgentMatchInput {
  context: MatchContext
  nodes: MapNode[]
}

export interface AIProvider {
  providerName: string
  generateConversationTurn(
    input: ConversationTurnInput
  ): Promise<AIServiceResponse<ConversationTurnData>>
  generateMirrorSummary(
    input: MirrorSummaryInput
  ): Promise<AIServiceResponse<MirrorSummary>>
  analyzeResult(
    input: ResultAnalysisInput
  ): Promise<AIServiceResponse<PathAAnalysis | PathBAnalysis>>
  matchAgent(input: AgentMatchInput): Promise<AIServiceResponse<MatchResult>>
}

export interface AIService {
  generateConversationTurn(
    input: ConversationTurnInput
  ): Promise<AIServiceResponse<ConversationTurnData>>
  generateMirrorSummary(
    input: MirrorSummaryInput
  ): Promise<AIServiceResponse<MirrorSummary>>
  analyzeResult(
    input: ResultAnalysisInput
  ): Promise<AIServiceResponse<PathAAnalysis | PathBAnalysis>>
  matchAgent(input: AgentMatchInput): Promise<AIServiceResponse<MatchResult>>
}

export interface MoltExperienceService {
  importMemory(input: MemoryImportRequest): Promise<MoltServiceResponse<MemoryImport>>
  generateMoltCards(input: MoltCardsRequest): Promise<MoltServiceResponse<MoltCardsResponse>>
  synthesizeProfile(input: ProfileSynthRequest): Promise<MoltServiceResponse<ProfileSynthResponse>>
  embedText(input: EmbedRequest): Promise<MoltServiceResponse<EmbedResponse>>
  matchProfile(input: MatchV32Request): Promise<MoltServiceResponse<MatchResult>>
}
