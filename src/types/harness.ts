export type StageStatus = 'pending' | 'running' | 'passed' | 'failed'

export type HarnessSessionStatus = 'running' | 'interrupted' | 'completed' | 'ended'

export type GateName =
  | 'prototype_confirmation'
  | 'design_approval'
  | 'acceptance_check'
  | 'human_intervention'

export interface TechStackSpec {
  frontend: string
  backend: string
  database: string
  llm: string
  frontend_package_manager: string
  backend_package_manager: string
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface HarnessRule {
  [key: string]: unknown
}

export interface FeatureEntry {
  [key: string]: unknown
}

export interface DesignDocEntry {
  source?: string
  status?: string
  summary?: string
  [key: string]: unknown
}

export interface CodeArtifactEntry {
  path?: string
  lines?: number
  [key: string]: unknown
}

export interface GateResult {
  gate_id: number
  name: string
  pass: boolean
}

export interface VerifyResult {
  pass?: boolean
  summary?: string
  gates?: GateResult[]
  [key: string]: unknown
}

export interface TestResult {
  pass?: boolean
  summary?: string
  coverage?: number
  [key: string]: unknown
}

export interface FeedbackEntry {
  event?: string
  decision?: string
  iteration_at_entry?: number
  [key: string]: unknown
}

export interface HarnessState {
  project_id: string
  project_name: string
  tech_stack: TechStackSpec
  agents_md: string
  rules: HarnessRule[]
  boundaries: string
  progress: string
  feature_list: FeatureEntry[]
  git_log: string
  design_docs: DesignDocEntry[]
  code_artifacts: CodeArtifactEntry[]
  worktree_branch: string
  verify_result: VerifyResult
  test_result: TestResult
  feedback_log: FeedbackEntry[]
  issue_type: string | null
  issue_resolved: boolean
  max_iterations: number
  current_iteration: number
  token_usage_total: TokenUsage
  current_stage: string
  next_feature: string | null
  human_intervention: boolean
  gate_decision: boolean
}

export interface HarnessStartRequest {
  project_id: string
  requirement: string
  tech_stack: TechStackSpec
}

export interface HarnessStartResponse {
  session_id: string
  status: string
}

export interface ResumeRequest {
  gate: string
  decision: boolean
}

export interface HarnessResumeResponse {
  status: string
  next: string[]
  state: HarnessState
}

export interface HarnessStateSnapshot {
  session_id: string
  status: HarnessSessionStatus
  next: string[]
  state: HarnessState
}

export interface RecentSession {
  project_id: string
  session_id: string
  started_at: number
}
