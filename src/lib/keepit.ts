import type { ReadContractReturnType } from 'viem'
import { arc } from 'viem/chains'
import { getUsdc } from '@/onchain-facts'
import { keepItAbi } from './keepitAbi'
import type { Keep } from './types'

/** KeepIt runs on Arc mainnet (chain ID 5042). */
export const ARC_CHAIN = arc
export const CHAIN_ID = ARC_CHAIN.id

// A build that is told to use a different chain would silently talk to the wrong network, so refuse to start.
const configuredChain = import.meta.env.VITE_CHAIN_ID as string | undefined
if (configuredChain && Number(configuredChain) !== CHAIN_ID) {
  throw new Error(`VITE_CHAIN_ID is ${configuredChain}, but this build only supports Arc mainnet (${CHAIN_ID}).`)
}

/** Stake limits per day, in 6-decimal USDC units. Must match the deployed contract. */
export const MIN_STAKE_PER_DAY = 10_000n
export const MAX_STAKE_PER_DAY = 5_000_000n
export const KEEPIT_ADDRESS = import.meta.env.VITE_KEEPIT_ADDRESS as `0x${string}`
const usdcFact = getUsdc(CHAIN_ID)
if (!usdcFact) throw new Error(`USDC is not registered for chain ${CHAIN_ID}`)
export const USDC_ADDRESS = usdcFact.address as `0x${string}`

export const DURATIONS = [7, 14, 30] as const
export const MAX_NAME = 48

export type GoalViewResult = ReadContractReturnType<typeof keepItAbi, 'getGoal'>

export function toKeep(v: GoalViewResult, me?: string): Keep {
  return {
    id: v.id,
    owner: v.owner,
    isMine: !!me && v.owner.toLowerCase() === me.toLowerCase(),
    name: v.name,
    emoji: v.emoji,
    stakePerDay: v.stakePerDay,
    duration: v.duration,
    startDay: v.startDay,
    mask: v.checkedMask,
    missedProcessed: v.missedDays,
    parentId: v.parentId,
    broken: v.broken,
    settled: v.settled,
    claimed: v.claimed,
    utcOffsetMin: v.utcOffsetMinutes,
    windowStart: v.windowStart,
    windowEnd: v.windowEnd,
    minBalance: v.minBalance,
  }
}
