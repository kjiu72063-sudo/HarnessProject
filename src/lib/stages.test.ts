import { describe, expect, it } from 'vitest'
import { buildSnapshot, buildState } from '../test/factories'
import { deriveStageStatuses, buildLogEntries } from './stages'

describe('deriveStageStatuses', () => {
  it('returns all pending for null snapshot', () => {
    const statuses = deriveStageStatuses(null)
    expect(statuses.initializer).toBe('pending')
    expect(statuses.human_intervention).toBe('pending')
    expect(statuses.entropy).toBe('pending')
  })

  it('marks everything passed when status is completed', () => {
    const statuses = deriveStageStatuses(buildSnapshot({ status: 'completed' }))
    expect(statuses.initializer).toBe('passed')
    expect(statuses.acceptance_check).toBe('passed')
    expect(statuses.entropy).toBe('passed')
  })

  it('marks human_intervention failed when status is ended', () => {
    const statuses = deriveStageStatuses(buildSnapshot({ status: 'ended' }))
    expect(statuses.initializer).toBe('passed')
    expect(statuses.human_intervention).toBe('failed')
    expect(statuses.entropy).toBe('passed')
  })

  it('uses next[0] anchor to split passed/running/pending', () => {
    const statuses = deriveStageStatuses(
      buildSnapshot({ next: ['coding_agent'], status: 'running' }),
    )
    expect(statuses.initializer).toBe('passed')
    expect(statuses.design_approval).toBe('passed')
    expect(statuses.coding_agent).toBe('running')
    expect(statuses.validation).toBe('pending')
  })

  it('falls back to current_stage when next is empty', () => {
    const statuses = deriveStageStatuses(
      buildSnapshot({ next: [], state: buildState({ current_stage: 'validation' }) }),
    )
    expect(statuses.initializer).toBe('passed')
    expect(statuses.validation).toBe('running')
    expect(statuses.merge_deploy).toBe('pending')
  })
})

describe('deriveStageStatuses 回退与失败标记', () => {
  it('falls back to boundary 0 for unknown current_stage', () => {
    const statuses = deriveStageStatuses(
      buildSnapshot({ next: [], state: buildState({ current_stage: 'unknown_stage' }) }),
    )
    expect(statuses.initializer).toBe('running')
    expect(statuses.information_layer).toBe('pending')
  })

  it('marks test_result failed when test failed but stage passed', () => {
    const statuses = deriveStageStatuses(
      buildSnapshot({
        next: ['merge_deploy'],
        state: buildState({ test_result: { pass: false, summary: '2 failed' } }),
      }),
    )
    expect(statuses.test_result).toBe('failed')
  })
})

describe('deriveStageStatuses 人工介入与熵', () => {
  it('marks review failed when human_intervention escalated', () => {
    const statuses = deriveStageStatuses(
      buildSnapshot({
        next: ['acceptance_check'],
        state: buildState({ human_intervention: true }),
      }),
    )
    expect(statuses.review).toBe('failed')
  })

  it('keeps entropy running only when interrupted', () => {
    expect(deriveStageStatuses(buildSnapshot({ status: 'running' })).entropy).toBe('pending')
    expect(deriveStageStatuses(buildSnapshot({ status: 'interrupted' })).entropy).toBe('running')
  })
})

describe('buildLogEntries', () => {
  it('returns empty for null snapshot', () => {
    expect(buildLogEntries(null)).toEqual([])
  })

  it('starts with session boot log containing session id and project', () => {
    const entries = buildLogEntries(buildSnapshot())
    expect(entries[0]).toEqual({
      level: 'info',
      message: 'Harness 会话 sess-001 已启动 · 项目 proj-001',
    })
  })

  it('lists completed stage logs and info layer summary', () => {
    const entries = buildLogEntries(
      buildSnapshot({
        next: ['prototype_confirmation'],
        state: buildState({
          design_docs: [{ summary: '需求文档已生成' }],
        }),
      }),
    )
    expect(entries).toContainEqual({
      level: 'info',
      message: '阶段0 初始化 Agent 完成',
    })
    expect(entries).toContainEqual({ level: 'info', message: '信息层产出: 需求文档已生成' })
  })

  it('warns on revision loop and feedback iterations', () => {
    const entries = buildLogEntries(
      buildSnapshot({
        state: buildState({
          design_docs: [{ summary: 'a' }, { summary: 'b' }],
          current_iteration: 2,
          max_iterations: 3,
        }),
      }),
    )
    expect(entries).toContainEqual({ level: 'warn', message: '检测到驳回回环 · 信息层已修订 2 轮' })
    expect(entries).toContainEqual({ level: 'warn', message: '反馈循环 · 第 2/3 轮' })
  })

  it('errors when human intervention escalated without ending', () => {
    const entries = buildLogEntries(
      buildSnapshot({
        next: [],
        state: buildState({ human_intervention: true }),
      }),
    )
    expect(entries).toContainEqual({ level: 'error', message: '循环预算超限 · 已升级人类介入' })
  })
})

describe('buildLogEntries 决策与终态', () => {
  it('prompts decision when interrupted at a named gate', () => {
    const entries = buildLogEntries(buildSnapshot({ status: 'interrupted', next: ['design_approval'] }))
    expect(entries).toContainEqual({
      level: 'warn',
      message: '等待人工决策 · 设计审批（通过 / 驳回）',
    })
  })

  it('logs completion and termination', () => {
    expect(
      buildLogEntries(buildSnapshot({ status: 'completed' })).at(-1),
    ).toEqual({ level: 'success', message: '流程已完成 · 全部闸门通过' })
    expect(buildLogEntries(buildSnapshot({ status: 'ended' })).at(-1)).toEqual({
      level: 'error',
      message: '流程已终止 · 人类介入（逃生口放弃）',
    })
  })

  it('appends token usage when total is positive', () => {
    const entries = buildLogEntries(
      buildSnapshot({
        state: buildState({
          token_usage_total: { prompt_tokens: 120, completion_tokens: 80, total_tokens: 200 },
        }),
      }),
    )
    expect(entries.at(-1)).toEqual({
      level: 'info',
      message: 'Token 用量 · prompt 120 / completion 80 / total 200',
    })
  })
})
