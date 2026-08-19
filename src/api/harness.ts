import type {
  HarnessResumeResponse,
  HarnessStartRequest,
  HarnessStartResponse,
  HarnessStateSnapshot,
  ResumeRequest,
} from '../types/harness'

const API_BASE = '/api'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }
  return (await response.json()) as T
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `请求失败 (HTTP ${response.status})`
  try {
    const body = (await response.json()) as { detail?: string }
    return body?.detail ?? fallback
  } catch {
    return fallback
  }
}

export function startHarness(request: HarnessStartRequest): Promise<HarnessStartResponse> {
  return apiFetch<HarnessStartResponse>('/harness/start', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function getHarnessState(sessionId: string): Promise<HarnessStateSnapshot> {
  return apiFetch<HarnessStateSnapshot>(`/harness/${sessionId}/state`)
}

export function resumeHarness(sessionId: string, request: ResumeRequest): Promise<HarnessResumeResponse> {
  return apiFetch<HarnessResumeResponse>(`/harness/${sessionId}/resume`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
