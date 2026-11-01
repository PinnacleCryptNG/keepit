import { USDC_DECIMALS } from '@/onchain-facts'

export type CellState = 'kept' | 'missed' | 'today' | 'future'
export type Mode = 'live' | 'demo'

/** One habit goal, in the same shape for live chain data and the demo store. */
export interface Keep {
  id: bigint
  /** Wallet address in live mode, a display handle in demo mode. */
  owner: string
  isMine: boolean
  name: string
  emoji: string
  stakePerDay: bigint
  duration: number
  /** Local day number of day index 0 (unix seconds plus the goal's offset, divided by 86400). */
  startDay: number
  /** Bit i set means day i was checked in. */
  mask: number
  /** Missed days the contract has already moved to the pool. */
  missedProcessed: number
  parentId: bigint
  broken: boolean
  settled: boolean
  claimed: boolean
  /** Hours east of UTC in minutes, fixed at creation. Days roll over at local midnight. */
  utcOffsetMin: number
  /** Daily check-in window in local seconds-of-day. windowEnd of 0 means no time rule. */
  windowStart: number
  windowEnd: number
  /** Minimum USDC wallet balance required at check-in (0 = no balance rule). */
  minBalance: bigint
}

export interface Analysis {
  /** Day index of today inside the goal (may exceed duration once ended). */
  idx: number
  ended: boolean
  /** The goal begins on a later UTC day. */
  notStarted: boolean
  cells: CellState[]
  kept: number
  missed: number
  checkedToday: boolean
  streak: number
  perfect: boolean
  total: bigint
  /** Stake already secured by check-ins. */
  secured: bigint
  /** Stake that is not lost yet (total minus missed days). */
  safe: bigint
  lost: bigint
  /** Missed days that still need to be moved to the pool onchain. */
  pendingMisses: number
  daysLeft: number
}

export interface Stats {
  goals: number
  totalKept: bigint
  pool: bigint
  totalPaidOut: bigint
  keepers: number
}

export interface Payout {
  refund: bigint
  poolShare: bigint
}

export interface CreateParams {
  name: string
  emoji: string
  duration: number
  stakePerDay: bigint
  windowStart: number
  windowEnd: number
  minBalance: bigint
}

export type Step = 'switch' | 'approve-sign' | 'approve-wait' | 'sign' | 'wait'
export type OnStep = (step: Step) => void
export interface TxResult {
  hash?: string
}

export interface DemoControls {
  advanceDay: () => void
  reset: () => void
  /** How many days the demo clock has been moved forward. */
  daysSkipped: number
}

export interface KeepApi {
  mode: Mode
  connected: boolean
  address?: string
  wrongChain: boolean
  switchToArc: () => Promise<void>
  /** USDC balance in the 6-decimal ERC-20 view. */
  balance?: bigint
  /** Current time in ms (the demo clock moves forward when you skip days). */
  now: number
  myKeeps: Keep[]
  allKeeps: Keep[]
  stats: Stats
  loading: boolean
  /** True when the chain could not be read (for example the RPC is unreachable). */
  error: boolean
  /** True when the configured contract does not implement the version of KeepIt this app was built for. */
  incompatible: boolean
  refetch: () => void
  create: (p: CreateParams, onStep?: OnStep) => Promise<TxResult>
  checkIn: (id: bigint, note: string, onStep?: OnStep) => Promise<TxResult>
  claim: (id: bigint, onStep?: OnStep) => Promise<TxResult>
  join: (parentId: bigint, onStep?: OnStep) => Promise<TxResult>
  sweep: (ids: bigint[], onStep?: OnStep) => Promise<TxResult>
  fetchKeep: (id: bigint) => Promise<Keep | undefined>
  previewPayout: (k: Keep) => Promise<Payout>
  demo?: DemoControls
}

export function popcount(n: number): number {
  let c = 0
  let x = n >>> 0
  while (x) {
    x &= x - 1
    c++
  }
  return c
}

const bit = (mask: number, i: number) => ((mask >>> i) & 1) === 1

export function analyze(k: Keep, nowMs: number): Analysis {
  const idx = localDay(k, nowMs) - k.startDay
  const ended = idx >= k.duration
  const stake = k.stakePerDay
  const cells: CellState[] = []
  let kept = 0
  let missed = 0
  for (let i = 0; i < k.duration; i++) {
    if (bit(k.mask, i)) {
      cells.push('kept')
      kept++
    } else if (i < idx) {
      cells.push('missed')
      missed++
    } else if (i === idx) {
      cells.push('today')
    } else {
      cells.push('future')
    }
  }
  const checkedToday = !ended && idx >= 0 && bit(k.mask, idx)
  let cursor = ended ? k.duration - 1 : checkedToday ? idx : idx - 1
  let streak = 0
  while (cursor >= 0 && bit(k.mask, cursor)) {
    streak++
    cursor--
  }
  const total = stake * BigInt(k.duration)
  return {
    idx,
    ended,
    notStarted: idx < 0,
    cells,
    kept,
    missed,
    checkedToday,
    streak,
    perfect: missed === 0 && !k.broken,
    total,
    secured: stake * BigInt(kept),
    safe: stake * BigInt(k.duration - missed),
    lost: stake * BigInt(missed),
    pendingMisses: Math.max(0, missed - k.missedProcessed),
    daysLeft: ended ? 0 : Math.max(0, k.duration - Math.max(idx, 0)),
  }
}

export const MS_PER_DAY = 86_400_000
export const utcDay = (ms: number) => Math.floor(ms / MS_PER_DAY)
/** The goal's own calendar day (days roll over at the goal's local midnight). */
export const localDay = (k: Pick<Keep, 'utcOffsetMin'>, nowMs: number) => Math.floor((nowMs + k.utcOffsetMin * 60_000) / MS_PER_DAY)
export function secondsOfDay(k: Pick<Keep, 'utcOffsetMin'>, nowMs: number): number {
  const local = nowMs + k.utcOffsetMin * 60_000
  return Math.floor((((local % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY) / 1000)
}
/** The browser's current offset from UTC in minutes (east is positive). */
export const browserOffsetMin = () => Math.max(-720, Math.min(840, -new Date().getTimezoneOffset()))

export interface Gate {
  /** False when a rule the contract enforces would reject a check-in right now. */
  allowed: boolean
  /** null when the goal has no time window. */
  windowOpen: boolean | null
  /** null when the goal has no balance rule (or the balance is not known yet). */
  balanceOk: boolean | null
  opensInSec: number
  closesInSec: number
}

/** Mirrors the rules the contract checks at check-in time. */
export function gate(k: Keep, nowMs: number, balance?: bigint): Gate {
  const sod = secondsOfDay(k, nowMs)
  let windowOpen: boolean | null = null
  let opensInSec = 0
  let closesInSec = 0
  if (k.windowEnd !== 0) {
    windowOpen = sod >= k.windowStart && sod < k.windowEnd
    if (windowOpen) closesInSec = k.windowEnd - sod
    else opensInSec = sod < k.windowStart ? k.windowStart - sod : 86_400 - sod + k.windowStart
  }
  const balanceOk = k.minBalance === 0n || balance === undefined ? null : balance >= k.minBalance
  return { allowed: windowOpen !== false && balanceOk !== false, windowOpen, balanceOk, opensInSec, closesInSec }
}
export { USDC_DECIMALS }
