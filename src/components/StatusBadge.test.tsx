import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['pending', '等待'],
    ['running', '运行中'],
    ['passed', '通过'],
    ['failed', '驳回'],
  ] as const)('renders label for %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('prefers custom label when provided', () => {
    render(<StatusBadge status="running" label="闸门暂停" />)
    expect(screen.getByText('闸门暂停')).toBeInTheDocument()
    expect(screen.queryByText('运行中')).not.toBeInTheDocument()
  })
})
