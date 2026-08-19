import { useCallback, useEffect, useState } from 'react'
import {
  createConstraint,
  listConstraints,
  updateConstraint,
} from '../api/constraints'
import type { Constraint, ConstraintCreateRequest, ConstraintUpdateRequest } from '../types/constraints'

interface ConstraintsResult {
  constraints: Constraint[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  create: (request: ConstraintCreateRequest) => Promise<Constraint>
  update: (id: number, request: ConstraintUpdateRequest) => Promise<Constraint>
}

export function useConstraints(projectId: string): ConstraintsResult {
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await listConstraints(projectId)
      setConstraints(result)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void reload()
  }, [reload, reloadToken])

  const create = useCallback(
    async (request: ConstraintCreateRequest): Promise<Constraint> => {
      const created = await createConstraint(request)
      setReloadToken((token) => token + 1)
      return created
    },
    [],
  )

  const update = useCallback(
    async (id: number, request: ConstraintUpdateRequest): Promise<Constraint> => {
      const updated = await updateConstraint(id, request)
      setConstraints((items) => items.map((item) => (item.id === id ? updated : item)))
      return updated
    },
    [],
  )

  return { constraints, loading, error, reload, create, update }
}
