import type { HarnessState, HarnessStateSnapshot } from '../types/harness'

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
