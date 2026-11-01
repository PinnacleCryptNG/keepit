import { useMemo } from 'react'
import { Plus, RefreshCw, Wallet } from 'lucide-react'
import { Flame } from '@/brand/Flame'
import { NETWORK_NAME } from '@/lib/brand'
import { analyze, type Keep, type KeepApi } from '@/lib/types'
import { useWalletModal } from '@/lib/walletModal'
import { KeepCard } from './KeepCard'

function Message({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon}
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="pretty max-w-sm text-muted">{body}</p>
      {children}
    </div>
  )
}

interface Props {
  api: KeepApi
  onOpen: (id: bigint) => void
  onStart: () => void
  onDemo: () => void
}

/** The home screen: every active keep with its check-in button right on the card. */
export function Today({ api, onOpen, onStart, onDemo }: Props) {
  const { open: openWallet } = useWalletModal()
  const live = api.mode === 'live'

  const sorted = useMemo(() => {
    const rank = (k: Keep) => {
      const a = analyze(k, api.now)
      if (k.claimed) return 4
      if (a.ended) return 0
      return a.checkedToday ? 3 : 1
    }
    return [...api.myKeeps].sort((x, y) => rank(x) - rank(y) || (x.id < y.id ? 1 : -1))
  }, [api.myKeeps, api.now])

  const claimable = sorted.filter((k) => !k.claimed && analyze(k, api.now).ended).length
  const toCheck = sorted.filter((k) => {
    const a = analyze(k, api.now)
    return !k.claimed && !a.ended && !a.checkedToday
  }).length
  const headline = claimable > 0 ? 'Money is waiting' : toCheck > 0 ? `${toCheck} to check in` : sorted.length > 0 ? 'All kept today' : 'Welcome'
  const date = new Date(api.now).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  let body: React.ReactNode
  if (live && !api.connected) {
    body = (
      <Message icon={<Wallet size={36} className="text-muted" />} title="Connect your wallet" body={`Your keeps live on ${NETWORK_NAME}. Connect a wallet to see them or start a new one.`}>
        <button className="btn btn-ember btn-lg mt-2" onClick={openWallet}>Connect wallet</button>
        <button className="text-sm font-semibold text-muted underline" onClick={onDemo}>or explore the demo, no wallet needed</button>
      </Message>
    )
  } else if (api.incompatible) {
    body = (
      <Message icon={<RefreshCw size={34} className="text-muted" />} title="Contract version mismatch" body="The contract at the configured address is not the version of KeepIt this app expects, so creating and checking in are turned off. No funds are at risk." />
    )
  } else if (api.error) {
    body = (
      <Message icon={<RefreshCw size={34} className="text-muted" />} title={`Couldn't reach ${NETWORK_NAME}`} body="The network didn't answer. Your money is safe, this is just a connection problem.">
        <button className="btn mt-2" onClick={api.refetch}>Try again</button>
      </Message>
    )
  } else if (api.loading) {
    body = (
      <div className="space-y-4">
        <div className="skeleton h-48" />
        <div className="skeleton h-48" />
      </div>
    )
  } else if (sorted.length === 0) {
    body = (
      <Message icon={<Flame size={64} />} title="Start your first keep" body="Pick a habit, set the stake and check in daily. It takes about a minute.">
        <button className="btn btn-ember btn-lg mt-2" onClick={onStart}>New keep</button>
      </Message>
    )
  } else {
    body = (
      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((k, i) => (
          <KeepCard key={k.id.toString()} api={api} keep={k} index={i} onOpen={() => onOpen(k.id)} />
        ))}
        <button className="flex min-h-[56px] w-full md:col-span-2 items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-line text-sm font-bold text-muted transition-colors hover:bg-[var(--card)]" onClick={onStart}>
          <Plus size={18} /> New keep
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-muted">{date}</p>
        <h1 className="text-4xl font-extrabold sm:text-5xl">{headline}</h1>
      </header>
      {body}
    </div>
  )
}
