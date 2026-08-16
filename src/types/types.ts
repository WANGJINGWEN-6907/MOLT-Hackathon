// MOLT 应用类型定义

export type PathType = 'A' | 'B' | 'C'

export type PressureLevel = 'low' | 'medium' | 'high'

export type CareerNodeType = 'crisis' | 'exploring' | 'acting' | 'landed'

export type ConnectionLevel = 'signal' | 'resonance'

export interface User {
  id: string
  anonymous_id: string
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  path_type: PathType
  question_index: number
  question_text: string
  answer_text: string
  created_at: string
}

export interface Result {
  id: string
  user_id: string
  path_type: 'A' | 'B'
  pressure_level: PressureLevel
  pressure_description: string
  abilities: string[]
  market_signals: string
  action_suggestions: string[]
  created_at: string
}

export interface Archive {
  id: string
  user_id: string
  trajectory_summary: string
  is_public: boolean
  created_at: string
}

export interface Signal {
  id: string
  sender_id: string
  receiver_id: string
  signal_content: string
  created_at: string
}

export interface Question {
  index: number
  text: string
  placeholder?: string
}

export interface ProfileExtract {
  anxiety_type?: string
  major_field?: string
  career_status?: string
  action_stage?: string
  actions_taken?: string[]
  direction?: string
  help_needed?: string
  education_stage?: string
}

export interface MoltCard {
  id: string
  line1: string
  line2: string
  tags: string[]
  profileFields: ProfileExtract
  isCustom?: boolean
  depth?: 'surface' | 'middle' | 'deep'
}

export interface MoltActSelection {
  actNumber: number
  selectedCards: MoltCard[]
}

export interface MoltAct {
  actNumber: 1 | 2 | 3
  title: string
  cards: MoltCard[]
  selectedCards: MoltCard[]
  customText?: string
  fallbackUsed?: boolean
  generationCount?: number
}

export interface UserProfile {
  anxiety_type: string[]
  major_field: string
  career_status: string
  education_stage: string
  action_stage: string
  actions_taken: string[]
  direction: string[]
  help_needed: string[]
  current_node_type: CareerNodeType
  aggregated_tags: string[]
}

export interface MemoryImport {
  id: string
  userId: string
  sourceAI: string
  background: string
  anxiety: string
  personality: string[]
  exploring: string
  strength: string
  confidence: number
  rawText?: string
  createdAt: string
}

export interface CareerNodeData {
  nodeType: CareerNodeType
  validFrom: string
  validUntil: string | null
  tags: string[]
  anxietyType?: string
  direction?: string
  profileDescription?: string
  profileEmbedding?: number[]
}

export interface Cluster {
  id: string
  label: string
  description: string
  centroidEmbedding: number[]
  memberCount: number
  recoveredCount?: number
}

export interface MatchFeedback {
  matchId: string
  action: 'accepted' | 'skipped'
  createdAt: string
}

export interface Connection {
  id: string
  senderId: string
  receiverId: string
  level: ConnectionLevel
  senderMessage?: string
  receiverMessage?: string
  createdAt: string
  updatedAt: string
}

export interface MoltSession {
  pathType: PathType
  memoryImport?: MemoryImport
  acts: MoltAct[]
  currentAct: 1 | 2 | 3 | 'done'
  profile: Partial<UserProfile>
  aggregatedTags: string[]
  profileDescription?: string
  profileEmbedding?: number[]
  clusterId?: string
  selectedNodeId?: string
}

export interface MapNode {
  id: string
  type?: 'lighthouse' | 'explorer'
  pathType: PathType
  user_id?: string
  city?: string
  direction?: string
  startPoint?: string
  turningPoint?: string
  currentState?: string
  lightMessage?: string
  is_public?: boolean
  visibility?: 'full' | 'partial' | 'minimal'
  createdAt?: Date | string
  summary?: string
  x?: number
  y?: number
  careerNodes?: CareerNodeData[]
  profileDescription?: string
  profileEmbedding?: number[]
  clusterId?: string
  resonanceHint?: string
}

export interface JobSnapshot {
  id: string
  sourceName: string
  capturedAt: Date
  jobTitle: string
  city: string
  skillTags: string[]
  salaryRange: string
  trendNote: string
  evidenceQuote: string
}
