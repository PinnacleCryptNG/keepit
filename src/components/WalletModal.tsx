import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Globe, Loader2, LogOut, QrCode, Wallet, X } from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import type { Connector } from 'wagmi'
import { WALLETCONNECT_PROJECT_ID } from '@/config'
import { STATUS_LINE } from '@/lib/brand'
import { shortAddress } from '@/lib/format'
import { useWalletModal } from '@/lib/walletModal'

const isRejected = (e: unknown) => /reject|denied|cancel/i.test(e instanceof Error ? e.message : '')

function WalletIcon({ connector }: { connector: Connector }) {
  if (connector.icon) return <img src={connector.icon} alt="" className="size-10 rounded-xl" />
  const Icon = connector.id === 'walletConnect' ? QrCode : connector.id === 'injected' ? Globe : Wallet
  return (
    <span className="flex size-10 items-center justify-center rounded-xl border border-line bg-sun text-[#1b1335]">
      <Icon size={20} />
    </span>
  )
}

/** Wallet picker. Lists every wallet the browser announces, so Rabby, MetaMask and friends show up by name. */
export function WalletModal() {
  const { isOpen, close } = useWalletModal()
  const { address, isConnected, connector: active } = useAccount()
  const { connectors, connectAsync } = useConnect()
  const { disconnect } = useDisconnect()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  const announced = connectors.filter((c) => c.id !== 'injected' && c.id !== 'walletConnect')
  const generic = connectors.find((c) => c.id === 'injected')
  const wc = connectors.find((c) => c.id === 'walletConnect')
  const hasProvider = typeof window !== 'undefined' && 'ethereum' in window

  const connect = async (c: Connector) => {
    setError(null)
    setPending(c.uid)
    try {
      await connectAsync({ connector: c })
      close()
    } catch (e) {
      if (!isRejected(e)) {
        const msg = e instanceof Error ? (e as Error & { shortMessage?: string }).shortMessage ?? e.message : 'Could not connect.'
        setError(msg.length > 160 ? `${msg.slice(0, 160)}...` : msg)
      }
    } finally {
      setPending(null)
    }
  }

  const row = (c: Connector, label: string, hint?: string) => (
    <li key={c.uid}>
      <button
        className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left shadow-pop-sm transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-60"
        disabled={pending !== null}
        onClick={() => void connect(c)}
      >
        <WalletIcon connector={c} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-extrabold">{label}</span>
          {hint && <span className="block truncate text-xs font-semibold text-muted">{hint}</span>}
        </span>
        {pending === c.uid ? <Loader2 size={18} className="animate-spin" /> : announced.includes(c) && <span className="tag !bg-mint !text-[#06251a]">Detected</span>}
      </button>
    </li>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--ink) 45%, transparent)' }} />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={isConnected ? 'Wallet' : 'Connect a wallet'}
            className="surface relative max-h-[92dvh] w-full max-w-md overflow-y-auto !rounded-b-none sm:!rounded-b-[1.75rem]"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn btn-icon btn-sm absolute right-3 top-3" onClick={close} aria-label="Close"><X size={18} /></button>
            <div className="space-y-4 p-6 pb-8">
              {isConnected && address ? (
                <>
                  <h2 className="text-3xl font-extrabold">Wallet connected</h2>
                  <div className="well space-y-1 p-4">
                    <div className="eyebrow">{active?.name ?? 'Wallet'}</div>
                    <div className="mono break-all text-sm font-medium">{address}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn flex-1"
                      onClick={() => {
                        void navigator.clipboard.writeText(address).then(() => {
                          setCopied(true)
                          setTimeout(() => setCopied(false), 1600)
                        })
                      }}
                    >
                      {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : shortAddress(address)}
                    </button>
                    <button className="btn btn-ink flex-1" onClick={() => { disconnect(); close() }}>
                      <LogOut size={17} /> Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-3xl font-extrabold">Connect a wallet</h2>
                    <p className="mt-1 text-sm text-muted">Pick the wallet you want to stake from. {STATUS_LINE}.</p>
                  </div>

                  <ul className="space-y-2.5">
                    {announced.map((c) => row(c, c.name, 'Installed in this browser'))}
                    {generic && row(generic, announced.length ? 'Other browser wallet' : 'Browser wallet', hasProvider ? 'Uses the wallet this browser injects' : 'No wallet found in this browser')}
                    {wc && row(wc, 'WalletConnect', 'Phone wallets and QR code')}
                  </ul>

                  {error && <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--berry)' }}>{error}</p>}

                  {announced.length === 0 && (
                    <div className="well space-y-2 p-4 text-sm text-muted">
                      <p className="font-bold text-ink">No wallet announced itself in this browser.</p>
                      <p>Make sure your wallet extension is enabled for this site and reload. On a phone, open KeepIt from inside your wallet's own browser, or {WALLETCONNECT_PROJECT_ID ? 'use WalletConnect above' : 'enable WalletConnect (see the README)'}.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
