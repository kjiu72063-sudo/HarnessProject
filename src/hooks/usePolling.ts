import { useCallback, useEffect, useRef, useState } from 'react'

export interface PollingState<T> {
  data: T | null
  error: string | null
  loading: boolean
  refresh: () => void
}

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number, enabled: boolean): PollingState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) {
      return
    }
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const result = await fetcherRef.current()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void run()
    const timer = setInterval(() => {
      void run()
    }, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled, intervalMs, tick])

  const refresh = useCallback(() => {
    setTick((current) => current + 1)
  }, [])

  return { data, error, loading, refresh }
}
