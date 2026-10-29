import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useModal } from 'connectkit'
import { Loader2, Swords, X } from 'lucide-react'
import { fireConfetti } from '@/lib/confetti'
import { shortAddress, usd } from '@/lib/format'
import type { Keep, KeepApi } from '@/lib/types'
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
  const { setOpen } = useModal()
  const { mode, connected } = api
  const lookup = useQuery({
    queryKey: ['challenge', mode, parentId?.toString() ?? ''],
    queryFn: async () => (await api.fetchKeep(parentId as bigint)) ?? null,
    enabled: parentId !== null,
    retry: false,
  })
  const parent: Keep | null | undefined = lookup.isLoading ? undefined : (lookup.data ?? null)

  const total = parent ? parent.stakePerDay * BigInt(parent.duration) : 0n
  const needsWallet = mode === 'live' && !connected
  const insufficient = parent && api.balance !== undefined && api.balance < total

  const join = async () => {
    if (!parent) return
    if (needsWallet) return setOpen(true)
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
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Friend challenge"
            className="relative w-full max-w-md overflow-hidden rounded-t-[2rem]"
            style={{ background: 'var(--surface-strong)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', border: '1px solid var(--border)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #5fbeff, #af8ff4, #f05c6b, #ffcd83, #7ef1b3)' }} />
            <div className="flex justify-center pt-3"><div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} /></div>
            <button className="absolute right-3 top-4 flex size-11 items-center justify-center rounded-full" onClick={onClose} aria-label="Close"><X size={18} /></button>
            <div className="space-y-4 px-5 pb-8 pt-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}><Swords size={14} /> Friend challenge</div>
              {parent === undefined ? (
                <div className="space-y-2"><div className="skeleton h-10" /><div className="skeleton h-20" /></div>
              ) : parent === null ? (
                <p className="py-4 text-sm" style={{ color: 'var(--muted)' }}>This challenge link points to a goal that does not exist{mode === 'demo' ? ' in the demo' : ' on Arc Testnet'}.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-2xl text-3xl" style={{ background: 'var(--flame-soft)' }}>{parent.emoji}</div>
                    <div className="min-w-0">
                      <h2 className="display truncate text-2xl font-bold">{parent.name}</h2>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {parent.isMine ? 'Your goal' : `${shortAddress(parent.owner)} challenged you`}
                      </p>
                    </div>
                  </div>
                  <div className="inner space-y-1.5 p-3 text-sm tabular-nums">
                    <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Length</span><b>{parent.duration} days</b></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Daily stake</span><b>{usd(parent.stakePerDay)}</b></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Total into escrow</span><b>{usd(total)}</b></div>
                  </div>
                  <button ref={btn} className="btn btn-flame w-full !min-h-[56px] text-base" disabled={action.busy || !!insufficient} onClick={() => void join()}>
                    {action.busy ? <><Loader2 className="animate-spin" size={18} /> {action.label}</> : needsWallet ? 'Connect wallet to join' : insufficient ? 'Not enough USDC' : `Join for ${usd(total)}`}
                  </button>
                  {action.error && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{action.error}</p>}
                  <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>Your own goal, starting today. Your stake, your streak, your payout.</p>
                </>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
