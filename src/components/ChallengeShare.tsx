import { useEffect, useState } from 'react'
import { Check, Copy, Share2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getShareBase } from '@/lib/share'
import { usd } from '@/lib/format'
import type { Keep, Mode } from '@/lib/types'

export function ChallengeShare({ keep, mode }: { keep: Keep; mode: Mode }) {
  const [base, setBase] = useState<string>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let live = true
    void getShareBase().then((b) => live && setBase(b))
    return () => {
      live = false
    }
  }, [])

  const link = base ? `${base}/?join=${keep.id.toString()}${mode === 'demo' ? '&demo=1' : ''}` : ''
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Challenge link copied')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }
  const share = async () => {
    try {
      await navigator.share({ title: `Join my KeepIt challenge: ${keep.name}`, text: `Stake ${usd(keep.stakePerDay)}/day on "${keep.name}" for ${keep.duration} days with me.`, url: link })
    } catch {
      /* dismissed */
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: 'var(--flame-soft)' }}><Users size={18} /></div>
        <div className="text-sm">
          <div className="font-semibold">Challenge a friend</div>
          <div style={{ color: 'var(--muted)' }}>Same goal, {keep.duration} days, {usd(keep.stakePerDay)}/day. Their own stake.</div>
        </div>
      </div>
      <div className="inner mono truncate px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>{link || 'Preparing link...'}</div>
      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1" disabled={!link} onClick={() => void copy()}>
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link'}
        </button>
        {canShare && (
          <button className="btn btn-primary flex-1" disabled={!link} onClick={() => void share()}>
            <Share2 size={16} /> Share
          </button>
        )}
      </div>
    </section>
  )
}
