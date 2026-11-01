import { useMemo, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'
import { usd } from '@/lib/format'
import { DURATIONS, MAX_STAKE_PER_DAY } from '@/lib/keepit'
import { useWalletModal } from '@/lib/walletModal'
import { parseUsdc } from '@/onchain-money'
import { browserOffsetMin, gate, type Keep, type KeepApi } from '@/lib/types'
import { useAction } from '@/hooks/useAction'
import { useNow } from '@/hooks/useNow'

type Template = 'early' | 'funded' | 'both' | 'honor'

const TEMPLATES: { id: Template; emoji: string; title: string; hint: string }[] = [
  { id: 'early', emoji: '🌅', title: 'Early bird', hint: 'Check in only inside a time window' },
  { id: 'funded', emoji: '🏦', title: 'Stay funded', hint: 'Keep a minimum balance in your wallet' },
  { id: 'both', emoji: '⏰', title: 'Window and balance', hint: 'Both rules, checked together' },
  { id: 'honor', emoji: '✍️', title: 'Your own habit', hint: 'Any habit, no rules. Honor system' },
]
const HONOR_EMOJIS = ['📚', '🏃', '🧘', '💧', '🥗', '💻', '😴', '🎸']
const STAKES = ['0.5', '1', '2', '5']
const MIN_STAKE = 10_000n
const MAX_STAKE = MAX_STAKE_PER_DAY

const hhmm = (sec: number) => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`
/** A two-hour window that contains the current local time, so a new keep can check in right away. */
function openWindow(nowMs: number, offsetMin: number): [string, string] {
  const day = 86_400_000
  const sod = Math.floor((((nowMs + offsetMin * 60_000) % day) + day) % day / 1000)
  const start = Math.min(Math.floor(sod / 3600) * 3600, 21 * 3600)
  return [hhmm(start), hhmm(Math.min(start + 2 * 3600, 86_340))]
}

const toSec = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 3600 + (m || 0) * 60
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
        <span className="flex size-7 items-center justify-center rounded-full bg-[var(--ink)] text-sm text-[var(--paper)]">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

export function CreateKeep({ api, onCreated }: { api: KeepApi; onCreated: () => void }) {
  const [tpl, setTpl] = useState<Template>('early')
  const [name, setName] = useState('Early bird')
  const [emoji, setEmoji] = useState('🌅')
  const [initialWindow] = useState(() => openWindow(api.mode === 'demo' ? api.now : Date.now(), browserOffsetMin()))
  const [from, setFrom] = useState(initialWindow[0])
  const [to, setTo] = useState(initialWindow[1])
  const [bal, setBal] = useState('50')
  const [duration, setDuration] = useState<number>(14)
  const [stake, setStake] = useState('1')
  const action = useAction()
  const realNow = useNow(30_000)
  const { open: openWallet } = useWalletModal()
  const demo = api.mode === 'demo'
  const needsWallet = api.mode === 'live' && !api.connected

  const useWindow = tpl === 'early' || tpl === 'both'
  const useBalance = tpl === 'funded' || tpl === 'both'

  const pick = (t: (typeof TEMPLATES)[number]) => {
    const wasDefault = TEMPLATES.some((x) => x.title === name) || name.trim() === ''
    setTpl(t.id)
    setEmoji(t.id === 'honor' ? HONOR_EMOJIS[0] : t.emoji)
    if (wasDefault) setName(t.id === 'honor' ? '' : t.title)
  }

  const stakeRaw = useMemo(() => {
    try {
      return parseUsdc(stake)
    } catch {
      return null
    }
  }, [stake])
  const balRaw = useMemo(() => {
    try {
      return parseUsdc(bal)
    } catch {
      return null
    }
  }, [bal])

  const nameBytes = new TextEncoder().encode(name.trim()).length
  const nameOk = nameBytes >= 1 && nameBytes <= 48
  const validStake = stakeRaw !== null && stakeRaw >= MIN_STAKE && stakeRaw <= MAX_STAKE ? stakeRaw : null
  const total = validStake !== null ? validStake * BigInt(duration) : 0n
  const winStart = toSec(from)
  const winEnd = toSec(to)
  const winOk = !useWindow || (winStart < winEnd && winEnd <= 86_400)
  const balValid = !useBalance || (balRaw !== null && balRaw > 0n && balRaw <= MAX_STAKE_PER_DAY * 1000n)

  const rules = {
    windowStart: useWindow && winOk ? winStart : 0,
    windowEnd: useWindow && winOk ? winEnd : 0,
    minBalance: useBalance && balRaw !== null && balValid ? balRaw : 0n,
  }
  const preview = { utcOffsetMin: browserOffsetMin(), ...rules } as Keep
  const windowClosedNow = useWindow && winOk && gate(preview, demo ? api.now : realNow).windowOpen === false
  const insufficient = validStake !== null && api.balance !== undefined && api.balance < total
  const after = api.balance !== undefined ? api.balance - total : undefined
  const belowAtStart = rules.minBalance > 0n && after !== undefined && after < rules.minBalance

  const ready = nameOk && validStake !== null && winOk && balValid
  const blocked = api.incompatible || (!needsWallet && (!ready || insufficient || belowAtStart))

  const submit = async () => {
    if (needsWallet) return openWallet()
    if (!ready || validStake === null) return
    const ok = await action.run((onStep) => api.create({ name: name.trim(), emoji, duration, stakePerDay: validStake, ...rules }, onStep), 'Keep created. Your stake is in escrow.')
    if (ok) {
      fireConfetti(undefined, 100)
      onCreated()
    }
  }

  const cta = action.busy ? null : needsWallet ? 'Connect wallet' : api.incompatible ? 'Contract version mismatch' : !nameOk ? 'Name your habit' : !winOk ? 'Fix the window' : !balValid ? 'Fix the balance' : validStake === null ? 'Set a daily stake' : insufficient ? 'Not enough USDC' : belowAtStart ? 'Balance rule not met' : `Stake ${usd(total)}`

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">New keep</h1>
        <p className="mt-1 text-muted">Put a little USDC behind a habit. Keep the streak and it all comes back.</p>
      </header>

      <Step n={1} title="Pick a habit">
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Habit type">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={tpl === t.id}
              onClick={() => pick(t)}
              className="flex flex-col items-start gap-2 rounded-2xl border bg-[var(--card)] p-4 text-left transition-colors"
              style={tpl === t.id ? { borderColor: 'var(--ember)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ember) 20%, transparent)' } : { borderColor: 'var(--line-soft)' }}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--paper-2)] text-2xl" aria-hidden="true">{t.emoji}</span>
              <span className="min-w-0">
                <span className="block font-extrabold leading-tight">{t.title}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{t.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-3 pt-1">
          <label className="block text-sm font-bold">
            Name
            <input className="field mt-1.5" placeholder="e.g. Read 20 pages" value={name} maxLength={48} onChange={(e) => setName(e.target.value)} />
          </label>
          {tpl === 'honor' && (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Icon">
              {HONOR_EMOJIS.map((e) => (
                <button key={e} role="radio" aria-checked={emoji === e} aria-label={`Icon ${e}`} className="chip !min-h-[44px] !px-3 text-xl" aria-pressed={emoji === e} onClick={() => setEmoji(e)}>{e}</button>
              ))}
            </div>
          )}
          {useWindow && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold">Open from<input type="time" className="field mt-1.5" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
              <label className="block text-sm font-bold">Until<input type="time" className="field mt-1.5" value={to} onChange={(e) => setTo(e.target.value)} /></label>
              <p className="col-span-2 -mt-1 text-xs text-muted">
                Your local time. You can only check in between these times.{' '}
                <button type="button" className="font-bold underline" onClick={() => { const [f, t] = openWindow(demo ? api.now : realNow, browserOffsetMin()); setFrom(f); setTo(t) }}>Use the next 2 hours</button>
              </p>
              {!winOk && <p className="col-span-2 text-sm font-semibold" style={{ color: 'var(--berry)' }}>The end must be after the start, on the same day.</p>}
            </div>
          )}
          {useBalance && (
            <label className="block text-sm font-bold">
              Wallet must hold at least (USDC)
              <input
                className="field mt-1.5"
                inputMode="decimal"
                value={bal}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '')
                  if (/^\d*\.?\d{0,6}$/.test(v)) setBal(v)
                }}
              />
            </label>
          )}
          <p className="text-sm text-muted">
            {tpl === 'honor' ? 'Nothing can verify this one, so only use it with people you trust.' : 'The contract checks this every time you check in.'}
          </p>
        </div>
      </Step>

      <Step n={2} title="How long, and how much">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Length">
          {DURATIONS.map((d) => (
            <button key={d} role="radio" aria-checked={duration === d} className="chip" aria-pressed={duration === d} onClick={() => setDuration(d)}>{d} days</button>
          ))}
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">Stake per day</div>
          <div className="flex flex-wrap items-center gap-2">
            {STAKES.map((s) => (
              <button key={s} className="chip" aria-pressed={stake === s} onClick={() => setStake(s)}>${Number(s).toFixed(2)}</button>
            ))}
            <label className="flex min-h-[44px] items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--card)] px-4">
              <span className="font-bold text-faint">$</span>
              <input
                aria-label="Custom daily stake"
                inputMode="decimal"
                className="w-16 bg-transparent text-base font-bold tnum outline-none"
                value={STAKES.includes(stake) ? '' : stake}
                placeholder="Other"
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, '')
                  if (/^\d*\.?\d{0,6}$/.test(v)) setStake(v)
                }}
              />
            </label>
          </div>
          {stake !== '' && validStake === null && <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--berry)' }}>Stake between $0.01 and $5 a day.</p>}
        </div>
        <p className="text-sm text-muted">
          Keep every day and you get {usd(total)} back plus a share of the pool. Miss a day and that day's stake goes to the pool.
        </p>
      </Step>

      <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 space-y-2 sm:bottom-4">
        {windowClosedNow && (
          <p className="flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--sun)_35%,var(--card))] p-3 text-sm font-semibold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Today's window is closed, so day 1 will count as missed.
          </p>
        )}
        {belowAtStart && (
          <p className="flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--berry)_16%,var(--card))] p-3 text-sm font-semibold">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> After staking your wallet would hold {usd(after && after > 0n ? after : 0n)}, below your {usd(rules.minBalance)} rule.
          </p>
        )}
        <div className="surface flex items-center gap-3 p-3 pl-5">
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-xs font-semibold text-muted">Total into escrow</div>
            <div className="display text-2xl font-extrabold tnum">{usd(total)}</div>
          </div>
          <button className="btn btn-ember btn-lg" disabled={action.busy || blocked} onClick={() => void submit()}>
            {action.busy ? <><Loader2 className="animate-spin" size={18} /> {action.label}</> : cta}
          </button>
        </div>
        {action.error && <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--berry)' }}>{action.error}</p>}
      </div>
    </div>
  )
}
