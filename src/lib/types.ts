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
  /** UTC day number (unix seconds / 86400) of day index 0. */
  startDay: number
  /** Bit i set means day i was checked in. */
  mask: number
  /** Missed days the contract has already moved to the pool. */
  missedProcessed: number
  parentId: bigint
  broken: boolean
  settled: boolean
  claimed: boolean
}

export interface Analysis {
  /** Day index of today inside the goal (may exceed duration once ended). */
  idx: number
  ended: boolean
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
  today: number
  myKeeps: Keep[]
  allKeeps: Keep[]
  stats: Stats
  loading: boolean
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

export function analyze(k: Keep, today: number): Analysis {
  const idx = today - k.startDay
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
export { USDC_DECIMALS }
