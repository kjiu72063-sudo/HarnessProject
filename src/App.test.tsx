import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

const fetchMock = vi.fn()

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function setInput(label: RegExp, value: string): void {
  const field = screen.getByLabelText(label)
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set
  setter?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('App shell 导航', () => {
  it('renders sidebar with four nav entries and highlights active page', () => {
    render(<App />)
    expect(screen.getByText('需求输入')).toBeInTheDocument()
    expect(screen.getByText('流程监控')).toBeInTheDocument()
    expect(screen.getByText('约束配置')).toBeInTheDocument()
    expect(screen.getByText('产物管理')).toBeInTheDocument()

    const active = screen.getByText('需求输入').closest('button')
    expect(active?.className).toContain('bg-app-primary/10')
    const inactive = screen.getByText('流程监控').closest('button')
    expect(inactive?.className).toContain('text-app-secondary')
  })

  it('switches pages via sidebar navigation', () => {
    render(<App />)
    fireEvent.click(screen.getByText('流程监控'))
    expect(screen.getByText('暂无活动会话')).toBeInTheDocument()
    fireEvent.click(screen.getByText('约束配置'))
    expect(screen.getByText('AGENTS.md 硬性规则')).toBeInTheDocument()
    fireEvent.click(screen.getByText('产物管理'))
    expect(screen.getByText('暂无产物文件 · 编码阶段完成后自动生成')).toBeInTheDocument()
  })
})

describe('App 会话流转', () => {
  it('starts a session from requirement page and lands on pipeline page', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ session_id: 'sess-app', status: 'running', next: ['information_layer'] }),
    )
    render(<App />)

    setInput(/项目名称/, 'my-todo')
    setInput(/需求描述/, '输入一个todo应用')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    expect(await screen.findByText('编码 Agent')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/harness/start')
  })
})

describe('App 会话持久化', () => {
  it('restores persisted session from localStorage on remount', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ session_id: 'sess-persist', status: 'running', next: ['information_layer'] }),
    )
    const { unmount } = render(<App />)
    setInput(/项目名称/, 'my-blog')
    setInput(/需求描述/, '输入一个博客系统')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))
    expect(await screen.findByText('流程 DAG · 8 阶段')).toBeInTheDocument()
    unmount()

    fetchMock.mockResolvedValue(
      jsonResponse({
        session_id: 'sess-persist',
        status: 'running',
        next: ['information_layer'],
        state: {
          project_id: 'my-blog',
          max_iterations: 3,
          current_iteration: 1,
          messages: [],
          design_docs: [],
          current_stage: 'information_layer',
          token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          token_usage_total: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          next_feature: '',
          test_result: null,
          verify_result: null,
          code_artifacts: [],
          error: null,
        },
      }),
    )
    render(<App />)
    fireEvent.click(screen.getByText('流程监控'))
    expect(await screen.findByText('需求与架构规划')).toBeInTheDocument()
    expect(screen.getByText('会话 sess-per')).toBeInTheDocument()
  })
})
