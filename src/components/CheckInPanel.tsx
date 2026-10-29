import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useModal } from 'connectkit'
import { Check, Link2, Loader2, Timer } from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'
import { untilUtcMidnight } from '@/lib/format'
import { MAX_NOTE } from '@/lib/keepit'
import type { Analysis, Keep, KeepApi } from '@/lib/types'
import { useAction } from '@/hooks/useAction'
import { useNow } from '@/hooks/useNow'
import { FlameIcon } from './FlameIcon'

interface Props {
  api: KeepApi
  keep: Keep
  a: Analysis
}

export function CheckInPanel({ api, keep, a }: Props) {
  const [note, setNote] = useState('')
  const action = useAction()
  const btn = useRef<HTMLButtonElement>(null)
  const { setOpen } = useModal()
  const now = useNow(1000)
  const needsWallet = api.mode === 'live' && !api.connected

  if (a.ended) return null

  if (a.checkedToday) {
    return (
      <section className="card flex flex-col items-center gap-2 p-6 text-center">
        <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 14 }}>
          <FlameIcon size={64} />
        </motion.div>
        <h2 className="display text-2xl font-bold">Kept today</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{`${a.daysLeft - 1} ${a.daysLeft - 1 === 1 ? 'day' : 'days'} to go. Your stake for today is safe.`}</p>
        <div className="inner mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm tabular-nums">
          <Timer size={16} />
          Next check-in opens in <b className="mono">{untilUtcMidnight(now)}</b> (UTC)
        </div>
      </section>
    )
  }

  const onClick = async () => {
    if (needsWallet) {
      setOpen(true)
      return
    }
    const ok = await action.run((onStep) => api.checkIn(keep.id, note.trim(), onStep), 'Checked in. Streak extended!')
    if (ok) {
      const r = btn.current?.getBoundingClientRect()
      fireConfetti(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined)
      setNote('')
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
        <span className="font-semibold uppercase tracking-[0.08em]">Day {a.idx + 1} of {keep.duration}</span>
        <span className="inline-flex items-center gap-1 tabular-nums"><Timer size={14} /> Closes in <b className="mono">{untilUtcMidnight(now)}</b> UTC</span>
      </div>

      <label className="relative block">
        <span className="sr-only">Proof note or photo link (optional)</span>
        <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--subtle)' }} />
        <input
          className="field !pl-10"
          placeholder="Proof: short note or photo link (optional)"
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          disabled={action.busy}
        />
      </label>

      <motion.button
        ref={btn}
        onClick={() => void onClick()}
        disabled={action.busy}
        whileTap={{ scale: 0.96 }}
        className={`btn btn-flame w-full !min-h-[92px] !rounded-[2rem] ${action.busy ? '' : 'idle-float'}`}
      >
        {action.busy ? (
          <span className="flex items-center gap-2 text-base"><Loader2 className="animate-spin" size={22} /> {action.label}</span>
        ) : needsWallet ? (
          <span className="display text-xl font-bold">Connect wallet to check in</span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/25"><Check size={30} strokeWidth={3.5} /></span>
            <span className="display text-2xl font-bold">I kept it today</span>
          </span>
        )}
      </motion.button>
      {action.error && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{action.error}</p>}
      <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>One check-in per day. Miss midnight UTC and today's {''}stake goes to the pool.</p>
    </section>
  )
}
