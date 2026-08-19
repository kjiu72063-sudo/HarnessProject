import { apiFetch } from './client'
import type { Constraint, ConstraintCreateRequest, ConstraintUpdateRequest } from '../types/constraints'

export function listConstraints(projectId?: string): Promise<Constraint[]> {
  const query = projectId ? `?project_id=${encodeURIComponent(projectId)}` : ''
  return apiFetch<Constraint[]>(`/constraints${query}`)
}

export function createConstraint(request: ConstraintCreateRequest): Promise<Constraint> {
  return apiFetch<Constraint>('/constraints', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function updateConstraint(id: number, request: ConstraintUpdateRequest): Promise<Constraint> {
  return apiFetch<Constraint>(`/constraints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}
