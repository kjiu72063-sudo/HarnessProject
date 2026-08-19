import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PipelinePage } from './PipelinePage'
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

describe('PipelinePage 轮询渲染', () => {
  it('shows empty state and navigates back to requirement page without session', () => {
    const onNavigate = vi.fn()
    render(<PipelinePage sessionId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('暂无活动会话')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '去启动流程' }))
    expect(onNavigate).toHaveBeenCalledWith('requirement')
  })

  it('polls session state and renders stats with DAG and logs', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({
          session_id: 'sess-flow',
          status: 'running',
          next: ['coding_agent'],
          state: buildState({
            current_stage: 'coding_agent',
            next_feature: 'F001',
            token_usage_total: { prompt_tokens: 700, completion_tokens: 300, total_tokens: 1000 },
          }),
        }),
      ),
    )
    render(<PipelinePage sessionId="sess-flow" onNavigate={vi.fn()} />)

    expect(await screen.findByText('编码 Agent')).toBeInTheDocument()
    expect(screen.getByText('F001')).toBeInTheDocument()
    expect(screen.getByText('1.0k')).toBeInTheDocument()
    expect(screen.getByText('0 / 3')).toBeInTheDocument()
    expect(screen.getByText('流程 DAG · 8 阶段')).toBeInTheDocument()
  })
})

describe('PipelinePage 闸门决策', () => {
  it('shows decision panel when interrupted at a resumable gate and submits approval', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildSnapshot({ status: 'interrupted', next: ['design_approval'] }),
      ),
    )
    render(<PipelinePage sessionId="sess-gate" onNavigate={vi.fn()} />)

    expect(await screen.findByText('等待人工决策')).toBeInTheDocument()
    expect(screen.getByText(/当前闸门/).textContent).toContain('设计审批')

    fetchMock.mockResolvedValue(
      jsonResponse({ status: 'running', next: ['coding_agent'], state: buildState() }),
    )
    fireEvent.click(screen.getByRole('button', { name: /通过/ }))

    await waitFor(() => {
      const resumeCall = fetchMock.mock.calls.find((call) =>
        String(call[0]).includes('/resume'),
      )
      expect(resumeCall).toBeDefined()
      const init = resumeCall?.[1] as RequestInit
      expect(JSON.parse(init.body as string)).toEqual({
        gate: 'design_approval',
        decision: true,
      })
    })
  })

  it('shows rejection error when resume request fails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(buildSnapshot({ status: 'interrupted', next: ['acceptance_check'] })),
    )
    render(<PipelinePage sessionId="sess-gate" onNavigate={vi.fn()} />)
    expect(await screen.findByText('等待人工决策')).toBeInTheDocument()

    fetchMock.mockResolvedValue(jsonResponse({ detail: '闸门状态冲突' }, 409))
    fireEvent.click(screen.getByRole('button', { name: /驳回/ }))

    expect(await screen.findByText('闸门状态冲突')).toBeInTheDocument()
  })

  it('surfaces polling error banner', async () => {
    fetchMock.mockRejectedValue(new Error('连接超时'))
    render(<PipelinePage sessionId="sess-err" onNavigate={vi.fn()} />)
    expect(await screen.findByText(/状态拉取失败: 连接超时/)).toBeInTheDocument()
  })
})
