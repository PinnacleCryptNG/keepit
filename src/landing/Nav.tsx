import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { Logo } from '@/brand/Logo'
import { AppLink } from '@/components/AppLink'
import { useTheme } from '@/hooks/useTheme'

const LINKS = [
  ['How it works', '#how'],
  ['The math', '#math'],
  ['Wall of Keepers', '#wall'],
  ['FAQ', '#faq'],
] as const

export function Nav({ onLaunch, onHome }: { onLaunch: () => void; onHome?: () => void }) {
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-all"
      style={{
        background: scrolled || open ? 'color-mix(in srgb, var(--paper) 86%, transparent)' : 'transparent',
        backdropFilter: scrolled || open ? 'blur(14px)' : undefined,
        borderBottom: scrolled || open ? '2px solid var(--line-soft)' : '2px solid transparent',
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-[1360px] items-center justify-between px-4 sm:px-8">
        {onHome ? (
          <AppLink href="?" onGo={onHome} aria-label="KeepIt home" className="rounded-xl"><Logo size={38} /></AppLink>
        ) : (
          <a href="#top" aria-label="KeepIt home" className="rounded-xl"><Logo size={38} /></a>
        )}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="rounded-xl px-3.5 py-2 text-[0.95rem] font-semibold text-ink-2 transition-colors hover:bg-card">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button className="btn btn-icon" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <AppLink href="?app=keeps&demo=1" onGo={onLaunch} className="btn btn-ember btn-sm !hidden sm:!inline-flex">
            Open the app
          </AppLink>
          <button className="btn btn-icon md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            className="overflow-hidden md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="mx-auto flex max-w-[1360px] flex-col gap-1 px-4 pb-5 pt-1">
              {LINKS.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-lg font-bold hover:bg-card">
                  {label}
                </a>
              ))}
              <AppLink href="?app=keeps&demo=1" onGo={onLaunch} className="btn btn-ember btn-lg mt-2 w-full">Open the app</AppLink>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
