import type { StageStatus } from '../types/harness'

const STATUS_CONFIG: Record<StageStatus, { label: string; dot: string; text: string }> = {
  pending: { label: '等待', dot: 'bg-status-pending', text: 'text-status-pending' },
  running: { label: '运行中', dot: 'bg-status-running', text: 'text-status-running' },
  passed: { label: '通过', dot: 'bg-status-passed', text: 'text-status-passed' },
  failed: { label: '驳回', dot: 'bg-status-failed', text: 'text-status-failed' },
}

interface StatusBadgeProps {
  status: StageStatus
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
      <span
        className={`h-2 w-2 rounded-full ${config.dot} ${status === 'running' ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {label ?? config.label}
    </span>
  )
}
