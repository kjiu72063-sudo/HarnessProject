import { FileCode2, Folder, FolderOpen, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useSessionState } from '../hooks/useSessionState'
import { buildFileTree, type FileTreeNode } from '../lib/fileTree'
import type { CodeArtifactEntry, HarnessState } from '../types/harness'

interface ArtifactsPageProps {
  sessionId: string | null
}

export function ArtifactsPage({ sessionId }: ArtifactsPageProps) {
  const { snapshot, error } = useSessionState(sessionId)
  const state = snapshot?.state ?? null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-app-text">产物管理</h2>
          <p className="mt-1 text-xs text-app-secondary">编码产物 · 统计指标 · 闸门详情</p>
        </div>
        <span className="rounded-lg border border-app-line bg-app-panel px-3 py-1.5 font-mono text-[11px] text-app-secondary">
          {sessionId ? `session ${sessionId.slice(0, 8)}` : '无活动会话'}
        </span>
      </header>

      <StatGrid state={state} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <FileTreeSection artifacts={state?.code_artifacts ?? []} />
        <GateDetailSection state={state} error={error} />
      </div>
    </div>
  )
}

function StatGrid({ state }: { state: HarnessState | null }) {
  const artifacts: CodeArtifactEntry[] = state?.code_artifacts ?? []
  const totalLines = artifacts.reduce(
    (sum, item) => sum + (typeof item.lines === 'number' ? item.lines : 0),
    0,
  )
  const coverage = state?.test_result?.coverage
  return (
    <section className="grid grid-cols-3 gap-3">
      <StatCard label="文件总数" value={String(artifacts.length)} icon={<FileCode2 size={15} />} />
      <StatCard label="代码行数" value={totalLines.toLocaleString()} icon={<FileCode2 size={15} />} />
      <StatCard
        label="测试覆盖率"
        value={typeof coverage === 'number' ? `${(coverage * 100).toFixed(1)}%` : '—'}
        icon={<ShieldCheck size={15} />}
      />
    </section>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-app-line bg-app-panel px-5 py-4">
      <div className="flex items-center gap-2 text-app-secondary">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-app-text">{value}</p>
    </div>
  )
}

function FileTreeSection({ artifacts }: { artifacts: CodeArtifactEntry[] }) {
  const tree = buildFileTree(artifacts)
  return (
    <section className="rounded-lg border border-app-line bg-app-panel">
      <div className="flex items-center gap-2 border-b border-app-line px-5 py-3.5">
        <Folder size={14} className="text-app-secondary" />
        <h3 className="text-sm font-semibold text-app-text">产物文件树</h3>
        <span className="ml-auto font-mono text-[11px] text-app-muted">{artifacts.length} 个文件</span>
      </div>
      <div className="max-h-[520px] overflow-y-auto px-3 py-3">
        {tree.length === 0 ? (
          <p className="py-8 text-center text-xs text-app-muted">
            暂无产物文件 · 编码阶段完成后自动生成
          </p>
        ) : (
          tree.map((node) => <TreeBranch key={node.path} node={node} depth={0} />)
        )}
      </div>
    </section>
  )
}

function TreeBranch({ node, depth }: { node: FileTreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  if (node.isFile) {
    return (
      <div
        className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-app-bg"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="flex items-center gap-2 text-xs text-app-text">
          <FileCode2 size={13} className="text-app-muted" />
          {node.name}
        </span>
        {node.lines !== null && <span className="font-mono text-[11px] text-app-muted">{node.lines} 行</span>}
      </div>
    )
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-semibold text-app-text hover:bg-app-bg"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {open ? (
          <FolderOpen size={13} className="text-app-primary" />
        ) : (
          <Folder size={13} className="text-app-primary" />
        )}
        {node.name}
        <span className="font-mono text-[10px] font-normal text-app-muted">{node.children.length} 项</span>
      </button>
      {open && node.children.map((child) => <TreeBranch key={child.path} node={child} depth={depth + 1} />)}
    </div>
  )
}

function GateDetailSection({ state, error }: { state: HarnessState | null; error: string | null }) {
  return (
    <section className="h-fit rounded-lg border border-app-line bg-app-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app-text">闸门详情</h3>
        {state?.verify_result?.pass === true ? (
          <span className="rounded border border-status-passed/40 bg-status-passed/10 px-2 py-0.5 text-[11px] text-status-passed">
            PASS
          </span>
        ) : state?.verify_result?.pass === false ? (
          <span className="rounded border border-status-failed/40 bg-status-failed/10 px-2 py-0.5 text-[11px] text-status-failed">
            FAIL
          </span>
        ) : (
          <span className="rounded border border-app-line px-2 py-0.5 text-[11px] text-app-muted">未运行</span>
        )}
      </div>
      <dl className="mt-4 space-y-3 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-app-secondary">verify.sh 闸门</dt>
          <dd className="font-mono text-app-text">14 项</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-app-secondary">worktree 分支</dt>
          <dd className="truncate font-mono text-app-text">{state?.worktree_branch || '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-app-secondary">测试结果</dt>
          <dd className="font-mono text-app-text">
            {state?.test_result?.pass === true
              ? 'PASS'
              : state?.test_result?.pass === false
                ? 'FAIL'
                : '—'}
          </dd>
        </div>
      </dl>
      {state?.verify_result?.summary && (
        <p className="mt-4 rounded-lg bg-app-bg px-3.5 py-2.5 font-mono text-[11px] leading-5 text-app-secondary">
          {state.verify_result.summary}
        </p>
      )}
      {error && <p className="mt-4 text-xs text-status-failed">数据拉取失败: {error}</p>}
    </section>
  )
}
