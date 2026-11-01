import { useCallback, useMemo, useState } from 'react'
import { useNow } from '@/hooks/useNow'
import {
  analyze,
  browserOffsetMin,
  gate,
  localDay,
  MS_PER_DAY,
  popcount,
  type CreateParams,
  type Keep,
  type KeepApi,
  type Payout,
  type Stats,
} from '@/lib/types'

const U = 1_000_000n // 1 USDC in base units
export const DEMO_ME = 'You'

interface Seed {
  owner: string
  name: string
  emoji: string
  stake: bigint
  duration: number
  /** Days since the goal started (today's day index). */
  idx: number
  /** One char per elapsed day: K kept, x missed. A trailing "!" means today is already checked. */
  history: string
  /** Has a daily check-in window (placed around the visitor's current time so it is open). */
  window?: boolean
  /** Minimum wallet balance in whole USDC. */
  hold?: bigint
}

const SEEDS: Seed[] = [
  { owner: DEMO_ME, name: 'Early bird', emoji: '🌅', stake: U, duration: 7, idx: 3, history: 'KKK', window: true },
  { owner: DEMO_ME, name: 'Stay funded', emoji: '🏦', stake: U, duration: 7, idx: 9, history: 'KKKKKKK', hold: 20n },
  { owner: 'maya', name: 'Early bird', emoji: '🌅', stake: U, duration: 30, idx: 20, history: 'KKKKKKKKKKKKKKKKKKKK!', window: true },
  { owner: 'dev_sam', name: 'Stay funded', emoji: '🏦', stake: U, duration: 14, idx: 6, history: 'KKKKKK!', hold: 200n },
  { owner: 'luna.run', name: 'Early bird', emoji: '🌅', stake: 2n * U, duration: 14, idx: 10, history: 'KKKKKKKKKK', window: true },
  { owner: 'kofi', name: 'Stay funded', emoji: '🏦', stake: U / 2n, duration: 30, idx: 13, history: 'KKxKKKKKKKKKK!', hold: 100n },
  { owner: 'rex', name: 'Early bird', emoji: '🌅', stake: 5n * U, duration: 14, idx: 8, history: 'Kxxxxxxx', window: true },
  { owner: 'ivy', name: 'Stay funded', emoji: '🏦', stake: 2n * U, duration: 7, idx: 7, history: 'KxxKxxx', hold: 25n },
]

