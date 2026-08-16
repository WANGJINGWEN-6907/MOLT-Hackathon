import { ShellVisual } from '@/components/ShellVisual'

interface ActTransitionProps {
  open: boolean
  label: string
  detail?: string
}

export function ActTransition({ open, label, detail }: ActTransitionProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/88 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-primary/20 bg-card/92 px-6 py-16 text-center shadow-[0_28px_80px_hsl(0_0%_0%/0.45)] sm:px-10">
        <ShellVisual actNumber={3} />
        <div className="relative space-y-4">
          <p className="section-kicker">MOLT</p>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{label}</h2>
          {detail && <p className="mx-auto max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{detail}</p>}
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}
