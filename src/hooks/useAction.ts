import { createElement, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { CHAIN_ID } from '@/lib/keepit'
import { parseError } from '@/lib/format'
import type { OnStep, Step, TxResult } from '@/lib/types'

export const STEP_LABEL: Record<Step, string> = {
  switch: 'Switching to Arc mainnet...',
  'approve-sign': 'Allow USDC in your wallet...',
  'approve-wait': 'Confirming allowance...',
  sign: 'Confirm in your wallet...',
  wait: 'Confirming on Arc mainnet...',
}

/** Runs one onchain (or demo) action and tracks real wallet / confirmation steps. */
export function useAction() {
  const [step, setStep] = useState<Step | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hash, setHash] = useState<string>()

  const run = useCallback(async (fn: (onStep: OnStep) => Promise<TxResult>, success?: string): Promise<boolean> => {
    setError(null)
    setStep('sign')
    try {
      const res = await fn(setStep)
      setHash(res.hash)
      if (success) {
        toast.success(
          res.hash
            ? createElement(
                'span',
                null,
                success + ' ',
                createElement('a', { href: buildTxExplorerUrl(CHAIN_ID, res.hash), target: '_blank', rel: 'noreferrer', style: { textDecoration: 'underline' } }, 'View'),
              )
            : success,
        )
      }
      return true
    } catch (e) {
      const msg = parseError(e)
      if (msg) {
        setError(msg)
        toast.error(msg)
      }
      return false
    } finally {
      setStep(null)
    }
  }, [])

  return { run, busy: step !== null, label: step ? STEP_LABEL[step] : null, error, hash }
}