function build(nowMs: number): { keeps: Keep[] } {
  const offset = browserOffsetMin()
  const today = localDay({ utcOffsetMin: offset }, nowMs)
  const sod = Math.floor((((nowMs + offset * 60_000) % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY / 1000)
  // A two-hour window that started up to an hour ago, so the demo can check in right away at any time of day.
  const winStart = Math.max(0, Math.floor(sod / 1800) * 1800 - 1800)
  const winEnd = Math.min(86_400, winStart + 7200)
  const keeps = SEEDS.map((s, i) => {
    let mask = 0
    let missed = 0
    const days = s.history.replace('!', '')
    for (let d = 0; d < days.length; d++) {
      if (days[d] === 'K') mask |= 1 << d
      else missed++
    }
    if (s.history.endsWith('!')) mask |= 1 << s.idx
    return {
      id: BigInt(i + 1),
      owner: s.owner,
      isMine: s.owner === DEMO_ME,
      name: s.name,
      emoji: s.emoji,
      stakePerDay: s.stake,
      duration: s.duration,
      startDay: today - s.idx,
      mask,
      missedProcessed: missed,
      parentId: 0n,
      broken: missed > 0,
      settled: false,
      claimed: false,
      utcOffsetMin: offset,
      windowStart: s.window ? winStart : 0,
      windowEnd: s.window ? winEnd : 0,
      minBalance: (s.hold ?? 0n) * U,
    } satisfies Keep
  })
  return { keeps }
}

interface DemoState {
  keeps: Keep[]
  balance: bigint
  rewardsPaid: bigint
  daysSkipped: number
}

const wrap = <T,>(f: () => T) =>
  new Promise<T>((resolve, reject) => {
    try {
      resolve(f())
    } catch (e) {
      reject(e instanceof Error ? e : new Error('Demo action failed'))
    }
  })

/** Local, in-memory simulation of KeepIt with seeded goals. No wallet or chain involved. */
export function useDemoEngine(): KeepApi {
  const clock = useNow(15_000)
  const fresh = (): DemoState => ({ ...build(Date.now()), balance: 25n * U, rewardsPaid: 0n, daysSkipped: 0 })
  const [state, setState] = useState<DemoState>(fresh)
  // The demo runs on your real clock. Skipping a day moves it forward by whole days, so the time of day stays the same.
  const now = clock + state.daysSkipped * MS_PER_DAY

  const pool = useMemo(() => {
    let missedStake = 0n
    for (const k of state.keeps) missedStake += k.stakePerDay * BigInt(k.missedProcessed)
    return missedStake - state.rewardsPaid
  }, [state.keeps, state.rewardsPaid])

  const shareOf = useCallback(
    (k: Keep): bigint => {
      if (k.claimed || k.broken || k.missedProcessed > 0 || analyze(k, now).missed > 0) return 0n
      let weights = 0n
      for (const o of state.keeps) {
        if (!o.claimed && !o.broken && analyze(o, now).missed === 0) weights += o.stakePerDay * BigInt(o.duration)
      }
      if (weights === 0n) return 0n
      return (pool * k.stakePerDay * BigInt(k.duration)) / weights
    },
    [state.keeps, pool, now],
  )

  const stats = useMemo<Stats>(() => {
    let kept = 0n
    for (const k of state.keeps) kept += k.stakePerDay * BigInt(popcount(k.mask))
    return {
      goals: state.keeps.length,
      totalKept: kept,
      pool,
      totalPaidOut: state.rewardsPaid,
      keepers: new Set(state.keeps.map((k) => k.owner)).size,
    }
  }, [state.keeps, pool, state.rewardsPaid])

  const addKeep = (p: CreateParams, parentId: bigint) => {
    const total = p.stakePerDay * BigInt(p.duration)
    if (state.balance < total) throw new Error('Insufficient USDC balance')
    setState((s) => ({
          ...s,
          balance: s.balance - total,
          keeps: [
            {
              id: BigInt(s.keeps.length + 1),
              owner: DEMO_ME,
              isMine: true,
              name: p.name,
              emoji: p.emoji,
              stakePerDay: p.stakePerDay,
              duration: p.duration,
              startDay: localDay({ utcOffsetMin: browserOffsetMin() }, now),
              utcOffsetMin: browserOffsetMin(),
              mask: 0,
              missedProcessed: 0,
              parentId,
              broken: false,
              settled: false,
              claimed: false,
              windowStart: p.windowStart,
              windowEnd: p.windowEnd,
              minBalance: p.minBalance,
            },
            ...s.keeps,
          ],
    }))
    return {}
  }

  const markProcessed = (k: Keep): Keep => {
    const missed = analyze(k, now).missed
    return { ...k, missedProcessed: missed, broken: k.broken || missed > 0 }
  }

  const sortedKeeps = useMemo(() => [...state.keeps].sort((a, b) => (a.id < b.id ? 1 : -1)), [state.keeps])

  return {
    mode: 'demo',
    connected: true,
    address: undefined,
    wrongChain: false,
    switchToArc: () => Promise.resolve(),
    balance: state.balance,
    now,
    myKeeps: sortedKeeps.filter((k) => k.isMine),
    allKeeps: sortedKeeps,
    stats,
    loading: false,
    error: false,
    incompatible: false,
    refetch: () => undefined,
    create: (p) => wrap(() => addKeep(p, 0n)),
    join: (parentId) =>
      wrap(() => {
        const parent = state.keeps.find((k) => k.id === parentId)
        if (!parent) throw new Error('UnknownGoal')
        return addKeep(
          {
            name: parent.name,
            emoji: parent.emoji,
            duration: parent.duration,
            stakePerDay: parent.stakePerDay,
            windowStart: parent.windowStart,
            windowEnd: parent.windowEnd,
            minBalance: parent.minBalance,
          },
          parentId,
        )
      }),
    checkIn: (id) =>
      wrap(() => {
        const k = state.keeps.find((x) => x.id === id)
        if (!k) throw new Error('UnknownGoal')
        const a = analyze(k, now)
        if (a.ended) throw new Error('GoalEnded')
        if (a.checkedToday) throw new Error('AlreadyCheckedIn')
        const g = gate(k, now, state.balance)
        if (g.windowOpen === false) throw new Error('OutsideWindow')
        if (g.balanceOk === false) throw new Error('BelowMinBalance')
        setState((s) => ({
              ...s,
              keeps: s.keeps.map((g) => (g.id === id ? { ...g, mask: g.mask | (1 << a.idx) } : g)),
        }))
        return {}
      }),
    claim: (id) =>
      wrap(() => {
        const k = state.keeps.find((x) => x.id === id)
        if (!k) throw new Error('UnknownGoal')
        const a = analyze(k, now)
        if (!a.ended) throw new Error('GoalNotEnded')
        if (k.claimed) throw new Error('AlreadyClaimed')
        const processed = markProcessed(k)
        const share = shareOf(processed)
        setState((s) => ({
              ...s,
              balance: s.balance + a.secured + share,
              rewardsPaid: s.rewardsPaid + share,
              keeps: s.keeps.map((g) => (g.id === id ? { ...processed, settled: true, claimed: true } : g)),
        }))
        return {}
      }),
    sweep: (ids) =>
      wrap(() => {
        setState((s) => ({ ...s, keeps: s.keeps.map((k) => (ids.includes(k.id) ? markProcessed(k) : k)) }))
        return {}
      }),
    fetchKeep: (id) => Promise.resolve(state.keeps.find((k) => k.id === id)),
    previewPayout: (k): Promise<Payout> => Promise.resolve({ refund: analyze(k, now).secured, poolShare: shareOf(k) }),
    demo: {
      advanceDay: () =>
        setState((s) => {
          // Sample keepers carry on: diligent ones check in, and their misses are swept into the pool.
          const nextDays = s.daysSkipped + 1
          const nextNow = now + MS_PER_DAY
          return {
            ...s,
            daysSkipped: nextDays,
            keeps: s.keeps.map((k) => {
              if (k.isMine) return k
              let mask = k.mask
              if (!k.broken) {
                const a = analyze(k, now)
                if (!a.ended && !a.checkedToday && a.idx >= 0) mask |= 1 << a.idx
              }
              const next = { ...k, mask }
              const missed = analyze(next, nextNow).missed
              return { ...next, missedProcessed: missed, broken: next.broken || missed > 0 }
            }),
          }
        }),
      reset: () => setState(fresh()),
      daysSkipped: state.daysSkipped,
    },
  }
}
