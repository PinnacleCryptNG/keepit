import { useCallback, useState } from 'react'
import type { Mode } from '@/lib/types'

const KEY = 'keepit-mode'

function initial(): Mode {
  const params = new URLSearchParams(window.location.search)
  if (params.get('demo') === '1') return 'demo'
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'live' || saved === 'demo') return saved
  } catch {
    /* storage can be blocked inside an iframe */
  }
  // A real friend invite lands on live data; everyone else starts in the seeded demo.
  return params.has('join') ? 'live' : 'demo'
}

export function useMode() {
  const [mode, setModeState] = useState<Mode>(initial)
  const setMode = useCallback((m: Mode) => {
    setModeState(m)
    try {
      localStorage.setItem(KEY, m)
    } catch {
      /* ignore */
    }
  }, [])
  return { mode, setMode }
}
