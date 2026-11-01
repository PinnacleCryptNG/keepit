import { useRef } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'
import { span, untilMidnight, usd } from '@/lib/format'
import { gate, MS_PER_DAY, type Analysis, type Keep, type KeepApi } from '@/lib/types'
import { useWalletModal } from '@/lib/walletModal'
import { useAction } from '@/hooks/useAction'
import { useNow } from '@/hooks/useNow'

interface Props {
  api: KeepApi
  keep: Keep
  a: Analysis
  large?: boolean
}

/**
 * The one button that matters: check in, wait for the window, claim, or done.
 * Used on the goal card and in the detail sheet so the action is always one tap away.
 */
export function KeepAction({ api, keep, a, large = false }: Props) {
  const action = useAction()
  const btn = useRef<HTMLButtonElement>(null)
  const { open: openWallet } = useWalletModal()
  const real = useNow(1000)
  const now = real + (api.demo?.daysSkipped ?? 0) * MS_PER_DAY
  const needsWallet = api.mode === 'live' && !api.connected
  const size = large ? 'btn-lg' : ''
  if (!keep.isMine) return null

  const burst = (n: number) => {
    const r = btn.current?.getBoundingClientRect()
    fireConfetti(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined, n)
  }

  if (keep.claimed) {
    return (
      <div className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--paper-2)] text-sm font-bold text-muted">
        <CheckCircle2 size={18} style={{ color: 'var(--mint)' }} /> Claimed and paid out
      </div>
    )
  }

  if (a.ended) {
    const onClaim = async () => {
      if (needsWallet) return openWallet()
      const ok = await action.run((onStep) => api.claim(keep.id, onStep), 'Claimed!')
      if (ok) burst(240)
    }
    return (
      <div className="space-y-2">
        <button ref={btn} className={`btn btn-ember w-full ${size}`} disabled={action.busy} onClick={() => void onClaim()}>
          {action.busy ? <><Loader2 className="animate-spin" size={18} /> {action.label}</> : needsWallet ? 'Connect wallet to claim' : `Claim ${usd(a.secured)}${a.perfect ? ' + pool share' : ''}`}
        </button>
        {action.error && <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--berry)' }}>{action.error}</p>}
      </div>
    )
  }

  if (a.checkedToday) {
    return (
      <div className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl text-sm font-bold" style={{ background: 'var(--mint-soft)', color: 'var(--mint)' }}>
        <CheckCircle2 size={18} /> Kept today
        <span className="font-medium text-muted tnum">· next in {untilMidnight(keep.utcOffsetMin, now)}</span>
      </div>
    )
  }

  const g = gate(keep, now, api.balance)
  const blocked = !needsWallet && !g.allowed
  const blockedLabel = g.windowOpen === false ? `Opens in ${span(g.opensInSec)}` : `Wallet needs ${usd(keep.minBalance)}`

  const onCheckIn = async () => {
    if (needsWallet) return openWallet()
    const ok = await action.run((onStep) => api.checkIn(keep.id, '', onStep), 'Checked in. Streak extended!')
    if (ok) burst(110)
  }

  return (
    <div className="space-y-2">
      <button ref={btn} className={`btn ${blocked ? '' : 'btn-ember'} w-full ${size}`} disabled={action.busy || blocked} onClick={() => void onCheckIn()}>
        {action.busy ? <><Loader2 className="animate-spin" size={18} /> {action.label}</> : needsWallet ? 'Connect wallet to check in' : blocked ? blockedLabel : 'Check in'}
      </button>
      {action.error && <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--berry)' }}>{action.error}</p>}
    </div>
  )
}
