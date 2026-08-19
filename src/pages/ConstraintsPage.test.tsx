import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConstraintsPage } from './ConstraintsPage'
import { buildSnapshot, buildState } from '../test/factories'
import type { Constraint } from '../types/constraints'

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildConstraint(overrides: Partial<Constraint> = {}): Constraint {
  return {
    id: 1,
    project_id: '',
    source: 'agents_md',
    source_key: 'agents-md-rule-1',
    rule_no: 1,
    title: '前端 API 相对路径',
    detail: '禁止硬编码域名/IP/localhost',
    rule_type: 'static_text',
    enforcer: 'dependency-cruiser',
    enforcement: 'mechanized',
    gate_ids: [4],
    enabled: true,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-20T00:00:00Z',
    ...overrides,
  }
}

function mockFetchByRoute(routes: Record<string, unknown>): void {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)
    for (const [path, body] of Object.entries(routes)) {
      if (url.includes(path)) {
        return Promise.resolve(jsonResponse(body))
      }
    }
    return Promise.resolve(jsonResponse({}, 404))
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('ConstraintsPage 静态区', () => {
  it('renders linter engines table', () => {
    mockFetchByRoute({ '/api/constraints': [] })
    render(<ConstraintsPage sessionId={null} />)
    expect(screen.getByText('Linter 引擎')).toBeInTheDocument()
    expect(screen.getByText('dependency-cruiser')).toBeInTheDocument()
    expect(screen.getByText('import-linter')).toBeInTheDocument()
    expect(screen.getByText('6 个')).toBeInTheDocument()
  })

  it('renders 14 verify gates with pending dashes when no session', async () => {
    mockFetchByRoute({ '/api/constraints': [] })
    render(<ConstraintsPage sessionId={null} />)
    expect(screen.getByText('verify.sh 闸门结果')).toBeInTheDocument()
    expect(screen.getByText(/TypeScript Check/)).toBeInTheDocument()
    expect(screen.getByText(/Port Consistency/)).toBeInTheDocument()
    expect(screen.getByText('未运行')).toBeInTheDocument()
    expect(screen.getAllByText('--').length).toBe(14)
    await waitFor(() => expect(screen.getByText('系统规则 · 0 条')).toBeInTheDocument())
  })

  it('renders constraint rules loaded from api', async () => {
    mockFetchByRoute({
      '/api/constraints': [
        buildConstraint(),
        buildConstraint({
          id: 2,
          source: 'manual',
          source_key: 'manual-2',
          rule_no: 2,
          title: '禁止裸 print',
          detail: '后端统一使用 logging',
          rule_type: 'static_text',
          enforcer: 'ruff',
        }),
      ],
    })
    render(<ConstraintsPage sessionId={null} />)
    expect(await screen.findByText('前端 API 相对路径')).toBeInTheDocument()
    expect(screen.getByText('禁止裸 print')).toBeInTheDocument()
    expect(screen.getByText('agents_md')).toBeInTheDocument()
    expect(screen.getByText('manual')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/constraints', expect.anything())
  })
})

describe('ConstraintsPage 闸门结果渲染', () => {
  it('renders per-gate PASS and FAIL from gates array', async () => {
    const gates = Array.from({ length: 14 }, (_, index) => ({
      gate_id: index + 1,
      name: `gate-${index + 1}`,
      pass: index !== 2,
    }))
    mockFetchByRoute({
      '/api/constraints': [],
      '/api/harness/sess-mixed/state': buildSnapshot({
        state: buildState({
          project_id: 'proj-1',
          verify_result: { pass: false, summary: '1 项失败', gates },
        }),
      }),
    })
    render(<ConstraintsPage sessionId="sess-mixed" />)
    expect(await screen.findByText('存在失败')).toBeInTheDocument()
    expect(screen.getByText('1 项失败')).toBeInTheDocument()
    expect(screen.getAllByText('PASS').length).toBe(13)
    expect(screen.getAllByText('FAIL').length).toBe(1)
  })

  it('shows all-pass badge and summary when every gate passes', async () => {
    const gates = Array.from({ length: 14 }, (_, index) => ({
      gate_id: index + 1,
      name: `gate-${index + 1}`,
      pass: true,
    }))
    mockFetchByRoute({
      '/api/constraints': [],
      '/api/harness/sess-ok/state': buildSnapshot({
        state: buildState({ project_id: 'proj-1', verify_result: { pass: true, summary: '14 项全通过', gates } }),
      }),
    })
    render(<ConstraintsPage sessionId="sess-ok" />)
    expect(await screen.findByText('全部通过')).toBeInTheDocument()
    expect(screen.getByText('14 项全通过')).toBeInTheDocument()
    expect(screen.getAllByText('PASS').length).toBe(14)
})

    expect(screen.queryByText('FAIL')).not.toBeInTheDocument()
  })

describe('ConstraintsPage 会话数据与错误', () => {
  it('requests project-scoped constraints when session has project_id', async () => {
    mockFetchByRoute({
      '/api/constraints': [buildConstraint({ project_id: 'proj-9' })],
      '/api/harness/sess-scoped/state': buildSnapshot({
        state: buildState({ project_id: 'proj-9' }),
      }),
    })
    render(<ConstraintsPage sessionId="sess-scoped" />)
    expect(await screen.findByText('前端 API 相对路径')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/constraints?project_id=proj-9',
        expect.anything(),
      ),
    )
  })

  it('displays fetch error under gate results', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/constraints')) {
        return Promise.resolve(jsonResponse([]))
      }
      return Promise.resolve(
        new Response(JSON.stringify({ detail: '会话不存在' }), { status: 404 }),
      )
    })
    render(<ConstraintsPage sessionId="missing" />)
    expect(await screen.findByText('闸门数据拉取失败: 会话不存在')).toBeInTheDocument()
  })
})

