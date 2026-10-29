import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, HeartCrack, ShieldCheck } from 'lucide-react'
import { analyze, type Keep, type KeepApi } from '@/lib/types'
import { usd } from '@/lib/format'
import { Calendar } from './Calendar'
import { ChallengeShare } from './ChallengeShare'
import { CheckInPanel } from './CheckInPanel'
import { ClaimPanel } from './ClaimPanel'
import { FlameIcon } from './FlameIcon'

interface Props {
  api: KeepApi
  keep: Keep
  onBack: () => void
}

export function KeepDetail({ api, keep, onBack }: Props) {
  const a = analyze(keep, api.today)

  return (
    <div className="space-y-4">
      <button className="btn btn-ghost !min-h-[40px] !px-3 text-xs" onClick={onBack}>
        <ArrowLeft size={16} /> All keeps
      </button>

      <section className="card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl text-3xl" style={{ background: 'var(--flame-soft)' }}>{keep.emoji}</div>
          <div className="min-w-0">
            <h2 className="display truncate text-2xl font-bold">{keep.name}</h2>
            <p className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
              {keep.duration} days · {usd(keep.stakePerDay)}/day · {usd(a.total)} staked
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 -z-0 rounded-full blur-2xl" style={{ background: a.streak > 0 ? 'rgba(255,106,26,.28)' : 'transparent' }} />
            <FlameIcon size={96} lit={a.streak > 0} className="relative" />
          </div>
          <div className="relative h-[4.5rem] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={a.streak}
                className="display text-6xl font-bold leading-[4.5rem] tabular-nums"
                initial={{ y: 40, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              >
                {a.streak}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>day streak</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="inner p-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}><ShieldCheck size={13} /> Money safe</div>
            <div className="display text-2xl font-bold tabular-nums">{usd(a.safe)}</div>
            <div className="text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>of {usd(a.total)}</div>
          </div>
          <div className="inner p-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}><HeartCrack size={13} /> Lost to pool</div>
            <div className="display text-2xl font-bold tabular-nums" style={{ color: a.lost > 0n ? 'var(--danger)' : undefined }}>{usd(a.lost)}</div>
            <div className="text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>{a.missed} missed {a.missed === 1 ? 'day' : 'days'}</div>
          </div>
        </div>
      </section>

      {keep.isMine && <CheckInPanel api={api} keep={keep} a={a} />}

      <section className="card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
          {a.kept} kept · {a.missed} missed · {a.daysLeft} to go
        </h3>
        <Calendar analysis={a} />
      </section>

      {keep.isMine && <ClaimPanel api={api} keep={keep} a={a} />}
      <ChallengeShare keep={keep} mode={api.mode} />
    </div>
  )
}
