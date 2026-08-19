export interface RuleEntry {
  id: number
  title: string
  detail: string
  enforced: boolean
  enforcer: string
}

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

export const HARNESS_RULES: RuleEntry[] = [
  { id: 1, title: 'API 相对路径', detail: '前端调用后端统一走 /api/...，禁止硬编码域名/IP/localhost', enforced: true, enforcer: 'ESLint no-restricted-syntax' },
  { id: 2, title: '禁裸 print()', detail: '后端 Python 统一用 logging', enforced: true, enforcer: 'ruff T20' },
  { id: 3, title: '禁 as any', detail: '前端禁止 as any 与隐式 any', enforced: true, enforcer: 'ESLint no-explicit-any' },
  { id: 4, title: 'API 类型定义', detail: '新增 API 必须有 Pydantic schema + TS 类型', enforced: false, enforcer: '人工审查' },
  { id: 5, title: 'Node 委派桩', detail: 'LangGraph Node 只做委派与状态转换，不含业务逻辑', enforced: false, enforcer: '人工审查' },
  { id: 6, title: '端口固定', detail: '前端 Vite 5000 / 后端 FastAPI 8000', enforced: true, enforcer: 'check_port_consistency' },
  { id: 7, title: 'sub_id 不可变', detail: '不修改 .coze 中的 sub_id', enforced: false, enforcer: 'git-level 约束' },
  { id: 8, title: 'Pydantic Body 模型', detail: 'POST/PUT 请求体必须用 BaseModel，禁止裸参数 [P003]', enforced: false, enforcer: '人工审查' },
  { id: 9, title: '关键文件 Git 追踪', detail: 'progress.txt / feature_list.json 不可被 .gitignore 排除 [P004]', enforced: true, enforcer: 'check_git_tracking' },
  { id: 10, title: '全闸门通过', detail: '所有代码变更必须通过 verify.sh 14 项闸门', enforced: true, enforcer: 'scripts/verify.sh' },
  { id: 11, title: '文件与函数行数', detail: '单文件 ≤300 行 / 单函数 ≤50 行', enforced: true, enforcer: 'ESLint max-lines' },
  { id: 12, title: '技术栈基线一致', detail: 'AGENTS.md 声明版本与实际安装版本一致 [P008]', enforced: true, enforcer: 'check_tech_stack_alignment' },
  { id: 13, title: '规则→执行闭合', detail: '每条规则在 convention-to-rule-mapping.md 有对应行', enforced: false, enforcer: '人工审查' },
]

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
