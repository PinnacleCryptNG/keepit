import { Flame } from '@/brand/Flame'
import { Reveal, SectionHead } from '@/components/Reveal'

const DAYS = 14
const STAKE = 2
/** Illustrative pool for the first card: four keepers finish and split $40 left by quitters. */
const EXAMPLE_POOL = 40
const EXAMPLE_KEEPERS = 4

const SCENARIOS = [
  { tag: 'Perfect run', title: 'Keep every day', days: 'KKKKKKKKKKKKKK', note: 'Everything comes home, plus your cut of what quitters left in the pot.', tone: 'var(--mint)' },
  { tag: 'One slip', title: 'Miss one day', days: 'KKKKKxKKKKKKKK', note: 'A slip costs one day, not the whole bet. No pool bonus.', tone: 'var(--sun)' },
  { tag: 'Gave up', title: 'Quit after day 3', days: 'KKKxxxxxxxxxxx', note: 'Kept days still come back. The rest goes to the keepers.', tone: 'var(--berry)' },
] as const

const money = (n: number) => `$${n.toFixed(2)}`

function Row({ label, value, color, last = false }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between py-2 ${last ? '' : 'border-b border-dashed border-[var(--line-soft)]'}`}>
      <dt className="font-semibold text-muted">{label}</dt>
      <dd className="display text-xl font-extrabold" style={color ? { color } : undefined}>{value}</dd>
    </div>
  )
}

/** Static explainer: three endings for the same goal, then what a group challenge pays. */
export function MoneyMath() {
  const bonus = EXAMPLE_POOL / EXAMPLE_KEEPERS
  return (
    <section id="math" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
        <SectionHead
          eyebrow="The math of showing up"
          title={<>What does one slip <span className="hl">actually cost</span>?</>}
          sub={`Same goal, three endings. You stake ${money(STAKE)} a day for ${DAYS} days, ${money(STAKE * DAYS)} in total.`}
        />
        <div className="grid gap-5 md:grid-cols-3">
          {SCENARIOS.map((s, i) => {
            const kept = [...s.days].filter((c) => c === 'K').length
            const back = kept * STAKE
            const pool = (DAYS - kept) * STAKE
            const perfect = kept === DAYS
            return (
              <Reveal key={s.title} delay={i * 0.08}>
                <article className="surface flex h-full flex-col p-5 sm:p-6">
                  <span className="tag w-fit" style={{ background: s.tone, color: '#1b1335' }}>{s.tag}</span>
                  <h3 className="mt-3 text-2xl font-extrabold leading-tight">{s.title}</h3>
                  <div className="mt-4 grid grid-cols-7 gap-1.5" role="img" aria-label={`${kept} of ${DAYS} days kept`}>
                    {[...s.days].map((c, d) => (
                      <span key={d} className={`tile ${c === 'K' ? 'tile-kept' : 'tile-missed'} !rounded-lg !border-[1.5px]`} style={c === 'K' ? { boxShadow: 'none' } : undefined}>
                        {c === 'K' ? <Flame size={22} flicker={false} /> : <Flame size={22} lit={false} cracked flicker={false} />}
                      </span>
                    ))}
                  </div>
                  <dl className="tnum mt-5 text-sm">
                    <Row label="You stake" value={money(STAKE * DAYS)} />
                    <Row label="You get back" value={money(back)} color="var(--mint)" />
                    <Row label="To the pool" value={money(pool)} color={pool ? 'var(--berry)' : 'var(--faint)'} />
                    <Row label="Pool bonus (example)" value={perfect ? `+${money(bonus)}` : money(0)} color={perfect ? 'var(--mint)' : 'var(--faint)'} last />
                  </dl>
                  <p className="pretty mt-auto pt-3 text-sm text-muted">{s.note}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-muted">
          Example only. The bonus assumes {EXAMPLE_KEEPERS} equal keepers share {money(EXAMPLE_POOL)} left by quitters. Real pools depend on who slips, and can be zero.
        </p>

        <Reveal className="mt-10">
          <article className="surface grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <span className="tag w-fit !bg-ember !text-[#1b1335]">Group challenge</span>
              <h3 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Six friends. Two fade. Four split the pot.</h3>
              <p className="pretty mt-3 text-muted">
                Everyone stakes {money(STAKE)} a day for {DAYS} days. Two friends fall off after day 4 and leave {money(EXAMPLE_POOL)} behind. The four who finish share it, so a perfect run returns more than it cost.
              </p>
            </div>
            <div>
              <div className="flex flex-wrap gap-2.5" role="img" aria-label="Six friends, four finished and two quit">
                {['A', 'M', 'J', 'K', 'S', 'R'].map((n, i) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <span className="display flex size-12 items-center justify-center rounded-full border border-line text-lg font-extrabold text-[#1b1335]" style={{ background: i < 4 ? 'var(--sun)' : 'var(--paper-2)', color: i < 4 ? '#1b1335' : 'var(--muted)' }}>{n}</span>
                    {i < 4 ? <Flame size={20} /> : <Flame size={20} lit={false} cracked flicker={false} />}
                  </div>
                ))}
              </div>
              <dl className="tnum mt-5 text-sm">
                <Row label="Each keeper's stake" value={money(STAKE * DAYS)} />
                <Row label="Left in the pot by quitters" value={money(EXAMPLE_POOL)} color="var(--berry)" />
                <Row label="Each keeper's bonus" value={`+${money(bonus)}`} color="var(--mint)" />
                <Row label="Each keeper gets" value={money(STAKE * DAYS + bonus)} last />
              </dl>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
