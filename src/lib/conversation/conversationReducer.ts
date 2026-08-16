import { deriveProfileFromSelection } from '@/services/ai/moltService'
import type { MemoryImport, MoltAct, MoltCard, MoltSession, PathType, UserProfile } from '@/types'

export type ConversationStatus =
  | 'idle'
  | 'loading-act'
  | 'ready'
  | 'synthesizing-profile'
  | 'confirming-profile'
  | 'matching'
  | 'completed'

export interface ConversationState {
  session: MoltSession
  status: ConversationStatus
  error: string | null
  transitionLabel?: string
}

export type ConversationAction =
  | { type: 'HYDRATE'; payload: ConversationState }
  | { type: 'SET_MEMORY_IMPORT'; payload?: MemoryImport }
  | { type: 'LOAD_ACT_REQUEST'; payload: { actNumber: 1 | 2 | 3; transitionLabel?: string } }
  | {
      type: 'LOAD_ACT_SUCCESS'
      payload: { actNumber: 1 | 2 | 3; title: string; cards: MoltCard[]; fallbackUsed?: boolean; generationCount?: number }
    }
  | { type: 'SELECT_CARD'; payload: { actNumber: 1 | 2 | 3; card: MoltCard } }
  | { type: 'SET_CUSTOM_TEXT'; payload: { actNumber: 1 | 2 | 3; customText: string } }
  | { type: 'SET_PROFILE_DESCRIPTION'; payload: string }
  | { type: 'SET_PROFILE_EMBEDDING'; payload: number[] }
  | { type: 'SET_CLUSTER'; payload?: string }
  | { type: 'SET_STATUS'; payload: { status: ConversationStatus; transitionLabel?: string } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET'; payload: { pathType: PathType } }

function createBaseProfile(): Partial<UserProfile> {
  return {
    anxiety_type: [],
    actions_taken: [],
    direction: [],
    help_needed: [],
    aggregated_tags: [],
    current_node_type: 'crisis',
  }
}

function createSession(pathType: PathType): MoltSession {
  return {
    pathType,
    acts: [],
    currentAct: 1,
    profile: createBaseProfile(),
    aggregatedTags: [],
  }
}

export function createInitialState(pathType: PathType): ConversationState {
  return {
    session: createSession(pathType),
    status: 'idle',
    error: null,
  }
}

function upsertAct(acts: MoltAct[], nextAct: MoltAct): MoltAct[] {
  const existingIndex = acts.findIndex((act) => act.actNumber === nextAct.actNumber)
  if (existingIndex === -1) {
    return [...acts, nextAct].sort((left, right) => left.actNumber - right.actNumber)
  }

  const cloned = [...acts]
  cloned[existingIndex] = nextAct
  return cloned
}

function rebuildProfileFromActs(acts: MoltAct[]): Pick<MoltSession, 'profile' | 'aggregatedTags'> {
  let profile = createBaseProfile()
  let aggregatedTags: string[] = []

  acts.forEach((act) => {
    act.selectedCards.forEach((card) => {
      if (card.isCustom) return
      const merged = deriveProfileFromSelection(profile, card, aggregatedTags)
      profile = merged.profile
      aggregatedTags = merged.aggregatedTags
    })
  })

  return { profile, aggregatedTags }
}

function hasCustomCardSelected(act: MoltAct): boolean {
  return act.selectedCards.some((card) => card.isCustom)
}

function toggleSelectedCards(existingAct: MoltAct, card: MoltCard): Pick<MoltAct, 'selectedCards' | 'customText'> {
  const hasSelected = existingAct.selectedCards.some((selectedCard) => selectedCard.id === card.id)

  if (card.isCustom) {
    return {
      selectedCards: hasSelected ? [] : [card],
      customText: hasSelected ? '' : existingAct.customText,
    }
  }

  const normalCards = existingAct.selectedCards.filter((selectedCard) => !selectedCard.isCustom)
  return {
    selectedCards: hasSelected
      ? normalCards.filter((selectedCard) => selectedCard.id !== card.id)
      : [...normalCards, card],
    customText: hasCustomCardSelected(existingAct) ? '' : existingAct.customText,
  }
}

export function getCurrentAct(state: ConversationState): MoltAct | undefined {
  const actNumber = state.session.currentAct
  if (actNumber === 'done') return undefined
  return state.session.acts.find((act) => act.actNumber === actNumber)
}

export function getSelectedCards(state: ConversationState): MoltCard[] {
  return state.session.acts.flatMap((act) => act.selectedCards)
}

export function canGoNext(state: ConversationState): boolean {
  if (state.status === 'confirming-profile') {
    return Boolean(state.session.profileDescription)
  }

  const currentAct = getCurrentAct(state)
  if (!currentAct || currentAct.selectedCards.length === 0) return false
  if (hasCustomCardSelected(currentAct)) {
    return Boolean(currentAct.customText?.trim())
  }
  return true
}

export function canGoPrev(state: ConversationState): boolean {
  return typeof state.session.currentAct === 'number' && state.session.currentAct > 1 && state.status === 'ready'
}

export function conversationReducer(state: ConversationState, action: ConversationAction): ConversationState {
  switch (action.type) {
    case 'HYDRATE': {
      return action.payload
    }

    case 'SET_MEMORY_IMPORT': {
      return {
        ...state,
        session: {
          ...state.session,
          memoryImport: action.payload,
        },
      }
    }

    case 'LOAD_ACT_REQUEST': {
      return {
        ...state,
        status: 'loading-act',
        error: null,
        transitionLabel: action.payload.transitionLabel,
        session: {
          ...state.session,
          currentAct: action.payload.actNumber,
        },
      }
    }

    case 'LOAD_ACT_SUCCESS': {
      const nextAct: MoltAct = {
        actNumber: action.payload.actNumber,
        title: action.payload.title,
        cards: action.payload.cards,
        selectedCards: [],
        customText: '',
        fallbackUsed: action.payload.fallbackUsed,
        generationCount: action.payload.generationCount ?? 0,
      }

      const acts = upsertAct(state.session.acts, nextAct)
      const rebuilt = rebuildProfileFromActs(acts)

      return {
        ...state,
        status: 'ready',
        error: null,
        transitionLabel: undefined,
        session: {
          ...state.session,
          currentAct: action.payload.actNumber,
          acts,
          profile: rebuilt.profile,
          aggregatedTags: rebuilt.aggregatedTags,
        },
      }
    }

    case 'SELECT_CARD': {
      const existingAct = state.session.acts.find((act) => act.actNumber === action.payload.actNumber)
      if (!existingAct) return state

      const toggled = toggleSelectedCards(existingAct, action.payload.card)
      const acts = upsertAct(state.session.acts, {
        ...existingAct,
        selectedCards: toggled.selectedCards,
        customText: toggled.customText,
      })
      const rebuilt = rebuildProfileFromActs(acts)

      return {
        ...state,
        session: {
          ...state.session,
          acts,
          profile: rebuilt.profile,
          aggregatedTags: rebuilt.aggregatedTags,
        },
      }
    }

    case 'SET_CUSTOM_TEXT': {
      const existingAct = state.session.acts.find((act) => act.actNumber === action.payload.actNumber)
      if (!existingAct) return state

      return {
        ...state,
        session: {
          ...state.session,
          acts: upsertAct(state.session.acts, {
            ...existingAct,
            customText: action.payload.customText,
          }),
        },
      }
    }

    case 'SET_PROFILE_DESCRIPTION': {
      return {
        ...state,
        status: 'confirming-profile',
        transitionLabel: undefined,
        session: {
          ...state.session,
          currentAct: 'done',
          profileDescription: action.payload,
        },
      }
    }

    case 'SET_PROFILE_EMBEDDING': {
      return {
        ...state,
        session: {
          ...state.session,
          profileEmbedding: action.payload,
        },
      }
    }

    case 'SET_CLUSTER': {
      return {
        ...state,
        session: {
          ...state.session,
          clusterId: action.payload,
        },
      }
    }

    case 'SET_STATUS': {
      return {
        ...state,
        status: action.payload.status,
        transitionLabel: action.payload.transitionLabel,
      }
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
      }
    }

    case 'RESET': {
      return createInitialState(action.payload.pathType)
    }

    default:
      return state
  }
}
