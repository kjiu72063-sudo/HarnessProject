import { Activity, Package, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

export type PageId = 'requirement' | 'pipeline' | 'constraints' | 'artifacts'

interface NavItem {
  id: PageId
  label: string
  description: string
  icon: typeof Sparkles
}

const NAV_ITEMS: NavItem[] = [
  { id: 'requirement', label: '需求输入', description: '启动新流程', icon: Sparkles },
  { id: 'pipeline', label: '流程监控', description: 'DAG · 日志 · 闸门', icon: Activity },
  { id: 'constraints', label: '约束配置', description: '规则 · Linter · 闸门', icon: ShieldCheck },
  { id: 'artifacts', label: '产物管理', description: '文件 · 统计 · 详情', icon: Package },
]

interface SidebarProps {
  active: PageId
  onNavigate: (page: PageId) => void
  sessionActive: boolean
}

export function Sidebar({ active, onNavigate, sessionActive }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-app-line bg-[#12151C]">
      <BrandHeader />
      <nav className="flex-1 space-y-1 px-3" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={item.id === active}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <SessionFooter sessionActive={sessionActive} />
    </aside>
  )
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3 px-5 pb-5 pt-6">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-primary/15 text-app-primary">
        <Workflow size={18} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-app-text">Harness Engine</span>
        <span className="block text-[11px] text-app-muted">AI 应用元开发平台</span>
      </span>
    </div>
  )
}

function NavButton({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem
  isActive: boolean
  onNavigate: (page: PageId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      aria-current={isActive ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ease-out ${
        isActive
          ? 'bg-app-primary/10 text-app-text'
          : 'text-app-secondary hover:bg-app-panel hover:text-app-text'
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md ${
          isActive ? 'bg-app-primary text-[#0F1115]' : 'bg-app-panel text-app-secondary'
        }`}
      >
        <item.icon size={15} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-4">{item.label}</span>
        <span className="block truncate text-[11px] text-app-muted">{item.description}</span>
      </span>
    </button>
  )
}

function SessionFooter({ sessionActive }: { sessionActive: boolean }) {
  return (
    <div className="border-t border-app-line px-5 py-4">
      <div className="flex items-center gap-2 text-[11px] text-app-muted">
        <span
          className={`h-1.5 w-1.5 rounded-full ${sessionActive ? 'bg-status-running animate-pulse' : 'bg-status-pending'}`}
        />
        {sessionActive ? 'Harness 会话进行中' : '无活动会话'}
      </div>
    </div>
  )
}
