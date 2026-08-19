import type { HarnessStateSnapshot, StageStatus, TokenUsage } from '../types/harness'

export type FlowNodeKind = 'stage' | 'human-gate' | 'auto-gate' | 'escape'

export interface FlowNodeMeta {
  id: string
  title: string
  subtitle: string
  phase: string
  kind: FlowNodeKind
}

export const FLOW_NODES: FlowNodeMeta[] = [
  { id: 'initializer', title: '初始化 Agent', subtitle: '读取 AGENTS.md → 建立工作区', phase: '阶段0', kind: 'stage' },
  { id: 'information_layer', title: '需求与架构规划', subtitle: '需求文档 / 架构分析 / 知识库框架', phase: '阶段1', kind: 'stage' },
  { id: 'prototype_confirmation', title: '原型确认', subtitle: '人类闸门 · 等待确认', phase: '', kind: 'human-gate' },
  { id: 'feature_breakdown', title: '功能拆分与设计', subtitle: 'Sprint 规划 + Controller Spec', phase: '阶段2', kind: 'stage' },
  { id: 'design_approval', title: '设计审批', subtitle: '人类闸门 · 设计文档批准', phase: '', kind: 'human-gate' },
  { id: 'coding_agent', title: '编码 Agent', subtitle: 'L3 coder 按 Controller Spec 实现', phase: '阶段3-4', kind: 'stage' },
  { id: 'validation', title: '自校验与反馈循环', subtitle: '测试套件 + e2e 验证', phase: '阶段5', kind: 'stage' },
  { id: 'test_result', title: '测试结果', subtitle: '自动闸门', phase: '', kind: 'auto-gate' },
  { id: 'merge_deploy', title: '合并与部署', subtitle: '代码合并 + 部署', phase: '阶段6', kind: 'stage' },
  { id: 'review', title: '审查', subtitle: '自动闸门', phase: '', kind: 'auto-gate' },
  { id: 'observability', title: '可观测性验证', subtitle: '运行时监控 + 日志', phase: '阶段7', kind: 'stage' },
  { id: 'acceptance_check', title: '验收', subtitle: '人类闸门 · 最终验收', phase: '', kind: 'human-gate' },
  { id: 'human_intervention', title: '人类介入', subtitle: '循环预算逃生口', phase: '', kind: 'escape' },
]

export const ENTROPY_NODE: FlowNodeMeta = {
  id: 'entropy',
  title: '熵管理',
  subtitle: '横切任务 · 知识库治理',
  phase: '横切',
  kind: 'stage',
}

export const GATE_TITLES: Record<string, string> = {
  prototype_confirmation: '原型确认',
  design_approval: '设计审批',
  acceptance_check: '验收',
  human_intervention: '人类介入',
}

export const RESUMABLE_GATES = ['prototype_confirmation', 'design_approval', 'acceptance_check', 'human_intervention']

export type LogLevel = 'info' | 'success' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
}

const LINEAR_IDS = FLOW_NODES.map((node) => node.id)

export function deriveStageStatuses(snapshot: HarnessStateSnapshot | null): Record<string, StageStatus> {
  const statuses: Record<string, StageStatus> = {}
  for (const node of FLOW_NODES) {
    statuses[node.id] = 'pending'
  }
  statuses.entropy = 'pending'
  if (!snapshot) {
    return statuses
  }

  if (snapshot.status === 'completed') {
    for (const id of Object.keys(statuses)) {
      statuses[id] = 'passed'
    }
    return statuses
  }
  if (snapshot.status === 'ended') {
    for (const id of LINEAR_IDS) {
      statuses[id] = 'passed'
    }
    statuses.human_intervention = 'failed'
    statuses.entropy = 'passed'
    return statuses
  }

  const state = snapshot.state
  const anchor = state ? snapshot.next[0] ?? '' : ''
  const boundary = LINEAR_IDS.indexOf(anchor) >= 0
    ? LINEAR_IDS.indexOf(anchor)
    : resolveBoundaryByStage(state?.current_stage ?? '')
  LINEAR_IDS.forEach((id, index) => {
    if (index < boundary) {
      statuses[id] = 'passed'
    } else if (index === boundary) {
      statuses[id] = 'running'
    } else {
      statuses[id] = 'pending'
    }
  })
  statuses.test_result = refineAutoGate(statuses.test_result, state?.test_result?.pass === false)
  statuses.review = refineAutoGate(statuses.review, state?.human_intervention === true)
  statuses.entropy = snapshot.status === 'running' ? 'pending' : 'running'
  return statuses
}

