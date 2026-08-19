import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createConstraint, listConstraints, updateConstraint } from './constraints'
import { buildConstraint } from '../test/factories'

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

describe('listConstraints', () => {
  it('GET /api/constraints?project_id={pid} with relative path', async () => {
    fetchMock.mockResolvedValue(jsonResponse([buildConstraint()]))
    const result = await listConstraints('proj-1')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/constraints?project_id=proj-1',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.rule_type).toBe('static_text')
  })

  it('throws backend detail message on 422', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: [{ msg: 'project_id 长度不足' }] }, 422),
    )
    await expect(listConstraints('x')).rejects.toThrow('project_id 长度不足')
  })
})

describe('createConstraint', () => {
  it('POST /api/constraints with JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(buildConstraint({ id: 9, title: '禁用裸 print' })))
    const result = await createConstraint({
      project_id: 'proj-1',
      title: '禁用裸 print',
      detail: '统一 logging',
      rule_type: 'static_text',
      enforcer: 'ruff',
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/constraints', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        project_id: 'proj-1',
        title: '禁用裸 print',
        detail: '统一 logging',
        rule_type: 'static_text',
        enforcer: 'ruff',
      }),
    })
    expect(result.title).toBe('禁用裸 print')
  })
})

describe('updateConstraint', () => {
  it('PUT /api/constraints/{id} with enabled toggle', async () => {
    fetchMock.mockResolvedValue(jsonResponse(buildConstraint({ id: 3, enabled: false })))
    const result = await updateConstraint(3, { enabled: false })
    expect(fetchMock).toHaveBeenCalledWith('/api/constraints/3', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ enabled: false }),
    })
    expect(result.enabled).toBe(false)
  })

  it('throws detail message on 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: '约束不存在' }, 404))
    await expect(updateConstraint(99, { enabled: true })).rejects.toThrow('约束不存在')
  })
})
