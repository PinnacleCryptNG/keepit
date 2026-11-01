import { Clock, ExternalLink, Gauge, ShieldCheck, Users } from 'lucide-react'
import { Reveal, SectionHead } from '@/components/Reveal'
import { REPO_URL } from '@/lib/brand'
import { CHAIN_ID, KEEPIT_ADDRESS } from '@/lib/keepit'
import { buildAddressExplorerUrl } from '@/onchain-facts'

function Icon({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-xl border border-line text-[#1b1335]" style={{ background: bg }}>
      {children}
    </span>
  )
}

const linkCls = 'inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper-2 px-3 py-2 text-sm font-bold hover:bg-card'

export function Features({ onDocs }: { onDocs: () => void }) {
  const contract = `${KEEPIT_ADDRESS.slice(0, 8)}...${KEEPIT_ADDRESS.slice(-6)}`
  return (
    <section className="mx-auto max-w-[1360px] px-4 pb-20 sm:px-8 sm:pb-28">
      <SectionHead eyebrow="What you get" title={<>Built so friends do <span className="hl">the nagging</span>.</>} />
      <div className="grid gap-5 md:grid-cols-2">
        <Reveal>
          <article className="surface h-full p-6 sm:p-8">
            <Icon bg="var(--ember)"><Users size={22} /></Icon>
            <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">Challenge friends with one link</h3>
            <p className="pretty mt-2 text-muted">Start a goal, copy the link, send it to the group chat. Each friend joins with the same habit and the same daily stake, on their own streak, and everyone's progress is public. Nothing keeps you honest like people who'll notice.</p>
          </article>
        </Reveal>
        <Reveal delay={0.06}>
          <article className="surface h-full p-6 sm:p-8">
            <Icon bg="var(--sky)"><Clock size={22} /></Icon>
            <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">Rules the contract enforces</h3>
            <p className="pretty mt-2 text-muted">Set a daily check-in window, a minimum wallet balance, or both. The contract checks them at the moment you check in, so there is nothing to argue about and nobody to convince. It proves what your wallet did, not what you did, so pick rules you would not want to fake.</p>
          </article>
        </Reveal>
        <Reveal delay={0.04}>
          <article className="surface h-full p-6 sm:p-8">
            <Icon bg="var(--sun)"><ShieldCheck size={22} /></Icon>
            <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">A contract you can read</h3>
            <p className="pretty mt-2 text-muted">Stakes sit in a public smart contract with no admin key and no pause button, and every deposit, check-in and payout is an event on the explorer. It has been through automated analysis and two review passes. It has not had an independent audit yet.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={buildAddressExplorerUrl(CHAIN_ID, KEEPIT_ADDRESS)} target="_blank" rel="noreferrer" className={`mono ${linkCls}`}>{contract} <ExternalLink size={13} /></a>
              {REPO_URL && <a href={REPO_URL} target="_blank" rel="noreferrer" className={linkCls}>Source code <ExternalLink size={13} /></a>}
              <button className={linkCls} onClick={onDocs}>Security and risks</button>
            </div>
          </article>
        </Reveal>
        <Reveal delay={0.1}>
          <article className="surface h-full p-6 sm:p-8">
            <Icon bg="var(--grape)"><Gauge size={22} color="#fff" /></Icon>
            <h3 className="mt-5 text-2xl font-extrabold sm:text-3xl">Small stakes make sense</h3>
            <p className="pretty mt-2 text-muted">On Arc, USDC is also the gas token. Fees are paid in the same dollars you stake and stay predictable, with sub-second finality. A one-dollar habit shouldn't need a five-dollar detour.</p>
          </article>
        </Reveal>
      </div>
    </section>
  )
}
