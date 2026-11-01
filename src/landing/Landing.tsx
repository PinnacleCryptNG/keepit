import type { KeepApi } from '@/lib/types'
import { Faq } from './Faq'
import { Features } from './Features'
import { FinalCta } from './FinalCta'
import { Footer } from './Footer'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { MoneyMath } from './MoneyMath'
import { Nav } from './Nav'
import { WallPreview } from './WallPreview'
import { WhyOnchain } from './WhyOnchain'

interface Props {
  demo: KeepApi
  onDemo: () => void
  onStart: () => void
  onWall: () => void
  onDocs: () => void
}

export function Landing({ demo, onDemo, onStart, onWall, onDocs }: Props) {
  return (
    <div className="relative z-[1]">
      <Nav onLaunch={onDemo} />
      <main>
        <Hero onDemo={onDemo} onStart={onStart} />
        <WhyOnchain />
        <HowItWorks />
        <MoneyMath />
        <WallPreview demo={demo} onOpen={onWall} />
        <Features onDocs={onDocs} />
        <Faq />
        <FinalCta onDemo={onDemo} onStart={onStart} />
      </main>
      <Footer onLaunch={onDemo} onDocs={onDocs} />
    </div>
  )
}
