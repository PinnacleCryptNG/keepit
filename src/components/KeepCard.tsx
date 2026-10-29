import { motion } from 'framer-motion'
import { ChevronRight, Gift } from 'lucide-react'
import { analyze, type Keep } from '@/lib/types'
import { usd } from '@/lib/format'
import { FlameIcon } from './FlameIcon'

interface Props {
  keep: Keep
  today: number
  onOpen: () => void
  index: number
}

export function KeepCard({ keep, today, onOpen, index }: Props) {
  const a = analyze(keep, today)
  const claimable = a.ended && !keep.claimed
  const status = keep.claimed ? 'Claimed' : claimable ? 'Ready to claim' : a.checkedToday ? 'Kept today' : 'Check in today'

  return (
    <motion.button
      onClick={onOpen}
      className="card w-full p-4 text-left"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      whileTap={{ scale: 0.985 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: 'var(--flame-soft)' }}>
          {keep.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{keep.name}</div>
          <div className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
            {a.ended ? `${keep.duration} days done` : `Day ${Math.min(a.idx + 1, keep.duration)} of ${keep.duration}`} · {usd(keep.stakePerDay)}/day
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: 'var(--flame-soft)' }}>
          <FlameIcon size={18} lit={a.streak > 0} />
          <span className="display text-lg font-bold tabular-nums">{a.streak}</span>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--subtle)' }} />
      </div>

      <div className="mt-3 flex gap-[3px]" aria-hidden="true">
        {a.cells.map((c, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background:
                c === 'kept' ? 'linear-gradient(90deg, var(--flame-1), var(--flame-2))' : c === 'missed' ? 'var(--crack)' : c === 'today' ? 'var(--flame-2)' : 'var(--border)',
              opacity: c === 'today' ? 0.55 : 1,
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="tabular-nums" style={{ color: 'var(--muted)' }}>
          Safe <b style={{ color: 'var(--ink)' }}>{usd(a.safe)}</b> of {usd(a.total)}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
          style={claimable ? { background: 'linear-gradient(135deg, var(--flame-1), var(--flame-2))', color: '#fff' } : { background: 'var(--surface-muted)', color: 'var(--muted)' }}
        >
          {claimable && <Gift size={12} />}
          {status}
        </span>
      </div>
    </motion.button>
  )
}
