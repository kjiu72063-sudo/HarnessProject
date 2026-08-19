export type ConstraintSource = 'agents_md' | 'manual'

export type RuleType =
  | 'static_text'
  | 'file_size'
  | 'dependency_direction'
  | 'port_consistency'
  | 'tech_stack_alignment'
  | 'git_tracking'
  | 'doc_freshness'
  | 'type_check'
  | 'test_coverage'
  | 'process_convention'

export type Enforcement = 'mechanized' | 'manual_review'

export interface Constraint {
  id: number
  project_id: string
  source: ConstraintSource
  source_key: string
  rule_no: number
  title: string
  detail: string
  rule_type: RuleType
  enforcer: string
  enforcement: Enforcement
  gate_ids: number[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface ConstraintCreateRequest {
  project_id: string
  title: string
  detail?: string
  rule_type: RuleType
  enforcer?: string
}

export interface ConstraintUpdateRequest {
  title?: string | null
  detail?: string | null
  enabled?: boolean | null
}
