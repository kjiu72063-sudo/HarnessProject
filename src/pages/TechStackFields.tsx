import type { TechStackSpec } from '../types/harness'

interface TechStackFieldsProps {
  value: TechStackSpec
  onChange: (next: TechStackSpec) => void
}

const FIELDS: Array<{ key: keyof TechStackSpec; label: string; placeholder: string }> = [
  { key: 'frontend', label: '前端框架', placeholder: 'react-19' },
  { key: 'backend', label: '后端框架', placeholder: 'python-3.12' },
  { key: 'database', label: '数据库', placeholder: 'postgresql' },
  { key: 'llm', label: 'LLM', placeholder: 'openai' },
  { key: 'frontend_package_manager', label: '前端包管理器', placeholder: 'pnpm' },
  { key: 'backend_package_manager', label: '后端包管理器', placeholder: 'uv' },
]

export function TechStackFields({ value, onChange }: TechStackFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1.5 block text-xs text-app-secondary">{field.label}</span>
          <input
            value={value[field.key]}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-app-line bg-app-bg px-3 py-2 text-sm text-app-text transition-colors duration-150 ease-out placeholder:text-app-muted focus:border-app-primary focus:outline-none"
          />
        </label>
      ))}
    </div>
  )
}
