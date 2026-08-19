import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { FlowNodeMeta } from '../../lib/stages'
import type { StageStatus } from '../../types/harness'
import { StatusBadge } from '../StatusBadge'

export interface StageNodeData extends Record<string, unknown> {
  meta: FlowNodeMeta
  status: StageStatus
}

export type StageFlowNode = Node<StageNodeData, 'stage'>

const BORDER_STYLES: Record<StageStatus, string> = {
  pending: 'border-app-line',
  running: 'border-status-running',
  passed: 'border-status-passed/40',
  failed: 'border-status-failed',
}

const BAR_STYLES: Record<StageStatus, string> = {
  pending: 'bg-status-pending',
  running: 'bg-status-running',
  passed: 'bg-status-passed',
  failed: 'bg-status-failed',
}

export function StageNode({ data }: NodeProps<StageFlowNode>) {
  const { meta, status } = data
  return (
    <div
      className={`w-[300px] rounded-lg border bg-app-panel px-4 py-3 transition-colors duration-150 ease-out ${BORDER_STYLES[status]}`}
    >
      <Handle type="target" position={Position.Top} className="!border-app-line !bg-app-secondary" />
      <Handle type="source" position={Position.Bottom} className="!border-app-line !bg-app-secondary" />
      <Handle id="loop" type="target" position={Position.Right} className="!border-app-line !bg-app-secondary" />
      <Handle id="loop" type="source" position={Position.Right} className="!border-app-line !bg-app-secondary" />

      <div className="flex items-start gap-3">
        <span className={`mt-0.5 h-9 w-1 shrink-0 rounded-full ${BAR_STYLES[status]}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wide text-app-muted">{meta.phase}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-app-text">{meta.title}</p>
          <p className="mt-0.5 truncate text-xs text-app-secondary">{meta.subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  )
}
