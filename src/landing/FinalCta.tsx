import { ArrowRight } from 'lucide-react'
import { Flame } from '@/brand/Flame'
import { AppLink } from '@/components/AppLink'
import { Reveal } from '@/components/Reveal'

export function FinalCta({ onDemo, onStart }: { onDemo: () => void; onStart: () => void }) {
  return (
    <section className="mx-auto max-w-[1360px] px-4 pb-20 sm:px-8 sm:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-5xl border border-line p-8 text-center shadow-pop-lg sm:p-14" style={{ background: '#1b1335', color: '#fff4e2' }}>
          <div className="glow-ember pointer-events-none absolute left-1/2 top-0 size-[28rem] -translate-x-1/2 -translate-y-1/3 opacity-70" aria-hidden="true" />
          <div className="relative mx-auto mb-4 w-fit"><Flame size={84} check /></div>
          <h2 className="balance relative mx-auto max-w-2xl text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[1]">
            Your streak is worth money. <span className="text-fire">Start today.</span>
          </h2>
          <p className="pretty relative mx-auto mt-4 max-w-xl text-lg opacity-80">
            Pick a habit, bring a friend and put a few dollars on it. The demo takes ten seconds and needs no wallet.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <AppLink href="?app=keeps&demo=1" onGo={onDemo} className="btn btn-ember btn-lg">Try the demo <ArrowRight size={20} /></AppLink>
            <AppLink href="?app=start&live=1" onGo={onStart} className="btn btn-lg">Start a challenge</AppLink>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
