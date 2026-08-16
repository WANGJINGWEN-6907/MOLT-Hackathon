import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShellVisual } from '@/components/ShellVisual'
import type { MoltCard, PathType } from '@/types'

const PATH_COPY: Record<PathType, string> = {
  A: '你先被理解，再被连接。',
  B: '你不是在乱走，你是在试着长出新壳。',
  C: '你能回头看见那条路，本身就是一种照明。',
}

interface MoltCompleteProps {
  pathType: PathType
  description: string
  tags: string[]
  selectedCards: MoltCard[]
  isSubmitting?: boolean
  onConfirm: () => void
}

export function MoltComplete({ pathType, description, tags, selectedCards, isSubmitting = false, onConfirm }: MoltCompleteProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card/92 p-6 shadow-[0_24px_80px_hsl(0_0%_0%/0.35)] sm:p-8">
      <ShellVisual actNumber={3} />
      <div className="relative space-y-6">
        <div className="space-y-2">
          <p className="section-kicker">Profile Synth</p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">壳已经脱落了。这是我看到的你。</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">{PATH_COPY[pathType]}</p>
        </div>

        <div className="rounded-[1.6rem] border border-primary/15 bg-background/75 p-5">
          <p className="text-lg leading-8 text-foreground sm:text-[1.08rem]">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 6).map((tag) => (
            <Badge key={tag} variant="outline" className="border-primary/25 bg-primary/5 text-primary/90">
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {selectedCards.map((card, index) => (
            <div key={card.id} className="rounded-[1.25rem] border border-border/70 bg-background/65 p-4">
              <p className="section-kicker">片段 {index + 1}</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{card.line1}</p>
              <p className="text-sm leading-6 text-muted-foreground">{card.line2}</p>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="h-auto min-h-[52px] rounded-full px-8 py-4 font-mono text-base"
        >
          {isSubmitting ? '正在为你定位...' : '是的，这就是我'}
        </Button>
      </div>
    </div>
  )
}
