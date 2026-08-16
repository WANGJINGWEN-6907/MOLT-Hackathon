export interface Option {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  withCount?: boolean
}

export type {
  AgentMatchInput,
  AIProvider,
  AIResponseKind,
  AIResponseMap,
  AIService,
  AIServiceResponse,
  ConversationTurnData,
  ConversationTurnInput,
  EmbedRequest,
  EmbedResponse,
  EvidenceSnapshot,
  MatchV32Request,
  MemoryImportRequest,
  MirrorFields,
  MirrorSummaryInput,
  MoltCardsRequest,
  MoltCardsResponse,
  MoltExperienceService,
  MoltResponseKind,
  MoltServiceResponse,
  ProfileSynthRequest,
  ProfileSynthResponse,
  ResultAnalysisInput,
} from './ai'

export type {
  Archive,
  CareerNodeData,
  CareerNodeType,
  Cluster,
  Connection,
  ConnectionLevel,
  Conversation,
  JobSnapshot,
  MapNode,
  MatchFeedback,
  MemoryImport,
  MoltAct,
  MoltActSelection,
  MoltCard,
  MoltSession,
  PathType,
  PressureLevel,
  ProfileExtract,
  Question,
  Result,
  Signal,
  User,
  UserProfile,
} from './types'
