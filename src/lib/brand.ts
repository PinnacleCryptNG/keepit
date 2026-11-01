import { requireChain } from '@/onchain-facts'
import { CHAIN_ID } from './keepit'

const chain = requireChain(CHAIN_ID)

/** Name of the network the contract is deployed to. Copy reads from here. */
export const NETWORK_NAME = `${chain.name} mainnet`
/** The one-line status shown wherever the network or the money is mentioned. */
export const STATUS_LINE = 'Arc mainnet · real USDC · unaudited, small amounts only (max $5/day)'

/** Optional public links, set in `.env`. A link is only shown when its variable is set. */
export const REPO_URL = (import.meta.env.VITE_REPO_URL as string | undefined) || undefined
export const CONTACT_URL = (import.meta.env.VITE_CONTACT_URL as string | undefined) || undefined
/** Where to send problems: the contact link if set, otherwise the repository's issue tracker. */
export const ISSUES_URL = REPO_URL ? `${REPO_URL.replace(/\/$/, '')}/issues` : undefined
export const CONTACT_LINK = CONTACT_URL ?? ISSUES_URL
const X_HANDLE = ((import.meta.env.VITE_X_HANDLE as string | undefined) || '').replace(/^@/, '').trim()
export const X_URL = /^[A-Za-z0-9_]{1,15}$/.test(X_HANDLE) ? `https://x.com/${X_HANDLE}` : undefined
export const X_LABEL = X_URL ? `@${X_HANDLE}` : undefined
