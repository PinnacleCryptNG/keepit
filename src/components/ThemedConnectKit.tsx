import type { ReactNode } from 'react'
import { ConnectKitProvider } from 'connectkit'
import { useTheme } from '@/hooks/useTheme'

export function ThemedConnectKit({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <ConnectKitProvider mode={theme} customTheme={{ '--ck-font-family': "'DM Sans', sans-serif", '--ck-border-radius': '20px' }}>
      {children}
    </ConnectKitProvider>
  )
}
