import { Clock, ShieldCheck, UserCheck, Wallet } from 'lucide-react'
import { clock, span, usd } from '@/lib/format'
import type { Gate, Keep } from '@/lib/types'

/** The rules a goal enforces, as quiet chips. No rules means honor system. */
export function RuleChips({ keep, className = '' }: { keep: Keep; className?: string }) {
  const hasWindow = keep.windowEnd !== 0
  const hasBalance = keep.minBalance > 0n
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {hasWindow && (
        <span className="tag">
          <Clock size={13} /> {clock(keep.windowStart)} to {clock(keep.windowEnd)}
        </span>
      )}
      {hasBalance && (
        <span className="tag">
          <Wallet size={13} /> Wallet holds {usd(keep.minBalance)}+
        </span>
      )}
      {!hasWindow && !hasBalance && (
        <span className="tag">
          <UserCheck size={13} /> Honor system
        </span>
      )}
    </div>
  )
}

/** One line of live rule status for the goal card. */
export function RuleLine({ keep, g }: { keep: Keep; g: Gate }) {
  const parts: React.ReactNode[] = []
  if (keep.windowEnd !== 0) {
    parts.push(
      <span key="w" className="inline-flex items-center gap-1.5">
        <Clock size={13} />
        {clock(keep.windowStart)} to {clock(keep.windowEnd)}
        <b className="font-bold" style={{ color: g.windowOpen ? 'var(--mint)' : 'var(--muted)' }}>
          {g.windowOpen ? `open, ${span(g.closesInSec)} left` : `opens in ${span(g.opensInSec)}`}
        </b>
      </span>,
    )
  }
  if (keep.minBalance > 0n) {
    parts.push(
      <span key="b" className="inline-flex items-center gap-1.5">
        <Wallet size={13} />
        Hold {usd(keep.minBalance)}+
        {g.balanceOk !== null && (
          <b className="font-bold" style={{ color: g.balanceOk ? 'var(--mint)' : 'var(--berry)' }}>
            {g.balanceOk ? 'met' : 'not met'}
          </b>
        )}
      </span>,
    )
  }
  if (parts.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck size={13} /> Honor system, no rules
      </span>
    )
  }
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{parts}</div>
}
