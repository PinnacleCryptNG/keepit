import { motion } from 'framer-motion'
import { Flame } from '@/brand/Flame'
import { shortAddress, usd } from '@/lib/format'
import type { Analysis, Keep } from '@/lib/types'

const MEDALS = [
  { background: 'var(--sun)', color: '#1b1335' },
  { background: '#dfe6f2', color: '#1b1335' },
  { background: '#f0b88a', color: '#1b1335' },
]

export function LeaderRow({ keep, a, rank, index = 0, onOpen }: { keep: Keep; a: Analysis; rank: number; index?: number; onOpen?: () => void }) {
  const body = (
    <>
      <span
        className="display flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
        style={rank <= 3 ? MEDALS[rank - 1] : { background: 'var(--paper-2)', color: 'var(--muted)' }}
      >
        {rank}
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-xl" aria-hidden="true">{keep.emoji}</span>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate font-bold leading-tight">{keep.name}</div>
        <div className="truncate text-xs text-muted">
          {keep.isMine ? <b className="text-ember">You</b> : shortAddress(keep.owner)} · kept <span className="tnum">{usd(a.secured)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-paper-2 py-1 pl-1.5 pr-3">
        <Flame size={22} />
        <span className="display text-xl font-extrabold tnum">{a.streak}</span>
      </div>
    </>
  )
  return (
    <motion.li
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      {onOpen ? (
        <button className="surface-flat flex w-full items-center gap-3 p-3 transition-colors hover:bg-[var(--card-2)]" onClick={onOpen} aria-label={`Open ${keep.name}`}>
          {body}
        </button>
      ) : (
        <div className="surface-flat flex items-center gap-3 p-3">{body}</div>
      )}
    </motion.li>
  )
}
