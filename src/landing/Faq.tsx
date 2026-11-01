import { Plus } from 'lucide-react'
import { Reveal, SectionHead } from '@/components/Reveal'
import { STATUS_LINE } from '@/lib/brand'

const FAQ: readonly (readonly [string, string])[] = [
  [
    'Is this real money?',
    `Yes. ${STATUS_LINE}. Your stake is real USDC, held by the contract until your goal ends, and the contract has not had an independent audit. Only stake what you are comfortable losing. The demo uses practice USDC and needs no wallet.`,
  ],
  ['What counts as a miss?', 'Each day runs from midnight to midnight in the time zone you create the goal in, and the check-in screen counts down to it. No check-in by then, and that day\'s stake moves to the pool. A check-in that breaks a rule, like one outside your window, fails and does not count.'],
  ['What if I miss just one day?', 'You lose that one day\'s stake to the pool and give up the pool bonus. Every day you did keep still comes home with you. One slip is a small fee, not a wipeout.'],
  ['When do I get paid?', 'The moment your goal ends. Claim, and your returned stake and any pool share arrive in a single transfer.'],
  ['Who holds my money?', 'A smart contract. It has no admin key, no pause switch and no way for anyone to move your stake. You can read every deposit and payout on the explorer.'],
  ['How are check-ins verified?', 'By the contract, at the moment you check in. You choose rules when you create a goal: a daily time window (say 5 to 7 AM) and a minimum USDC balance your wallet must hold. A check-in that breaks either rule fails. Nobody, including us, can override that.'],
  ['What can\'t it verify?', 'What you did in real life. A window proves your wallet signed a transaction at 6 AM, not that you were awake, and a balance rule can be met with borrowed money for a moment. So pick rules you would not want to fake. A goal with no rules is honor-system and is labelled that way.'],
  ['Is this gambling?', 'KeepIt is a commitment device. You stake your own money on your own behavior, not on chance, and there is no house. Rules differ by country, though, and you are responsible for using KeepIt only where it is legal for you. See the terms for details.'],
  ['Why Arc?', 'USDC is the native gas token on Arc, with predictable fees and sub-second finality. That makes a one-dollar-a-day habit practical and keeps everything in one dollar balance.'],
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 pb-20 sm:px-8 sm:pb-28">
      <SectionHead eyebrow="Questions" title={<>The fine print, <span className="hl">in plain words</span>.</>} />
      <div className="space-y-3">
        {FAQ.map(([q, a], i) => (
          <Reveal key={q} delay={i * 0.03} y={14}>
            <details className="surface-flat group overflow-hidden transition-colors open:bg-card-2">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-sun text-[#1b1335] transition-transform duration-200 group-open:rotate-45">
                  <Plus size={16} strokeWidth={3} />
                </span>
              </summary>
              <p className="pretty px-5 pb-5 text-muted">{a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
