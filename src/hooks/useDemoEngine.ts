import { useCallback, useMemo, useState } from 'react'
import { analyze, popcount, utcDay, type CreateParams, type Keep, type KeepApi, type Payout, type Stats } from '@/lib/types'

const U = 1_000_000n // 1 USDC in base units
const ME = 'You (demo)'

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
}

const SEEDS: Seed[] = [
  { owner: ME, name: 'Run 2km', emoji: '🏃', stake: U, duration: 14, idx: 8, history: 'KKKxKKKK' },
  { owner: ME, name: 'No sugar', emoji: '🍎', stake: U / 2n, duration: 7, idx: 5, history: 'KKKKK' },
  { owner: ME, name: 'Code 1 hour', emoji: '💻', stake: 2n * U, duration: 30, idx: 11, history: 'KKKKKKKKKKK!' },
  { owner: ME, name: 'Read 20 pages', emoji: '📚', stake: U, duration: 7, idx: 9, history: 'KKKKKKK' },
  { owner: 'maya', name: 'Meditate 10 min', emoji: '🧘', stake: U, duration: 30, idx: 20, history: 'KKKKKKKKKKKKKKKKKKKK!' },
  { owner: 'dev_sam', name: 'Ship a commit', emoji: '🚢', stake: U, duration: 14, idx: 6, history: 'KKKKKK!' },
  { owner: 'luna.run', name: 'Morning run', emoji: '🌅', stake: 2n * U, duration: 14, idx: 10, history: 'KKKKKKKKKK' },
  { owner: 'kofi', name: 'No doomscroll', emoji: '📵', stake: U / 2n, duration: 30, idx: 13, history: 'KKxKKKKKKKKKK!' },
  { owner: 'ana_codes', name: 'Learn Rust', emoji: '🦀', stake: U, duration: 30, idx: 3, history: 'KKK!' },
  { owner: 'tariq', name: 'Cold shower', emoji: '🧊', stake: U / 4n, duration: 7, idx: 4, history: 'KxKK!' },
  { owner: 'juno', name: 'Stretch', emoji: '🤸', stake: U, duration: 14, idx: 12, history: 'KKxxKKKKKKKK!' },
  { owner: 'bo', name: 'Journal', emoji: '📓', stake: U, duration: 7, idx: 7, history: 'KKKKKKK' },
  { owner: 'sky', name: 'Drink water', emoji: '💧', stake: U / 4n, duration: 14, idx: 2, history: 'KK' },
  { owner: 'rex', name: 'Gym every day', emoji: '🏋️', stake: 5n * U, duration: 14, idx: 8, history: 'Kxxxxxxx' },
  { owner: 'ivy', name: 'Wake at 6am', emoji: '⏰', stake: 2n * U, duration: 7, idx: 7, history: 'KxxKxxx' },
]

function build(today: number): Keep[] {
  return SEEDS.map((s, i) => {
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
      isMine: s.owner === ME,
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
    }
  })
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
      reject(e instanceof Error ? e : new Error("Demo action failed"))
    }
  })

/** Local, in-memory simulation of KeepIt with seeded goals. No wallet or chain involved. */
export function useDemoEngine(): KeepApi {
  const [baseDay] = useState(() => utcDay(Date.now()))
  const [state, setState] = useState<DemoState>(() => ({ keeps: build(baseDay), balance: 25n * U, rewardsPaid: 0n, daysSkipped: 0 }))
  const today = baseDay + state.daysSkipped

  const pool = useMemo(() => {
    let missedStake = 0n
    for (const k of state.keeps) missedStake += k.stakePerDay * BigInt(k.missedProcessed)
    return missedStake - state.rewardsPaid
  }, [state])

  const shareOf = useCallback(
    (k: Keep): bigint => {
      if (k.claimed || k.broken || k.missedProcessed > 0 || analyze(k, today).missed > 0) return 0n
      let weights = 0n
      for (const o of state.keeps) {
        if (!o.claimed && !o.broken && analyze(o, today).missed === 0) weights += o.stakePerDay * BigInt(o.duration)
      }
      if (weights === 0n) return 0n
      return (pool * k.stakePerDay * BigInt(k.duration)) / weights
    },
    [state.keeps, pool, today],
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

  const update = (id: bigint, fn: (k: Keep) => Keep) =>
    setState((s) => ({ ...s, keeps: s.keeps.map((k) => (k.id === id ? fn(k) : k)) }))

  const addKeep = (p: CreateParams, parentId: bigint) => {
    const total = p.stakePerDay * BigInt(p.duration)
    if (state.balance < total) throw new Error('Insufficient USDC balance')
    setState((s) => ({
      ...s,
      balance: s.balance - total,
      keeps: [
        {
          id: BigInt(s.keeps.length + 1),
          owner: ME,
          isMine: true,
          name: p.name,
          emoji: p.emoji,
          stakePerDay: p.stakePerDay,
          duration: p.duration,
          startDay: today,
          mask: 0,
          missedProcessed: 0,
          parentId,
          broken: false,
          settled: false,
          claimed: false,
        },
        ...s.keeps,
      ],
    }))
    return {}
  }

  const markProcessed = (k: Keep): Keep => {
    const missed = analyze(k, today).missed
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
    today,
    myKeeps: sortedKeeps.filter((k) => k.isMine),
    allKeeps: sortedKeeps,
    stats,
    loading: false,
    create: (p) => wrap(() => addKeep(p, 0n)),
    join: (parentId) =>
      wrap(() => {
        const parent = state.keeps.find((k) => k.id === parentId)
        if (!parent) throw new Error('UnknownGoal')
        return addKeep({ name: parent.name, emoji: parent.emoji, duration: parent.duration, stakePerDay: parent.stakePerDay }, parentId)
      }),
    checkIn: (id) =>
      wrap(() => {
        const k = state.keeps.find((x) => x.id === id)
        if (!k) throw new Error('UnknownGoal')
        const a = analyze(k, today)
        if (a.ended) throw new Error('GoalEnded')
        if (a.checkedToday) throw new Error('AlreadyCheckedIn')
        update(id, (g) => ({ ...g, mask: g.mask | (1 << a.idx) }))
        return {}
      }),
    claim: (id) =>
      wrap(() => {
        const k = state.keeps.find((x) => x.id === id)
        if (!k) throw new Error('UnknownGoal')
        const a = analyze(k, today)
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
    previewPayout: (k): Promise<Payout> =>
      Promise.resolve({ refund: analyze(k, today).secured, poolShare: shareOf(k) }),
    demo: {
      advanceDay: () => setState((s) => ({ ...s, daysSkipped: s.daysSkipped + 1 })),
      reset: () => setState({ keeps: build(baseDay), balance: 25n * U, rewardsPaid: 0n, daysSkipped: 0 }),
      daysSkipped: state.daysSkipped,
    },
  }
}
