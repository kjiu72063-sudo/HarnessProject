import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchSessions, getHarnessState, resumeHarness, startHarness } from './harness'
import { buildState } from '../test/factories'

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

describe('startHarness', () => {
  it('POST /api/harness/start with JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ session_id: 'sess-1', status: 'running' }))
    const result = await startHarness({
      project_id: 'proj-1',
      requirement: '做一个记账应用',
      tech_stack: buildState().tech_stack,
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/harness/start', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: expect.any(String),
    })
    const call = fetchMock.mock.calls[0]
    const init = call[1] as RequestInit
    expect(JSON.parse(init.body as string)).toEqual({
      project_id: 'proj-1',
      requirement: '做一个记账应用',
      tech_stack: buildState().tech_stack,
    })
    expect(result).toEqual({ session_id: 'sess-1', status: 'running' })
  })
})

describe('getHarnessState', () => {
  it('GET /api/harness/{sid}/state with relative path', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ session_id: 'sess-9', status: 'running', next: [], state: buildState() }),
    )
    const result = await getHarnessState('sess-9')
    expect(fetchMock).toHaveBeenCalledWith('/api/harness/sess-9/state', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(result.session_id).toBe('sess-9')
  })
})

describe('resumeHarness', () => {
  it('POST /api/harness/{sid}/resume with gate decision body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: 'running', next: ['coding_agent'], state: buildState() }),
    )
    const result = await resumeHarness('sess-9', { gate: 'design_approval', decision: true })
    expect(fetchMock).toHaveBeenCalledWith('/api/harness/sess-9/resume', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ gate: 'design_approval', decision: true }),
    })
    expect(result.status).toBe('running')
  })
})

describe('error handling', () => {
  it('throws detail message from FastAPI error body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: '会话不存在' }, 404))
    await expect(getHarnessState('missing')).rejects.toThrow('会话不存在')
  })

  it('falls back to HTTP status when body has no detail', async () => {
    fetchMock.mockResolvedValue(new Response('not json', { status: 500 }))
    await expect(getHarnessState('boom')).rejects.toThrow('请求失败 (HTTP 500)')
  })
})

describe('fetchSessions', () => {
  it('GET /api/harness/sessions returns session list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      sessions: [
        {
          session_id: 'sess-1',
          status: 'interrupted',
          project_id: 'proj-1',
          current_stage: 'prototype_confirmation',
          requirement_summary: 'build a todo app',
          started_at: 1700000000.0,
        },
      ],
      total: 1,
    }))
    const result = await fetchSessions()
    expect(fetchMock).toHaveBeenCalledWith('/api/harness/sessions', {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(result.total).toBe(1)
    expect(result.sessions[0].session_id).toBe('sess-1')
    expect(result.sessions[0].status).toBe('interrupted')
  })
})
