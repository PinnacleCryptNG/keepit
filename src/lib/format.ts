/** Format a raw 6-decimal USDC amount as "$1.25": always two decimals, rounded to the nearest cent. */
export function usd(raw: bigint): string {
  const cents = (raw + 5_000n) / 10_000n
  if (raw > 0n && cents === 0n) return '<$0.01'
  const whole = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `$${whole}.${(cents % 100n).toString().padStart(2, '0')}`
}

export const shortAddress = (a: string) => (a.startsWith('0x') ? `${a.slice(0, 6)}...${a.slice(-4)}` : a)

/** "05:12:09" until the next UTC midnight. */
const pad2 = (n: number) => String(n).padStart(2, '0')

/** HH:MM:SS until the goal's local midnight. */
export function untilMidnight(offsetMin: number, nowMs: number): string {
  const day = 86_400_000
  const local = nowMs + offsetMin * 60_000
  const left = day - (((local % day) + day) % day)
  return [Math.floor(left / 3_600_000), Math.floor((left % 3_600_000) / 60_000), Math.floor((left % 60_000) / 1000)].map(pad2).join(':')
}

/** Seconds-of-day as a clock time, for example 5:00 AM. */
export function clock(sec: number): string {
  const h24 = Math.floor(sec / 3600) % 24
  const m = Math.floor((sec % 3600) / 60)
  return `${h24 % 12 || 12}:${pad2(m)} ${h24 < 12 ? 'AM' : 'PM'}`
}

/** A short duration such as "3h 12m" or "12m". */
export function span(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.max(1, Math.ceil((sec % 3600) / 60))
  return h > 0 ? `${h}h ${m === 60 ? 0 : m}m` : `${m}m`
}

const ERROR_COPY: Record<string, string> = {
  AlreadyCheckedIn: 'You already checked in today.',
  AlreadyClaimed: 'This goal was already claimed.',
  OutsideWindow: "You're outside this goal's check-in window.",
  BelowMinBalance: "Your wallet holds less than this goal's minimum balance.",
  InsufficientBalanceForRule: "After staking, your wallet would be below this goal's minimum balance. Add USDC or lower the rule.",
  GoalEnded: 'This goal has already ended.',
  GoalNotEnded: "This goal hasn't ended yet.",
  GoalNotStarted: "This goal hasn't started yet.",
  GraceNotElapsed: 'Only the owner can settle this goal for now.',
  InexactDeposit: 'The deposit did not arrive in full. Nothing was staked.',
  InvalidDuration: 'Pick 7, 14 or 30 days.',
  InvalidStake: 'Stake between $0.01 and $5 a day.',
  InvalidNameLength: 'Use a name of 1 to 48 characters.',
  InvalidEmojiLength: 'Pick a shorter emoji.',
  InvalidWindow: 'The check-in window must start and end on the same day.',
  WindowTooShort: 'The check-in window is too short.',
  InvalidOffset: 'Your time zone is out of range.',
  InvalidMinBalance: 'That minimum balance is too high.',
  MinBalanceTooHigh: 'That minimum balance is too high.',
  NotGoalOwner: 'Only the goal owner can do that.',
  UnknownGoal: 'That goal does not exist.',
  TooManySweeps: 'Too many goals to update at once.',
}

export function parseError(error: unknown): string | null {
  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const lower = msg.toLowerCase()
  if (lower.includes('user rejected') || lower.includes('user denied') || lower.includes('rejected the request')) return null
  for (const [name, copy] of Object.entries(ERROR_COPY)) if (msg.includes(name)) return copy
  if (lower.includes('insufficient') || lower.includes('exceeds balance')) return 'Not enough USDC in your wallet.'
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch')) return 'Network issue. Check your connection and retry.'
  return 'Transaction failed. Please try again.'
}