function refineAutoGate(current: StageStatus, failed: boolean): StageStatus {
  if (failed && current === 'passed') {
    return 'failed'
  }
  return current
}

function resolveBoundaryByStage(currentStage: string): number {
  const index = LINEAR_IDS.indexOf(currentStage)
  return index >= 0 ? index : 0
}

export function buildLogEntries(snapshot: HarnessStateSnapshot | null): LogEntry[] {
  if (!snapshot) {
    return []
  }
  if (!snapshot.state) {
    return [{ level: 'info', message: `Harness 会话 ${snapshot.session_id} 已启动 · 等待首个节点产出` }]
  }
  const statuses = deriveStageStatuses(snapshot)
  return [
    {
      level: 'info',
      message: `Harness 会话 ${snapshot.session_id} 已启动 · 项目 ${snapshot.state.project_id}`,
    },
    ...buildStageLogs(snapshot, statuses),
    ...buildSignalLogs(snapshot),
    ...buildTokenLog(snapshot.state.token_usage_total),
  ]
}

function buildStageLogs(
  snapshot: HarnessStateSnapshot,
  statuses: Record<string, StageStatus>,
): LogEntry[] {
  const entries: LogEntry[] = []
  for (const node of FLOW_NODES) {
    if (node.kind === 'stage' && statuses[node.id] === 'passed') {
      entries.push({ level: 'info', message: `${node.phase} ${node.title} 完成` })
    }
  }
  const infoSummary = snapshot.state.design_docs.at(-1)?.summary
  if (statuses.information_layer === 'passed' && infoSummary) {
    entries.push({ level: 'info', message: `信息层产出: ${infoSummary}` })
  }
  return entries
}

function buildSignalLogs(snapshot: HarnessStateSnapshot): LogEntry[] {
  const { state, status } = snapshot
  const entries: LogEntry[] = []
  if (state.design_docs.length > 1) {
    entries.push({
      level: 'warn',
      message: `检测到驳回回环 · 信息层已修订 ${state.design_docs.length} 轮`,
    })
  }
  if (state.current_iteration > 0) {
    entries.push({
      level: 'warn',
      message: `反馈循环 · 第 ${state.current_iteration}/${state.max_iterations} 轮`,
    })
  }
  if (state.human_intervention && status !== 'ended' && snapshot.next[0] !== 'human_intervention') {
    entries.push({ level: 'error', message: '循环预算超限 · 已升级人类介入' })
  }
  const gateTitle = GATE_TITLES[snapshot.next[0] ?? '']
  if (status === 'interrupted' && gateTitle) {
    entries.push({ level: 'warn', message: `等待人工决策 · ${gateTitle}（通过 / 驳回）` })
  }
  if (status === 'completed') {
    entries.push({ level: 'success', message: '流程已完成 · 全部闸门通过' })
  }
  if (status === 'ended') {
    entries.push({ level: 'error', message: '流程已终止 · 人类介入（逃生口放弃）' })
  }
  return entries
}

function buildTokenLog(usage: TokenUsage | null | undefined): LogEntry[] {
  if (usage && usage.total_tokens > 0) {
    return [
      {
        level: 'info',
        message: `Token 用量 · prompt ${usage.prompt_tokens} / completion ${usage.completion_tokens} / total ${usage.total_tokens}`,
      },
    ]
  }
  return []
}
