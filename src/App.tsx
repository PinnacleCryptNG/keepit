import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, FastForward, Flame, Plus, RotateCcw, Trophy, Wallet } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { buildAddressExplorerUrl } from '@/onchain-facts'
import { CHAIN_ID, KEEPIT_ADDRESS } from '@/lib/keepit'
import { analyze } from '@/lib/types'
import { useDemoEngine } from '@/hooks/useDemoEngine'
import { useLiveEngine } from '@/hooks/useLiveEngine'
import { useMode } from '@/hooks/useMode'
import { CreateKeep } from '@/components/CreateKeep'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { JoinSheet } from '@/components/JoinSheet'
import { KeepCard } from '@/components/KeepCard'
import { KeepDetail } from '@/components/KeepDetail'
import { Wall } from '@/components/Wall'

type Tab = 'keeps' | 'start' | 'wall'

function readJoinId(): bigint | null {
  const p = new URLSearchParams(window.location.search).get('join')
  return p && /^\d{1,18}$/.test(p) ? BigInt(p) : null
}

export default function App() {
  const { mode, setMode } = useMode()
  const live = useLiveEngine(mode === 'live')
  const demo = useDemoEngine()
  const api = mode === 'live' ? live : demo

  const [tab, setTab] = useState<Tab>('keeps')
  const [openId, setOpenId] = useState<bigint | null>(null)
  const [joinId, setJoinId] = useState<bigint | null>(readJoinId)

  const openKeep = openId !== null ? api.myKeeps.find((k) => k.id === openId) : undefined
  const claimable = api.myKeeps.filter((k) => analyze(k, api.today).ended && !k.claimed).length

  const closeJoin = () => {
    setJoinId(null)
    window.history.replaceState(null, '', window.location.pathname)
  }
  const go = (t: Tab) => {
    setTab(t)
    setOpenId(null)
  }

  const tabs: { id: Tab; label: string; icon: typeof Flame }[] = [
    { id: 'keeps', label: 'My keeps', icon: Flame },
    { id: 'start', label: 'Start', icon: Plus },
    { id: 'wall', label: 'Wall', icon: Trophy },
  ]

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div style={{ position: 'absolute', top: '4%', left: '-8%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,176,32,0.28) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '6%', right: '-6%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.22) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-24">
        <Header mode={mode} onMode={setMode} />
        <Hero api={api} />

        {api.demo && (
          <div className="card mt-4 space-y-2 p-4">
            <div className="text-sm">
              <b>Demo mode.</b> <span style={{ color: 'var(--muted)' }}>Seeded goals and practice USDC. Nothing touches the chain.</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1 !min-h-[44px] text-xs" onClick={api.demo.advanceDay}>
                <FastForward size={16} /> Skip a day{api.demo.daysSkipped > 0 ? ` (+${api.demo.daysSkipped})` : ''}
              </button>
              <button className="btn btn-ghost !min-h-[44px] text-xs" onClick={api.demo.reset}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>Skip a day to watch unchecked goals crack, then sweep missed days into the pool from the Wall.</p>
          </div>
        )}

        <nav className="pill sticky top-2 z-20 mt-5 grid grid-cols-3 gap-1 p-1" aria-label="Sections" style={{ backdropFilter: 'blur(18px)' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => go(id)}
              className="relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors"
              style={tab === id ? { background: 'var(--accent)', color: 'var(--accent-ink)' } : { color: 'var(--muted)' }}
            >
              <Icon size={16} /> {label}
              {id === 'keeps' && claimable > 0 && (
                <span className="absolute right-2 top-1.5 size-2.5 rounded-full" style={{ background: 'var(--flame-2)' }} aria-label={`${claimable} ready to claim`} />
              )}
            </button>
          ))}
        </nav>

        <main className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${tab}-${openId ?? ''}-${mode}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {tab === 'keeps' && openKeep && <KeepDetail api={api} keep={openKeep} onBack={() => setOpenId(null)} />}
              {tab === 'keeps' && !openKeep && (
                <div className="space-y-3">
                  {mode === 'live' && !api.connected ? (
                    <div className="card space-y-3 p-6 text-center">
                      <Wallet className="mx-auto" size={28} />
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>Connect your wallet to see your keeps on Arc Testnet.</p>
                      <ConnectKitButton.Custom>
                        {({ show }) => <button className="btn btn-primary" onClick={show}>Connect wallet</button>}
                      </ConnectKitButton.Custom>
                    </div>
                  ) : api.loading && api.myKeeps.length === 0 ? (
                    <>
                      <div className="skeleton h-32" />
                      <div className="skeleton h-32" />
                    </>
                  ) : api.myKeeps.length === 0 ? (
                    <div className="card space-y-3 p-6 text-center">
                      <Flame className="mx-auto" size={32} style={{ color: 'var(--flame-2)' }} />
                      <h2 className="display text-xl font-bold">No keeps yet</h2>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>Stake a little USDC on a daily habit and keep the streak alive.</p>
                      <button className="btn btn-flame" onClick={() => go('start')}>Start your first keep</button>
                    </div>
                  ) : (
                    api.myKeeps.map((k, i) => <KeepCard key={k.id.toString()} keep={k} today={api.today} index={i} onOpen={() => setOpenId(k.id)} />)
                  )}
                </div>
              )}
              {tab === 'start' && <CreateKeep api={api} onCreated={() => go('keeps')} />}
              {tab === 'wall' && <Wall api={api} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-8 space-y-1 text-center text-xs" style={{ color: 'var(--subtle)' }}>
          <p>Arc Testnet · USDC only · no real money</p>
          <a href={buildAddressExplorerUrl(CHAIN_ID, KEEPIT_ADDRESS)} target="_blank" rel="noreferrer" className="mono inline-flex items-center gap-1" style={{ color: 'var(--link)' }}>
            KeepIt contract {KEEPIT_ADDRESS.slice(0, 8)}...{KEEPIT_ADDRESS.slice(-6)} <ExternalLink size={11} />
          </a>
        </footer>
      </div>

      <JoinSheet api={api} parentId={joinId} onClose={closeJoin} onJoined={() => { closeJoin(); go('keeps') }} />
    </div>
  )
}
