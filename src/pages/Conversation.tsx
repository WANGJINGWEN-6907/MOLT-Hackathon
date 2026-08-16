import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ActTransition } from '@/components/ActTransition'
import { MoltCard } from '@/components/MoltCard'
import { MoltComplete } from '@/components/MoltComplete'
import { ShellVisual } from '@/components/ShellVisual'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createOrGetUser, deleteConversationsByUserAndPath, saveConversation } from '@/db/api'
import { getOrCreateAnonymousId } from '@/lib/anonymousUser'
import { canGoNext, conversationReducer, createInitialState, getCurrentAct } from '@/lib/conversation'
import { defaultMoltService, getActTitle } from '@/services/ai'
import type { MemoryImport, MoltAct, MoltActSelection, MoltCard as MoltCardType, PathType } from '@/types'

const MEMORY_STORAGE_KEY = 'molt_memory_import'
const RESULT_STORAGE_PREFIX = 'molt_v32_result_'

const ACT_COPY: Record<1 | 2 | 3, string> = {
  1: '先不要解释得很完整。你可以多选几张，让裂缝先有一个更接近你的形状。',
  2: '往下看一层。你不是只有焦虑，壳下面还有真实的状态和已经发生过的动作。',
  3: '最后一幕不问你是谁，而问你下一步更想朝哪里长。这里也可以多选。',
}

function readMemoryImport(): MemoryImport | undefined {
  try {
    const raw = sessionStorage.getItem(MEMORY_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MemoryImport) : undefined
  } catch {
    return undefined
  }
}

function createContextCard(card: MoltCardType, customText?: string): MoltCardType {
  if (!card.isCustom || !customText?.trim()) return card
  const content = customText.trim()
  return {
    ...card,
    line1: content.slice(0, 12) || card.line1,
    line2: content.slice(12, 24) || '我想自己说',
  }
}

function buildActSelection(act: Pick<MoltAct, 'actNumber' | 'selectedCards' | 'customText'>): MoltActSelection {
  return {
    actNumber: act.actNumber,
    selectedCards: act.selectedCards.map((card) => createContextCard(card, act.customText)),
  }
}

function hasCustomCard(act: Pick<MoltAct, 'selectedCards'>): boolean {
  return act.selectedCards.some((card) => card.isCustom)
}

function getAllContextCards(acts: MoltAct[]): MoltCardType[] {
  return acts.flatMap((act) => buildActSelection(act).selectedCards)
}

function describeSelection(cards: MoltCardType[]): string {
  return cards.map((card) => `${card.line1} ${card.line2}`.trim()).join(' / ')
}

function getTransitionDetail(label: string): string {
  if (label.includes('轮廓')) return 'MOLT 正在把三幕选择和导入记忆缝合成一段更完整的画像。'
  if (label.includes('定位')) return '这一步会把你的画像压成语义向量，再去找那些曾经站在相似节点上的人。'
  return '这一小段等待不是空白，它是壳在真正裂开。'
}

