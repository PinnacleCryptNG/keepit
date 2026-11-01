import { ConnectKitButton } from 'connectkit'
import { motion } from 'framer-motion'
import { Loader2, Wallet } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { useState } from 'react'
import type { KeepApi } from '@/lib/types'
import { shortAddress, usd } from '@/lib/format'

export function Hero({ api }: { api: KeepApi }) {
  const [switching, setSwitching] = useState(false)
  const demo = api.mode === 'demo'
  const needsConnect = !demo && !api.connected

  return (
    <section className="space-y-4">
      <motion.h1
        className="display text-balance text-[2.1rem] font-bold leading-[1.05] sm:text-4xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Keep the streak.
        <br />
        <span
          style={{
            background: 'linear-gradient(90deg, var(--flame-1), var(--flame-2), var(--flame-3))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Keep your money.
        </span>
      </motion.h1>
      <p className="max-w-[34ch] text-pretty text-sm" style={{ color: 'var(--muted)' }}>
        Stake USDC on a daily habit. Check in every day and get it all back, plus a share of what quitters leave behind.
      </p>

      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            <TokenUSDC variant="branded" size={16} />
            {demo ? 'Demo wallet balance' : 'Your USDC on Arc mainnet'}
          </div>
          {needsConnect ? (
            <div className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Connect a wallet to stake real USDC on Arc mainnet. Unaudited: small amounts only (max $5/day).</div>
          ) : api.balance === undefined ? (
            <div className="skeleton mt-2 h-8 w-32" />
          ) : (
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="display text-3xl font-bold tabular-nums">{usd(api.balance)}</span>
              <span className="text-sm" style={{ color: 'var(--subtle)' }}>USDC</span>
            </div>
          )}
          {!demo && api.address && (
            <div className="mono mt-0.5 text-[11px]" style={{ color: 'var(--subtle)' }}>{shortAddress(api.address)}</div>
          )}
        </div>
        {needsConnect ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button className="btn btn-primary shrink-0" onClick={show}>
                <Wallet size={16} /> Connect
              </button>
            )}
          </ConnectKitButton.Custom>
        ) : api.wrongChain ? (
          <button
            className="btn btn-primary shrink-0"
            disabled={switching}
            onClick={() => {
              setSwitching(true)
              void api.switchToArc().finally(() => setSwitching(false))
            }}
          >
            {switching && <Loader2 size={16} className="animate-spin" />} Switch to Arc
          </button>
        ) : null}
      </div>
    </section>
  )
}
