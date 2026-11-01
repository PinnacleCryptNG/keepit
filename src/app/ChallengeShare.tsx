import { useEffect, useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { getShareBase } from '@/lib/share'
import { usd } from '@/lib/format'
import type { Keep, Mode } from '@/lib/types'

/** Invite friends: one button copies the challenge link, a second opens the share sheet where supported. */
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
      toast.error('Could not copy the link.')
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
    <div className="flex gap-2">
      <button className="btn flex-1" disabled={!link} onClick={() => void copy()}>
        {copied ? <Check size={17} /> : <Link2 size={17} />} {copied ? 'Link copied' : 'Invite friends'}
      </button>
      {canShare && (
        <button className="btn btn-icon" disabled={!link} onClick={() => void share()} aria-label="Share challenge">
          <Share2 size={17} />
        </button>
      )}
    </div>
  )
}
