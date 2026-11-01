import { Flame as FlameGlyph, Plus, Trophy } from 'lucide-react'
import { Logo } from '@/brand/Logo'
import type { KeepApi, Mode } from '@/lib/types'
import { STATUS_LINE } from '@/lib/brand'
import type { Tab } from '@/hooks/useRoute'
import { AccountMenu } from './AccountMenu'
import { Rail } from './Rail'

const NAV = [
  { tab: 'keeps' as const, label: 'Today', Icon: FlameGlyph },
  { tab: 'start' as const, label: 'New keep', Icon: Plus },
  { tab: 'wall' as const, label: 'Wall', Icon: Trophy },
]

interface Props {
  api: KeepApi
  mode: Mode
  tab: Tab
  badge: number
  onTab: (t: Tab) => void
  onMode: (m: Mode) => void
  onHome: () => void
  onOpen: (id: bigint) => void
  children: React.ReactNode
}

/** A single calm column. Top bar for identity and account, tab bar at the thumb on phones. */
export function AppShell({ api, mode, tab, badge, onTab, onMode, onHome, onOpen, children }: Props) {
  return (
    <div className="relative z-10 min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-3 px-4 sm:px-6">
          <button onClick={onHome} aria-label="KeepIt website" className="shrink-0 rounded-xl">
            <span className="sm:hidden"><Logo size={34} hideWordmark /></span>
            <span className="hidden sm:inline"><Logo size={34} /></span>
          </button>

          <nav className="ml-4 hidden gap-1 sm:flex" aria-label="Sections">
            {NAV.map(({ tab: t, label }) => (
              <button
                key={t}
                onClick={() => onTab(t)}
                aria-current={tab === t ? 'page' : undefined}
                className="relative rounded-xl px-3.5 py-2 text-[15px] font-bold transition-colors"
                style={tab === t ? { background: 'var(--paper-2)', color: 'var(--ink)' } : { color: 'var(--muted)' }}
              >
                {label}
                {t === 'keeps' && badge > 0 && <span className="ml-1.5 rounded-full bg-[var(--ember)] px-1.5 py-0.5 text-[0.68rem] font-extrabold text-[#1b1335]">{badge}</span>}
              </button>
            ))}
          </nav>

          <div className="ml-auto">
            <AccountMenu api={api} mode={mode} onMode={onMode} onHome={onHome} />
          </div>
        </div>
      </header>

      {mode === 'live' && <p className="border-b border-[var(--line-soft)] bg-[var(--paper-2)] px-4 py-2 text-center text-xs font-semibold text-muted">{STATUS_LINE}</p>}

      <main className="mx-auto grid max-w-[1120px] gap-10 px-4 pb-32 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">{children}</div>
        <Rail api={api} tab={tab} onOpen={onOpen} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden" aria-label="Sections">
        <div className="mx-auto grid max-w-md grid-cols-3 px-3 pt-1.5">
          {NAV.map(({ tab: t, label, Icon }) => {
            const active = tab === t
            const center = t === 'start'
            return (
              <button key={t} onClick={() => onTab(t)} aria-current={active ? 'page' : undefined} className="relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[0.7rem] font-bold" style={{ color: active ? 'var(--ink)' : 'var(--faint)' }}>
                {center ? (
                  <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-b from-[#ff7f3a] to-[var(--ember)] text-[#1b1335] shadow-[0_8px_18px_-8px_var(--glow)]"><Icon size={22} strokeWidth={2.8} /></span>
                ) : (
                  <Icon size={22} strokeWidth={active ? 2.6 : 2} />
                )}
                {!center && label}
                {t === 'keeps' && badge > 0 && <span className="absolute right-[calc(50%-22px)] top-2 size-2.5 rounded-full bg-[var(--ember)]" />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
