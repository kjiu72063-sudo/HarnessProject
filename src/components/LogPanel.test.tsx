import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogPanel } from './LogPanel'
import type { LogEntry } from '../lib/stages'

describe('LogPanel', () => {
  it('shows placeholder when no entries', () => {
    render(<LogPanel entries={[]} />)
    expect(screen.getByText('暂无日志')).toBeInTheDocument()
    expect(screen.getByText('0 条')).toBeInTheDocument()
  })

  it('renders entries with level tags and count', () => {
    const entries: LogEntry[] = [
      { level: 'info', message: 'Harness 会话已启动' },
      { level: 'warn', message: '等待人工决策' },
      { level: 'success', message: '流程已完成' },
      { level: 'error', message: '流程已终止' },
    ]
    render(<LogPanel entries={entries} />)
    expect(screen.getByText('Harness 会话已启动')).toBeInTheDocument()
    expect(screen.getByText('等待人工决策')).toBeInTheDocument()
    expect(screen.getByText('流程已完成')).toBeInTheDocument()
    expect(screen.getByText('流程已终止')).toBeInTheDocument()
    expect(screen.getByText('4 条')).toBeInTheDocument()
    expect(screen.getAllByText('[info]').length + screen.getAllByText('[warn]').length).toBe(2)
  })

  it('renders custom title', () => {
    render(<LogPanel entries={[]} title="执行日志" />)
    expect(screen.getByText('执行日志')).toBeInTheDocument()
  })
})
