import type { ReadContractReturnType } from 'viem'
import { arc } from 'viem/chains'
import { getUsdc } from '@/onchain-facts'
import { keepItAbi } from './keepitAbi'
import type { Keep } from './types'

export const CHAIN_ID = arc.id
export const KEEPIT_ADDRESS = import.meta.env.VITE_KEEPIT_ADDRESS as `0x${string}`
const usdcFact = getUsdc(CHAIN_ID)
if (!usdcFact) throw new Error('USDC is not registered for Arc')
export const USDC_ADDRESS = usdcFact.address as `0x${string}`

export const DURATIONS = [7, 14, 30] as const
export const MAX_NOTE = 280

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
  }
}
