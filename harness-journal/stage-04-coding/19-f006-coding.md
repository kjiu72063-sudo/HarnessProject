# 19 · F006 前端 4 页面 UI 编码实现

- **步骤名称**: F006 — 需求输入/流程监控/约束配置/产物管理 4 页面 + 共享组件 + API 客户端
- **执行时间**: 2026-08-19 15:34（UTC）
- **执行角色**: L3 编码 Agent (coder)
- **前置条件**:
  - F002 = passing（/api/harness/* 4 端点已实现）、F003 = passing（token_usage_total 字段已存在）
  - F006 设计文档 = Approved（含 1 轮修订: DAGView=Type 1 只读 @xyflow/react、轮询 2s、StatusBadge 四色）；Controller Spec: docs/handbook/controller-specs/f006-coder.md
  - 启动提示词: docs/handbook/launch-prompts/f006-coding-launch.md

## 执行内容

按 Approved 的 F006 设计文档实现前端 4 页面；API 契约以 server/routes/harness.py + schemas/harness.py + harness_state.py 实际实现为唯一权威（api-spec.md「Agent 会话」段未同步，未按旧契约编码）。

1. **TS 类型**（`src/types/harness.ts`，127 行）：与后端逐字段对齐——`HarnessState`（含 TechStackSpec{frontend,backend,database,llm} kebab-case ID、max_iterations、current_iteration、token_usage_total: TokenUsage{input,total}、design_docs、iteration_records、stage_outputs）、`HarnessStateSnapshot`（state 可 null——无 checkpoint 时后端返回 null）、`StartSessionResponse{session_id,status}`、`ResumeRequest{gate,decision}`、`GateDecision` 字面量联合与后端 `RESUMABLE_GATES`（4 闸门）对齐。
2. **API 客户端**（`src/api/harness.ts`，48 行）：三函数 `startHarness` / `getSessionState` / `resumeSession`，全部相对路径 `/api/harness/...`，fetch 检查响应头 Content-Type 为 JSON 才解析（422/500 时后端可能返回 HTML/纯文本，避免 JSON parse 崩溃），非 2xx 抛含状态码的 Error。
3. **状态推导库**（`src/lib/stages.ts`，189 行）：8 阶段 + 6 决策点静态拓扑（节点/边/坐标）+ `deriveStageStatuses`。状态推导基于 LangGraph 语义：`current_stage` 之前的节点=completed、当前=pending（等待执行）、之后的=idle；`status==="awaiting_gate"` 时若 `next` 是闸门节点则该节点=waiting、当前阶段保持 completed；6 决策点在图直接顺序经过时显示 completed。后端 `next` 值域以 graph/definition.py 实测为准（阶段名/闸门名）。
4. **4 页面**：
   - RequirementPage（247 行）：需求描述 textarea + 项目名 + TechStackFields 四组单选（React/Python/数据库/LLM，值=后端 kebab-case ID）+ 启动校验（空需求禁用）→ `startHarness` 成功后写 recentSessions（localStorage）→ onNavigate 跳流程监控；右侧 RecentProjects 列表可恢复/删除历史会话。
   - PipelinePage（254 行）：2s 轮询 `getSessionState`（usePolling，卸载/停止时 clearInterval）+ DAGView + 会话信息卡（迭代 max/current、token 累计、状态）+ 闸门决策面板（status=awaiting_gate 且 next∈RESUMABLE_GATES 时渲染 通过/驳回 两按钮 → `resumeSession` 后立即刷新）+ LogPanel（stage_outputs 阶段产物时间线）。
   - ConstraintsPage（192 行）：三卡片——规则列表（AGENTS.md 13 条硬性规则的 ID 化展示）、Linter 列表（TypeScript Check/ESLint/Stylelint/ruff/import-linter/dependency-cruiser，含用途与机械状态，源自 convention-to-rule-mapping.md 真实清单）、闸门结果（14 项 verify 闸门网格，无会话时空态提示）。
   - ArtifactsPage（173 行）：统计卡片（会话状态/设计文档数/迭代数/token）+ fileTree（design_docs 路径→树形层级）+ 闸门详情（verify 14 项清单）。
5. **共享组件**：Sidebar（104 行，4 导航项 lucide 图标+当前页高亮）、Header（21 行，页标题+动作槽）、StatusBadge（26 行，四色 #F59E0B/#10B981/#EF4444/#4B5563，Lucide 图标双重编码）、LogPanel（54 行，时间线+空态）、DAGView（118 行，@xyflow/react 只读：panOnDrag 平移、禁缩放/拖拽/框选，回环边 dashed、跨行边 animated）、dag/StageNode（49 行矩形阶段节点）/ dag/DiamondNode（63 行菱形决策点）。
6. **hooks**：usePolling（56 行，2s 间隔+立即首拉+卸载清理+错误容忍）、useSessionState（39 行，从 URL hash ?session= 恢复 sessionId）。
7. **测试**（15 文件 83 用例）：api（fetch mock 3 函数×成功/失败/非 JSON）、stages 状态推导（顺序推进/awaiting_gate 停闸门/无 state null 边界）、recentSessions/fileTree 纯函数、usePolling/useSessionState hooks、StatusBadge/LogPanel/Sidebar/DAGView/4 页面/App 集成（React Testing Library + jsdom，factories.ts 提供后端契约对齐的测试数据工厂）。setup.ts（29 行）提供 jsdom + jest-dom matchers + ResizeObserver/DOMMatrixReadOnly 桩（@xyflow/react 依赖）。
8. **构建配置**：tailwind.config.js（DESIGN.md 深色主题令牌）、vitest.config.ts（jsdom + setup + coverage threshold lines 80 与 verify.sh 口径一致）、index.html（Inter+Noto Sans SC+JetBrains Mono 字体引入）、index.css（Tailwind 指令+@xyflow 基础样式引入）。

## 技术决策备注（待重审聚焦）

1. **DAGView 只读强化**：nodesDraggable=false、zoomOnScroll=false、panOnDrag=true——设计文档"Type 1 只读"未穷举交互开关，按"仅允许平移浏览、禁止缩放拖拽"理解；如审查认为应禁平移，改一行 props。
2. **决策点状态语义**：后端 `current_stage` 只描述阶段节点，不描述闸门；推导规则"awaiting_gate 时 next=闸门节点则该闸门 waiting，否则图直接顺序经过的闸门=completed"为最小合理实现（设计文档 §DAGView 未定义决策点状态机），已在 stages.ts 注释标注语义。
3. **resume 后刷新策略**：点击通过/驳回后先 `await resumeSession` 再立即手动 fetch 一次（不等下一轮轮询）——决策反馈即时性设计文档未覆盖，选保守同步等待。
4. **约束/产物页数据源**：规则/Linter/闸门清单前端静态常量（constraintsData.ts，内容源自 convention-to-rule-mapping.md + verify.sh 14 项真实清单），因后端无对应只读端点；闸门结果区无会话时显示"运行 verify.sh 后回填"空态——不伪造运行时数据。
5. **Coverage threshold 只设 lines 80**（与 verify.sh 口径一致），statements/branches 不设下限——避免超出闸门要求的自加约束。
6. **决策面板 gate 与后端校验对齐**：RESUMABLE_GATES 前端常量 = 后端 routes/harness.py RESUMABLE_GATES 同值同序，防止发送后端 400 的 gate 名。
7. **测试环境桩**：setup.ts 为 @xyflow/react 桩 ResizeObserver 与 DOMMatrixReadOnly（其 dmm 模块在 import 期解构），非项目逻辑，属测试环境适配。

## 产出物（行数为 wc -l 实测）

- src/pages/：RequirementPage(247)/PipelinePage(254)/ConstraintsPage(192)/ArtifactsPage(173)/TechStackFields(33)/RecentProjects(57)
- src/components/：Sidebar(104)/Header(21)/StatusBadge(26)/LogPanel(54)/DAGView(118)/dag/StageNode(49)/dag/DiamondNode(63)
- src/api/harness.ts(48)/src/types/harness.ts(127)
- src/lib/：stages(189)/constraintsData(62)/fileTree(54)/recentSessions(38)；src/hooks/：usePolling(56)/useSessionState(39)
- src/test/：setup.ts(29)/factories.ts(52)；15 个 .test.ts(x) 文件 83 用例（源码合计 3006 行，单文件最大 254 ≤ 300）
- 配置：tailwind.config.js/vitest.config.ts/index.html/index.css
- package.json（+2 运行依赖：@xyflow/react ^12.11.3、lucide-react ^1.33.0；+4 devDeps：jsdom ^30.0.1、@testing-library/react ^16.3.2、@testing-library/dom ^10.4.1、@testing-library/jest-dom ^7.0.1）+ pnpm-lock.yaml
- harness-journal/README.md 索引 19 号条目、progress.txt 末行

## 验证结果

- 验证环境（实测）：node v24.19.0 / pnpm 9.15.9 / Python 3.12.3 / uv 0.12.5；**后端环境重建**：本会话沙箱无 .venv 且 uv 不存在（P009 沙箱漂移），按 P009 替代法 pip3 阿里镜像装 uv → `uv venv` + `uv export --frozen --no-hashes` + `uv pip install -r`（全程 UV_DEFAULT_INDEX=aliyun 镜像、uv 命令前置 UV_FROZEN=1 防 P010；uv.lock 本体零改动，git diff 确认无变更）；前端依赖 pnpm add 正常直连
- P011 防护：提交前 `git diff --cached --stat` 逐文件核对，46 文件全部在 src/ + 配置 + package.json + pnpm-lock.yaml + journal/progress/README 范围内，无 .coverage/uv.lock/其他夹带
- `bash scripts/verify.sh`：**14 passed / 0 failed**（后端 82+1 skip 零回归）
- vitest：**83 passed / 0 failed**（前端新增 83 用例）
- 覆盖率（前端，threshold lines 80）：**lines 97.66% / statements 97.75% / branches 91.87% / functions 98.42%**
- tsc --noEmit 通过（无 as any/隐式 any，strict 模式）；ESLint 0 error（含 max-lines-per-function 50 强制，测试 describe 块拆分以合规）；Stylelint 0 error
- 单文件最大 254 行 ≤ 300；API 调用硬编码检查：grep src/ 域名/IP/localhost 仅命中 constraintsData.ts 规则描述文本（AGENTS.md 规则 #1 的文案本身），实际请求全部相对路径 /api
- 禁区核对：server/ 零改动、.coze/AGENTS.md/verify.sh/设计文档/跨文档/feature_list.json 零触碰、journal 20 未占用
