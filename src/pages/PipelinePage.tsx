import { Activity, CheckCircle2, XCircle } from 'lucide-react'
import { useCallback, useState } from 'react'
import { getHarnessState, resumeHarness } from '../api/harness'
import type { PageId } from '../components/Sidebar'
import { DAGView } from '../components/DAGView'
import { LogPanel } from '../components/LogPanel'
import { StatusBadge } from '../components/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import { buildLogEntries, ENTROPY_NODE, FLOW_NODES, GATE_TITLES, RESUMABLE_GATES } from '../lib/stages'
import type { HarnessStateSnapshot } from '../types/harness'

const POLL_INTERVAL_MS = 2000

const STAGE_TITLE_OVERRIDES: Record<string, string> = {
  completed: '已完成',
  problem_classification: '问题分类',
}

interface PipelinePageProps {
  sessionId: string | null
  onNavigate: (page: PageId) => void
}

export function PipelinePage({ sessionId, onNavigate }: PipelinePageProps) {
  const fetcher = useCallback(() => getHarnessState(sessionId ?? ''), [sessionId])
  const { data, error, loading, refresh } = usePolling<HarnessStateSnapshot>(
    fetcher,
    POLL_INTERVAL_MS,
    sessionId !== null,
  )

  if (!sessionId) {
    return <PipelineEmpty onNavigate={onNavigate} />
  }

  const currentGate = data?.next[0] ?? ''
  const awaitingDecision = data?.status === 'interrupted' && RESUMABLE_GATES.includes(currentGate)

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <StatGrid data={data} />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-app-line bg-app-panel">
          <div className="flex items-center gap-2 border-b border-app-line px-4 py-3">
            <Activity size={14} className="text-app-secondary" />
            <h2 className="text-sm font-semibold text-app-text">流程 DAG · 8 阶段</h2>
            {data && <StatusBadge status={mapSessionStatus(data.status)} />}
            {loading && <span className="ml-auto text-[11px] text-app-muted">轮询中 · 2s</span>}
          </div>
          <div className="min-h-0 flex-1 p-3">
            <DAGView snapshot={data} />
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-4">
          {awaitingDecision && data && (
            <DecisionPanel
              snapshot={data}
              sessionId={sessionId}
              onDecisionHandled={refresh}
            />
          )}
          <div className="min-h-0 flex-1">
            <LogPanel entries={buildLogEntries(data)} />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-status-failed/40 bg-status-failed/10 px-3.5 py-2 text-xs text-status-failed">
          状态拉取失败: {error}
        </p>
      )}
    </div>
  )
}

function StatGrid({ data }: { data: HarnessStateSnapshot | null }) {
  const state = data?.state ?? null
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label="当前阶段"
        value={state ? resolveStageTitle(state.current_stage) : '—'}
        hint={state?.current_stage ?? undefined}
      />
      <StatCard label="当前功能" value={state?.next_feature ?? '—'} />
      <StatCard
        label="Token 用量"
        value={state ? formatTokens(state.token_usage_total.total_tokens) : '—'}
        hint={data ? `会话 ${data.session_id.slice(0, 8)}` : undefined}
      />
      <StatCard
        label="迭代轮次"
        value={state ? `${state.current_iteration} / ${state.max_iterations}` : '—'}
        hint="反馈循环预算"
      />
    </section>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-app-line bg-app-panel px-4 py-3.5">
      <p className="text-xs text-app-secondary">{label}</p>
      <p className="mt-1.5 truncate text-lg font-semibold text-app-text">{value}</p>
      {hint && <p className="mt-0.5 truncate font-mono text-[11px] text-app-muted">{hint}</p>}
    </div>
  )
}

function DecisionPanel({
  snapshot,
  sessionId,
  onDecisionHandled,
}: {
  snapshot: HarnessStateSnapshot
  sessionId: string
  onDecisionHandled: () => void
}) {
  const gate = snapshot.next[0] ?? ''
  const { submitting, error, decide } = useDecisionSubmit(sessionId, gate, onDecisionHandled)

  return (
    <section className="rounded-lg border border-status-running/40 bg-app-panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app-text">等待人工决策</h3>
        <StatusBadge status="running" label="闸门暂停" />
      </div>
      <p className="mt-2 text-xs leading-5 text-app-secondary">
        当前闸门 <span className="font-semibold text-app-text">{GATE_TITLES[gate] ?? gate}</span>
        ：通过则推进下一阶段，驳回将触发回环。
      </p>
      {error && <p className="mt-2 text-xs text-status-failed">{error}</p>}
      <div className="mt-3 flex gap-2.5">
        <DecisionButton
          label="通过"
          icon={<CheckCircle2 size={14} />}
          tone="passed"
          disabled={submitting}
          onClick={() => void decide(true)}
        />
        <DecisionButton
          label="驳回"
          icon={<XCircle size={14} />}
          tone="failed"
          disabled={submitting}
          onClick={() => void decide(false)}
        />
      </div>
    </section>
  )
}

function useDecisionSubmit(
  sessionId: string,
  gate: string,
  onDecisionHandled: () => void,
) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const decide = async (decision: boolean) => {
    setSubmitting(true)
    setError(null)
    try {
      await resumeHarness(sessionId, { gate, decision })
      onDecisionHandled()
    } catch (err) {
      setError(err instanceof Error ? err.message : '决策提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, decide }
}

function DecisionButton({
  label,
  icon,
  tone,
  disabled,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  tone: 'passed' | 'failed'
  disabled: boolean
  onClick: () => void
}) {
  const toneClasses =
    tone === 'passed'
      ? 'bg-status-passed/15 text-status-passed hover:bg-status-passed/25'
      : 'bg-status-failed/15 text-status-failed hover:bg-status-failed/25'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 ease-out disabled:opacity-40 ${toneClasses}`}
    >
      {icon}
      {label}
    </button>
  )
}

function PipelineEmpty({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm rounded-lg border border-app-line bg-app-panel px-8 py-10 text-center">
        <Activity size={28} className="mx-auto text-app-muted" />
        <h2 className="mt-4 text-base font-semibold text-app-text">暂无活动会话</h2>
        <p className="mt-2 text-xs leading-5 text-app-secondary">
          启动 Harness 流程后，这里将实时展示 8 阶段 DAG、闸门决策与流程日志。
        </p>
        <button
          type="button"
          onClick={() => onNavigate('requirement')}
          className="mt-5 rounded-lg bg-app-primary px-4 py-2 text-xs font-semibold text-[#0F1115] transition-colors duration-150 ease-out hover:bg-[#6096F8]"
        >
          去启动流程
        </button>
      </div>
    </div>
  )
}

function resolveStageTitle(currentStage: string): string {
  if (STAGE_TITLE_OVERRIDES[currentStage]) {
    return STAGE_TITLE_OVERRIDES[currentStage]
  }
  const node = [...FLOW_NODES, ENTROPY_NODE].find((item) => item.id === currentStage)
  return node?.title ?? currentStage
}

function formatTokens(total: number): string {
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)}k`
  }
  return String(total)
}

function mapSessionStatus(status: HarnessStateSnapshot['status']): 'running' | 'passed' | 'failed' {
  if (status === 'completed') {
    return 'passed'
  }
  if (status === 'ended') {
    return 'failed'
  }
  return 'running'
}
