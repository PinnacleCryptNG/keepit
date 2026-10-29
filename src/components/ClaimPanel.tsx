import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, ExternalLink, Gift, Loader2, PiggyBank } from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'
import { usd } from '@/lib/format'
import { CHAIN_ID } from '@/lib/keepit'
import { buildTxExplorerUrl } from '@/onchain-facts'
import type { Analysis, Keep, KeepApi } from '@/lib/types'
import { useAction } from '@/hooks/useAction'

interface Props {
  api: KeepApi
  keep: Keep
  a: Analysis
}

export function ClaimPanel({ api, keep, a }: Props) {
  const action = useAction()
  const btn = useRef<HTMLButtonElement>(null)
  const preview = useQuery({
    queryKey: ['payout', api.mode, keep.id.toString(), keep.mask, keep.claimed, api.today, api.stats.pool.toString()],
    queryFn: () => api.previewPayout(keep),
    refetchInterval: api.mode === 'live' ? 20_000 : false,
  })
  const refund = preview.data?.refund ?? a.secured
  const share = preview.data?.poolShare ?? 0n

  if (keep.claimed) {
    return (
      <section className="card flex items-center gap-3 p-4">
        <CheckCircle2 style={{ color: 'var(--success)' }} />
        <div className="text-sm">
          <div className="font-semibold">Claimed</div>
          <div style={{ color: 'var(--muted)' }}>This goal is settled and paid out.</div>
        </div>
      </section>
    )
  }

  if (!a.ended) {
    return (
      <section className="card flex items-center gap-3 p-4">
        <PiggyBank style={{ color: 'var(--flame-2)' }} />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-semibold">Finish to claim {usd(a.total)} back</div>
          <div className="tabular-nums" style={{ color: 'var(--muted)' }}>
            {a.missed === 0 ? `Pool share so far: ${preview.isLoading ? '...' : usd(share)}` : 'A missed day means no pool share, but kept days are still refunded.'}
          </div>
        </div>
      </section>
    )
  }

  const total = refund + share
  const onClaim = async () => {
    const ok = await action.run((onStep) => api.claim(keep.id, onStep), 'Claimed!')
    if (ok) {
      const r = btn.current?.getBoundingClientRect()
      fireConfetti(r ? { x: r.left + r.width / 2, y: r.top } : undefined, 220)
    }
  }

  return (
    <motion.section className="card overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }} />
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
          <Gift size={14} /> Goal complete
        </div>
        <div className="display text-4xl font-bold tabular-nums">{usd(total)}</div>
        <div className="inner space-y-1.5 p-3 text-sm tabular-nums">
          <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Stake returned ({a.kept} kept {a.kept === 1 ? 'day' : 'days'})</span><b>{usd(refund)}</b></div>
          <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Pool share</span><b>{usd(share)}</b></div>
          {a.missed > 0 && (
            <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Missed {a.missed} {a.missed === 1 ? 'day' : 'days'} to the pool</span><b style={{ color: 'var(--danger)' }}>-{usd(a.lost)}</b></div>
          )}
        </div>
        <button ref={btn} className="btn btn-flame w-full !min-h-[56px] text-base" disabled={action.busy} onClick={() => void onClaim()}>
          {action.busy ? <><Loader2 className="animate-spin" size={18} /> {action.label}</> : `Claim ${usd(total)}`}
        </button>
        {action.error && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{action.error}</p>}
        {action.hash && (
          <a href={buildTxExplorerUrl(CHAIN_ID, action.hash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--link)' }}>
            View on ArcScan <ExternalLink size={12} />
          </a>
        )}
      </div>
    </motion.section>
  )
}
