import { useMemo } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Flame } from '@/brand/Flame'
import { LeaderRow } from '@/components/LeaderRow'
import { SampleBadge } from '@/components/SampleBadge'
import { NETWORK_NAME } from '@/lib/brand'
import { usd } from '@/lib/format'
import { analyze, type KeepApi } from '@/lib/types'
import { useAction } from '@/hooks/useAction'

interface Props {
  api: KeepApi
  onStart: () => void
  onOpen: (id: bigint) => void
}

export function Wall({ api, onStart, onOpen }: Props) {
  const action = useAction()
  const demo = api.mode === 'demo'

  const rows = useMemo(
    () =>
      api.allKeeps
        .map((k) => ({ k, a: analyze(k, api.now) }))
        .filter(({ a }) => !a.ended && a.streak > 0)
        .sort((x, y) => y.a.streak - x.a.streak || Number(y.a.total - x.a.total))
        .slice(0, 12),
    [api.allKeeps, api.now],
  )
  const pending = useMemo(() => {
    const ids: bigint[] = []
    let days = 0
    for (const k of api.allKeeps) {
      const p = analyze(k, api.now).pendingMisses
      if (p > 0) {
        ids.push(k.id)
        days += p
      }
    }
    return { ids, days }
  }, [api.allKeeps, api.now])
  const canSweep = demo || api.connected

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Wall of Keepers</h1>
          <p className="mt-1 text-muted">The longest streaks still going.</p>
        </div>
        {demo && <SampleBadge>Sample keepers</SampleBadge>}
      </header>

      <section className="surface flex items-center gap-4 p-5 sm:p-6">
        <Flame size={52} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-muted">In the pool</div>
          <div className="display text-4xl font-extrabold leading-tight tnum sm:text-5xl">{usd(api.stats.pool)}</div>
        </div>
        <div className="hidden text-right text-sm text-muted sm:block">
          <div>Shared by keepers</div>
          <div>who finish clean</div>
        </div>
      </section>

      {pending.ids.length > 0 && canSweep && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--paper-2)] px-4 py-3">
          <p className="text-sm font-semibold">
            {pending.days} missed {pending.days === 1 ? 'day is' : 'days are'} waiting to move into the pool.
          </p>
          <button className="btn btn-sm shrink-0" disabled={action.busy} onClick={() => void action.run((onStep) => api.sweep(pending.ids, onStep), 'Missed days moved to the pool.')}>
            {action.busy ? <><Loader2 size={14} className="animate-spin" /> Working</> : 'Update pool'}
          </button>
        </div>
      )}
      {action.error && <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--berry)' }}>{action.error}</p>}

      {api.error && rows.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-10 text-center">
          <RefreshCw size={30} className="text-muted" />
          <p className="font-bold">Couldn't reach {NETWORK_NAME}</p>
          <button className="btn btn-sm" onClick={api.refetch}>Try again</button>
        </div>
      ) : api.loading && rows.length === 0 ? (
        <div className="space-y-3">
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      ) : rows.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Flame size={52} lit={false} />
          <h2 className="text-2xl font-extrabold">{api.allKeeps.length > 0 ? 'No active streaks right now' : 'No keepers yet'}</h2>
          <p className="max-w-sm text-muted">{api.allKeeps.length > 0 ? 'Check in today and your streak lands on the wall.' : "Start a keep and you'll be the first name on the wall."}</p>
          <button className="btn btn-ember mt-1" onClick={onStart}>Start a keep</button>
        </div>
      ) : (
        <>
        <ol className="space-y-2.5">
          {rows.map(({ k, a }, i) => (
            <LeaderRow key={k.id.toString()} keep={k} a={a} rank={i + 1} index={i} onOpen={() => onOpen(k.id)} />
          ))}
        </ol>
        <p className="text-sm text-muted">Ranked by current streak. Miss a day and your streak resets to 0, which drops you off this list until you check in again. The days you kept still come back to you.</p>
        </>
      )}
    </div>
  )
}
