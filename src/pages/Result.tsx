import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShellVisual } from '@/components/ShellVisual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buildClusterNarrative } from '@/lib/clustering/semanticCluster'
import type { MatchResult } from '@/lib/agent'
import type { MoltSession, PathType } from '@/types'

const RESULT_STORAGE_PREFIX = 'molt_v32_result_'

interface ResultBundle {
  session: MoltSession
  match: MatchResult
}

function getNodeIdentityLabel(type?: 'lighthouse' | 'explorer'): string {
  if (type === 'explorer') return '领先半步的人'
  return '已经走出来的人'
}

const Result: React.FC = () => {
  const { pathType } = useParams<{ pathType: PathType }>()
  const navigate = useNavigate()
  const [bundle, setBundle] = React.useState<ResultBundle | null>(null)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (!pathType) return
    try {
      const raw = sessionStorage.getItem(`${RESULT_STORAGE_PREFIX}${pathType}`)
      if (!raw) {
        setFailed(true)
        return
      }
      setBundle(JSON.parse(raw) as ResultBundle)
    } catch {
      setFailed(true)
    }
  }, [pathType])

  if (!pathType) return null

  if (failed || !bundle) {
    return (
      <div className="shell-stage min-h-screen w-full px-4 py-10 sm:px-6">
        <div className="page-container flex min-h-[70vh] items-center justify-center">
          <div className="rounded-[1.8rem] border border-primary/20 bg-card/92 px-6 py-10 text-center shadow-[0_24px_80px_hsl(0_0%_0%/0.35)] sm:px-10">
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">这段结果还没生成出来</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              先回到脱壳三幕里，把你的轮廓说清。MOLT 才能去找那个真正有共鸣的人。
            </p>
            <Button type="button" onClick={() => navigate('/onboarding')} className="mt-6 rounded-full px-6 font-mono">
              重新开始
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { session, match } = bundle
  const matchedNode = match.matchedNode
  const cluster = match.cluster

  return (
    <div className="shell-stage min-h-screen w-full overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="page-container space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/92 px-5 py-8 shadow-[0_26px_80px_hsl(0_0%_0%/0.34)] sm:px-8 sm:py-10">
          <ShellVisual actNumber={3} />
          <div className="relative space-y-4">
            <p className="section-kicker">MOLT / Result</p>
            <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              你不是被“推荐”到了谁，你是被定位到了一个和你形成互补的人。
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              这是一次异时态匹配。系统不会把灯塔再推给灯塔，也不会把探索者再推给探索者，而是拿你的现在，去对照另一侧角色曾经站过的位置。
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6">
            <div className="rounded-[1.8rem] border border-primary/15 bg-card/90 p-6 shadow-[0_18px_50px_hsl(0_0%_0%/0.22)]">
              <p className="section-kicker">你的画像</p>
              <p className="mt-4 text-[1.02rem] leading-8 text-foreground">{session.profileDescription}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {session.aggregatedTags.slice(0, 8).map((tag) => (
                  <Badge key={tag} variant="outline" className="border-primary/25 bg-primary/5 text-primary/90">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {cluster && (
              <div className="rounded-[1.8rem] border border-primary/15 bg-card/90 p-6 shadow-[0_18px_50px_hsl(0_0%_0%/0.22)]">
                <p className="section-kicker">你所在的群</p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">{cluster.label}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{cluster.description}</p>
                <p className="mt-4 rounded-[1.2rem] border border-primary/15 bg-background/70 px-4 py-3 text-sm leading-7 text-foreground">
                  {buildClusterNarrative(cluster)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.8rem] border border-primary/18 bg-card/92 p-6 shadow-[0_18px_50px_hsl(0_0%_0%/0.22)]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="section-kicker">Agent Match</p>
                <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary/90">
                  语义匹配 {match.matchScore} 分
                </Badge>
              </div>

              {matchedNode ? (
                <div className="mt-4 space-y-5">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {matchedNode.city && <Badge variant="outline">{matchedNode.city}</Badge>}
                      {matchedNode.direction && <Badge variant="outline">{matchedNode.direction}</Badge>}
                      <Badge variant="outline">{getNodeIdentityLabel(matchedNode.type)}</Badge>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-foreground">{matchedNode.currentState}</h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{match.matchReason}</p>
                  </div>

                  <div className="rounded-[1.4rem] border border-primary/15 bg-background/70 p-4">
                    <p className="text-lg leading-8 text-foreground">“{match.agentMessage}”</p>
                  </div>

                  {matchedNode.profileDescription && (
                    <p className="text-sm leading-7 text-muted-foreground">{matchedNode.profileDescription}</p>
                  )}

                  {matchedNode.careerNodes && matchedNode.careerNodes.length > 0 && (
                    <div className="space-y-3">
                      <p className="section-kicker">对方走过的节点</p>
                      {matchedNode.careerNodes.map((careerNode) => (
                        <div key={`${matchedNode.id}-${careerNode.nodeType}`} className="rounded-[1.2rem] border border-border/70 bg-background/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{careerNode.nodeType}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(careerNode.validFrom).toLocaleDateString('zh-CN')} {careerNode.validUntil ? `- ${new Date(careerNode.validUntil).toLocaleDateString('zh-CN')}` : '- 至今'}
                            </p>
                          </div>
                          {careerNode.profileDescription && <p className="mt-2 text-sm leading-7 text-muted-foreground">{careerNode.profileDescription}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.4rem] border border-border/70 bg-background/70 p-5 text-sm leading-7 text-muted-foreground">
                  暂时还没有找到足够贴合的人，但你的画像已经完成，系统会优先保留这段轮廓去等更合适的连接。
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-primary/15 bg-card/90 p-6 shadow-[0_18px_50px_hsl(0_0%_0%/0.22)]">
              <p className="section-kicker">连接规则</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                第一次接触不会让你直接暴露自己。进入地图后，你只能先发出一个“信号”，由 Agent 继续守住连接的节奏。
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => navigate(matchedNode ? `/map?focus=${matchedNode.id}` : '/map')}
                  className="rounded-full px-6 font-mono"
                >
                  去看这张地图
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/onboarding')} className="rounded-full px-6">
                  重新脱壳一次
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Result
