import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { config } from './config'
import App from './App'
import { WalletModal } from './components/WalletModal'
import { CHAIN_ID } from './lib/keepit'
import { requireChain } from './onchain-facts'
import { installShareSync } from './lib/share'
import './index.css'

installShareSync()

// Ad and analytics link decorators (Google's _gl and _gcl_*, click ids) get appended by the page a link was clicked on.
// KeepIt does not use them, so drop them to keep the address clean.
;(() => {
  const params = new URLSearchParams(window.location.search)
  let changed = false
  for (const key of [...params.keys()]) {
    if (key === '_gl' || key.startsWith('_gcl') || key === 'gclid' || key === 'fbclid') {
      params.delete(key)
      changed = true
    }
  }
  if (!changed) return
  const qs = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`)
})()

// Fail fast instead of spinning: two quick attempts, then the UI shows a retry state.
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, retryDelay: 1200 } } })

async function boot() {
  if (import.meta.env.DEV) {
    // Preview-only request tracing and console capture. Not part of production builds.
    const [tracing] = await Promise.all([import('./tracing'), import('./console-capture')])
    tracing.registerChain(CHAIN_ID, requireChain(CHAIN_ID).rpcUrls[0])
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
          <WalletModal />
          <Toaster position="top-center" />
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>,
  )
}

void boot()
