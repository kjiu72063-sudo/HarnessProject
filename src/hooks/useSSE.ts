import { useCallback, useEffect, useRef, useState } from 'react'
import type { HarnessStateSnapshot } from '../types/harness'
import type {
  SSEEventType,
  SSEStageEvent,
  SSEStatusEvent,
  SSEGateEvent,
  SSEErrorEvent,
  SSEHeartbeatEvent,
} from '../types/sse'

export interface SSEState {
  data: HarnessStateSnapshot | null
  error: string | null
  connected: boolean
}

interface SSEHandlers {
  onSnapshot?: (snapshot: HarnessStateSnapshot) => void
  onStageStart?: (event: SSEStageEvent) => void
  onStageEnd?: (event: SSEStageEvent) => void
  onStatus?: (event: SSEStatusEvent) => void
  onGate?: (event: SSEGateEvent) => void
  onError?: (event: SSEErrorEvent) => void
  onHeartbeat?: (event: SSEHeartbeatEvent) => void
}

const SSE_EVENT_TYPES: SSEEventType[] = [
  'snapshot', 'status', 'stage-start', 'stage-end',
  'gate', 'done', 'error', 'heartbeat',
]

function dispatchSSEEvent(
  e: MessageEvent,
  handlers: SSEHandlers | undefined,
  setData: (d: HarnessStateSnapshot | null) => void,
  setError: (e: string | null) => void,
  setConnected: (c: boolean) => void,
): void {
  const eventType = e.type as SSEEventType
  try {
    const payload = e.data ? JSON.parse(e.data) : {}
    switch (eventType) {
      case 'snapshot':
        setData(payload as HarnessStateSnapshot)
        handlers?.onSnapshot?.(payload as HarnessStateSnapshot)
        break
      case 'status':
        handlers?.onStatus?.(payload as SSEStatusEvent)
        break
      case 'stage-start':
        handlers?.onStageStart?.(payload as SSEStageEvent)
        break
      case 'stage-end':
        handlers?.onStageEnd?.(payload as SSEStageEvent)
        break
      case 'gate':
        handlers?.onGate?.(payload as SSEGateEvent)
        break
      case 'done':
        setConnected(false)
        break
      case 'error':
        setError((payload as SSEErrorEvent).message)
        handlers?.onError?.(payload as SSEErrorEvent)
        setConnected(false)
        break
      case 'heartbeat':
        handlers?.onHeartbeat?.(payload as SSEHeartbeatEvent)
        break
    }
  } catch {
    setError('SSE 事件解析失败')
  }
}

/**
 * useSSE — F007 SSE 实时推送 hook。
 * 轮询回退不保留（开放问题②裁决）：EventSource 内置重连；
 * 404 直接终止。首版单订阅（开放问题③裁决）。
 */
export function useSSE(
  sessionId: string | null,
  handlers?: SSEHandlers,
): SSEState {
  const [data, setData] = useState<HarnessStateSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const handleMessage = useCallback((e: MessageEvent) => {
    dispatchSSEEvent(e, handlersRef.current, setData, setError, setConnected)
  }, [setData, setError, setConnected])

  useEffect(() => {
    if (!sessionId) {
      setConnected(false)
      return
    }
    const url = `/api/harness/${sessionId}/stream`
    const es = new EventSource(url)
    setConnected(true)
    setError(null)

    for (const t of SSE_EVENT_TYPES) {
      es.addEventListener(t, handleMessage)
    }

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setConnected(false)
      }
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [sessionId, handleMessage])

  return { data, error, connected }
}
