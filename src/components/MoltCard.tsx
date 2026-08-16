import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MoltCard as MoltCardType } from '@/types'

interface MoltCardProps {
  card: MoltCardType
  selected?: boolean
  onSelect: (card: MoltCardType) => void
}

export function MoltCard({ card, selected = false, onSelect }: MoltCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      aria-pressed={selected}
      data-testid={`molt-card-${card.id}`}
      className={cn(
        'group relative flex min-h-[180px] w-full flex-col justify-between overflow-hidden rounded-[1.6rem] border p-5 text-left transition-all duration-300',
        selected
          ? 'border-primary bg-primary/10 shadow-[0_22px_60px_hsl(var(--primary)/0.18)]'
          : 'border-border/80 bg-card/90 hover:-translate-y-1 hover:border-primary/40 hover:bg-card',
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="section-kicker">{card.isCustom ? 'Self' : card.depth ?? 'surface'}</span>
        {selected && <span className="text-sm font-medium text-primary">已加入</span>}
      </div>

      <div className="relative space-y-2">
        <p className="text-[1.15rem] font-semibold leading-7 text-foreground sm:text-[1.3rem] sm:leading-8">
          <span className="block">{card.line1}</span>
          <span className="block text-foreground/86">{card.line2}</span>
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          {card.isCustom ? '如果这些都不够像你，你可以自己补上一句。' : '这不是标签题，而是一段更像你的裂缝场景。支持多选。'}
        </p>
      </div>

      <div className="relative flex flex-wrap gap-2">
        {card.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="border-primary/25 bg-primary/5 text-primary/90">
            {tag}
          </Badge>
        ))}
        {card.tags.length === 0 && <span className="text-xs text-muted-foreground">Agent 会优先读你的选择语义</span>}
      </div>
    </button>
  )
}
