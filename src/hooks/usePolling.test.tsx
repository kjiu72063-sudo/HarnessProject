import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePolling } from './usePolling'

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('usePolling 数据获取', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches immediately and exposes data', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 42 })
    const { result } = renderHook(() => usePolling(fetcher, 2000, true))
    await flush()
    expect(result.current.data).toEqual({ value: 42 })
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('records error when fetcher rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('网络中断'))
    const { result } = renderHook(() => usePolling(fetcher, 2000, true))
    await flush()
    expect(result.current.error).toBe('网络中断')
    expect(result.current.data).toBeNull()
  })
})

describe('usePolling 定时与清理', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls on interval and stops after unmount', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { unmount } = renderHook(() => usePolling(fetcher, 2000, true))
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)

    unmount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not fetch when disabled', () => {
    vi.useFakeTimers()
    const fetcher = vi.fn().mockResolvedValue('ok')
    renderHook(() => usePolling(fetcher, 2000, false))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('refresh re-runs the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result } = renderHook(() => usePolling(fetcher, 2000, true))
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.refresh()
    })
    await flush()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
