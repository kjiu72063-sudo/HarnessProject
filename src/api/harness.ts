import type {
  HarnessResumeResponse,
  HarnessStartRequest,
  HarnessStartResponse,
  HarnessStateSnapshot,
  ResumeRequest,
  SessionListResponse,
} from '../types/harness'
import { apiFetch } from './client'

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

export function fetchSessions(): Promise<SessionListResponse> {
  return apiFetch<SessionListResponse>('/harness/sessions')
}
