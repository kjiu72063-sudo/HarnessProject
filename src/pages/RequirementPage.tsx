import { Rocket } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'
import { startHarness } from '../api/harness'
import { addRecentSession, getRecentSessions } from '../lib/recentSessions'
import type { RecentSession, TechStackSpec } from '../types/harness'
import { RecentProjects } from './RecentProjects'
import { TechStackFields } from './TechStackFields'

interface RequirementPageProps {
  onSessionStarted: (sessionId: string) => void
}

export function RequirementPage({ onSessionStarted }: RequirementPageProps) {
  const [recent, setRecent] = useState<RecentSession[]>([])

  useEffect(() => {
    setRecent(getRecentSessions())
  }, [])

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h2 className="text-[32px] font-bold leading-tight text-app-text">
          从需求到可部署应用，一句话开始
        </h2>
        <p className="mt-2 text-[15px] text-app-secondary">
          描述你的产品愿景，Harness 将按 8 阶段流程自动生成完整应用
        </p>
        <RequirementForm onSessionStarted={onSessionStarted} />
      </section>

      <RecentProjects sessions={recent} onOpen={onSessionStarted} />
    </div>
  )
}

interface RequirementFormProps {
  onSessionStarted: (sessionId: string) => void
}

function RequirementForm({ onSessionStarted }: RequirementFormProps) {
  const { projectName, setProjectName, requirement, setRequirement } = useProjectInputs()
  const [techStack, setTechStack] = useState<TechStackSpec>(DEFAULT_TECH_STACK)
  const { submitting, error, canSubmit, handleSubmit } = useStartHarness({
    projectName,
    requirement,
    techStack,
    onSessionStarted,
  })

  return (
    <form
      className="mt-8 space-y-6 rounded-lg border border-app-line bg-app-panel p-6"
      onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
    >
      <ProjectFields
        projectName={projectName}
        requirement={requirement}
        onProjectNameChange={setProjectName}
        onRequirementChange={setRequirement}
      />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-app-text">技术栈配置</h3>
        <TechStackFields value={techStack} onChange={setTechStack} />
      </div>

      <ConstraintSection />

      {error && (
        <p className="rounded-lg border border-status-failed/40 bg-status-failed/10 px-3.5 py-2.5 text-xs text-status-failed">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-app-primary px-4 py-2.5 text-sm font-semibold text-[#0F1115] transition-all duration-150 ease-out hover:bg-[#6096F8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Rocket size={15} />
        {submitting ? '正在启动...' : '启动 Harness 流程'}
      </button>
    </form>
  )
}

function useProjectInputs() {
  const [projectName, setProjectName] = useState('')
  const [requirement, setRequirement] = useState('')
  return { projectName, setProjectName, requirement, setRequirement }
}

interface StartHarnessParams {
  projectName: string
  requirement: string
  techStack: TechStackSpec
  onSessionStarted: (sessionId: string) => void
}

function useStartHarness({ projectName, requirement, techStack, onSessionStarted }: StartHarnessParams) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSubmit = projectName.trim().length > 0 && requirement.trim().length > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const response = await startHarness({
        project_id: projectName.trim(),
        requirement: requirement.trim(),
        tech_stack: techStack,
      })
      addRecentSession({
        project_id: projectName.trim(),
        session_id: response.session_id,
        started_at: Date.now(),
      })
      onSessionStarted(response.session_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, error, canSubmit, handleSubmit }
}

const DEFAULT_TECH_STACK: TechStackSpec = {
  frontend: 'react-19',
  backend: 'python-3.12',
  database: 'postgresql',
  llm: 'openai',
  frontend_package_manager: 'pnpm',
  backend_package_manager: 'uv',
}

const CONSTRAINT_OPTIONS = [
  { key: 'agentsMd', label: '自动生成 AGENTS.md', detail: '项目规范与经验沉淀' },
  { key: 'linter', label: 'Linter 规则自动注入', detail: '约定 → 机械规则对照' },
  { key: 'coverage', label: '覆盖率闸门 ≥ 80%', detail: 'pytest-cov + vitest 覆盖率' },
] as const

type ConstraintKey = (typeof CONSTRAINT_OPTIONS)[number]['key']

function ConstraintSection() {
  const [constraints, setConstraints] = useState<Record<ConstraintKey, boolean>>({
    agentsMd: true,
    linter: true,
    coverage: true,
  })
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-app-text">约束预配置</h3>
      <div className="space-y-2.5">
        {CONSTRAINT_OPTIONS.map((option) => (
          <ConstraintToggle
            key={option.key}
            option={option}
            enabled={constraints[option.key]}
            onToggle={() => setConstraints({ ...constraints, [option.key]: !constraints[option.key] })}
          />
        ))}
      </div>
    </div>
  )
}

function ConstraintToggle({
  option,
  enabled,
  onToggle,
}: {
  option: (typeof CONSTRAINT_OPTIONS)[number]
  enabled: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border border-app-line bg-app-bg px-3.5 py-3 text-left transition-colors duration-150 ease-out hover:border-app-secondary/50"
    >
      <span>
        <span className="block text-[13px] font-medium text-app-text">{option.label}</span>
        <span className="block text-[11px] text-app-muted">{option.detail}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ease-out ${
          enabled ? 'bg-app-primary' : 'bg-app-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-app-bg transition-all duration-150 ease-out ${
            enabled ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function ProjectFields({
  projectName,
  requirement,
  onProjectNameChange,
  onRequirementChange,
}: {
  projectName: string
  requirement: string
  onProjectNameChange: (value: string) => void
  onRequirementChange: (value: string) => void
}) {
  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-xs text-app-secondary">项目名称</span>
        <input
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          placeholder="my-app"
          className="w-full rounded-lg border border-app-line bg-app-bg px-3 py-2 text-sm text-app-text transition-colors duration-150 ease-out placeholder:text-app-muted focus:border-app-primary focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-app-secondary">需求描述</span>
        <textarea
          value={requirement}
          onChange={(event) => onRequirementChange(event.target.value)}
          placeholder="用一段话描述你想构建的应用：目标用户、核心功能、期望的技术形态..."
          rows={5}
          className="w-full resize-none rounded-lg border border-app-line bg-app-bg px-3 py-2.5 text-sm leading-6 text-app-text transition-colors duration-150 ease-out placeholder:text-app-muted focus:border-app-primary focus:outline-none"
        />
      </label>
    </>
  )
}
