import { cn } from '@/lib/utils'

interface ShellVisualProps {
  actNumber?: 1 | 2 | 3
  className?: string
}

export function ShellVisual({ actNumber = 1, className }: ShellVisualProps) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute inset-x-[12%] top-[-18%] h-[52%] rounded-full border border-primary/15 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12),transparent_65%)] blur-2xl" />
      <div className="absolute inset-x-[18%] bottom-[-28%] h-[48%] rounded-full border border-primary/10 bg-[radial-gradient(circle_at_center,hsl(var(--accent-blue)/0.1),transparent_68%)] blur-3xl" />
      <span className={cn('shell-crack shell-crack-a', actNumber >= 2 && 'shell-crack-active')} />
      <span className={cn('shell-crack shell-crack-b', actNumber >= 2 && 'shell-crack-active')} />
      <span className={cn('shell-crack shell-crack-c', actNumber >= 3 && 'shell-crack-active')} />
      <span className={cn('shell-fragment shell-fragment-a', actNumber >= 2 && 'shell-fragment-active')} />
      <span className={cn('shell-fragment shell-fragment-b', actNumber >= 3 && 'shell-fragment-active')} />
    </div>
  )
}
