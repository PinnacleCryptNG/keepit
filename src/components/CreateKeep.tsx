import { useMemo, useState } from 'react'
import { useModal } from 'connectkit'
import { Loader2, Sunrise } from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'
import { usd } from '@/lib/format'
import { DURATIONS } from '@/lib/keepit'
import { parseUsdc } from '@/onchain-money'
import type { KeepApi } from '@/lib/types'
import { useAction } from '@/hooks/useAction'

const EMOJIS = ['🏃', '💻', '🍎', '📚', '🧘', '💧', '🏋️', '🎸', '✍️', '😴', '🥗', '🚭']
const IDEAS = [
  { name: 'Run 2km', emoji: '🏃' },
  { name: 'Code 1 hour', emoji: '💻' },
  { name: 'No sugar', emoji: '🍎' },
  { name: 'Read 20 pages', emoji: '📚' },
]
const STAKES = ['0.25', '0.5', '1', '2', '5']
const MIN_STAKE = 10_000n
const MAX_STAKE = 100_000_000n

export function CreateKeep({ api, onCreated }: { api: KeepApi; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏃')
  const [duration, setDuration] = useState<number>(14)
  const [stake, setStake] = useState('1')
  const action = useAction()
  const { setOpen } = useModal()

  const stakeRaw = useMemo(() => {
    try {
      return parseUsdc(stake)
    } catch {
      return null
    }
  }, [stake])
  const nameBytes = new TextEncoder().encode(name.trim()).length
  const nameOk = nameBytes >= 1 && nameBytes <= 48
  const validStake = stakeRaw !== null && stakeRaw >= MIN_STAKE && stakeRaw <= MAX_STAKE ? stakeRaw : null
  const stakeOk = validStake !== null
  const total = validStake !== null ? validStake * BigInt(duration) : 0n
  const needsWallet = api.mode === 'live' && !api.connected
  const insufficient = stakeOk && api.balance !== undefined && api.balance < total
  const demo = api.mode === 'demo'

  const submit = async () => {
    if (needsWallet) return setOpen(true)
    if (!nameOk || validStake === null) return
    const ok = await action.run(
      (onStep) => api.create({ name: name.trim(), emoji, duration, stakePerDay: validStake }, onStep),
      'Goal created. Your stake is in escrow.',
    )
    if (ok) {
      fireConfetti(undefined, 90)
      setName('')
      onCreated()
    }
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-4 p-5">
        <h2 className="display text-2xl font-bold">Put money on a habit</h2>

        <div>
          <label htmlFor="goal-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Daily goal</label>
          <input id="goal-name" className="field" placeholder="e.g. Run 2km" value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {IDEAS.map((i) => (
              <button key={i.name} className="chip !min-h-[36px] text-xs" aria-pressed={name === i.name} onClick={() => { setName(i.name); setEmoji(i.emoji) }}>
                {i.emoji} {i.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Emoji</div>
          <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Goal emoji">
            {EMOJIS.map((e) => (
              <button
                key={e}
                role="radio"
                aria-checked={emoji === e}
                aria-label={`Emoji ${e}`}
                onClick={() => setEmoji(e)}
                className="flex aspect-square items-center justify-center rounded-2xl text-2xl transition-transform active:scale-90"
                style={emoji === e ? { background: 'var(--flame-soft)', outline: '2px solid var(--flame-2)' } : { background: 'var(--surface-muted)' }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Length</div>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button key={d} className="chip" aria-pressed={duration === d} onClick={() => setDuration(d)}>{d} days</button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="stake" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Stake per day (USDC)</label>
          <div className="inner flex items-baseline gap-2 px-4 py-3">
            <span className="display text-3xl font-bold" style={{ color: 'var(--subtle)' }}>$</span>
            <input
              id="stake"
              inputMode="decimal"
              className="display w-full bg-transparent text-4xl font-bold tabular-nums outline-none"
              value={stake}
              placeholder="1.00"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if (/^\d*\.?\d{0,6}$/.test(v)) setStake(v)
              }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {STAKES.map((s) => (
              <button key={s} className="chip !min-h-[40px]" aria-pressed={stake === s} onClick={() => setStake(s)}>${s}</button>
            ))}
          </div>
          {stake !== '' && !stakeOk && <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>Stake between $0.01 and $100 a day.</p>}
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Total into escrow</span>
          <span className="display text-3xl font-bold tabular-nums">{usd(total)}</span>
        </div>
        <ul className="space-y-1.5 text-xs" style={{ color: 'var(--muted)' }}>
          <li className="flex gap-2"><Sunrise size={14} className="mt-0.5 shrink-0" /> Day 1 is today and closes at midnight UTC.</li>
          <li>Keep every day: get all {usd(total)} back plus a share of the pool.</li>
          <li>Miss a day: that day's {validStake !== null ? usd(validStake) : 'stake'} goes to the pool for keepers.</li>
        </ul>
        <button
          className="btn btn-primary w-full !min-h-[54px] text-base"
          disabled={action.busy || (!needsWallet && (!nameOk || !stakeOk || insufficient))}
          onClick={() => void submit()}
        >
          {action.busy ? (
            <><Loader2 className="animate-spin" size={18} /> {action.label}</>
          ) : needsWallet ? 'Connect wallet to stake'
            : insufficient ? 'Not enough USDC'
            : !nameOk ? 'Name your habit'
            : `${demo ? 'Stake (demo)' : 'Stake'} ${usd(total)} on ${duration} days`}
        </button>
        {action.error && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{action.error}</p>}
        {insufficient && !demo && <p className="text-xs" style={{ color: 'var(--muted)' }}>Tap "Get test USDC" in the Arc Studio sidebar to top up.</p>}
      </section>
    </div>
  )
}
