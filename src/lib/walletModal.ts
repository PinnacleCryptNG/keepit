import { useSyncExternalStore } from 'react'

let isOpen = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Opens or closes the wallet dialog from anywhere in the app. */
export function useWalletModal() {
  const open = useSyncExternalStore(subscribe, () => isOpen)
  return {
    isOpen: open,
    open: () => {
      isOpen = true
      emit()
    },
    close: () => {
      isOpen = false
      emit()
    },
  }
}
