import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DAGView } from './DAGView'
import { buildSnapshot, buildState } from '../test/factories'

describe('DAGView', () => {
  it('renders all 13 flow nodes plus entropy with pending statuses', () => {
    render(<DAGView snapshot={null} />)
    expect(screen.getByText('初始化 Agent')).toBeInTheDocument()
    expect(screen.getByText('需求与架构规划')).toBeInTheDocument()
    expect(screen.getByText('原型确认')).toBeInTheDocument()
    expect(screen.getByText('功能拆分与设计')).toBeInTheDocument()
    expect(screen.getByText('设计审批')).toBeInTheDocument()
    expect(screen.getByText('编码 Agent')).toBeInTheDocument()
    expect(screen.getByText('自校验与反馈循环')).toBeInTheDocument()
    expect(screen.getByText('合并与部署')).toBeInTheDocument()
    expect(screen.getByText('可观测性验证')).toBeInTheDocument()
    expect(screen.getByText('验收')).toBeInTheDocument()
    expect(screen.getByText('人类介入')).toBeInTheDocument()
    expect(screen.getByText('熵管理')).toBeInTheDocument()
    expect(screen.getAllByText('等待').length).toBeGreaterThan(0)
  })

  it('reflects running status at the anchor node', () => {
    render(
      <DAGView snapshot={buildSnapshot({ next: ['coding_agent'], status: 'running' })} />,
    )
    expect(screen.getAllByText('运行中').length).toBeGreaterThan(0)
    expect(screen.getAllByText('通过').length).toBeGreaterThan(0)
  })

  it('marks escape node failed when ended', () => {
    render(
      <DAGView
        snapshot={buildSnapshot({
          status: 'ended',
          state: buildState({ human_intervention: true }),
        })}
      />,
    )
    const failedBorders = document.querySelectorAll('.border-status-failed')
    expect(failedBorders.length).toBe(1)
  })
})
