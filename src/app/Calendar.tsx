import { Flame } from '@/brand/Flame'
import type { Analysis } from '@/lib/types'

const LABEL = { kept: 'kept', missed: 'missed', today: 'today, open', future: 'upcoming' } as const

/** A flame for every day kept, a cracked cold flame for every day missed. */
export function Calendar({ analysis }: { analysis: Analysis }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="list" aria-label="Daily check-ins">
        {analysis.cells.map((state, i) => (
          <div
            key={i}
            role="listitem"
            aria-label={`Day ${i + 1}: ${LABEL[state]}`}
            className={`tile tile-${state} ${state === 'kept' || state === 'missed' ? 'pop-in' : ''}`}
            style={{ animationDelay: `${Math.min(i, 30) * 22}ms` }}
          >
            {state === 'kept' && <Flame size={26} delay={(i % 6) * 0.25} />}
            {state === 'missed' && <Flame size={26} lit={false} cracked className="crack-in" />}
            {state === 'today' && <span className="display text-lg font-extrabold">{i + 1}</span>}
            {state === 'future' && <span>{i + 1}</span>}
            {(state === 'kept' || state === 'missed') && <span className="absolute left-1 top-0.5 text-[9px] font-extrabold opacity-60 tnum">{i + 1}</span>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-bold text-muted">
        <span className="inline-flex items-center gap-1.5"><Flame size={15} flicker={false} /> Kept</span>
        <span className="inline-flex items-center gap-1.5"><Flame size={15} lit={false} cracked /> Missed</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block size-3.5 rounded-md border" style={{ borderColor: 'var(--ember)' }} /> Today</span>
      </div>
    </div>
  )
}
