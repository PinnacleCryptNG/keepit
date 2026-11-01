import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, SkipForward } from 'lucide-react'
import { Embers, Flame } from '@/brand/Flame'
import { fireConfetti } from '@/lib/confetti'
import { useCountUp } from '@/hooks/useCountUp'

type Day = 'kept' | 'missed' | 'open'
const DAYS = 7
const STAKE = 1
const START: Day[] = ['kept', 'kept', 'kept', ...Array<Day>(DAYS - 3).fill('open')]

/** A tiny sandbox on the landing page. Nothing here touches a wallet. */
export function PlayableCard() {
  const [days, setDays] = useState<Day[]>(START)
  const btn = useRef<HTMLButtonElement>(null)

  const next = days.indexOf('open')
  const finished = next === -1
  const kept = days.filter((d) => d === 'kept').length
  const missed = days.filter((d) => d === 'missed').length
  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] === 'kept') streak++
    else if (days[i] === 'missed') break
  }
  const safe = useCountUp((DAYS - missed) * STAKE)
  const lost = missed * STAKE

  const play = (result: Day) => {
    if (finished) return
    setDays((d) => d.map((x, i) => (i === next ? result : x)))
    if (result === 'kept') {
      const r = btn.current?.getBoundingClientRect()
      fireConfetti(r ? { x: r.left + r.width / 2, y: r.top } : undefined, next === DAYS - 1 && missed === 0 ? 200 : 60)
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[26rem]">
      <div className="glow-ember pointer-events-none absolute -inset-10 -z-10 opacity-70" aria-hidden="true" />
      <motion.div
        className="surface relative overflow-hidden p-5 sm:p-6"
        style={{ rotate: -1.5 }}
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-line bg-sun text-2xl shadow-pop-sm" aria-hidden="true">🌅</div>
          <div className="min-w-0 flex-1">
            <div className="display text-xl font-extrabold leading-tight">Early bird</div>
            <div className="text-sm text-muted tnum">{finished ? 'Goal complete' : `Day ${next + 1} of ${DAYS}`} · $1.00/day</div>
          </div>
          <span className="tag !bg-sun !px-3 !py-1.5 !text-[0.8rem] !text-[#1b1335]">Try it</span>
        </div>

        <div className="relative my-4 flex items-end justify-center gap-3 py-2">
          <div className="relative">
            <Embers count={6} />
            <Flame size={92} lit={streak > 0} />
          </div>
          <div className="pb-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={streak}
                className="display text-7xl font-extrabold leading-none tnum"
                initial={{ y: 30, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              >
                {streak}
              </motion.div>
            </AnimatePresence>
            <div className="eyebrow !text-[0.68rem]">day streak</div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="Example week">
          {days.map((d, i) => {
            const state = d === 'kept' ? 'kept' : d === 'missed' ? 'missed' : i === next ? 'today' : 'future'
            return (
              <div key={i} role="listitem" aria-label={`Day ${i + 1}: ${state}`} className={`tile tile-${state} ${d !== 'open' ? 'pop-in' : ''}`}>
                {d === 'kept' && <Flame size={22} flicker={false} />}
                {d === 'missed' && <Flame size={22} lit={false} cracked className="crack-in" />}
                {d === 'open' && <span>{i + 1}</span>}
              </div>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="hairline p-3">
            <div className="eyebrow !text-[0.66rem]">Money safe</div>
            <div className="display text-2xl font-extrabold tnum" style={{ color: 'var(--mint)' }}>${safe.toFixed(2)}</div>
          </div>
          <div className="hairline p-3">
            <div className="eyebrow !text-[0.66rem]">To the pool</div>
            <motion.div key={lost} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="display text-2xl font-extrabold tnum" style={{ color: lost ? 'var(--berry)' : 'var(--faint)' }}>
              ${lost.toFixed(2)}
            </motion.div>
          </div>
        </div>

        <div className="mt-4">
          {finished ? (
            <div className="space-y-3 text-center">
              <p className="display text-xl font-extrabold">
                {missed === 0 ? `Perfect week. $${(kept * STAKE).toFixed(2)} back, plus a pool share.` : `$${(kept * STAKE).toFixed(2)} back. $${lost.toFixed(2)} went to the keepers.`}
              </p>
              <button className="btn btn-sun w-full" onClick={() => setDays(START)}>
                <RotateCcw size={16} /> Play again
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <motion.button ref={btn} whileTap={{ scale: 0.97 }} className="btn btn-ember btn-lg min-w-0 flex-1" onClick={() => play('kept')}>
                <Check size={22} strokeWidth={3.5} /> I kept it today
              </motion.button>
              <button className="btn btn-lg !px-4" onClick={() => play('missed')} aria-label="Skip this day and see what happens" title="Skip a day">
                <SkipForward size={20} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <p className="mt-4 text-center text-sm text-muted">Go on, tap it. Then try skipping a day.</p>
    </div>
  )
}
