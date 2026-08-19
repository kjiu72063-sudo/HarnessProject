import { describe, expect, it } from 'vitest'
import { buildFileTree } from './fileTree'

describe('buildFileTree', () => {
  it('builds nested tree from artifact paths', () => {
    const tree = buildFileTree([
      { path: 'src/index.tsx', lines: 20 },
      { path: 'src/App.tsx', lines: 48 },
      { path: 'server/main.py', lines: 30 },
    ])
    expect(tree.map((node) => node.name)).toEqual(['server', 'src'])
    const src = tree.find((node) => node.name === 'src')
    expect(src?.isFile).toBe(false)
    expect(src?.children.map((child) => child.name)).toEqual(['App.tsx', 'index.tsx'])
    expect(src?.children[1].lines).toBe(20)
  })

  it('sorts directories before files with alphabetical order', () => {
    const tree = buildFileTree([
      { path: 'zeta.py', lines: 1 },
      { path: 'alpha/zeta.py', lines: 1 },
      { path: 'beta.py', lines: 1 },
    ])
    expect(tree.map((node) => node.name)).toEqual(['alpha', 'beta.py', 'zeta.py'])
  })

  it('skips entries without a path', () => {
    const tree = buildFileTree([{ lines: 10 }, { path: '', lines: 5 }])
    expect(tree).toEqual([])
  })

  it('mounts lines only on file nodes and keeps last value on repeats', () => {
    const tree = buildFileTree([
      { path: 'docs/readme.md', lines: 12 },
      { path: 'docs/readme.md', lines: 40 },
    ])
    expect(tree).toHaveLength(1)
    expect(tree[0].children[0].lines).toBe(12)
  })

  it('handles missing lines safely on file nodes', () => {
    const tree = buildFileTree([{ path: 'weird.md' }])
    expect(tree).toHaveLength(1)
    expect(tree[0].isFile).toBe(true)
    expect(tree[0].lines).toBeNull()
  })
})
