import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Coins, Loader2, ShieldCheck, Trophy, Users } from 'lucide-react'
import { analyze, type KeepApi } from '@/lib/types'
import { shortAddress, usd } from '@/lib/format'
import { useAction } from '@/hooks/useAction'
import { FlameIcon } from './FlameIcon'

const RANK_STYLE = [
  { background: 'linear-gradient(135deg, #ffd86b, #ffb020)', color: '#5a3a00' },
  { background: 'linear-gradient(135deg, #e5eaf2, #b8c4d6)', color: '#2b3a4f' },
  { background: 'linear-gradient(135deg, #f3c9a0, #d9945a)', color: '#4a2a10' },
]

export function Wall({ api }: { api: KeepApi }) {
  const action = useAction()

  const rows = useMemo(
    () =>
      api.allKeeps
        .map((k) => ({ k, a: analyze(k, api.today) }))
        .filter(({ a }) => !a.ended && a.streak > 0)
        .sort((x, y) => y.a.streak - x.a.streak || Number(y.a.total - x.a.total))
        .slice(0, 10),
    [api.allKeeps, api.today],
  )
  const pending = useMemo(() => {
    const ids: bigint[] = []
    let days = 0
    for (const k of api.allKeeps) {
      const p = analyze(k, api.today).pendingMisses
      if (p > 0) {
        ids.push(k.id)
        days += p
      }
    }
    return { ids, days }
  }, [api.allKeeps, api.today])

  const canSweep = api.mode === 'demo' || api.connected

  return (
    <div className="space-y-4">
      <section className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full blur-3xl" style={{ background: 'rgba(255,106,26,.25)' }} />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
            <Coins size={14} /> Pool up for grabs
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="display text-5xl font-bold tabular-nums">{usd(api.stats.pool)}</span>
            <FlameIcon size={38} />
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Missed stakes, split among keepers who finish every day.</p>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="inner p-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}><ShieldCheck size={13} /> Total kept</div>
            <div className="display text-2xl font-bold tabular-nums">{usd(api.stats.totalKept)}</div>
          </div>
          <div className="inner p-3">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}><Users size={13} /> Keepers</div>
            <div className="display text-2xl font-bold tabular-nums">{api.stats.keepers}</div>
            <div className="text-[11px] tabular-nums" style={{ color: 'var(--subtle)' }}>{api.stats.goals} goals</div>
          </div>
        </div>
      </section>

      {pending.ids.length > 0 && (
        <section className="card space-y-2 p-4">
          <div className="text-sm">
            <b className="tabular-nums">{pending.days}</b> missed {pending.days === 1 ? 'day is' : 'days are'} waiting to move into the pool.
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Anyone can sweep them in. It makes pool shares accurate for everyone.</p>
          <button
            className="btn btn-primary w-full"
            disabled={action.busy || !canSweep}
            onClick={() => void action.run((onStep) => api.sweep(pending.ids, onStep), 'Missed days moved to the pool.')}
          >
            {action.busy ? <><Loader2 className="animate-spin" size={16} /> {action.label}</> : canSweep ? 'Move missed days to pool' : 'Connect wallet to sweep'}
          </button>
          {action.error && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{action.error}</p>}
        </section>
      )}

      <section className="card p-4">
        <h2 className="display mb-3 flex items-center gap-2 text-xl font-bold"><Trophy size={20} style={{ color: 'var(--flame-2)' }} /> Wall of Keepers</h2>
        {api.loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>No active streaks yet. Start a keep and be the first on the wall.</p>
        ) : (
          <ol className="space-y-2">
            {rows.map(({ k, a }, i) => (
              <motion.li
                key={k.id.toString()}
                className="inner flex items-center gap-3 p-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className="display flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={RANK_STYLE[i] ?? { background: 'var(--surface-strong)', color: 'var(--muted)' }}>{i + 1}</span>
                <span className="text-xl">{k.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{k.name}</div>
                  <div className="truncate text-xs" style={{ color: 'var(--muted)' }}>
                    {k.isMine ? 'You' : shortAddress(k.owner)} · kept <span className="tabular-nums">{usd(a.secured)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <FlameIcon size={22} />
                  <span className="display text-xl font-bold tabular-nums">{a.streak}</span>
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </section>

      <section className="card space-y-2 p-4 text-sm">
        <h3 className="display text-lg font-bold">How payouts work</h3>
        <ul className="list-disc space-y-1.5 pl-5" style={{ color: 'var(--muted)' }}>
          <li>Your whole stake sits in escrow. Each kept day secures that day's stake.</li>
          <li>A missed day's stake moves to the shared pool.</li>
          <li>Finish with zero misses and you claim your stake back plus a share of the pool, weighted by stake.</li>
          <li>Finish with misses and you still get your kept days back, just no pool share.</li>
        </ul>
      </section>
    </div>
  )
}
