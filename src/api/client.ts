const API_BASE = '/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }
  return (await response.json()) as T
}

export async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `请求失败 (HTTP ${response.status})`
  try {
    const body = (await response.json()) as {
      detail?: string | Array<{ msg?: string }>
    }
    if (typeof body?.detail === 'string') return body.detail
    if (Array.isArray(body?.detail) && body.detail.length > 0) {
      return body.detail.map((item) => item.msg).filter(Boolean).join('; ') || fallback
    }
    return fallback
  } catch {
    return fallback
  }
}
