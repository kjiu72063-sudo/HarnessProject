import '@xyflow/react/dist/style.css'

import { Background, Controls, ReactFlow, type Edge, type Node } from '@xyflow/react'
import { useMemo } from 'react'
import { deriveStageStatuses, ENTROPY_NODE, FLOW_NODES } from '../lib/stages'
import type { HarnessStateSnapshot, StageStatus } from '../types/harness'
import { DiamondNode, type DiamondFlowNode } from './dag/DiamondNode'
import { StageNode, type StageFlowNode } from './dag/StageNode'

const nodeTypes = { stage: StageNode, diamond: DiamondNode }

const COLUMN_X = 240
const STAGE_GAP = 92
const ENTROPY_X = 600

const EDGE_BASE = { type: 'smoothstep' } as const

const LOOP_EDGES: Array<{ source: string; target: string; label: string; tone: 'danger' | 'warning' }> = [
  { source: 'prototype_confirmation', target: 'information_layer', label: '驳回回环', tone: 'danger' },
  { source: 'design_approval', target: 'information_layer', label: '驳回回环', tone: 'danger' },
  { source: 'test_result', target: 'coding_agent', label: '测试失败 · 反馈循环', tone: 'danger' },
  { source: 'acceptance_check', target: 'coding_agent', label: 'DRR 长循环', tone: 'danger' },
  { source: 'human_intervention', target: 'coding_agent', label: '预算内继续', tone: 'warning' },
]

interface DAGViewProps {
  snapshot: HarnessStateSnapshot | null
}

export function DAGView({ snapshot }: DAGViewProps) {
  const nodes = useMemo(() => buildNodes(snapshot), [snapshot])
  const edges = useMemo(() => buildEdges(snapshot), [snapshot])

  return (
    <div className="h-full min-h-[420px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesFocusable={false}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        minZoom={0.35}
        maxZoom={1.6}
        proOptions={{ hideAttribution: false }}
      >
        <Background color="#2A2F3A" gap={26} size={1} />
        <Controls showInteractive={false} className="!border-app-line !bg-app-panel !text-app-secondary" />
      </ReactFlow>
    </div>
  )
}

function buildNodes(snapshot: HarnessStateSnapshot | null): Node[] {
  const statuses = deriveStageStatuses(snapshot)
  const mainNodes = FLOW_NODES.map((meta, index) => createNode(meta, statuses[meta.id], COLUMN_X, index * STAGE_GAP))
  const entropyY = FLOW_NODES.findIndex((node) => node.id === 'validation') * STAGE_GAP
  const entropyNode = createNode(ENTROPY_NODE, statuses.entropy, ENTROPY_X, entropyY)
  return [...mainNodes, entropyNode]
}

function createNode(
  meta: (typeof FLOW_NODES)[number],
  status: StageStatus,
  x: number,
  y: number,
): StageFlowNode | DiamondFlowNode {
  if (meta.kind === 'stage') {
    return { id: meta.id, type: 'stage', position: { x, y }, data: { meta, status } }
  }
  return { id: meta.id, type: 'diamond', position: { x, y }, data: { meta, status } }
}

function buildEdges(snapshot: HarnessStateSnapshot | null): Edge[] {
  const statuses = deriveStageStatuses(snapshot)
  const linearEdges = FLOW_NODES.slice(0, -1).map((node, index) => {
    const target = FLOW_NODES[index + 1]
    return createLinearEdge(node.id, target.id, statuses[target.id])
  })
  const loopEdges = LOOP_EDGES.map((loop) => createLoopEdge(loop.source, loop.target, loop.label, loop.tone))
  return [...linearEdges, ...loopEdges]
}

function createLinearEdge(source: string, target: string, targetStatus: StageStatus): Edge {
  const stroke =
    targetStatus === 'running' ? '#F59E0B'
    : targetStatus === 'passed' ? '#10B981'
    : targetStatus === 'failed' ? '#EF4444'
    : '#3A4150'
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    ...EDGE_BASE,
    animated: targetStatus === 'running',
    style: { stroke, strokeWidth: 1.5 },
  }
}

function createLoopEdge(source: string, target: string, label: string, tone: 'danger' | 'warning'): Edge {
  const color = tone === 'danger' ? '#EF4444' : '#F59E0B'
  return {
    id: `loop-${source}-${target}`,
    source,
    target,
    sourceHandle: 'loop',
    targetHandle: 'loop',
    ...EDGE_BASE,
    animated: false,
    label,
    labelShowBg: false,
    labelStyle: { fill: color, fontSize: 10 },
    style: { stroke: color, strokeWidth: 1.2, strokeDasharray: '6 4' },
  }
}
