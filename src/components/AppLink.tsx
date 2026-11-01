import type { ReactNode } from 'react'

/** A real link (right-click, new tab, copy address all work) that navigates in place on a normal click. */
export function AppLink({ href, onGo, className = '', children, ...rest }: { href: string; onGo: () => void; className?: string; children: ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        onGo()
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
