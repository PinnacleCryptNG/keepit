/** wagmi configuration. */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { arc } from 'viem/chains'
import { requireChain } from '@/onchain-facts'

/** Optional. A free project id from cloud.reown.com turns on WalletConnect (phone wallets, QR codes). */
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

export const config = createConfig({
  chains: [arc, mainnet], // Ethereum mainnet is only needed for ENS names
  // Wallets that announce themselves (EIP-6963), such as Rabby or MetaMask, are discovered automatically
  // and listed next to this generic browser-wallet connector.
  multiInjectedProviderDiscovery: true,
  connectors: [injected(), ...(WALLETCONNECT_PROJECT_ID ? [walletConnect({ projectId: WALLETCONNECT_PROJECT_ID, showQrModal: true })] : [])],
  transports: {
    // Always pass the RPC explicitly; the Arc endpoints come from the shared chain facts.
    [arc.id]: http(requireChain(arc.id).rpcUrls[0]),
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})
