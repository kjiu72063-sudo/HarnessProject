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

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  window.localStorage.clear()
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
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    const submit = screen.getByRole('button', { name: /启动 Harness 流程/ })
    expect(submit).toBeDisabled()

    fillForm('my-app', '一个记账应用')
    expect(submit).toBeEnabled()
  })

  it('starts harness and reports session id on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ session_id: 'sess-42', status: 'running' }))
    const onSessionStarted = vi.fn()
    render(<RequirementPage onSessionStarted={onSessionStarted} />)

    fillForm('ledger', '做一个记账应用')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    await waitFor(() => expect(onSessionStarted).toHaveBeenCalledWith('sess-42'))
    const stored = window.localStorage.getItem('harness_recent_sessions')
    expect(stored).toContain('sess-42')
    expect(fetchMock).toHaveBeenCalledWith('/api/harness/start', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: expect.any(String),
    })
  })

  it('persists the submitted tech stack in request body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ session_id: 's', status: 'running' }))
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    fillForm('app', '需求')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.tech_stack).toEqual(buildState().tech_stack)
  })

  it('shows error detail when start request fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: '项目 ID 已存在' }, 400))
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    fillForm('app', '需求')
    fireEvent.click(screen.getByRole('button', { name: /启动 Harness 流程/ }))

    expect(await screen.findByText('项目 ID 已存在')).toBeInTheDocument()
  })
})

describe('RequirementPage 本地交互', () => {
  it('renders recent projects from storage', () => {
    window.localStorage.setItem(
      'harness_recent_sessions',
      JSON.stringify([{ project_id: 'demo', session_id: 'sess-7', started_at: 1 }]),
    )
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('toggles constraint switches', () => {
    render(<RequirementPage onSessionStarted={vi.fn()} />)
    const toggle = screen.getByRole('switch', { name: /自动生成 AGENTS.md/ })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })
})
