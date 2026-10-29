import { formatUsdc } from '@/onchain-money'

/** Format a raw 6-decimal USDC amount as "$1.25" (at least two decimals, exact beyond that). */
export function usd(raw: bigint): string {
  const s = formatUsdc(raw)
  const [whole, frac = ''] = s.split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `$${withCommas}.${frac.padEnd(2, '0')}`
}

export const shortAddress = (a: string) => (a.startsWith('0x') ? `${a.slice(0, 6)}...${a.slice(-4)}` : a)

/** "05:12:09" until the next UTC midnight. */
export function untilUtcMidnight(nowMs: number): string {
  const day = 86_400_000
  const left = day - (nowMs % day)
  const h = Math.floor(left / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  const s = Math.floor((left % 60_000) / 1000)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

const ERROR_COPY: Record<string, string> = {
  AlreadyCheckedIn: 'You already checked in today.',
  GoalEnded: 'This goal has finished.',
  GoalNotEnded: 'This goal is still running.',
  NotGoalOwner: 'Only the goal owner can do that.',
  AlreadyClaimed: 'Already claimed.',
  InvalidStake: 'Daily stake must be between $0.01 and $100.',
  InvalidDuration: 'Pick 7, 14 or 30 days.',
  InvalidNameLength: 'Name must be 1 to 48 characters.',
  InvalidEmojiLength: 'Pick an emoji.',
  NoteTooLong: 'Note is too long (280 characters max).',
  UnknownGoal: 'That goal does not exist.',
  GraceNotElapsed: 'Too early to settle this goal.',
}

export function parseError(error: unknown): string | null {
  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const lower = msg.toLowerCase()
  if (lower.includes('user rejected') || lower.includes('user denied') || lower.includes('rejected the request')) return null
  for (const [name, copy] of Object.entries(ERROR_COPY)) if (msg.includes(name)) return copy
  if (lower.includes('insufficient') || lower.includes('exceeds balance')) return 'Not enough USDC. Use "Get test USDC" in the sidebar.'
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch')) return 'Network issue. Check your connection and retry.'
  return 'Transaction failed. Please try again.'
}
