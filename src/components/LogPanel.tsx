import { Terminal } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { LogEntry, LogLevel } from '../lib/stages'

const LEVEL_STYLES: Record<LogLevel, { tag: string; text: string }> = {
  info: { tag: 'info', text: 'text-app-secondary' },
  success: { tag: 'done', text: 'text-status-passed' },
  warn: { tag: 'warn', text: 'text-status-running' },
  error: { tag: 'fail', text: 'text-status-failed' },
}

interface LogPanelProps {
  entries: LogEntry[]
  title?: string
}

export function LogPanel({ entries, title = '流程日志' }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [entries])

  return (
    <section className="flex h-full flex-col rounded-lg border border-app-line bg-app-panel">
      <div className="flex items-center gap-2 border-b border-app-line px-4 py-3">
        <Terminal size={14} className="text-app-secondary" />
        <h2 className="text-sm font-semibold text-app-text">{title}</h2>
        <span className="ml-auto font-mono text-[11px] text-app-muted">{entries.length} 条</span>
      </div>
      <div
        ref={scrollRef}
        className="scroll-thin flex-1 overflow-y-auto rounded-b-lg bg-[#141821] px-4 py-3 font-mono text-[12.5px] leading-7"
      >
        {entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-app-muted">暂无日志</p>
        ) : (
          entries.map((entry, index) => {
            const style = LEVEL_STYLES[entry.level]
            return (
              <p key={`${index}-${entry.message}`} className="whitespace-pre-wrap break-all">
                <span className="text-app-muted">{`[${style.tag}]`.padEnd(8, ' ')}</span>
                <span className={style.text}>{entry.message}</span>
              </p>
            )
          })
        )}
      </div>
    </section>
  )
}
