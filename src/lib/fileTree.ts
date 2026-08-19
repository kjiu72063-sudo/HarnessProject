import type { CodeArtifactEntry } from '../types/harness'

export interface FileTreeNode {
  name: string
  path: string
  lines: number | null
  isFile: boolean
  children: FileTreeNode[]
}

export function buildFileTree(artifacts: CodeArtifactEntry[]): FileTreeNode[] {
  const root: FileTreeNode = { name: '', path: '', lines: null, isFile: false, children: [] }
  for (const artifact of artifacts) {
    const path = typeof artifact.path === 'string' ? artifact.path : ''
    if (!path) {
      continue
    }
    insertPath(root, path, typeof artifact.lines === 'number' ? artifact.lines : null)
  }
  return sortTree(root.children)
}

function insertPath(root: FileTreeNode, path: string, lines: number | null): void {
  const segments = path.split('/').filter((segment) => segment.length > 0)
  let current = root
  segments.forEach((segment, index) => {
    const isFile = index === segments.length - 1
    let child = current.children.find((item) => item.name === segment && item.isFile === isFile)
    if (!child) {
      child = {
        name: segment,
        path: segments.slice(0, index + 1).join('/'),
        lines: isFile ? lines : null,
        isFile,
        children: [],
      }
      current.children.push(child)
    }
    current = child
  })
}

function sortTree(nodes: FileTreeNode[]): FileTreeNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (a.isFile !== b.isFile) {
      return a.isFile ? 1 : -1
    }
    return a.name.localeCompare(b.name)
  })
  for (const node of sorted) {
    node.children = sortTree(node.children)
  }
  return sorted
}
