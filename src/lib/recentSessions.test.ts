import { beforeEach, describe, expect, it } from 'vitest'
import { addRecentSession, getRecentSessions } from './recentSessions'
import type { RecentSession } from '../types/harness'

function session(projectId: string, sessionId: string): RecentSession {
  return { project_id: projectId, session_id: sessionId, started_at: 1_760_000_000_000 }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('getRecentSessions', () => {
  it('returns empty list when storage is empty', () => {
    expect(getRecentSessions()).toEqual([])
  })

  it('returns persisted entries', () => {
    addRecentSession(session('proj-1', 'sess-1'))
    const entries = getRecentSessions()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toEqual(session('proj-1', 'sess-1'))
  })

  it('tolerates corrupted JSON', () => {
    window.localStorage.setItem('harness_recent_sessions', '{broken')
    expect(getRecentSessions()).toEqual([])
  })

  it('filters entries with invalid shape', () => {
    window.localStorage.setItem(
      'harness_recent_sessions',
      JSON.stringify([{ project_id: 'x' }, 'oops', session('proj-2', 'sess-2')]),
    )
    const entries = getRecentSessions()
    expect(entries).toHaveLength(1)
    expect(entries[0].session_id).toBe('sess-2')
  })

  it('returns empty for non-array payload', () => {
    window.localStorage.setItem('harness_recent_sessions', JSON.stringify({ nope: true }))
    expect(getRecentSessions()).toEqual([])
  })
})

describe('addRecentSession', () => {
  it('prepends newest entry and dedupes by session id', () => {
    addRecentSession(session('proj-1', 'sess-1'))
    addRecentSession(session('proj-2', 'sess-2'))
    addRecentSession(session('proj-1-updated', 'sess-1'))
    const entries = getRecentSessions()
    expect(entries.map((entry) => entry.session_id)).toEqual(['sess-1', 'sess-2'])
    expect(entries[0].project_id).toBe('proj-1-updated')
  })

  it('caps history at 6 entries', () => {
    for (let index = 0; index < 9; index += 1) {
      addRecentSession(session(`proj-${index}`, `sess-${index}`))
    }
    const entries = getRecentSessions()
    expect(entries).toHaveLength(6)
    expect(entries[0].session_id).toBe('sess-8')
    expect(entries.at(-1)?.session_id).toBe('sess-3')
  })
})
