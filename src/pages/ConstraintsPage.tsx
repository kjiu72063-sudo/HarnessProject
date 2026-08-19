import { ListChecks, ShieldCheck } from 'lucide-react'
import type { JSX } from 'react'
import { useSessionState } from '../hooks/useSessionState'
import { HARNESS_RULES, LINTER_ENGINES, VERIFY_GATES } from '../lib/constraintsData'
import type { VerifyResult } from '../types/harness'

interface ConstraintsPageProps {
  sessionId: string | null
}

export function ConstraintsPage({ sessionId }: ConstraintsPageProps) {
  const { snapshot, error } = useSessionState(sessionId)
  const verifyResult = snapshot?.state.verify_result ?? null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-app-text">约束配置</h2>
          <p className="mt-1 text-xs text-app-secondary">
            AGENTS.md 硬性规则 · Linter 引擎 · verify.sh 全闸门
          </p>
        </div>
        <SessionChip sessionId={sessionId} />
      </header>

      <RulesSection />
      <LinterSection />
      <GateResultsSection verifyResult={verifyResult} error={error} />
    </div>
  )
}

function SessionChip({ sessionId }: { sessionId: string | null }) {
  return (
    <span className="rounded-lg border border-app-line bg-app-panel px-3 py-1.5 font-mono text-[11px] text-app-secondary">
      {sessionId ? `session ${sessionId.slice(0, 8)}` : '无活动会话'}
    </span>
  )
}

function SectionHeader({ icon, title, count }: { icon: JSX.Element; title: string; count: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-app-line px-5 py-3.5">
      {icon}
      <h3 className="text-sm font-semibold text-app-text">{title}</h3>
      <span className="ml-auto font-mono text-[11px] text-app-muted">{count}</span>
    </div>
  )
}

function RulesSection() {
  return (
    <section className="rounded-lg border border-app-line bg-app-panel">
      <SectionHeader
        icon={<ShieldCheck size={14} />}
        title="AGENTS.md 硬性规则"
        count={`${HARNESS_RULES.length} 条`}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-app-line text-[11px] uppercase text-app-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">编号</th>
              <th className="px-5 py-2.5 font-medium">规则</th>
              <th className="px-5 py-2.5 font-medium">执行方式</th>
              <th className="px-5 py-2.5 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {HARNESS_RULES.map((rule) => (
              <tr key={rule.id} className="border-b border-app-line/60 last:border-none">
                <td className="px-5 py-3 font-mono text-xs text-app-muted">#{rule.id}</td>
                <td className="px-5 py-3">
                  <span className="block font-semibold text-app-text">{rule.title}</span>
                  <span className="mt-0.5 block text-xs text-app-secondary">{rule.detail}</span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-app-secondary">{rule.enforcer}</td>
                <td className="px-5 py-3">{renderEnforcedBadge(rule.enforced)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LinterSection() {
  return (
    <section className="rounded-lg border border-app-line bg-app-panel">
      <SectionHeader
        icon={<ListChecks size={14} />}
        title="Linter 引擎"
        count={`${LINTER_ENGINES.length} 个`}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-app-line text-[11px] uppercase text-app-muted">
            <tr>
              <th className="px-5 py-2.5 font-medium">Linter</th>
              <th className="px-5 py-2.5 font-medium">作用域</th>
              <th className="px-5 py-2.5 font-medium">职责</th>
              <th className="px-5 py-2.5 font-medium">规则数</th>
            </tr>
          </thead>
          <tbody>
            {LINTER_ENGINES.map((linter) => (
              <tr key={linter.name} className="border-b border-app-line/60 last:border-none">
                <td className="px-5 py-3 font-semibold text-app-text">{linter.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-app-secondary">{linter.scope}</td>
                <td className="px-5 py-3 text-xs text-app-secondary">{linter.duty}</td>
                <td className="px-5 py-3 font-mono text-xs text-app-secondary">{linter.ruleCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GateResultsSection({
  verifyResult,
  error,
}: {
  verifyResult: VerifyResult | null
  error: string | null
}) {
  return (
    <section className="rounded-lg border border-app-line bg-app-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app-text">verify.sh 闸门结果</h3>
        {renderVerifyBadge(verifyResult)}
      </div>
      {verifyResult?.summary && (
        <p className="mb-4 rounded-lg bg-app-bg px-3.5 py-2.5 font-mono text-xs leading-5 text-app-secondary">
          {verifyResult.summary}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {VERIFY_GATES.map((gate) => (
          <div
            key={gate.id}
            className="flex items-center justify-between rounded-lg border border-app-line bg-app-bg px-3.5 py-2.5"
          >
            <span>
              <span className="block text-xs font-semibold text-app-text">
                {gate.id}. {gate.name}
              </span>
              <span className="block text-[11px] text-app-muted">{gate.detail}</span>
            </span>
            {renderGateStatus(verifyResult)}
          </div>
        ))}
      </div>
      {error && <p className="mt-4 text-xs text-status-failed">闸门数据拉取失败: {error}</p>}
    </section>
  )
}

function renderEnforcedBadge(enforced: boolean): JSX.Element {
  return enforced ? (
    <span className="inline-flex items-center rounded border border-status-passed/40 bg-status-passed/10 px-2 py-0.5 text-[11px] text-status-passed">
      已机械化
    </span>
  ) : (
    <span className="inline-flex items-center rounded border border-status-running/40 bg-status-running/10 px-2 py-0.5 text-[11px] text-status-running">
      人工审查
    </span>
  )
}

function renderVerifyBadge(verifyResult: VerifyResult | null): JSX.Element {
  if (verifyResult?.pass === true) {
    return <span className="text-xs font-semibold text-status-passed">全部通过</span>
  }
  if (verifyResult?.pass === false) {
    return <span className="text-xs font-semibold text-status-failed">存在失败</span>
  }
  return <span className="text-xs text-app-muted">未运行</span>
}

function renderGateStatus(verifyResult: VerifyResult | null): JSX.Element {
  if (verifyResult?.pass === true) {
    return <span className="font-mono text-xs text-status-passed">PASS</span>
  }
  if (verifyResult?.pass === false) {
    return <span className="font-mono text-xs text-status-failed">FAIL</span>
  }
  return <span className="font-mono text-xs text-app-muted">--</span>
}
