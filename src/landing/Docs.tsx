import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { CONTACT_LINK, REPO_URL, STATUS_LINE } from '@/lib/brand'
import { CHAIN_ID, KEEPIT_ADDRESS } from '@/lib/keepit'
import { buildAddressExplorerUrl } from '@/onchain-facts'
import { Footer } from './Footer'
import { Nav } from './Nav'

const SECTIONS = [
  ['what', 'What KeepIt is'],
  ['terms', 'Terms of use'],
  ['risks', 'Risks'],
  ['gambling', 'Is it gambling?'],
  ['security', 'Security'],
  ['privacy', 'Privacy'],
] as const

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-[var(--line-soft)] py-8 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-2 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">{children}</div>
    </section>
  )
}

/** Plain-language terms, risks and security notes. Not a substitute for legal review. */
export function Docs({ onHome, onApp, onDocs }: { onHome: () => void; onApp: () => void; onDocs: () => void }) {
  const explorer = buildAddressExplorerUrl(CHAIN_ID, KEEPIT_ADDRESS)
  return (
    <div className="relative z-[1] min-h-dvh">
      <Nav onLaunch={onApp} onHome={onHome} />
      <main className="mx-auto grid max-w-[1100px] gap-10 px-4 pb-20 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-28 flex flex-col gap-1 text-sm font-semibold">
            <span className="eyebrow mb-2">On this page</span>
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-lg px-3 py-1.5 text-muted hover:bg-card hover:text-ink">{label}</a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="mb-8">
            <div className="eyebrow mb-3">Terms, risks and security</div>
            <h1 className="balance text-[clamp(2.2rem,6vw,3.6rem)] font-extrabold leading-[1]">The fine print, in plain words.</h1>
            <p className="mt-4 text-sm font-semibold text-muted">Last updated October 31, 2026</p>
          </header>

          <Section id="what" title="What KeepIt is">
            <p>KeepIt is a website that lets you create a daily goal, lock a stake in USDC in a public smart contract, check in each day, and claim your stake back when the goal ends. Stakes for days you miss go to a shared pool that is split among people who finish without a miss.</p>
            <p>KeepIt does not hold your funds. The contract does, and nobody, including the people who built this site, can move them, pause the contract or change the rules. Blockchain transactions cannot be reversed.</p>
            <p><b>{STATUS_LINE}.</b> Stakes are real USDC on a contract that has not had an independent audit, so stake only what you can afford to lose.</p>
          </Section>

          <Section id="terms" title="Terms of use">
            <ul>
              <li>You use KeepIt at your own risk. The site and contract are provided as is, without warranties of any kind.</li>
              <li>You are responsible for your wallet, keys and transactions, and for any taxes that apply to you.</li>
              <li>You must be old enough to enter contracts where you live, and you must only use KeepIt where it is legal for you. Do not use it if it is prohibited in your location.</li>
              <li>The pool bonus is not guaranteed. It depends on how much other people forfeit and how many people finish, and it can be zero.</li>
              <li>We may change or remove this website at any time. We cannot change a contract once it is deployed, so existing stakes keep following the rules they started with.</li>
            </ul>
          </Section>

          <Section id="risks" title="Risks">
            <ul>
              <li><b>You can lose your stake.</b> Every day you do not check in costs you that day's stake.</li>
              <li><b>Smart contract risk.</b> Code can contain bugs. The contract has not been independently audited, so only stake what you can afford to lose.</li>
              <li><b>Rules prove wallet activity, not real life.</b> A time window shows your wallet transacted inside it, and a balance rule is a snapshot that can be met with borrowed money. Goals with no rules are honor-system. Pool shares come from other people&apos;s forfeits, so a gamed check-in costs honest players.</li>
              <li><b>Time zones are fixed at creation.</b> Each goal rolls over at midnight in the time zone it was created in. Daylight-saving changes are not applied, so a window can drift by an hour when your clocks change.</li>
              <li><b>USDC and network risk.</b> USDC is issued by a third party that can freeze addresses. The network can be congested or unavailable, which can delay a check-in.</li>
              <li><b>Wallet risk.</b> Lose access to your wallet and you lose access to your stake. Nobody can recover it for you.</li>
            </ul>
          </Section>

          <Section id="gambling" title="Is it gambling?">
            <p>KeepIt is built as a commitment device: you stake your own money on your own behavior, not on a random result, and there is no house that takes a cut. Whether you finish depends on what you do.</p>
            <p>Some places treat pooled forfeits differently, however, and the law varies by country and region. Nothing here is legal advice, and it is your responsibility to check that using KeepIt is allowed where you are.</p>
          </Section>

          <Section id="security" title="Security">
            <p><b>How the contract is built.</b> No owner, admin key, pause or upgrade path. Reentrancy protection on every function that moves funds. Token transfers use a standard safe-transfer library. Deposits are checked to arrive in full.</p>
            <p><b>What has been checked.</b> Automated static analysis found no high-severity issues, and two separate review passes found and fixed one ordering issue in how pool shares are settled.</p>
            <p><b>What has not.</b> There has been no independent third-party audit yet. Treat the contract as unaudited until that changes.</p>
            <p className="flex flex-wrap gap-3 pt-1">
              <a href={explorer} target="_blank" rel="noreferrer" className="btn btn-sm">Contract on the explorer <ExternalLink size={14} /></a>
              {REPO_URL && <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-sm">Source code <ExternalLink size={14} /></a>}
              {CONTACT_LINK && <a href={CONTACT_LINK} target="_blank" rel="noreferrer" className="btn btn-sm">Report an issue <ExternalLink size={14} /></a>}
            </p>
          </Section>

          <Section id="privacy" title="Privacy">
            <ul>
              <li>There are no accounts. KeepIt does not ask for your name or email.</li>
              <li>Your wallet address, goals and check-ins are public on the blockchain.</li>
              <li>The site stores your theme and demo or live choice in your browser. Its host may keep standard server logs.</li>
            </ul>
          </Section>
        </article>
      </main>
      <Footer onLaunch={onApp} onDocs={onDocs} />
    </div>
  )
}
