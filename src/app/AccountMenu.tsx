import { useEffect, useRef, useState } from 'react'
import { useDisconnect } from 'wagmi'
import { TokenUSDC } from '@web3icons/react'
import { ChevronDown, Loader2, LogOut, Moon, Sun, Wallet } from 'lucide-react'
import { NETWORK_NAME } from '@/lib/brand'
import { shortAddress, usd } from '@/lib/format'
import type { KeepApi, Mode } from '@/lib/types'
import { useWalletModal } from '@/lib/walletModal'
import { useTheme } from '@/hooks/useTheme'

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex rounded-xl bg-[var(--paper-2)] p-1" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className="min-h-[36px] flex-1 rounded-lg px-3 text-sm font-bold transition-colors"
          style={value === v ? { background: 'var(--card)', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' } : { color: 'var(--muted)' }}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

interface Props {
  api: KeepApi
  mode: Mode
  onMode: (m: Mode) => void
  onHome: () => void
}

/** Everything that is not the habit lives here: balance, wallet, demo or live, theme. */
export function AccountMenu({ api, mode, onMode, onHome }: Props) {
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggle } = useTheme()
  const { open: openWallet } = useWalletModal()
  const { disconnect } = useDisconnect()
  const demo = mode === 'demo'
  const needsConnect = !demo && !api.connected

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button className="btn btn-sm !min-h-[42px] gap-2 !pl-2.5 !pr-3" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        {needsConnect ? (
          <><Wallet size={16} /> Connect</>
        ) : (
          <>
            <TokenUSDC variant="branded" size={20} />
            <span className="tnum">{api.balance === undefined ? '...' : usd(api.balance)}</span>
            {demo && <span className="tag !px-2 !py-0.5 !text-[0.68rem]">Demo</span>}
          </>
        )}
        <ChevronDown size={14} className="text-faint" />
      </button>

      {open && (
        <div role="menu" className="surface absolute right-0 top-[calc(100%+8px)] z-40 w-[min(20rem,calc(100vw-2rem))] space-y-4 p-4 shadow-pop-lg">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted">
              <TokenUSDC variant="branded" size={15} /> {demo ? 'Demo wallet (practice USDC)' : `USDC on ${NETWORK_NAME}`}
            </div>
            {needsConnect ? (
              <button className="btn btn-ink mt-2 w-full" onClick={() => { setOpen(false); openWallet() }}><Wallet size={16} /> Connect wallet</button>
            ) : (
              <>
                <div className="display mt-1 text-3xl font-extrabold tnum">{api.balance === undefined ? '...' : usd(api.balance)}</div>
                {!demo && api.address && <div className="mono mt-0.5 text-[11px] text-faint">{shortAddress(api.address)}</div>}
              </>
            )}
            {api.wrongChain && (
              <button
                className="btn btn-sun btn-sm mt-3 w-full"
                disabled={switching}
                onClick={() => {
                  setSwitching(true)
                  void api.switchToArc().finally(() => setSwitching(false))
                }}
              >
                {switching && <Loader2 size={15} className="animate-spin" />} Switch to {NETWORK_NAME}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="eyebrow">Data</div>
            <Segmented value={mode} onChange={onMode} label="Demo or live" options={[['demo', 'Demo'], ['live', 'Live']] as const} />
            <p className="text-xs text-muted">{demo ? 'Sample goals and practice USDC. Nothing touches the chain.' : `Real goals on ${NETWORK_NAME}.`}</p>
          </div>

          <div className="space-y-1.5">
            <div className="eyebrow">Theme</div>
            <button className="btn btn-sm w-full justify-between" onClick={toggle}>
              {theme === 'dark' ? 'Dark' : 'Light'} {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>

          <div className="flex gap-2 border-t border-[var(--line-soft)] pt-3">
            <button className="btn btn-sm flex-1" onClick={() => { setOpen(false); onHome() }}>Website</button>
            {!demo && api.connected && (
              <button className="btn btn-sm flex-1" onClick={() => { disconnect(); setOpen(false) }}><LogOut size={14} /> Disconnect</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
