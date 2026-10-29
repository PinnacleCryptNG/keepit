import { HeartCrack } from 'lucide-react'
import type { Analysis } from '@/lib/types'
import { FlameIcon } from './FlameIcon'

const LABEL = { kept: 'kept', missed: 'missed', today: 'today, open', future: 'upcoming' } as const

/** Flame for every kept day, a crack for every missed day. */
export function Calendar({ analysis }: { analysis: Analysis }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Daily check-ins">
        {analysis.cells.map((state, i) => (
          <div
            key={i}
            role="listitem"
            aria-label={`Day ${i + 1}: ${LABEL[state]}`}
            className={`cell cell-${state} ${state === 'kept' || state === 'missed' ? 'pop-in' : ''}`}
            style={{ animationDelay: `${Math.min(i, 30) * 18}ms` }}
          >
            {state === 'kept' && <FlameIcon size={24} delay={(i % 6) * 0.25} />}
            {state === 'missed' && <HeartCrack size={20} className="crack-in" style={{ animationDelay: `${Math.min(i, 30) * 18}ms` }} />}
            {state === 'today' && <span className="display text-lg font-bold">{i + 1}</span>}
            {state === 'future' && <span>{i + 1}</span>}
            {(state === 'kept' || state === 'missed') && (
              <span className="absolute left-1.5 top-1 text-[9px] opacity-70 tabular-nums">{i + 1}</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
        <span className="inline-flex items-center gap-1"><FlameIcon size={14} flicker={false} /> Kept</span>
        <span className="inline-flex items-center gap-1"><HeartCrack size={14} style={{ color: 'var(--crack)' }} /> Missed</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-3 rounded-full border-2" style={{ borderColor: 'var(--flame-2)' }} /> Today
        </span>
      </div>
    </div>
  )
}
