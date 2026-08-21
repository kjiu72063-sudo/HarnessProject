import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PipelinePage } from './PipelinePage'
import { buildSnapshot, buildState } from '../test/factories'

class MockEventSource {
  static instances: MockEventSource[] = []
  url = ''
  readyState = 1
  private listeners: Record<string, EventListener[]> = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(listener)
  }

  close(): void { this.readyState = 2 }

  emit(type: string, data: unknown): void {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    for (const listener of this.listeners[type] ?? []) {
      listener(event)
    }
  }
}

const OriginalES = globalThis.EventSource

beforeEach(() => {
  MockEventSource.instances = []
  globalThis.EventSource = MockEventSource as unknown as typeof EventSource
})

afterEach(() => {
  globalThis.EventSource = OriginalES
  vi.restoreAllMocks()
})

describe('PipelinePage SSE 渲染', () => {
  it('shows empty state without session', () => {
    const onNavigate = vi.fn()
    render(<PipelinePage sessionId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('暂无活动会话')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '去启动流程' }))
    expect(onNavigate).toHaveBeenCalledWith('requirement')
  })

  it('renders stats from SSE snapshot event', async () => {
    render(<PipelinePage sessionId="sess-flow" onNavigate={vi.fn()} />)
    const es = MockEventSource.instances[0]
    es.emit('snapshot', buildSnapshot({
      session_id: 'sess-flow',
      status: 'running',
      next: ['coding_agent'],
      state: buildState({
        current_stage: 'coding_agent',
        next_feature: 'F001',
        token_usage_total: { prompt_tokens: 700, completion_tokens: 300, total_tokens: 1000 },
      }),
    }))
    expect(await screen.findByText('编码 Agent')).toBeInTheDocument()
    expect(screen.getByText('F001')).toBeInTheDocument()
    expect(screen.getByText('1.0k')).toBeInTheDocument()
    expect(screen.getByText('流程 DAG · 8 阶段')).toBeInTheDocument()
  })
})

describe('PipelinePage 闸门决策', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('shows decision panel on gate event and submits approval', async () => {
    render(<PipelinePage sessionId="sess-gate" onNavigate={vi.fn()} />)
    const es = MockEventSource.instances[0]
    es.emit('snapshot', buildSnapshot({ status: 'interrupted', next: ['design_approval'] }))

    expect(await screen.findByText('等待人工决策')).toBeInTheDocument()
    expect(screen.getByText(/当前闸门/).textContent).toContain('设计审批')

    fetchMock.mockResolvedValue(new Response(
      JSON.stringify({ status: 'running', next: ['coding_agent'], state: buildState() }),
      { headers: { 'Content-Type': 'application/json' } },
    ))
    fireEvent.click(screen.getByRole('button', { name: /通过/ }))

    await waitFor(() => {
      const resumeCall = fetchMock.mock.calls.find((call) =>
        String(call[0]).includes('/resume'),
      )
      expect(resumeCall).toBeDefined()
    })
  })

  it('surfaces SSE error banner', async () => {
    render(<PipelinePage sessionId="sess-err" onNavigate={vi.fn()} />)
    const es = MockEventSource.instances[0]
    es.emit('error', { message: '连接超时' })
    expect(await screen.findByText(/SSE 连接失败: 连接超时/)).toBeInTheDocument()
  })
})