const Conversation: React.FC = () => {
  const { pathType } = useParams<{ pathType: PathType }>()
  const navigate = useNavigate()
  const memoryImportRef = React.useRef<MemoryImport | undefined>(undefined)

  const [state, dispatch] = React.useReducer(
    conversationReducer,
    pathType ?? 'A',
    (initialPathType) => createInitialState(initialPathType as PathType),
  )
  const [userId, setUserId] = React.useState<string | null>(null)
  const [isBusy, setIsBusy] = React.useState(false)

  const currentAct = React.useMemo(() => getCurrentAct(state), [state])
  const selectedCards = React.useMemo(() => getAllContextCards(state.session.acts), [state.session.acts])

  React.useEffect(() => {
    memoryImportRef.current = state.session.memoryImport
  }, [state.session.memoryImport])

  const loadAct = React.useCallback(
    async (
      actNumber: 1 | 2 | 3,
      previousSelections: MoltActSelection[],
      memoryImport?: MemoryImport,
      regenerationCount = 0,
    ) => {
      if (!pathType) return
      dispatch({
        type: 'LOAD_ACT_REQUEST',
        payload: {
          actNumber,
          transitionLabel:
            regenerationCount > 0
              ? `第 ${actNumber} 幕正在换一层新碎片...`
              : actNumber === 1
                ? '裂缝正在显现...'
                : `第 ${actNumber} 幕正在长出来...`,
        },
      })
      setIsBusy(true)
      try {
        const response = await defaultMoltService.generateMoltCards({
          actNumber,
          pathType,
          previousSelections,
          memoryImport: memoryImport ?? memoryImportRef.current,
          regenerationCount,
        })
        dispatch({
          type: 'LOAD_ACT_SUCCESS',
          payload: {
            actNumber,
            title: getActTitle(actNumber),
            cards: response.data.cards,
            fallbackUsed: response.fallbackUsed,
            generationCount: regenerationCount,
          },
        })
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '卡片加载失败。' })
      } finally {
        setIsBusy(false)
      }
    },
    [pathType],
  )

  React.useEffect(() => {
    if (!pathType) return

    let cancelled = false

    const bootstrap = async () => {
      try {
        const importedMemory = readMemoryImport()
        if (importedMemory) {
          dispatch({ type: 'SET_MEMORY_IMPORT', payload: importedMemory })
        }

        const anonymousId = getOrCreateAnonymousId()
        const user = await createOrGetUser(anonymousId)
        if (!user || cancelled) return
        setUserId(user.id)
        await deleteConversationsByUserAndPath(user.id, pathType)
        if (cancelled) return
        await loadAct(1, [], importedMemory)
      } catch (error) {
        if (!cancelled) {
          dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '初始化失败。' })
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [loadAct, pathType])

  const handleAdvance = React.useCallback(async () => {
    if (!pathType || !currentAct) return

    const currentSelection = buildActSelection(currentAct)
    if (currentSelection.selectedCards.length === 0) return

    const previousSelections = state.session.acts
      .filter((act) => act.actNumber < currentAct.actNumber && act.selectedCards.length > 0)
      .map((act) => buildActSelection(act))
    const nextSelections = [...previousSelections, currentSelection]

    if (userId) {
      await saveConversation(
        userId,
        pathType,
        currentAct.actNumber - 1,
        currentAct.title,
        currentAct.customText?.trim() || describeSelection(currentSelection.selectedCards),
      )
    }

    if (currentAct.actNumber < 3) {
      await loadAct((currentAct.actNumber + 1) as 1 | 2 | 3, nextSelections)
      return
    }

    dispatch({
      type: 'SET_STATUS',
      payload: { status: 'synthesizing-profile', transitionLabel: '壳已经脱落，你的轮廓正在显现...' },
    })
    setIsBusy(true)

    try {
      const response = await defaultMoltService.synthesizeProfile({
        profile: state.session.profile,
        memoryImport: state.session.memoryImport,
        selectedCards: nextSelections.flatMap((selection) => selection.selectedCards),
      })
      dispatch({ type: 'SET_PROFILE_DESCRIPTION', payload: response.data.profileDescription })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '画像合成失败。' })
    } finally {
      setIsBusy(false)
    }
  }, [currentAct, loadAct, pathType, state.session.acts, state.session.memoryImport, state.session.profile, userId])

  const handleCardSelect = (card: MoltCardType) => {
    if (!currentAct) return
    dispatch({ type: 'SELECT_CARD', payload: { actNumber: currentAct.actNumber, card } })
  }

  const handleRefreshCards = React.useCallback(async () => {
    if (!currentAct) return
    const previousSelections = state.session.acts
      .filter((act) => act.actNumber < currentAct.actNumber && act.selectedCards.length > 0)
      .map((act) => buildActSelection(act))
    await loadAct(currentAct.actNumber, previousSelections, undefined, (currentAct.generationCount ?? 0) + 1)
  }, [currentAct, loadAct, state.session.acts])

  const handleConfirmProfile = async () => {
    if (!pathType || !state.session.profileDescription) return

    dispatch({ type: 'SET_STATUS', payload: { status: 'matching', transitionLabel: 'Agent 正在替你定位那个人...' } })
    setIsBusy(true)

    try {
      const embedResponse = await defaultMoltService.embedText({
        text: state.session.profileDescription,
      })
      dispatch({ type: 'SET_PROFILE_EMBEDDING', payload: embedResponse.data.embedding })

      const matchResponse = await defaultMoltService.matchProfile({
        pathType,
        profile: state.session.profile,
        profileDescription: state.session.profileDescription,
        profileEmbedding: embedResponse.data.embedding,
        aggregatedTags: state.session.aggregatedTags,
      })
      dispatch({ type: 'SET_CLUSTER', payload: matchResponse.data.cluster?.id })

      sessionStorage.setItem(
        `${RESULT_STORAGE_PREFIX}${pathType}`,
        JSON.stringify({
          session: {
            ...state.session,
            profileEmbedding: embedResponse.data.embedding,
            clusterId: matchResponse.data.cluster?.id,
          },
          match: matchResponse.data,
        }),
      )

      navigate(`/result/${pathType}`)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : '匹配失败。' })
      setIsBusy(false)
    }
  }

  if (!pathType) {
    return null
  }

  const showTransition = isBusy || state.status === 'loading-act' || state.status === 'synthesizing-profile' || state.status === 'matching'
  const currentActSelectionCount = currentAct?.selectedCards.length ?? 0

  return (
    <div className="shell-stage min-h-screen w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <ActTransition
        open={showTransition}
        label={state.transitionLabel ?? '壳正在裂开...'}
        detail={getTransitionDetail(state.transitionLabel ?? '')}
      />

      <div className="page-container space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/90 px-5 py-7 shadow-[0_22px_70px_hsl(0_0%_0%/0.3)] sm:px-8 sm:py-8">
          <ShellVisual actNumber={typeof state.session.currentAct === 'number' ? state.session.currentAct : 3} />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="section-kicker">MOLT / Stage Flow</p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
                {currentAct ? currentAct.title : '壳已经脱落了'}
              </h1>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                {currentAct ? ACT_COPY[currentAct.actNumber] : '这不是结论页，而是一段你愿意点头承认的轮廓。'}
              </p>
              {state.session.memoryImport && (
                <div className="rounded-[1.2rem] border border-primary/15 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                  已导入 {state.session.memoryImport.sourceAI} 记忆：{state.session.memoryImport.background}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {[1, 2, 3].map((actNumber) => {
                const active = state.session.currentAct === actNumber || (state.session.currentAct === 'done' && actNumber === 3)
                const completed = state.session.acts.some((act) => act.actNumber === actNumber && act.selectedCards.length > 0)
                return (
                  <div
                    key={actNumber}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm ${active ? 'border-primary bg-primary/12 text-primary' : completed ? 'border-primary/30 bg-primary/5 text-primary/80' : 'border-border bg-background text-muted-foreground'}`}
                  >
                    0{actNumber}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {state.error && (
          <div className="rounded-[1.4rem] border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm leading-7 text-foreground">
            {state.error}
          </div>
        )}

        {(state.status === 'confirming-profile' || state.status === 'matching') &&
        state.session.profileDescription ? (
          <MoltComplete
            pathType={pathType}
            description={state.session.profileDescription}
            tags={state.session.aggregatedTags}
            selectedCards={selectedCards}
            isSubmitting={state.status === 'matching' || isBusy}
            onConfirm={handleConfirmProfile}
          />
        ) : currentAct ? (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentAct.cards.map((card) => (
                <MoltCard
                  key={card.id}
                  card={card}
                  selected={currentAct.selectedCards.some((selectedCard) => selectedCard.id === card.id)}
                  onSelect={handleCardSelect}
                />
              ))}
            </div>

            {hasCustomCard(currentAct) && (
              <div className="rounded-[1.6rem] border border-primary/20 bg-card/92 p-5 shadow-[0_16px_40px_hsl(0_0%_0%/0.18)]">
                <p className="section-kicker">自己补一句</p>
                <Textarea
                  value={currentAct.customText ?? ''}
                  onChange={(event) =>
                    dispatch({
                      type: 'SET_CUSTOM_TEXT',
                      payload: { actNumber: currentAct.actNumber, customText: event.target.value },
                    })
                  }
                  placeholder="可以是一句话，也可以是一个你一直说不准的状态。Agent 会把它作为上下文继续往下问。"
                  className="mt-3 min-h-[140px] rounded-[1.2rem] border-border/80 bg-background/70 px-4 py-4 text-sm leading-7"
                />
              </div>
            )}

            <div className="rounded-[1.6rem] border border-border/70 bg-card/92 p-5 shadow-[0_16px_40px_hsl(0_0%_0%/0.18)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <p className="section-kicker">Selection</p>
                  <p className="text-sm leading-7 text-foreground">
                    {currentActSelectionCount > 0
                      ? `这一幕已选 ${currentActSelectionCount} 张。你可以继续补选，也可以直接进入下一幕。`
                      : '这一幕支持多选。如果这一屏都不够像你，可以先换一组。'}
                  </p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {hasCustomCard(currentAct)
                      ? '选了“自己补一句”后，这一幕会只保留你自己的那句话。'
                      : '未被选中的碎片不会进入画像，Agent 只会继续读你点头承认的部分。'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" disabled={isBusy} onClick={handleRefreshCards} className="rounded-full px-6 font-mono">
                    换一组
                  </Button>
                  <Button type="button" disabled={!canGoNext(state) || isBusy} onClick={handleAdvance} className="rounded-full px-6 font-mono">
                    下一幕
                  </Button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[1.6rem] border border-border/70 bg-card/90 px-5 py-8 text-center text-muted-foreground">
            {userId ? '这段脱壳暂时还没开始。' : '正在准备你的会话...'}
          </section>
        )}
      </div>
    </div>
  )
}

export default Conversation
