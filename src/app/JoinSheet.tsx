import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useWalletModal } from '@/lib/walletModal'
import { Loader2, Swords, X } from 'lucide-react'
import { NETWORK_NAME } from '@/lib/brand'
import { RuleChips } from './Rules'
import { fireConfetti } from '@/lib/confetti'
import { shortAddress, usd } from '@/lib/format'
import type { Keep, KeepApi } from '@/lib/types'
import { MAX_STAKE_PER_DAY } from '@/lib/keepit'
import { useAction } from '@/hooks/useAction'

interface Props {
  api: KeepApi
  /** Goal id from the challenge link, or null when closed. */
  parentId: bigint | null
  onClose: () => void
  onJoined: () => void
}

export function JoinSheet({ api, parentId, onClose, onJoined }: Props) {
  const action = useAction()
  const btn = useRef<HTMLButtonElement>(null)
  const { open: openWallet } = useWalletModal()
  const { mode, connected } = api

  const lookup = useQuery({
    queryKey: ['challenge', mode, parentId?.toString() ?? ''],
    queryFn: async () => (await api.fetchKeep(parentId as bigint)) ?? null,
    enabled: parentId !== null,
    retry: false,
  })
  const parent: Keep | null | undefined = lookup.isLoading ? undefined : (lookup.data ?? null)

  useEffect(() => {
    if (parentId === null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [parentId, onClose])

  const total = parent ? parent.stakePerDay * BigInt(parent.duration) : 0n
  const needsWallet = mode === 'live' && !connected
  const overCap = !!parent && parent.stakePerDay > MAX_STAKE_PER_DAY
  const insufficient = parent && api.balance !== undefined && api.balance < total

  const join = async () => {
    if (!parent) return
    if (needsWallet) return openWallet()
    const ok = await action.run((onStep) => api.join(parent.id, onStep), 'You joined the challenge!')
    if (ok) {
      const r = btn.current?.getBoundingClientRect()
      fireConfetti(r ? { x: r.left + r.width / 2, y: r.top } : undefined)
      onJoined()
    }
  }

  return (
    <AnimatePresence>
      {parentId !== null && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--ink) 45%, transparent)' }} />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Friend challenge"
            className="surface relative w-full max-w-md !rounded-b-none sm:!rounded-b-[1.75rem]"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn btn-icon btn-sm absolute right-3 top-3" onClick={onClose} aria-label="Close"><X size={18} /></button>
            <div className="space-y-4 p-6 pb-8">
              <div className="tag !bg-sky !text-[#1b1335]"><Swords size={13} /> Friend challenge</div>
              {parent === undefined ? (
                <div className="space-y-2"><div className="skeleton h-12" /><div className="skeleton h-24" /></div>
              ) : parent === null ? (
                <p className="py-4 text-muted">This challenge link points to a goal that does not exist{mode === 'demo' ? ' in the demo' : ` on ${NETWORK_NAME}`}.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-sun text-4xl shadow-pop-sm" aria-hidden="true">{parent.emoji}</div>
                    <div className="min-w-0">
                      <h2 className="truncate text-3xl font-extrabold leading-tight">{parent.name}</h2>
                      <p className="text-sm font-semibold text-muted">{parent.isMine ? 'Your goal' : `${shortAddress(parent.owner)} dares you`}</p>
                    </div>
                  </div>
                  <RuleChips keep={parent} />
                  <div className="well space-y-1.5 p-4 text-sm tnum">
                    <div className="flex justify-between"><span className="text-muted">Length</span><b>{parent.duration} days</b></div>
                    <div className="flex justify-between"><span className="text-muted">Daily stake</span><b>{usd(parent.stakePerDay)}</b></div>
                    <div className="flex justify-between border-t border-dashed border-[var(--line-soft)] pt-2"><span className="text-muted">Total into escrow</span><b className="display text-xl">{usd(total)}</b></div>
                  </div>
                  <button ref={btn} className="btn btn-ember btn-lg w-full" disabled={action.busy || !!insufficient || overCap || api.incompatible} onClick={() => void join()}>
                    {action.busy ? <><Loader2 className="animate-spin" size={18} /> {action.label}</> : needsWallet ? 'Connect wallet to join' : overCap ? 'Above the $5/day limit' : api.incompatible ? 'Contract version mismatch' : insufficient ? 'Not enough USDC' : `Join for ${usd(total)}`}
                  </button>
                  {action.error && <p role="alert" className="text-sm font-semibold" style={{ color: 'var(--berry)' }}>{action.error}</p>}
                  <p className="text-center text-xs font-semibold text-muted">Your own goal, starting today in your time zone. The same rules, your stake, your payout.</p>
                </>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
