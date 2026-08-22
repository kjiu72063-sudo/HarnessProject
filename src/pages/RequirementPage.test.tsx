import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequirementPage } from './RequirementPage'
import { buildState } from '../test/factories'

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockSessionsList(sessions: unknown[] = [], total = sessions.length) {
  fetchMock.mockImplementation((url: string) => {
    if (url === '/api/harness/sessions') {
      return Promise.resolve(jsonResponse({ sessions, total }))
    }
    return Promise.resolve(jsonResponse({ session_id: 'sess-42', status: 'running' }))
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

function fillForm(projectName: string, requirement: string) {
  fireEvent.change(screen.getByPlaceholderText('my-app'), {
    target: { value: projectName },
  })
  fireEvent.change(screen.getByPlaceholderText(/用一段话描述/), {
    target: { value: requirement },
  })
}

describe('RequirementPage 启动流程', () => {
  it('disables submit until project name and requirement are filled', () => {
    mockSessionsList()
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    const submit = screen.getByRole('button', { name: /启动 Harness 流程/ })
    expect(submit).toBeDisabled()

    fillForm('my-app', '一个记账应用')
    expect(submit).toBeEnabled()
  })

  it('starts harness and reports session id on success', async () => {
    mockSessionsList()
    render(<RequirementPage onSessionStarted={vi.fn()} />)

    fillForm('ledger', '做一个记账应用')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/harness/start', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: expect.any(String),
    }))
  })

  it('persists the submitted tech stack in request body', async () => {
    mockSessionsList()
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    fillForm('app', '需求')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const startCall = fetchMock.mock.calls.find((c) => c[0] === '/api/harness/start')
    const init = startCall![1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.tech_stack).toEqual(buildState().tech_stack)
  })

  it('shows error detail when start request fails', async () => {
    mockSessionsList()
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/harness/sessions') {
        return Promise.resolve(jsonResponse({ sessions: [], total: 0 }))
      }
      return Promise.resolve(jsonResponse({ detail: '项目 ID 已存在' }, 400))
    })
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    fillForm('app', '需求')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    expect(await screen.findByText('项目 ID 已存在')).toBeInTheDocument()
  })
})

describe('RequirementPage 会话列表', () => {
  it('renders recent sessions from API', async () => {
    mockSessionsList([
      {
        session_id: 'sess-7',
        status: 'interrupted',
        project_id: 'demo',
        current_stage: 'prototype_confirmation',
        requirement_summary: 'build a demo app',
        started_at: Date.now() / 1000,
      },
    ], 1)
    render(<RequirementPage onSessionStarted={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('demo')).toBeInTheDocument())
  })

  it('shows empty state when no sessions', async () => {
    mockSessionsList()
    render(<RequirementPage onSessionStarted={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('暂无历史会话')).toBeInTheDocument())
  })

  it('shows empty state when API fails', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ detail: 'fail' }, 500)))
    render(<RequirementPage onSessionStarted={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('暂无历史会话')).toBeInTheDocument())
  })

  it('toggles constraint switches', () => {
    mockSessionsList()
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    const toggle = screen.getByRole('switch', { name: /自动生成 AGENTS.md/ })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})
