import type { Constraint } from '../types/constraints'
import type { HarnessState, HarnessStateSnapshot } from '../types/harness'

export function buildConstraint(overrides: Partial<Constraint> = {}): Constraint {
  return {
    id: 1,
    project_id: 'proj-001',
    source: 'manual',
    source_key: 'manual-1',
    rule_no: 1,
    title: '前端 API 相对路径',
    detail: '禁止硬编码域名/IP/localhost',
    rule_type: 'static_text',
    enforcer: 'dependency-cruiser',
    enforcement: 'mechanized',
    gate_ids: [4],
    enabled: true,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-20T00:00:00Z',
    ...overrides,
  } as Constraint
}

export function buildState(overrides: Partial<HarnessState> = {}): HarnessState {
  return {
    project_id: 'proj-001',
    project_name: '示例项目',
    tech_stack: {
      frontend: 'react-19',
      backend: 'python-3.12',
      database: 'postgresql',
      llm: 'openai',
      frontend_package_manager: 'pnpm',
      backend_package_manager: 'uv',
    },
    agents_md: '# AGENTS',
    rules: [],
    boundaries: '',
    progress: '',
    feature_list: [],
    git_log: '',
    design_docs: [],
    code_artifacts: [],
    worktree_branch: 'main',
    verify_result: {},
    test_result: {},
    feedback_log: [],
    issue_type: null,
    issue_resolved: false,
    max_iterations: 3,
    current_iteration: 0,
    token_usage_total: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
    current_stage: 'initializer',
    next_feature: null,
    human_intervention: false,
    gate_decision: false,
    ...overrides,
  }
}

export function buildSnapshot(overrides: Partial<HarnessStateSnapshot> = {}): HarnessStateSnapshot {
  return {
    session_id: 'sess-001',
    status: 'running',
    next: [],
    state: buildState(),
    ...overrides,
  }
}
