import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ArtifactsPage } from './ArtifactsPage'
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

describe('ArtifactsPage 统计与文件树', () => {
  it('renders empty placeholders without a session', () => {
    render(<ArtifactsPage sessionId={null} />)
    expect(screen.getByText('产物管理')).toBeInTheDocument()
    expect(screen.getByText('无活动会话')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBe(2)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('暂无产物文件 · 编码阶段完成后自动生成')).toBeInTheDocument()
    expect(screen.getByText('未运行')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders stats and file tree from session state', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          session_id: 'sess-art',
          state: buildState({
            worktree_branch: 'feat/f006',
            verify_result: { pass: true, summary: '14 项全通过' },
            test_result: { pass: true, coverage: 0.9955 },
            code_artifacts: [
              { path: 'src/App.tsx', lines: 47 },
              { path: 'src/api/harness.ts', lines: 48 },
              { path: 'server/routes/harness.py', lines: 200 },
            ],
          }),
        }),
      ),
    )
    render(<ArtifactsPage sessionId="sess-art" />)

    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(screen.getByText('295')).toBeInTheDocument()
    expect(screen.getByText('99.6%')).toBeInTheDocument()
    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText('server')).toBeInTheDocument()
    expect(screen.getByText('harness.py')).toBeInTheDocument()
    expect(screen.getByText('200 行')).toBeInTheDocument()
    expect(screen.getByText('feat/f006')).toBeInTheDocument()
  })
})

describe('ArtifactsPage 闸门结果', () => {
  it('shows gate details from verify and test results', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          session_id: 'sess-art',
          state: buildState({
            verify_result: { pass: true, summary: '14 项全通过' },
            test_result: { pass: true, coverage: 0.9955 },
            code_artifacts: [{ path: 'src/App.tsx', lines: 47 }],
          }),
        }),
      ),
    )
    render(<ArtifactsPage sessionId="sess-art" />)

    expect(await screen.findAllByText('PASS')).toHaveLength(2)
    expect(screen.getByText('14 项全通过')).toBeInTheDocument()
  })

  it('shows FAIL badge when verify fails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          state: buildState({
            verify_result: { pass: false },
            test_result: { pass: false },
          }),
        }),
      ),
    )
    render(<ArtifactsPage sessionId="sess-fail" />)
    expect(await screen.findAllByText('FAIL')).toHaveLength(2)
  })
})

describe('ArtifactsPage 文件树交互', () => {
  it('collapses and expands directories', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          state: buildState({
            code_artifacts: [{ path: 'src/pages/Home.tsx', lines: 10 }],
          }),
        }),
      ),
    )
    render(<ArtifactsPage sessionId="sess-tree" />)

    expect(await screen.findByText('pages')).toBeInTheDocument()
    expect(screen.getByText('Home.tsx')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^src/ }))
    expect(screen.queryByText('Home.tsx')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^src/ }))
    expect(screen.getByText('Home.tsx')).toBeInTheDocument()
  })
})
