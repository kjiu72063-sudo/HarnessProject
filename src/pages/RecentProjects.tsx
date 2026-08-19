import { History } from 'lucide-react'
import type { RecentSession } from '../types/harness'

interface RecentProjectsProps {
  sessions: RecentSession[]
  onOpen: (sessionId: string) => void
}

function formatTime(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000)
  if (minutes < 1) {
    return '刚刚'
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }
  return `${Math.floor(hours / 24)} 天前`
}

export function RecentProjects({ sessions, onOpen }: RecentProjectsProps) {
  return (
    <aside className="h-fit rounded-lg border border-app-line bg-app-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <History size={14} className="text-app-secondary" />
        <h3 className="text-sm font-semibold text-app-text">近期生成</h3>
        <span className="ml-auto font-mono text-[11px] text-app-muted">{sessions.length} 个</span>
      </div>
      {sessions.length === 0 ? (
        <p className="py-6 text-center text-xs text-app-muted">暂无历史会话</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.session_id}>
              <button
                type="button"
                onClick={() => onOpen(session.session_id)}
                className="w-full rounded-lg border border-app-line bg-app-bg px-3.5 py-3 text-left transition-colors duration-150 ease-out hover:border-app-primary/60"
              >
                <span className="block truncate text-[13px] font-semibold text-app-text">
                  {session.project_id}
                </span>
                <span className="mt-1 flex items-center justify-between font-mono text-[11px] text-app-muted">
                  <span>{session.session_id.slice(0, 8)}</span>
                  <span>{formatTime(session.started_at)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
