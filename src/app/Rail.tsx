import { useMemo } from 'react'
import { Flame } from '@/brand/Flame'
import { shortAddress, usd } from '@/lib/format'
import { analyze, type KeepApi } from '@/lib/types'
import type { Tab } from '@/hooks/useRoute'

/** Wide-screen side panel: the pool, your totals and the leaders. Hidden on phones, where the tabs carry this. */
export function Rail({ api, tab, onOpen }: { api: KeepApi; tab: Tab; onOpen: (id: bigint) => void }) {
  const mine = useMemo(() => {
    const rows = api.myKeeps.map((k) => ({ k, a: analyze(k, api.now) }))
    const active = rows.filter(({ k, a }) => !k.claimed && !a.ended)
    const ready = rows.filter(({ k, a }) => !k.claimed && a.ended)
    return {
      count: active.length,
      safe: active.reduce((sum, { a }) => sum + a.safe, 0n),
      streak: active.reduce((m, { a }) => Math.max(m, a.streak), 0),
      ready: ready.length,
      readyAmount: ready.reduce((sum, { a }) => sum + a.secured, 0n),
      total: rows.length,
    }
  }, [api.myKeeps, api.now])

  const top = useMemo(
    () =>
      api.allKeeps
        .map((k) => ({ k, a: analyze(k, api.now) }))
        .filter(({ a }) => !a.ended && a.streak > 0)
        .sort((x, y) => y.a.streak - x.a.streak)
        .slice(0, 4),
    [api.allKeeps, api.now],
  )

  return (
    <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Overview">
      {tab !== 'wall' && (
        <section className="surface p-5">
          <div className="text-sm font-bold text-muted">In the pool</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="display text-4xl font-extrabold tnum">{usd(api.stats.pool)}</span>
            <Flame size={40} />
          </div>
          <p className="mt-2 text-sm text-muted">Split among keepers who finish a perfect run.</p>
        </section>
      )}

      {mine.total > 0 && (
        <section className="surface p-5">
          <div className="text-sm font-bold text-muted">Your keeps</div>
          <dl className="mt-3 space-y-2.5 text-[15px]">
            <div className="flex justify-between"><dt className="text-muted">Active</dt><dd className="font-extrabold tnum">{mine.count}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Money safe</dt><dd className="font-extrabold tnum">{usd(mine.safe)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Current streak</dt><dd className="flex items-center gap-1 font-extrabold tnum"><Flame size={16} lit={mine.streak > 0} />{mine.streak}</dd></div>
            {mine.ready > 0 && <div className="flex justify-between border-t border-[var(--line-soft)] pt-2.5"><dt className="font-bold">Ready to claim</dt><dd className="font-extrabold tnum" style={{ color: 'var(--mint)' }}>{usd(mine.readyAmount)}</dd></div>}
          </dl>
        </section>
      )}

      {tab !== 'wall' && top.length > 0 && (
        <section className="surface p-5">
          <div className="text-sm font-bold text-muted">Longest streaks</div>
          <ul className="mt-2 divide-y divide-[var(--line-soft)]">
            {top.map(({ k, a }) => (
              <li key={k.id.toString()}>
                <button onClick={() => onOpen(k.id)} className="flex w-full items-center gap-3 py-2.5 text-left" aria-label={`Open ${k.name}`}>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--paper-2)] text-lg" aria-hidden="true">{k.emoji}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-bold leading-tight">{k.name}</span><span className="block truncate text-xs text-muted">{k.isMine ? 'You' : shortAddress(k.owner)}</span></span>
                  <span className="flex items-center gap-1 font-extrabold tnum"><Flame size={16} />{a.streak}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">A missed day resets a streak to 0 and drops it from this list until the next check-in.</p>
        </section>
      )}
    </aside>
  )
}
