import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Coin, CoinStack } from '@/brand/art'
import { Embers, Flame } from '@/brand/Flame'
import { Reveal, SectionHead } from '@/components/Reveal'

function StakeArt() {
  return (
    <div className="relative flex h-44 items-end justify-center overflow-hidden rounded-2xl border border-line bg-paper-2 pb-4">
      <div className="dots absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative">
        <CoinStack count={5} size={50} />
      </div>
      <span className="tag absolute left-3 top-3">Escrow</span>
      <Coin size={30} className="float absolute right-6 top-5" style={{ ['--r' as string]: '10deg' }} />
    </div>
  )
}

function CheckArt() {
  return (
    <div className="relative flex h-44 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-line bg-paper-2">
      <div className="dots absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative grid grid-cols-7 gap-1.5 px-4">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            className={`tile ${i < 4 ? 'tile-kept' : i === 4 ? 'tile-today' : 'tile-future'} !w-8 sm:!w-9 !rounded-lg`}
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i, type: 'spring', stiffness: 360, damping: 18 }}
          >
            {i < 4 && <Flame size={18} flicker={false} />}
          </motion.div>
        ))}
      </div>
      <div className="relative inline-flex items-center gap-2 rounded-2xl border border-line bg-ember px-4 py-2 font-bold text-[#1b1335] shadow-pop-sm">
        <Check size={18} strokeWidth={3.5} /> I kept it today
      </div>
    </div>
  )
}

function CashArt() {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-line bg-paper-2">
      <div className="dots absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative">
        <Embers count={6} />
        <Flame size={96} check />
      </div>
      <div className="absolute right-4 top-4 rotate-6 rounded-xl border border-line bg-mint px-3 py-1.5 font-extrabold text-[#06251a] shadow-pop-sm display tnum" style={{ background: 'var(--mint)' }}>
        +$10.00
      </div>
    </div>
  )
}

const STEPS = [
  { n: 1, title: 'Start a challenge', copy: 'Name the habit and set its rules: a daily check-in window, a minimum wallet balance, or both. Pick 7, 14 or 30 days and a daily stake, then send the link to friends.', art: <StakeArt /> },
  { n: 2, title: 'Check in every day', copy: 'One tap a day. The contract checks your rules at that moment, and a check-in that breaks one simply fails. A flame for every day you keep, a crack for every day you miss.', art: <CheckArt /> },
  { n: 3, title: 'Split the pot', copy: 'Finish with a perfect record and claim your stake plus your share of what the quitters left. Miss a day and the kept days still come home.', art: <CashArt /> },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8 sm:py-28">
      <SectionHead eyebrow="How it works" title={<>From <span className="hl">good intentions</span> to money back.</>} sub="Nobody has to chase anybody. The contract keeps count, and it never forgets." />
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <li className="surface group h-full list-none p-5 transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[-0.6deg] sm:p-6">
              {s.art}
              <div className="mt-5 flex items-center gap-3">
                <span className="display flex size-10 items-center justify-center rounded-full border border-line bg-sun text-lg font-extrabold text-[#1b1335]">{s.n}</span>
                <h3 className="text-2xl font-extrabold leading-tight">{s.title}</h3>
              </div>
              <p className="pretty mt-3 text-muted">{s.copy}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
