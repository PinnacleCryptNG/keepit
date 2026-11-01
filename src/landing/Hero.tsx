import { motion } from 'framer-motion'
import { ArrowRight, Banknote, ShieldCheck, Users } from 'lucide-react'
import { Squiggle } from '@/brand/art'
import { AppLink } from '@/components/AppLink'
import { STATUS_LINE } from '@/lib/brand'
import { PlayableCard } from './PlayableCard'

interface Props {
  onDemo: () => void
  onStart: () => void
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: 0.08 * i, ease: [0.2, 0.8, 0.2, 1] as const },
})

const FACTS = [
  [ShieldCheck, 'The contract checks the rules, not a friend'],
  [Users, 'Invite friends with one link'],
  [Banknote, 'Paid in USDC the moment you finish'],
] as const

export function Hero({ onDemo, onStart }: Props) {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
      <div className="dots pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" aria-hidden="true" />
      <div className="glow-ember pointer-events-none absolute -left-40 top-10 size-[34rem] opacity-30" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1360px] items-center gap-14 px-4 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <motion.h1 {...rise(0)} className="text-[clamp(2.7rem,10.5vw,5.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em] lg:text-[clamp(3.4rem,5.4vw,5.6rem)]">
            Keep the streak.
            <br />
            <span className="relative inline-block">
              <span className="text-fire">Keep your money.</span>
              <Squiggle className="absolute -bottom-2 left-0 h-3 w-full sm:-bottom-3 sm:h-4" />
            </span>
          </motion.h1>

          <motion.p {...rise(1)} className="pretty mt-8 max-w-xl text-lg text-ink-2 sm:text-xl">
            Challenge your friends to a habit the contract can check by itself, like checking in before 7 AM or keeping $50 in your wallet. Everyone who keeps going <b>splits what the quitters leave behind</b>.
          </motion.p>

          <motion.div {...rise(2)} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <AppLink href="?app=keeps&demo=1" onGo={onDemo} className="btn btn-ember btn-lg">
              Try the demo <ArrowRight size={20} />
            </AppLink>
            <AppLink href="?app=start&live=1" onGo={onStart} className="btn btn-lg">
              Start a challenge
            </AppLink>
          </motion.div>
          <motion.p {...rise(3)} className="mt-3 text-sm font-medium text-muted">
            {STATUS_LINE}. The demo needs no wallet.
          </motion.p>

          <motion.ul {...rise(4)} className="mt-9 grid gap-3 text-sm font-semibold text-ink-2 sm:grid-cols-3">
            {FACTS.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-card"><Icon size={14} /></span>
                <span className="pretty">{text}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        <PlayableCard />
      </div>
    </section>
  )
}
