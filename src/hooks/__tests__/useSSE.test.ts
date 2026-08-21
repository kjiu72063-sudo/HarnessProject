import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSSE } from '../useSSE'

class MockEventSource {
  url = ''
  readyState = 1
  private listeners: Record<string, EventListener[]> = {}
  onerror: ((ev: Event) => void) | null = null
  static instances: MockEventSource[] = []
  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }
  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(listener)
  }
  emit(type: string, data: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    for (const listener of this.listeners[type] ?? []) listener(event)
  }
  close() { this.readyState = 2 }
}

const OriginalES = globalThis.EventSource

async function flush(): Promise<void> {
  return act(async () => { await Promise.resolve() })
}

describe('useSSE 连接与生命周期', () => {
  beforeEach(() => {
    MockEventSource.instances = []
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource
  })
  afterEach(() => {
    globalThis.EventSource = OriginalES
    vi.restoreAllMocks()
  })

  it('creates EventSource with correct URL on mount', async () => {
    renderHook(() => useSSE('sess-123'))
    await flush()
    expect(MockEventSource.instances).toHaveLength(1)
    expect(MockEventSource.instances[0].url).toBe('/api/harness/sess-123/stream')
  })

  it('does not create EventSource when sessionId is null', async () => {
    renderHook(() => useSSE(null))
    await flush()
    expect(MockEventSource.instances).toHaveLength(0)
  })

  it('closes EventSource on unmount', async () => {
    const { unmount } = renderHook(() => useSSE('sess-unmount'))
    await flush()
    const es = MockEventSource.instances[0]
    unmount()
    expect(es.readyState).toBe(2)
  })
})

describe('useSSE 事件处理', () => {
  beforeEach(() => {
    MockEventSource.instances = []
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource
  })
  afterEach(() => {
    globalThis.EventSource = OriginalES
    vi.restoreAllMocks()
  })

  it('updates data on snapshot event', async () => {
    const { result } = renderHook(() => useSSE('sess-snap'))
    await flush()
    const es = MockEventSource.instances[0]
    act(() => {
      es.emit('snapshot', { session_id: 'sess-snap', status: 'running', next: [], state: {} })
    })
    expect(result.current.data).not.toBeNull()
    expect(result.current.data?.status).toBe('running')
  })

  it('sets error on error event', async () => {
    const { result } = renderHook(() => useSSE('sess-err'))
    await flush()
    const es = MockEventSource.instances[0]
    act(() => { es.emit('error', { message: '执行异常' }) })
    expect(result.current.error).toBe('执行异常')
  })

  it('sets connected=false on done event', async () => {
    const { result } = renderHook(() => useSSE('sess-done'))
    await flush()
    const es = MockEventSource.instances[0]
    act(() => { es.emit('done', {}) })
    expect(result.current.connected).toBe(false)
  })

  it('invokes onSnapshot handler', async () => {
    const onSnapshot = vi.fn()
    renderHook(() => useSSE('sess-handler', { onSnapshot }))
    await flush()
    const es = MockEventSource.instances[0]
    const snapshot = { session_id: 'sess-handler', status: 'running', next: [], state: {} }
    act(() => { es.emit('snapshot', snapshot) })
    expect(onSnapshot).toHaveBeenCalledWith(snapshot)
  })
})
