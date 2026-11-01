import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Flame } from '@/brand/Flame'
import { shortAddress, usd } from '@/lib/format'
import { analyze, type Analysis, type Keep, type KeepApi } from '@/lib/types'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Calendar } from './Calendar'
import { ChallengeShare } from './ChallengeShare'
import { KeepAction } from './KeepAction'
import { RuleChips } from './Rules'

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-[15px] tnum">
      <span className="text-muted">{label}</span>
      <b style={tone ? { color: tone } : undefined}>{value}</b>
    </div>
  )
}

function Money({ api, keep, a }: { api: KeepApi; keep: Keep; a: Analysis }) {
  const preview = useQuery({
    queryKey: ['payout', api.mode, keep.id.toString(), keep.mask, keep.claimed, api.now, api.stats.pool.toString()],
    queryFn: () => api.previewPayout(keep),
    enabled: keep.isMine && !keep.claimed,
    refetchInterval: api.mode === 'live' ? 20_000 : false,
  })
  const share = preview.data?.poolShare ?? 0n
  const dayWord = (n: number) => (n === 1 ? 'day' : 'days')
  return (
    <div className="space-y-3">
      {keep.isMine && !keep.claimed && a.missed > 0 && (
        <p className="rounded-2xl bg-[color-mix(in_srgb,var(--sun)_26%,var(--card))] p-3.5 text-sm font-semibold leading-snug">
          You missed {a.missed} {dayWord(a.missed)}, so {usd(a.lost)} went to the pool. The {a.kept} {dayWord(a.kept)} you kept still come back to you ({usd(a.secured)}).
          {a.ended
            ? ' This keep is finished: claim what you kept, or start a new keep.'
            : a.daysLeft <= 1
              ? ' Today is the last day. Check in, then claim once it closes.'
              : !a.checkedToday
                ? ' Check in today to start a new streak.'
                : ''}
        </p>
      )}
    <div className="divide-y divide-[var(--line-soft)] rounded-2xl bg-[var(--paper-2)] px-4">
      <Row label="Staked" value={usd(a.total)} />
      <Row label={a.ended ? 'Kept' : 'Safe so far'} value={usd(a.ended ? a.secured : a.safe)} tone="var(--mint)" />
      {a.missed > 0 && <Row label={`Missed ${a.missed} ${a.missed === 1 ? 'day' : 'days'}, to the pool`} value={`-${usd(a.lost)}`} tone="var(--berry)" />}
      {keep.isMine && !keep.claimed && <Row label={a.ended ? 'Pool share' : 'Pool share so far'} value={a.perfect ? (preview.isLoading ? '...' : usd(share)) : 'Not this time'} />}
    </div>
    </div>
  )
}

interface Props {
  api: KeepApi
  id: bigint | null
  onClose: () => void
}

/** Goal details. Slides up on phones and in from the right on larger screens. */
export function KeepSheet({ api, id, onClose }: Props) {
  const keep = id === null ? undefined : api.allKeeps.find((k) => k.id === id)
  const side = useMediaQuery('(min-width: 640px)')
  const open = !!keep

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const a = keep ? analyze(keep, api.now) : null

  return (
    <AnimatePresence>
      {keep && a && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-stretch sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={keep.name}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-[var(--paper)] shadow-pop-lg sm:max-h-none sm:max-w-[460px] sm:rounded-none sm:rounded-l-[1.75rem]"
            initial={side ? { x: 480 } : { y: '100%' }}
            animate={{ x: 0, y: 0 }}
            exit={side ? { x: 480 } : { y: '100%' }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5 p-5 pb-8 sm:p-7">
              <header className="flex items-center gap-3">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--paper-2)] text-3xl" aria-hidden="true">{keep.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-2xl font-extrabold leading-tight">{keep.name}</h2>
                  <p className="truncate text-sm text-muted tnum">
                    {keep.isMine ? 'Your keep' : shortAddress(keep.owner)} · {keep.duration} days · {usd(keep.stakePerDay)}/day
                  </p>
                </div>
                <button className="btn btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
              </header>

              <div className="flex items-center gap-4 rounded-2xl bg-[var(--paper-2)] p-4">
                <Flame size={60} lit={a.streak > 0} />
                <div>
                  <div className="display text-5xl font-extrabold leading-none tnum">{a.streak}</div>
                  <div className="mt-1 text-sm font-semibold text-muted">day streak</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="display text-2xl font-extrabold tnum">{usd(a.safe)}</div>
                  <div className="text-sm font-semibold text-muted">still safe</div>
                </div>
              </div>

              <KeepAction api={api} keep={keep} a={a} large />

              <Calendar analysis={a} />

              <div className="space-y-2">
                <RuleChips keep={keep} />
                {(keep.windowEnd !== 0 || keep.minBalance > 0n) && <p className="text-sm text-muted">The contract checks these every time you check in.</p>}
              </div>

              <Money api={api} keep={keep} a={a} />

              {keep.isMine && !a.ended && <ChallengeShare keep={keep} mode={api.mode} />}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
