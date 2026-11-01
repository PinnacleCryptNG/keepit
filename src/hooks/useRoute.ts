import { useCallback, useEffect, useState } from 'react'

export type Tab = 'keeps' | 'start' | 'wall'
export type Route = { view: 'landing' } | { view: 'docs' } | { view: 'app'; tab: Tab }

const TABS: Tab[] = ['keeps', 'start', 'wall']

function read(): Route {
  const p = new URLSearchParams(window.location.search)
  if (p.has('docs')) return { view: 'docs' }
  const app = p.get('app')
  if (app !== null) return { view: 'app', tab: TABS.includes(app as Tab) ? (app as Tab) : 'keeps' }
  // A friend challenge link always opens the app.
  if (p.has('join')) return { view: 'app', tab: 'keeps' }
  return { view: 'landing' }
}

/** Query-string routing, so every URL is the same static page (no host rewrites needed). */
export function useRoute() {
  const [route, setRoute] = useState<Route>(read)

  useEffect(() => {
    const onPop = () => setRoute(read())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((next: Route) => {
    const p = new URLSearchParams(window.location.search)
    p.delete('app')
    p.delete('docs')
    if (next.view === 'app') p.set('app', next.tab)
    if (next.view === 'docs') p.set('docs', '1')
    p.delete('join')
    const qs = p.toString()
    window.history.pushState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    setRoute(next)
    window.scrollTo({ top: 0 })
  }, [])

  return { route, go }
}
