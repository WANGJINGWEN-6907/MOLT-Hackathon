import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ForceGraph } from '@/components/ForceGraph'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createOrGetUser, getPublicArchives, sendSignal } from '@/db/api'
import { getOrCreateAnonymousId } from '@/lib/anonymousUser'
import { archiveToNode } from '@/lib/map'
import { getSignalButtonState } from '@/lib/map/signalSender'
import { staticMapNodes } from '@/lib/staticData'
import type { MapNode } from '@/types'

function getNodeIdentityLabel(node: MapNode): string {
  const currentNodeType =
    node.careerNodes?.find((careerNode) => careerNode.validUntil === null)?.nodeType ??
    node.careerNodes?.[node.careerNodes.length - 1]?.nodeType

  if (currentNodeType === 'landed') return '已经走出来的人'
  if (currentNodeType === 'crisis') return '还在壳里的人'
  return '领先半步的人'
}

const Map: React.FC = () => {
  const [searchParams] = useSearchParams()
  const focusNodeId = searchParams.get('focus')

  const [userId, setUserId] = React.useState<string | null>(null)
  const [nodes, setNodes] = React.useState<MapNode[]>([])
  const [selectedNode, setSelectedNode] = React.useState<MapNode | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSending, setIsSending] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [pageError, setPageError] = React.useState<string | null>(null)
  const [fallbackNotice, setFallbackNotice] = React.useState<string | null>(null)
  const [sentSignals, setSentSignals] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setPageError(null)
        setFallbackNotice(null)
        const anonymousId = getOrCreateAnonymousId()
        const user = await createOrGetUser(anonymousId)
        if (!user) throw new Error('failed to initialize user')
        setUserId(user.id)

        const archives = await getPublicArchives()
        const realNodes = archives.map(archiveToNode).filter((node): node is MapNode => node !== null)
        const mergedNodes = [...realNodes, ...staticMapNodes]
        setNodes(mergedNodes)

        if (realNodes.length === 0) {
          setFallbackNotice('当前展示的是 demo 地图节点，真实公开档案暂时为空。')
        }

        if (focusNodeId) {
          const focusNode = mergedNodes.find((node) => node.id === focusNodeId)
          if (focusNode) {
            setSelectedNode(focusNode)
            setIsDialogOpen(true)
          }
        }
      } catch (error) {
        setNodes(staticMapNodes)
        setFallbackNotice('当前展示的是 demo 地图节点，真实公开档案暂时为空。')
        setPageError(error instanceof Error ? error.message : '地图加载失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [focusNodeId])

  const handleNodeClick = (node: MapNode) => {
    setSelectedNode(node)
    setIsDialogOpen(true)
  }

  const handleSendSignal = async () => {
    if (!userId || !selectedNode || !selectedNode.user_id) {
      toast.error('这个节点当前不能接收信号')
      return
    }

    setIsSending(true)
    try {
      const signal = await sendSignal(userId, selectedNode.user_id, '')
      if (!signal) throw new Error('sendSignal returned null')
      setSentSignals((previous) => new Set(previous).add(selectedNode.user_id!))
      toast.success('信号已经发出，对方只会先看到“有人看见了你”。')
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发送失败，请稍后重试')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="shell-stage min-h-screen w-full flex items-center justify-center px-4">
        <p className="text-muted-foreground">地图正在重新拼合这些碎片...</p>
      </div>
    )
  }

  return (
    <div className="shell-stage min-h-screen w-full overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="page-container space-y-4">
        <section className="rounded-[1.8rem] border border-primary/20 bg-card/92 px-5 py-6 shadow-[0_18px_50px_hsl(0_0%_0%/0.22)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">MOLT / Map</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">换壳地图</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                地图里不是“和你一样的人”，而是曾经和你一样、现在已经走出来的人。第一次接触只允许发出一个信号。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{nodes.length} 个节点</Badge>
              <Badge variant="outline">灯塔 / 探索者</Badge>
              <Badge variant="outline">Agent 守门连接</Badge>
            </div>
          </div>
        </section>

        {(pageError || fallbackNotice) && (
          <div className="space-y-3">
            {pageError && <div className="rounded-[1.2rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">{pageError}</div>}
            {fallbackNotice && <div className="rounded-[1.2rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">{fallbackNotice}</div>}
          </div>
        )}

        <section className="h-[70vh] min-h-[560px] overflow-hidden rounded-[1.8rem] border border-border/80 bg-card/88 shadow-[0_18px_50px_hsl(0_0%_0%/0.22)]">
          <ForceGraph nodes={nodes} currentUserId={userId ?? undefined} onNodeClick={handleNodeClick} />
        </section>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[1.8rem] border border-primary/20 bg-card shadow-[0_32px_90px_hsl(0_0%_0%/0.45)]">
          {selectedNode && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-foreground">{selectedNode.currentState ?? '这个节点'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {selectedNode.city && <Badge variant="outline">{selectedNode.city}</Badge>}
                  {selectedNode.direction && <Badge variant="outline">{selectedNode.direction}</Badge>}
                  <Badge variant="outline">{getNodeIdentityLabel(selectedNode)}</Badge>
                </div>

                {selectedNode.resonanceHint && (
                  <p className="rounded-[1.2rem] border border-primary/15 bg-background/70 px-4 py-3 text-sm leading-7 text-foreground">
                    {selectedNode.resonanceHint}
                  </p>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                    <p className="section-kicker">起点</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedNode.startPoint}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                    <p className="section-kicker">转折</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedNode.turningPoint}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                    <p className="section-kicker">现在</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedNode.currentState}</p>
                  </div>
                </div>

                {selectedNode.profileDescription && <p className="text-sm leading-7 text-muted-foreground">{selectedNode.profileDescription}</p>}

                <div className="rounded-[1.2rem] border border-primary/15 bg-primary/5 px-4 py-4">
                  <p className="section-kicker">Signal Only</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    第一次接触只能发送一个没有内容的“信号”。对方收到的是“有人看见了你”，不是一段要求立刻回应的自我介绍。
                  </p>
                </div>

                <Button
                  type="button"
                  disabled={!getSignalButtonState(selectedNode, userId, sentSignals).canSend || isSending}
                  onClick={handleSendSignal}
                  className="h-auto min-h-[52px] rounded-full px-8 py-4 font-mono text-base"
                >
                  {isSending
                    ? '信号发送中...'
                    : getSignalButtonState(selectedNode, userId, sentSignals).isSent
                      ? '这个信号已经发出'
                      : '发出一个信号'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Map
