import { Banknote, Lock, Vault } from 'lucide-react'
import { Reveal, SectionHead } from '@/components/Reveal'

const POINTS = [
  { Icon: Vault, title: 'No company holds the pot', copy: 'In most habit-bet apps the forfeited money sits in a company account. Here it sits in a smart contract, and the only way out is the rules.' },
  { Icon: Lock, title: 'Rules nobody can change', copy: 'There is no admin key and no pause button. Not even we can move a stake, edit a payout or decide a result after the fact.' },
  { Icon: Banknote, title: 'Paid in USDC, anywhere', copy: 'Claim the moment your goal ends, from any country, in dollars. No bank, no payout threshold, no waiting for approval.' },
] as const

/** The "why onchain" answer, placed right under the hero. */
export function WhyOnchain() {
  return (
    <section id="why" className="border-y border-line bg-paper-2 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <SectionHead eyebrow="Why onchain" title={<>The pot has <span className="hl">no owner</span>.</>} sub="Habit bets are an old idea. What's new is that nobody has to be trusted to hold the money or call the result." />
        <div className="grid gap-5 md:grid-cols-3">
          {POINTS.map(({ Icon, title, copy }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <article className="surface h-full p-6">
                <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sun text-[#1b1335]"><Icon size={22} /></span>
                <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
                <p className="pretty mt-2 text-muted">{copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
