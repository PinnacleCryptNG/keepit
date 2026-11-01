import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Flame } from '@/brand/Flame'
import { usd } from '@/lib/format'
import { analyze, gate, type Keep, type KeepApi } from '@/lib/types'
import { KeepAction } from './KeepAction'
import { RuleLine } from './Rules'

/** One strip segment per day: kept, missed, today, upcoming. */
export function DayStrip({ cells }: { cells: ReturnType<typeof analyze>['cells'] }) {
  return (
    <div className="flex gap-[3px]" aria-hidden="true">
      {cells.map((c, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: c === 'kept' ? 'linear-gradient(90deg, var(--sun), var(--ember))' : c === 'missed' ? 'var(--crack)' : c === 'today' ? 'var(--ember)' : 'var(--line-soft)',
            opacity: c === 'today' ? 0.45 : c === 'missed' ? 0.7 : 1,
          }}
        />
      ))}
    </div>
  )
}

interface Props {
  api: KeepApi
  keep: Keep
  index: number
  onOpen: () => void
}

export function KeepCard({ api, keep, index, onOpen }: Props) {
  const a = analyze(keep, api.now)
  const g = gate(keep, api.now, api.balance)
  const sub = a.ended ? 'Finished' : `Day ${Math.min(a.idx + 1, keep.duration)} of ${keep.duration}`

  return (
    <motion.article
      className="surface flex h-full flex-col gap-4 p-4 sm:p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.3 }}
    >
      <button className="flex w-full items-center gap-3 text-left" onClick={onOpen} aria-label={`Open ${keep.name}`}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--paper-2)] text-2xl" aria-hidden="true">{keep.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-extrabold leading-tight">{keep.name}</span>
          <span className="block text-sm leading-snug text-muted tnum">{sub} · {usd(keep.stakePerDay)}/day</span>
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[var(--paper-2)] py-1 pl-2 pr-3">
          <Flame size={20} lit={a.streak > 0} />
          <span className="display text-lg font-extrabold tnum">{a.streak}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-faint" />
      </button>

      <DayStrip cells={a.cells} />

      {!a.ended && !keep.claimed && (
        <div className="text-xs font-medium text-muted">
          <RuleLine keep={keep} g={g} />
        </div>
      )}

      <div className="mt-auto">
        <KeepAction api={api} keep={keep} a={a} />
      </div>
    </motion.article>
  )
}
