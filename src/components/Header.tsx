import { User } from 'lucide-react'

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-app-line bg-app-bg px-6">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-[3px] bg-app-primary" aria-hidden="true" />
        <h1 className="text-[15px] font-semibold text-app-text">Harness Engine</h1>
        <span className="rounded border border-app-line px-1.5 py-0.5 font-mono text-[10px] text-app-muted">
          v0.1.0
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden text-xs text-app-muted sm:block">环境: development</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-app-line bg-app-panel text-app-secondary">
          <User size={16} />
        </span>
      </div>
    </header>
  )
}
