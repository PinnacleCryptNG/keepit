import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Fade-and-rise when scrolled into view. Plays once. */
export function Reveal({ children, delay = 0, className = '', y = 24 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function SectionHead({ eyebrow, title, sub, align = 'center' }: { eyebrow: string; title: ReactNode; sub?: ReactNode; align?: 'center' | 'left' }) {
  return (
    <Reveal className={`mb-10 max-w-2xl sm:mb-14 ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="balance text-[clamp(2rem,5.5vw,3.6rem)] font-extrabold leading-[1.02]">{title}</h2>
      {sub && <p className="pretty mt-4 text-base text-muted sm:text-lg">{sub}</p>}
    </Reveal>
  )
}
