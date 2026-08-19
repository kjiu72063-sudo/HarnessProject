import type { RecentSession } from '../types/harness'

const STORAGE_KEY = 'harness_recent_sessions'
const MAX_ENTRIES = 6

export function getRecentSessions(): RecentSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((entry): entry is RecentSession => {
      if (typeof entry !== 'object' || entry === null) {
        return false
      }
      const candidate = entry as Record<string, unknown>
      return typeof candidate.project_id === 'string'
        && typeof candidate.session_id === 'string'
        && typeof candidate.started_at === 'number'
    })
  } catch {
    return []
  }
}

export function addRecentSession(entry: RecentSession): void {
  const existing = getRecentSessions().filter((item) => item.session_id !== entry.session_id)
  const next = [entry, ...existing].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级，不影响主流程
  }
}
