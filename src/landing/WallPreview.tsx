import { useMemo } from 'react'
import { ArrowRight, Coins, ShieldCheck, Users } from 'lucide-react'
import { Flame } from '@/brand/Flame'
import { LeaderRow } from '@/components/LeaderRow'
import { SampleBadge } from '@/components/SampleBadge'
import { Reveal, SectionHead } from '@/components/Reveal'
import { usd } from '@/lib/format'
import { analyze, type KeepApi } from '@/lib/types'

/** Landing-page peek at the leaderboard, always fed by the seeded demo data. */
export function WallPreview({ demo, onOpen }: { demo: KeepApi; onOpen: () => void }) {
  const rows = useMemo(
    () =>
      demo.allKeeps
        .map((k) => ({ k, a: analyze(k, demo.now) }))
        .filter(({ k, a }) => !k.isMine && !a.ended && a.streak > 0)
        .sort((x, y) => y.a.streak - x.a.streak)
        .slice(0, 5),
    [demo.allKeeps, demo.now],
  )

  return (
    <section id="wall" className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8 sm:py-28">
      <SectionHead
        eyebrow="Wall of Keepers"
        title={<>Quitters fund the pool. <span className="text-fire">Keepers</span> collect it.</>}
        sub="Every missed stake lands in a shared pool, and everyone who finishes with a perfect record splits it. The names and numbers below are made up to show how the wall looks."
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="surface relative h-full overflow-hidden p-6 sm:p-8">
            <div className="glow-ember pointer-events-none absolute -right-16 -top-16 size-64 opacity-60" aria-hidden="true" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="eyebrow flex items-center gap-1.5"><Coins size={14} /> Pool up for grabs</div><SampleBadge /></div>
              <div className="mt-2 flex items-center gap-3">
                <span className="display text-6xl font-extrabold tnum sm:text-7xl">{usd(demo.stats.pool)}</span>
                <Flame size={56} />
              </div>
              <p className="pretty mt-3 text-muted">Forfeited by people who skipped a day. Waiting for the ones who didn't.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="hairline p-3">
                  <div className="eyebrow flex items-center gap-1 !text-[0.66rem]"><ShieldCheck size={12} /> Total kept</div>
                  <div className="display text-2xl font-extrabold tnum">{usd(demo.stats.totalKept)}</div>
                </div>
                <div className="hairline p-3">
                  <div className="eyebrow flex items-center gap-1 !text-[0.66rem]"><Users size={12} /> Keepers</div>
                  <div className="display text-2xl font-extrabold tnum">{demo.stats.keepers}</div>
                </div>
              </div>
              <button className="btn btn-ink mt-6 w-full" onClick={onOpen}>
                See the full wall <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="surface h-full p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-extrabold">Longest active streaks</h3><SampleBadge>Sample keepers</SampleBadge></div>
            <ol className="space-y-3">
              {rows.map(({ k, a }, i) => (
                <LeaderRow key={k.id.toString()} keep={{ ...k, isMine: false }} a={a} rank={i + 1} index={i} />
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
