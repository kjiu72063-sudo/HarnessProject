# Controller Spec: F006 前端 UI 编码

任务: 按 Approved 的 F006 设计文档实现前端 4 页面 UI（需求输入/流程监控/约束配置/产物管理）
角色: coder
前置条件: F002 passing（/api/harness/* 4 端点已实现）+ F003 passing（token_usage_total 字段已存在）
委派记录: harness-journal/stage-04-coding/18-f003-passing-and-f006-delegation.md

## 输入

- 功能 ID: F006
- 设计文档: docs/design/feature-f006-frontend-ui.md（Approved，含 1 轮修订，DAGView=Type 1 只读 @xyflow/react，轮询 2s，StatusBadge 四色）
- 设计规范: DESIGN.md（项目根，配色/字体/动效/禁忌的唯一视觉权威）
- 原型参考: .cozeproj/prototype/web/（4 页面，视觉还原目标）
- API 契约源: **server/routes/harness.py + server/schemas/harness.py + server/schemas/harness_state.py（实际实现为唯一权威）**。注意 docs/reference/api-spec.md「Agent 会话」段尚未与 F002 同步（L1 已知待办），不要按该段旧契约编码
- 骨架现状（L1 已核实，免重复勘探）:
  - src/ 仅 App.tsx / index.css / index.tsx，pages/ components/ api/ types/ 目录均需新建
  - package.json 现无 @xyflow/react 与 lucide-react，需 pnpm add（pnpm-lock.yaml 同步更新）
  - 基线: React 19.2.8 / Vite 7.2.4 / TypeScript 5.6 / Tailwind CSS 3.4.17 / Vitest 4.1.10 —— 不升级不改栈
- 约束: AGENTS.md 硬性规则（#1 相对路径 /api、#3 禁 as any/隐式 any、#4 TS 类型定义、#11 单文件≤300行/单函数≤50行、#10 verify.sh 14 项全通过、#6 端口 5000）+ docs/conventions/coding.md + testing.md

## 输出

| 类型 | 路径 |
|---|---|
| 页面组件 | src/pages/{RequirementPage,PipelinePage,ConstraintsPage,ArtifactsPage}.tsx |
| 共享组件 | src/components/（DAGView.tsx @xyflow/react Type 1 只读 / StatusBadge 四色 / LogPanel 非实时 / Sidebar 侧边栏导航） |
| API 客户端 | src/api/harness.ts（startHarness / getHarnessState / resumeHarness，相对路径） |
| TS 类型 | src/types/harness.ts（与 F002/F003 修订后字段逐一对齐: TechStackSpec + max_iterations + current_iteration + token_usage_total + TokenUsage） |
| 测试 | src/**/*.test.tsx（覆盖率 ≥80%） |
| 依赖 | package.json + pnpm-lock.yaml（新增 @xyflow/react、lucide-react） |

## 验收标准（13 条，源自设计文档验收标准段）

1. 4 个页面按原型视觉还原（DESIGN.md 配色 #0F1115/#1A1D24/#3B82F6/#F59E0B/#10B981/#EF4444、Inter+Noto Sans SC+JetBrains Mono、动效 ease-out 150-200ms）
2. 侧边栏导航 4 页面跳转正常，当前页高亮
3. 需求输入页: 表单可填写 + 技术栈可选中 + 启动按钮跳转流程监控页
4. 流程监控页: DAG 视图 8 阶段 + 回环边 + 闸门决策点 + 日志面板 + 状态灯四色（pending #4B5563 / running #F59E0B / passed #10B981 / failed #EF4444，Lucide 图标双重编码）
5. 约束配置页: 规则列表 + Linter 列表 + 闸门结果展示
6. 产物管理页: 统计卡片 + 文件树 + 闸门详情
7. API 调用走相对路径 /api/...，无硬编码域名/IP/localhost
8. TS HarnessState 与 F002/F003 修订后字段对齐（TechStackSpec + max_iterations + current_iteration + token_usage_total + TokenUsage 接口）
9. 禁止 as any 和隐式 any（ESLint 强制）
10. 单文件 ≤300 行 / 单函数 ≤50 行
11. 测试覆盖率 ≥80%（前端部分）
12. verify.sh 14 项全通过（含后端 82+1 存量回归零破坏）
13. 状态轮询 2s（F007 SSE 替换的过渡方案），组件卸载时清理定时器

## 禁止

- 不得修改 server/ 任何文件（后端已 passing，本任务纯前端）
- 不得修改 .coze（含 sub_id）/ AGENTS.md / scripts/verify.sh / 设计文档 / 跨文档
- 不得修改 feature_list.json（状态推进属 L1 职责）
- 不得升级技术栈基线（React/Vite/TS/Tailwind 大版本）
- 不得为求覆盖率降低测试质量（mock 边界清晰: API 层 mock fetch/axios，组件行为真实断言）
- 不得跳过 harness-journal 记录（journal 19）
- 不得占用 journal 20（预留 test-reviewer）

## journal 编号

- 19（coder 自写编码记录）
