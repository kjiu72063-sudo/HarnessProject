import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionState } from './useSessionState'
import { buildSnapshot } from '../test/factories'

const fetchMock = vi.fn()

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('useSessionState', () => {
  it('returns null snapshot when sessionId is null', () => {
    const { result } = renderHook(() => useSessionState(null))
    expect(result.current.snapshot).toBeNull()
    expect(result.current.error).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads snapshot for a session', async () => {
    const snapshot = buildSnapshot({ session_id: 'sess-5' })
    fetchMock.mockResolvedValue(jsonResponse(snapshot))
    const { result } = renderHook(() => useSessionState('sess-5'))
    await waitFor(() => expect(result.current.snapshot?.session_id).toBe('sess-5'))
    expect(result.current.error).toBeNull()
  })

  it('surfaces fetch error message', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: '会话不存在' }), { status: 404 }),
    )
    const { result } = renderHook(() => useSessionState('missing'))
    await waitFor(() => expect(result.current.error).toBe('会话不存在'))
  })

  it('ignores stale response after session change', async () => {
    let resolveFirst: (value: Response) => void = () => undefined
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirst = resolve
        }),
    )
    fetchMock.mockResolvedValueOnce(jsonResponse(buildSnapshot({ session_id: 'sess-2' })))

    const { result, rerender } = renderHook(({ id }) => useSessionState(id), {
      initialProps: { id: 'sess-1' },
    })

    rerender({ id: 'sess-2' })
    await waitFor(() => expect(result.current.snapshot?.session_id).toBe('sess-2'))

    resolveFirst(jsonResponse(buildSnapshot({ session_id: 'sess-1' })))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current.snapshot?.session_id).toBe('sess-2')
  })
})
