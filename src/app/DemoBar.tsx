import { FastForward, RotateCcw } from 'lucide-react'
import type { DemoControls } from '@/lib/types'

/** One quiet line in demo mode: what this is, plus the time machine. */
export function DemoBar({ demo }: { demo: DemoControls }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--paper-2)] px-4 py-2.5" role="region" aria-label="Demo mode">
      <p className="min-w-0 truncate text-sm font-semibold text-muted"><span className="sm:hidden">Demo mode</span><span className="hidden sm:inline">Demo mode: sample goals, practice USDC</span></p>
      <div className="flex shrink-0 gap-2">
        <button className="btn btn-sm" onClick={demo.advanceDay}>
          <FastForward size={15} /> Skip a day{demo.daysSkipped > 0 ? ` (+${demo.daysSkipped})` : ''}
        </button>
        <button className="btn btn-sm btn-icon !w-[38px]" onClick={demo.reset} aria-label="Reset demo">
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  )
}
