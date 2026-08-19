import { Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { JSX } from 'react'
import { useConstraints } from '../hooks/useConstraints'
import type { Constraint, RuleType } from '../types/constraints'

const RULE_TYPE_OPTIONS: { value: RuleType; label: string }[] = [
  { value: 'static_text', label: '静态文本约定' },
  { value: 'file_size', label: '文件/函数行数' },
  { value: 'dependency_direction', label: '依赖方向' },
  { value: 'port_consistency', label: '端口一致性' },
  { value: 'tech_stack_alignment', label: '技术栈基线' },
  { value: 'git_tracking', label: 'Git 追踪' },
  { value: 'doc_freshness', label: '文档新鲜度' },
  { value: 'type_check', label: '类型检查' },
  { value: 'test_coverage', label: '测试覆盖率' },
  { value: 'process_convention', label: '流程约定' },
]

export interface ConstraintCreateRequest {
  title: string
  detail: string
  rule_type: RuleType
  enforcer: string
}

interface ConstraintRulesSectionProps {
  projectId: string
}

export function ConstraintRulesSection({ projectId }: ConstraintRulesSectionProps) {
  const { constraints, loading, error, create, update } = useConstraints(projectId)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const runAction = async (action: () => Promise<unknown>): Promise<void> => {
    setActionError(null)
    try {
      await action()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section className="rounded-lg border border-app-line bg-app-panel">
      <div className="flex items-center gap-2 border-b border-app-line px-5 py-3.5">
        <ShieldCheck size={14} />
        <h3 className="text-sm font-semibold text-app-text">规则库（AGENTS.md + 自定义）</h3>
        <span className="ml-auto font-mono text-[11px] text-app-muted">
          {projectId ? `project ${projectId.slice(0, 8)}` : '系统规则'} · {constraints.length} 条
        </span>
      </div>
      <RulesTable
        constraints={constraints}
        onToggle={(constraint) =>
          void runAction(() => update(constraint.id, { enabled: !constraint.enabled }))
        }
      />
      {(error || actionError) && (
        <p className="px-5 py-3 text-xs text-status-failed">规则操作失败: {actionError ?? error}</p>
      )}
      {loading && <p className="px-5 py-3 text-xs text-app-muted">加载规则库…</p>}
      <AddRuleFooter
        projectId={projectId}
        formOpen={formOpen}
        onToggleForm={() => setFormOpen((open) => !open)}
        onSubmit={(request) => void runAction(() => create({ project_id: projectId, ...request }))}
      />
    </section>
  )
}

function RulesTable({
  constraints,
  onToggle,
}: {
  constraints: Constraint[]
  onToggle: (constraint: Constraint) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-app-line text-[11px] uppercase text-app-muted">
          <tr>
            <th className="px-5 py-2.5 font-medium">规则号</th>
            <th className="px-5 py-2.5 font-medium">标题</th>
            <th className="px-5 py-2.5 font-medium">来源</th>
            <th className="px-5 py-2.5 font-medium">类型</th>
            <th className="px-5 py-2.5 font-medium">执行器</th>
            <th className="px-5 py-2.5 font-medium">执行方式</th>
            <th className="px-5 py-2.5 font-medium">闸门</th>
            <th className="px-5 py-2.5 font-medium">启用</th>
          </tr>
        </thead>
        <tbody>
          {constraints.map((constraint) => (
            <RuleRow key={constraint.id} constraint={constraint} onToggle={onToggle} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RuleRow({
  constraint,
  onToggle,
}: {
  constraint: Constraint
  onToggle: (constraint: Constraint) => void
}) {
  return (
    <tr className="border-b border-app-line/60 last:border-none">
      <td className="px-5 py-3 font-mono text-xs text-app-muted">#{constraint.rule_no}</td>
      <td className="max-w-72 px-5 py-3">
        <span className="block font-semibold text-app-text">{constraint.title}</span>
        {constraint.detail && (
          <span className="mt-0.5 block text-xs text-app-secondary">{constraint.detail}</span>
        )}
      </td>
      <td className="px-5 py-3 font-mono text-xs text-app-secondary">{constraint.source}</td>
      <td className="px-5 py-3 font-mono text-xs text-app-secondary">{constraint.rule_type}</td>
      <td className="px-5 py-3 font-mono text-xs text-app-secondary">{constraint.enforcer}</td>
      <td className="px-5 py-3">{renderEnforcementBadge(constraint)}</td>
      <td className="px-5 py-3 font-mono text-xs text-app-secondary">
        {constraint.gate_ids.length > 0 ? constraint.gate_ids.join(', ') : '--'}
      </td>
      <td className="px-5 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={constraint.enabled}
          aria-label={`toggle ${constraint.title}`}
          onClick={() => onToggle(constraint)}
          className={`inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
            constraint.enabled
              ? 'border-status-passed/50 bg-status-passed/30'
              : 'border-app-line bg-app-bg'
          }`}
        >
          <span
            className={`h-3.5 w-3.5 rounded-full transition-transform ${
              constraint.enabled ? 'translate-x-4.5 bg-status-passed' : 'translate-x-0.5 bg-app-muted'
            }`}
          />
        </button>
      </td>
    </tr>
  )
}

interface AddRuleFooterProps {
  projectId: string
  formOpen: boolean
  onToggleForm: () => void
  onSubmit: (request: ConstraintCreateRequest) => void
}

function AddRuleFooter({ projectId, formOpen, onToggleForm, onSubmit }: AddRuleFooterProps) {
  return (
    <div className="border-t border-app-line px-5 py-3.5">
      <button
        type="button"
        onClick={onToggleForm}
        className="inline-flex items-center gap-1.5 rounded-lg border border-app-line px-3 py-1.5 text-xs font-medium text-app-text hover:bg-app-bg"
      >
        <Plus size={12} />
        添加自定义规则
      </button>
      {formOpen && (
        <ConstraintForm disabled={!projectId} onSubmit={onSubmit} />
      )}
      {!projectId && formOpen && (
        <p className="mt-2 text-xs text-app-muted">无活动会话：自定义规则需项目归属，请先创建会话</p>
      )}
    </div>
  )
}

interface ConstraintFormProps {
  disabled: boolean
  onSubmit: (request: ConstraintCreateRequest) => void
}

function ConstraintForm({ disabled, onSubmit }: ConstraintFormProps): JSX.Element {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [ruleType, setRuleType] = useState<RuleType>('static_text')
  const [enforcer, setEnforcer] = useState('')

  return (
    <form
      className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (disabled || title.trim() === '') return
        onSubmit({
          title: title.trim(),
          detail: detail.trim(),
          rule_type: ruleType,
          enforcer: enforcer.trim(),
        })
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="标题（必填）"
        className="rounded-lg border border-app-line bg-app-bg px-3 py-2 text-xs text-app-text placeholder:text-app-muted"
      />
      <input
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        placeholder="细节说明（可选）"
        className="rounded-lg border border-app-line bg-app-bg px-3 py-2 text-xs text-app-text placeholder:text-app-muted"
      />
      <TypeSelect value={ruleType} onChange={(value) => setRuleType(value)} />
      <div className="flex gap-2">
        <input
          value={enforcer}
          onChange={(event) => setEnforcer(event.target.value)}
          placeholder="执行器（可选）"
          className="w-full rounded-lg border border-app-line bg-app-bg px-3 py-2 text-xs text-app-text placeholder:text-app-muted"
        />
        <button
          type="submit"
          disabled={disabled || title.trim() === ''}
          className="shrink-0 rounded-lg border border-status-passed/50 bg-status-passed/10 px-3 py-2 text-xs font-semibold text-status-passed disabled:opacity-40"
        >
          提交
        </button>
      </div>
    </form>
  )
}

function TypeSelect({
  value,
  onChange,
}: {
  value: RuleType
  onChange: (value: RuleType) => void
}): JSX.Element {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as RuleType)}
      className="rounded-lg border border-app-line bg-app-bg px-3 py-2 text-xs text-app-text"
    >
      {RULE_TYPE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function renderEnforcementBadge(constraint: Constraint): JSX.Element {
  return constraint.enforcement === 'mechanized' ? (
    <span className="inline-flex items-center rounded border border-status-passed/40 bg-status-passed/10 px-2 py-0.5 text-[11px] text-status-passed">
      已机械化
    </span>
  ) : (
    <span className="inline-flex items-center rounded border border-status-running/40 bg-status-running/10 px-2 py-0.5 text-[11px] text-status-running">
      人工审查
    </span>
  )
}
