import { useEffect, useState } from 'react'
import { getHarnessState } from '../api/harness'
import type { HarnessStateSnapshot } from '../types/harness'

interface SessionStateResult {
  snapshot: HarnessStateSnapshot | null
  error: string | null
}

export function useSessionState(sessionId: string | null): SessionStateResult {
  const [snapshot, setSnapshot] = useState<HarnessStateSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setSnapshot(null)
      setError(null)
      return
    }
    let cancelled = false
    getHarnessState(sessionId)
      .then((result) => {
        if (!cancelled) {
          setSnapshot(result)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return { snapshot, error }
}
