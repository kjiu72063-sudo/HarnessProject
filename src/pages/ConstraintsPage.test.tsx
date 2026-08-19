import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConstraintsPage } from './ConstraintsPage'
import { buildSnapshot, buildState } from '../test/factories'

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

describe('ConstraintsPage 静态规则表', () => {
  it('renders rules table with enforced badges', () => {
    render(<ConstraintsPage sessionId={null} />)
    expect(screen.getByText('AGENTS.md 硬性规则')).toBeInTheDocument()
    expect(screen.getByText('API 相对路径')).toBeInTheDocument()
    expect(screen.getByText('禁裸 print()')).toBeInTheDocument()
    expect(screen.getByText('13 条')).toBeInTheDocument()
    expect(screen.getAllByText('已机械化').length).toBeGreaterThan(0)
    expect(screen.getAllByText('人工审查').length).toBeGreaterThan(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders linter engines table', () => {
    render(<ConstraintsPage sessionId={null} />)
    expect(screen.getByText('Linter 引擎')).toBeInTheDocument()
    expect(screen.getByText('dependency-cruiser')).toBeInTheDocument()
    expect(screen.getByText('import-linter')).toBeInTheDocument()
    expect(screen.getByText('6 个')).toBeInTheDocument()
  })

  it('renders 14 verify gates with pending dashes when no session', () => {
    render(<ConstraintsPage sessionId={null} />)
    expect(screen.getByText('verify.sh 闸门结果')).toBeInTheDocument()
    expect(screen.getByText(/TypeScript Check/)).toBeInTheDocument()
    expect(screen.getByText(/Port Consistency/)).toBeInTheDocument()
    expect(screen.getByText('未运行')).toBeInTheDocument()
    expect(screen.getAllByText('--').length).toBe(14)
  })
})

describe('ConstraintsPage 闸门结果渲染', () => {
  it('shows PASS gates when verify_result.pass is true', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          state: buildState({
            verify_result: { pass: true, summary: '14 项全通过' },
          }),
        }),
      ),
    )
    render(<ConstraintsPage sessionId="sess-ok" />)
    expect(await screen.findByText('全部通过')).toBeInTheDocument()
    expect(screen.getByText('14 项全通过')).toBeInTheDocument()
    expect(screen.getAllByText('PASS').length).toBe(14)
  })

  it('shows FAIL gates when verify_result.pass is false', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          state: buildState({
            verify_result: { pass: false, summary: '2 项失败' },
          }),
        }),
      ),
    )
    render(<ConstraintsPage sessionId="sess-bad" />)
    expect(await screen.findByText('存在失败')).toBeInTheDocument()
    expect(screen.getAllByText('FAIL').length).toBe(14)
  })

  it('displays fetch error under gate results', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: '会话不存在' }), { status: 404 }),
    )
    render(<ConstraintsPage sessionId="missing" />)
    expect(await screen.findByText('闸门数据拉取失败: 会话不存在')).toBeInTheDocument()
  })
})
