import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useConstraints } from './useConstraints'
import { buildConstraint } from '../test/factories'
import type { Constraint } from '../types/constraints'

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
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

describe('useConstraints loading', () => {
  it('loads constraints on mount and exposes them', async () => {
    fetchMock.mockResolvedValue(jsonResponse([buildConstraint({ title: '规则A' })]))
    const { result } = renderHook(() => useConstraints('proj-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.constraints).toHaveLength(1)
    expect(result.current.constraints[0]?.title).toBe('规则A')
    expect(result.current.error).toBeNull()
  })

  it('exposes error message when load fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: '加载失败' }, 500))
    const { result } = renderHook(() => useConstraints('proj-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('加载失败')
    expect(result.current.constraints).toHaveLength(0)
  })
})

describe('useConstraints mutations', () => {
  it('update applies optimistic state replacement for the target id', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([buildConstraint({ id: 3 })]))
    const { result } = renderHook(() => useConstraints('proj-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    fetchMock.mockResolvedValueOnce(
      jsonResponse(buildConstraint({ id: 3, enabled: false })),
    )
    let updated: Constraint | undefined
    await act(async () => {
      updated = await result.current.update(3, { enabled: false })
    })
    expect(updated?.enabled).toBe(false)
    expect(result.current.constraints[0]?.enabled).toBe(false)
  })

  it('create reloads the list after success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]))
    const { result } = renderHook(() => useConstraints('proj-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    fetchMock.mockResolvedValueOnce(jsonResponse(buildConstraint({ id: 9 })))
    fetchMock.mockResolvedValueOnce(
      jsonResponse([buildConstraint({ id: 9, title: '新规则' })]),
    )
    await act(async () => {
      await result.current.create({
        project_id: 'proj-1',
        title: '新规则',
        detail: '',
        rule_type: 'static_text',
        enforcer: 'ruff',
      })
    })
    await waitFor(() =>
      expect(result.current.constraints[0]?.title).toBe('新规则'),
    )
  })
})
