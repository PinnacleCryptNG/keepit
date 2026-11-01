import { ExternalLink } from 'lucide-react'
import { Logo } from '@/brand/Logo'
import { AppLink } from '@/components/AppLink'
import { CONTACT_LINK, REPO_URL, STATUS_LINE, X_LABEL, X_URL } from '@/lib/brand'
import { CHAIN_ID, KEEPIT_ADDRESS } from '@/lib/keepit'
import { buildAddressExplorerUrl } from '@/onchain-facts'

export function Footer({ onLaunch, onDocs }: { onLaunch: () => void; onDocs: () => void }) {
  const ext = 'inline-flex items-center gap-1.5 hover:underline'
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto grid max-w-[1360px] gap-8 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size={40} />
          <p className="mt-3 max-w-xs text-sm text-muted">Keep the streak. Keep your money.</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{STATUS_LINE}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm font-semibold">
          <span className="eyebrow mb-1">Product</span>
          <a href="#how" className="hover:underline">How it works</a>
          <a href="#math" className="hover:underline">The math</a>
          <a href="#wall" className="hover:underline">Wall of Keepers</a>
          <a href="#faq" className="hover:underline">FAQ</a>
          <AppLink href="?app=keeps&demo=1" onGo={onLaunch} className="w-fit hover:underline">Open the app</AppLink>
        </nav>
        <div className="flex flex-col gap-2 text-sm font-semibold">
          <span className="eyebrow mb-1">Trust</span>
          <AppLink href="?docs=1" onGo={onDocs} className="w-fit hover:underline">Terms, risks and security</AppLink>
          <a href={buildAddressExplorerUrl(CHAIN_ID, KEEPIT_ADDRESS)} target="_blank" rel="noreferrer" className={ext}>Contract on the explorer <ExternalLink size={13} /></a>
          {REPO_URL && <a href={REPO_URL} target="_blank" rel="noreferrer" className={ext}>GitHub <ExternalLink size={13} /></a>}
          {X_URL && <a href={X_URL} target="_blank" rel="noreferrer" className={ext}>{X_LABEL} on X <ExternalLink size={13} /></a>}
          {CONTACT_LINK && <a href={CONTACT_LINK} target="_blank" rel="noreferrer" className={ext}>Contact and issues <ExternalLink size={13} /></a>}
          <p className="mt-2 text-xs font-medium text-muted">The contract checks your rules, not your real life. Staking can lose money. Not financial advice.</p>
        </div>
      </div>
    </footer>
  )
}
