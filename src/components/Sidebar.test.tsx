import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('renders all four nav entries with aria-current on active page', () => {
    render(<Sidebar active="pipeline" onNavigate={vi.fn()} sessionActive />)
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByText('需求输入')).toBeInTheDocument()
    expect(screen.getByText('流程监控')).toBeInTheDocument()
    expect(screen.getByText('约束配置')).toBeInTheDocument()
    expect(screen.getByText('产物管理')).toBeInTheDocument()
    const active = screen.getByRole('button', { name: /流程监控/ })
    expect(active).toHaveAttribute('aria-current', 'page')
  })

  it('invokes onNavigate with target page id', () => {
    const onNavigate = vi.fn()
    render(<Sidebar active="requirement" onNavigate={onNavigate} sessionActive={false} />)
    fireEvent.click(screen.getByRole('button', { name: /产物管理/ }))
    expect(onNavigate).toHaveBeenCalledWith('artifacts')
  })

  it('shows session state in footer', () => {
    const { rerender } = render(<Sidebar active="requirement" onNavigate={vi.fn()} sessionActive />)
    expect(screen.getByText('Harness 会话进行中')).toBeInTheDocument()
    rerender(<Sidebar active="requirement" onNavigate={vi.fn()} sessionActive={false} />)
    expect(screen.getByText('无活动会话')).toBeInTheDocument()
  })
})
