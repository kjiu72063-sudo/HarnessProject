import { useCallback, useEffect, useState } from 'react'
import '@xyflow/react/dist/style.css'
import { Header } from './components/Header'
import { Sidebar, type PageId } from './components/Sidebar'
import { fetchSessions } from './api/harness'
import { ArtifactsPage } from './pages/ArtifactsPage'
import { ConstraintsPage } from './pages/ConstraintsPage'
import { PipelinePage } from './pages/PipelinePage'
import { RequirementPage } from './pages/RequirementPage'

export function App() {
  const [page, setPage] = useState<PageId>('requirement')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [navSeq, setNavSeq] = useState(0)

  useEffect(() => {
    void fetchSessions()
      .then((data) => {
        if (data.sessions.length > 0) {
          setSessionId(data.sessions[0].session_id)
        }
      })
      .catch(() => {})
  }, [])

  const handleNavigate = useCallback((target: PageId) => {
    setPage(target)
    setNavSeq((seq) => seq + 1)
  }, [])

  const handleSessionStarted = useCallback((startedSessionId: string) => {
    setSessionId(startedSessionId)
    setPage('pipeline')
    setNavSeq((seq) => seq + 1)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg text-app-text">
      <Sidebar active={page} onNavigate={handleNavigate} sessionActive={sessionId !== null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {page === 'requirement' && (
            <RequirementPage key={navSeq} onSessionStarted={handleSessionStarted} />
          )}
          {page === 'pipeline' && (
            <PipelinePage key={navSeq} sessionId={sessionId} onNavigate={handleNavigate} />
          )}
          {page === 'constraints' && <ConstraintsPage key={navSeq} sessionId={sessionId} />}
          {page === 'artifacts' && <ArtifactsPage key={navSeq} sessionId={sessionId} />}
        </main>
      </div>
    </div>
  )
}
