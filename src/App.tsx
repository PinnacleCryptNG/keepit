import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/app/AppShell'
import { CreateKeep } from '@/app/CreateKeep'
import { DemoBar } from '@/app/DemoBar'
import { JoinSheet } from '@/app/JoinSheet'
import { KeepSheet } from '@/app/KeepSheet'
import { Today } from '@/app/Today'
import { Wall } from '@/app/Wall'
import { useDemoEngine } from '@/hooks/useDemoEngine'
import { useLiveEngine } from '@/hooks/useLiveEngine'
import { useMode } from '@/hooks/useMode'
import { useRoute, type Tab } from '@/hooks/useRoute'
import { Docs } from '@/landing/Docs'
import { Landing } from '@/landing/Landing'
import { analyze } from '@/lib/types'

function readJoinId(): bigint | null {
  const p = new URLSearchParams(window.location.search).get('join')
  return p && /^\d{1,18}$/.test(p) ? BigInt(p) : null
}

export default function App() {
  const { mode, setMode } = useMode()
  const live = useLiveEngine(mode === 'live')
  const demo = useDemoEngine()
  const api = mode === 'live' ? live : demo
  const { route, go } = useRoute()
  const viewKey = route.view === 'app' ? `app-${route.tab}` : route.view
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [viewKey])

  const [openId, setOpenId] = useState<bigint | null>(null)
  const [joinId, setJoinId] = useState<bigint | null>(readJoinId)

  const toApp = useCallback((m: 'demo' | 'live', tab: Tab = 'keeps') => {
    setMode(m)
    setOpenId(null)
    go({ view: 'app', tab })
  }, [setMode, go])

  const closeJoin = useCallback(() => {
    setJoinId(null)
    const p = new URLSearchParams(window.location.search)
    p.delete('join')
    p.delete('demo')
    const qs = p.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
  }, [])

  if (route.view === 'docs') {
    return <Docs onHome={() => go({ view: 'landing' })} onApp={() => toApp('demo')} onDocs={() => go({ view: 'docs' })} />
  }

  if (route.view === 'landing') {
    return (
      <Landing
        demo={demo}
        onDemo={() => toApp('demo')}
        onStart={() => toApp('live', 'start')}
        onWall={() => toApp('demo', 'wall')}
        onDocs={() => go({ view: 'docs' })}
      />
    )
  }

  const tab = route.tab
  const goTab = (t: Tab) => {
    setOpenId(null)
    go({ view: 'app', tab: t })
  }
  const claimable = api.myKeeps.filter((k) => analyze(k, api.now).ended && !k.claimed).length

  return (
    <>
      <AppShell
        api={api}
        mode={mode}
        tab={tab}
        badge={claimable}
        onTab={goTab}
        onMode={(m) => {
          setMode(m)
          setOpenId(null)
        }}
        onHome={() => go({ view: 'landing' })}
        onOpen={setOpenId}
      >
        {api.demo && tab === 'keeps' && (
          <div className="mb-6">
            <DemoBar demo={api.demo} />
          </div>
        )}
        <motion.div key={`${tab}-${mode}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
            {tab === 'keeps' && <Today api={api} onOpen={setOpenId} onStart={() => goTab('start')} onDemo={() => { setMode('demo'); setOpenId(null) }} />}
            {tab === 'start' && <CreateKeep api={api} onCreated={() => goTab('keeps')} />}
            {tab === 'wall' && <Wall api={api} onStart={() => goTab('start')} onOpen={setOpenId} />}
        </motion.div>
      </AppShell>
      <KeepSheet api={api} id={openId} onClose={() => setOpenId(null)} />
      <JoinSheet api={api} parentId={joinId} onClose={closeJoin} onJoined={() => { closeJoin(); goTab('keeps') }} />
    </>
  )
}
