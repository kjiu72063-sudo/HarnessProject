import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { AlertTriangle, Bot, UserRound } from 'lucide-react'
import type { FlowNodeKind, FlowNodeMeta } from '../../lib/stages'
import type { StageStatus } from '../../types/harness'

export interface DiamondNodeData extends Record<string, unknown> {
  meta: FlowNodeMeta
  status: StageStatus
}

export type DiamondFlowNode = Node<DiamondNodeData, 'diamond'>

const KIND_ICONS: Record<FlowNodeKind, typeof UserRound> = {
  'human-gate': UserRound,
  'auto-gate': Bot,
  escape: AlertTriangle,
  stage: Bot,
}

const KIND_LABELS: Record<FlowNodeKind, string> = {
  'human-gate': '人类闸门',
  'auto-gate': '自动闸门',
  escape: '逃生口',
  stage: '闸门',
}

const DIAMOND_STYLES: Record<StageStatus, { border: string; glow: string }> = {
  pending: { border: 'border-status-pending', glow: '' },
  running: { border: 'border-status-running', glow: 'shadow-[0_0_0_4px_rgba(245,158,11,0.15)]' },
  passed: { border: 'border-status-passed', glow: '' },
  failed: { border: 'border-status-failed', glow: '' },
}

export function DiamondNode({ data }: NodeProps<DiamondFlowNode>) {
  const { meta, status } = data
  const Icon = KIND_ICONS[meta.kind]
  const style = DIAMOND_STYLES[status]
  return (
    <div className="flex items-center gap-2.5">
      <Handle type="target" position={Position.Top} className="!border-app-line !bg-app-secondary" />
      <Handle type="source" position={Position.Bottom} className="!border-app-line !bg-app-secondary" />
      <Handle id="loop" type="source" position={Position.Right} className="!border-app-line !bg-app-secondary" />

      <span
        className={`flex h-5 w-5 rotate-45 items-center justify-center rounded-[4px] border-2 bg-app-panel transition-all duration-150 ease-out ${style.border} ${style.glow} ${
          status === 'running' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />
      <span className="flex items-center gap-1.5">
        <Icon
          size={13}
          className={status === 'running' ? 'text-status-running' : 'text-app-secondary'}
          aria-hidden="true"
        />
        <span>
          <span className="block text-[13px] font-semibold leading-4 text-app-text">{meta.title}</span>
          <span className="block text-[11px] leading-4 text-app-muted">{KIND_LABELS[meta.kind]}</span>
        </span>
      </span>
    </div>
  )
}
