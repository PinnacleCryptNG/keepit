import { ConnectKitButton } from 'connectkit'
import { Moon, Sun } from 'lucide-react'
import type { Mode } from '@/lib/types'
import { useTheme } from '@/hooks/useTheme'
import { FlameIcon } from './FlameIcon'

interface Props {
  mode: Mode
  onMode: (m: Mode) => void
}

export function Header({ mode, onMode }: Props) {
  const { theme, toggle } = useTheme()
  return (
    <header className="flex items-center justify-between gap-2 py-4">
      <div className="flex items-center gap-2">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{ background: 'var(--flame-soft)' }}
        >
          <FlameIcon size={26} />
        </div>
        <span className="display hidden text-2xl font-bold min-[420px]:inline">KeepIt</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="pill flex p-0.5" role="group" aria-label="Data mode">
          {(['demo', 'live'] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => onMode(m)}
              className="min-h-[36px] rounded-full px-3 text-xs font-semibold capitalize transition-colors"
              style={mode === m ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--muted)' }}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          className="pill flex size-11 items-center justify-center"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <ConnectKitButton.Custom>
          {({ isConnected, show, truncatedAddress }) => (
            <button className="btn btn-primary !min-h-[44px] !px-3 text-xs" onClick={show}>
              {isConnected ? truncatedAddress : 'Connect'}
            </button>
          )}
        </ConnectKitButton.Custom>
      </div>
    </header>
  )
}
