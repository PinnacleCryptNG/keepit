import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'keepit-theme'
const listeners = new Set<() => void>()

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage can be blocked inside an iframe */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let current: Theme = read()
document.documentElement.dataset.theme = current

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setTheme(next: Theme) {
  current = next
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
