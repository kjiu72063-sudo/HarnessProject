export interface LinterEntry {
  name: string
  scope: string
  duty: string
  ruleCount: string
}

export interface GateEntry {
  id: number
  name: string
  detail: string
}


export const LINTER_ENGINES: LinterEntry[] = [
  { name: 'ESLint', scope: '前端 src/', duty: 'TS/TSX 静态分析：any 类型 / 行数上限 / 硬编码域名', ruleCount: '40+' },
  { name: 'Stylelint', scope: '前端 CSS', duty: 'stylelint-config-standard 样式规范', ruleCount: '60+' },
  { name: 'dependency-cruiser', scope: '前端架构', duty: 'src/ 禁止 import server/，禁止循环依赖', ruleCount: '2' },
  { name: 'import-linter', scope: '后端 server/', duty: 'routes / models / nodes 分层契约', ruleCount: '3' },
  { name: 'ruff', scope: '后端 Python', duty: 'lint + format，T20 规则族禁裸 print', ruleCount: '100+' },
  { name: 'mypy', scope: '后端 Python', duty: '静态类型检查（strict 模式）', ruleCount: 'strict' },
]

export const VERIFY_GATES: GateEntry[] = [
  { id: 1, name: 'TypeScript Check', detail: '前端类型检查' },
  { id: 2, name: 'ESLint', detail: '前端静态分析' },
  { id: 3, name: 'Vitest', detail: '前端单元测试' },
  { id: 4, name: 'Stylelint', detail: 'CSS 规范' },
  { id: 5, name: 'dependency-cruiser', detail: '前端分层依赖' },
  { id: 6, name: 'Ruff Lint', detail: '后端 lint' },
  { id: 7, name: 'MyPy', detail: '后端类型检查' },
  { id: 8, name: 'import-linter', detail: '后端分层契约' },
  { id: 9, name: 'Tests + Coverage', detail: '后端测试 · 覆盖率 ≥80%' },
  { id: 10, name: 'Doc Freshness', detail: '文档新鲜度 ≤60 天' },
  { id: 11, name: 'File & Function Size', detail: '文件 ≤300 行 / 函数 ≤50 行' },
  { id: 12, name: 'Tech Stack Alignment', detail: '技术栈基线一致性' },
  { id: 13, name: 'Git Tracking', detail: '关键文件追踪' },
  { id: 14, name: 'Port Consistency', detail: '.preview 与 vite.config 端口一致' },
]
