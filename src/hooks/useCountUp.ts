import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'

/** Eases a displayed number toward `target`. Returns the target as-is when motion is reduced. */
export function useCountUp(target: number, ms = 900): number {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [value, setValue] = useState(target)
  const from = useRef(target)

  useEffect(() => {
    if (reduced) return
    const start = performance.now()
    const begin = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = begin + (target - begin) * eased
      from.current = v
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, reduced])

  return reduced ? target : value
}
