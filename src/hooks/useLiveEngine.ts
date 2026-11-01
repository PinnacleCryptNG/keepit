import { useEffect, useMemo, useState } from 'react'
import { erc20Abi } from 'viem'
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { keepItAbi } from '@/lib/keepitAbi'
import { CHAIN_ID, KEEPIT_ADDRESS, USDC_ADDRESS, toKeep } from '@/lib/keepit'
import { analyze, browserOffsetMin, type CreateParams, type Keep, type KeepApi, type OnStep, type Payout, type Stats } from '@/lib/types'

const WALL_WINDOW = 60

/** Reads and writes the deployed KeepIt contract on the configured Arc network. Queries stay idle while `enabled` is false. */
export function useLiveEngine(enabled: boolean): KeepApi {
  const { address, chainId: walletChain, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()
  const qc = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(t)
  }, [])
  const poll = enabled ? 15_000 : false

  const balanceQ = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: enabled && !!address, refetchInterval: poll },
  })
  const myIdsQ = useReadContract({
    address: KEEPIT_ADDRESS,
    abi: keepItAbi,
    functionName: 'goalsOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: enabled && !!address, refetchInterval: poll },
  })
  // A cheap call that only exists in the current KeepIt version. If it reverts, the address holds an older or different contract.
  const versionQ = useReadContract({
    address: KEEPIT_ADDRESS,
    abi: keepItAbi,
    functionName: 'localDay',
    args: [0],
    chainId: CHAIN_ID,
    query: { enabled, retry: false, staleTime: Infinity },
  })
  const countQ = useReadContract({
    address: KEEPIT_ADDRESS,
    abi: keepItAbi,
    functionName: 'goalCount',
    chainId: CHAIN_ID,
    query: { enabled, refetchInterval: poll },
  })
  const statsQ = useReadContract({
    address: KEEPIT_ADDRESS,
    abi: keepItAbi,
    functionName: 'stats',
    chainId: CHAIN_ID,
    query: { enabled, refetchInterval: poll },
  })

  const ids = useMemo(() => {
    const set = new Set<bigint>(myIdsQ.data ?? [])
    const count = countQ.data ?? 0n
    const first = count > BigInt(WALL_WINDOW) ? count - BigInt(WALL_WINDOW) + 1n : 1n
    for (let i = first; i <= count; i++) set.add(i)
    return [...set].sort((a, b) => (a < b ? -1 : 1))
  }, [myIdsQ.data, countQ.data])

  const goalsQ = useReadContracts({
    contracts: ids.map((id) => ({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'getGoal' as const,
      args: [id] as const,
      chainId: CHAIN_ID,
    })),
    query: { enabled: enabled && ids.length > 0, refetchInterval: poll },
  })

  const allKeeps = useMemo<Keep[]>(() => {
    const out: Keep[] = []
    for (const r of goalsQ.data ?? []) {
      if (r.status === 'success') out.push(toKeep(r.result, address))
    }
    return out.sort((a, b) => (a.id < b.id ? 1 : -1))
  }, [goalsQ.data, address])
  const myKeeps = useMemo(() => allKeeps.filter((k) => k.isMine), [allKeeps])

  const stats = useMemo<Stats>(() => {
    const s = statsQ.data
    return {
      goals: s ? Number(s[0]) : 0,
      totalKept: s ? s[2] : 0n,
      pool: s ? s[3] : 0n,
      totalPaidOut: s ? s[4] : 0n,
      keepers: new Set(allKeeps.map((k) => k.owner.toLowerCase())).size,
    }
  }, [statsQ.data, allKeeps])

  const wrongChain = isConnected && walletChain !== CHAIN_ID
  const refresh = () => qc.invalidateQueries()

  const switchToArc = async () => {
    await switchChainAsync({ chainId: CHAIN_ID })
  }
  const prepare = async (onStep?: OnStep) => {
    if (!address) throw new Error('Connect your wallet first')
    if (walletChain !== CHAIN_ID) {
      onStep?.('switch')
      await switchChainAsync({ chainId: CHAIN_ID })
    }
  }
  const wait = async (hash: `0x${string}`) => {
    if (!publicClient) throw new Error('network unavailable')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') throw new Error('Transaction reverted')
  }
  const ensureAllowance = async (total: bigint, onStep?: OnStep) => {
    if (!publicClient || !address) throw new Error('Connect your wallet first')
    const bal = balanceQ.data ?? (await publicClient.readContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [address] }))
    if (bal < total) throw new Error('Insufficient USDC balance')
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, KEEPIT_ADDRESS],
    })
    if (allowance >= total) return
    onStep?.('approve-sign')
    const hash = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [KEEPIT_ADDRESS, total],
      chainId: CHAIN_ID,
    })
    onStep?.('approve-wait')
    await wait(hash)
  }
  const sweepIdsFor = (target: bigint) =>
    allKeeps
      .filter((k) => k.id !== target && analyze(k, now).pendingMisses > 0)
      .slice(0, 64)
      .map((k) => k.id)

  const create = async (p: CreateParams, onStep?: OnStep) => {
    await prepare(onStep)
    await ensureAllowance(p.stakePerDay * BigInt(p.duration), onStep)
    onStep?.('sign')
    const hash = await writeContractAsync({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'createGoal',
      args: [p.name, p.emoji, p.duration, p.stakePerDay, { utcOffsetMinutes: browserOffsetMin(), windowStart: p.windowStart, windowEnd: p.windowEnd, minBalance: p.minBalance }],
      chainId: CHAIN_ID,
    })
    onStep?.('wait')
    await wait(hash)
    await refresh()
    return { hash }
  }
  const join = async (parentId: bigint, onStep?: OnStep) => {
    await prepare(onStep)
    const parent = await fetchKeep(parentId)
    if (!parent) throw new Error('UnknownGoal')
    await ensureAllowance(parent.stakePerDay * BigInt(parent.duration), onStep)
    onStep?.('sign')
    const hash = await writeContractAsync({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'joinChallenge',
      args: [parentId, browserOffsetMin()],
      chainId: CHAIN_ID,
    })
    onStep?.('wait')
    await wait(hash)
    await refresh()
    return { hash }
  }
  const checkIn = async (id: bigint, note: string, onStep?: OnStep) => {
    await prepare(onStep)
    onStep?.('sign')
    const hash = await writeContractAsync({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'checkIn',
      args: [id, note],
      chainId: CHAIN_ID,
    })
    onStep?.('wait')
    await wait(hash)
    await refresh()
    return { hash }
  }
  const claim = async (id: bigint, onStep?: OnStep) => {
    await prepare(onStep)
    onStep?.('sign')
    const hash = await writeContractAsync({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'claim',
      args: [id, sweepIdsFor(id)],
      chainId: CHAIN_ID,
    })
    onStep?.('wait')
    await wait(hash)
    await refresh()
    return { hash }
  }
  const sweep = async (sweepIds: bigint[], onStep?: OnStep) => {
    await prepare(onStep)
    onStep?.('sign')
    const hash = await writeContractAsync({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'markMissedBatch',
      args: [sweepIds.slice(0, 64)],
      chainId: CHAIN_ID,
    })
    onStep?.('wait')
    await wait(hash)
    await refresh()
    return { hash }
  }
  async function fetchKeep(id: bigint): Promise<Keep | undefined> {
    if (!publicClient) return undefined
    try {
      const v = await publicClient.readContract({ address: KEEPIT_ADDRESS, abi: keepItAbi, functionName: 'getGoal', args: [id] })
      return toKeep(v, address)
    } catch {
      return undefined
    }
  }
  const previewPayout = async (k: Keep): Promise<Payout> => {
    if (!publicClient) return { refund: 0n, poolShare: 0n }
    const [refund, poolShare] = await publicClient.readContract({
      address: KEEPIT_ADDRESS,
      abi: keepItAbi,
      functionName: 'previewPayout',
      args: [k.id],
    })
    return { refund, poolShare }
  }

  return {
    mode: 'live',
    connected: isConnected,
    address,
    wrongChain,
    switchToArc,
    balance: balanceQ.data,
    now,
    myKeeps,
    allKeeps,
    stats,
    loading: enabled && (countQ.isLoading || goalsQ.isLoading || (!!address && myIdsQ.isLoading)),
    incompatible: enabled && versionQ.isError && /revert/i.test(versionQ.error?.message ?? ''),
    error: enabled && (countQ.isError || goalsQ.isError || statsQ.isError || (!!address && myIdsQ.isError)),
    refetch: () => void refresh(),
    create,
    checkIn,
    claim,
    join,
    sweep,
    fetchKeep,
    previewPayout,
  }
}
