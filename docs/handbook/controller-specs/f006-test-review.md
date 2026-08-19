# [Controller Spec] F006 前端 UI 编码产出 — test-reviewer 审查

## 任务
对 F006 前端 UI 编码产出（commit 00eed47）做独立测试审查：13 条验收标准逐项验证 + 7 项技术决策独立裁定 + 存量回归 + 合规复核。

## 角色
test-reviewer（docs/handbook/prompts/test-reviewer.md）

## 前置条件
- F002 passing（commit 1d54504）、F003 passing（commit a775554）
- F006 编码完成，L1 流程验收通过（journal 21）

## 输入
- 被审提交: 00eed47（49 文件：src/ 43 + index.html + tailwind.config.js + vitest.config.ts + package.json + pnpm-lock.yaml + journal 19 + progress.txt + README 索引）
- diff 基线: e1423b6（F003 审查提交。注意：基线到被审提交间含 L1 自己的 3 处产物——AGENTS.md 状态段 / feature_list.json F003 状态 / docs/handbook/ f006 ControllerSpec 与启动提示词，非 coder 改动，评估范围时排除）
- 设计文档: docs/design/feature-f006-frontend-ui.md（Approved，含验收标准段与 Controller Spec 明示的 3 项范围调整）
- Controller Spec（编码）: docs/handbook/controller-specs/f006-coder.md（13 条验收标准 + 13 条禁止）
- coder journal: harness-journal/stage-04-coding/19-f006-coding.md（含 7 项技术决策备注）
- coder 报告的验证环境: Node v24.19.0 / pnpm 9.15.9 / React 19.2.8 / Vite 7.2.4 / Tailwind 3.4.17 / Vitest 4.1.10 / 新增 @xyflow/react 12.11.3 + lucide-react 1.33.0（运行）+ jsdom + @testing-library/*（dev）

## 验收标准（审查通过条件）

### A. 13 条编码验收标准逐项独立验证（不引用 coder/L1 自报）
1. **视觉还原**: 4 页面按原型与 DESIGN.md 令牌（深色 #0F1115/#1A1D24、主色 #3B82F6、四状态色、JetBrains Mono 日志区、Inter+Noto Sans SC、ease-out 150-200ms）——验证代码中令牌实际使用而非仅存在
2. **导航与高亮**: 侧边栏跳转 + 当前页高亮（测试断言存在且真实）
3. **需求输入页**: 表单 + 4 技术栈选择器（kebab-case ID 对齐后端 TechStackSpec）+ POST /api/harness/start 成功跳转携带 session_id
4. **流程监控页**: 8 矩形阶段节点 + 6 菱形决策点 + 4 条 dashed 回环边 + StatusBadge 四色 + Lucide 图标双重编码
5. **约束配置页**: 规则列表 + Linter 状态 + verify.sh 14 闸门网格
6. **产物管理页**: 4 统计卡 + design_docs 推导文件树 + 闸门详情
7. **API 相对路径**: 全部 '/api/...'，无 localhost/域名/IP 硬编码（grep 复核）
8. **TS 类型对齐**: TechStackSpec/TokenUsage/HarnessState 快照类型与 server/schemas/ 实际定义对照（非仅自报一致）
9. **禁 as any/隐式 any**: tsc strict + ESLint 独立复跑
10. **行数**: 单文件 ≤ 300 / 单函数 ≤ 50（机械复核）
11. **前端覆盖率 ≥ 80%**: 独立复跑（vitest coverage），83 测试计数核对
12. **verify.sh 14 项**: 独立复跑（注意环境：无 uv 时按 pitfalls P009 替代法构建 lock 等价后端环境，uv 命令前置 UV_FROZEN=1 防 P010 lock 重写；提交后 git diff 复核 lock 零改动）
13. **轮询与清理**: usePolling 2000ms + useEffect cleanup（测试断言）

### B. 7 项技术决策独立裁定（coder journal 19 备注，逐项给结论）
1. DAGView 只读最小实现（nodesDraggable/nodesConnectable/elementsSelectable 全关）
2. 决策点状态机由 current_stage 前端推导（后端无 gate 级字段）；回环检测依赖 design_docs 长度增长的启发式
3. resume 决策后立即单次 fetch 刷新（不等轮询）
4. 约束配置页静态镜像 constraintsData.ts（后端无该 API，设计文档未定义端点）
5. deriveStageStatuses 对 state:null 安全返回全 pending
6. 最近会话存 localStorage（无服务端会话列表 API）
7. SSE stream 端点未消费（Controller Spec 明示轮询为唯一状态源）

裁定基准：设计文档语义 + Controller Spec 范围 + 不引入功能缺陷。若某决策属"设计文档未覆盖的实现自由度"且无缺陷，结论应为"合理/可接受"而非缺陷；若与设计文档明确语义冲突或埋下缺陷，列为问题并定级。

### C. 回归检查
- F002/F003 后端 82+1skip 零回归（独立复跑 pytest）
- 技术栈基线未升级（React 19.2.8/Vite 7.2.4/Tailwind 3.4.17 等对照 AGENTS.md 基线与 package.json）
- server/ 目录零改动（diff e1423b6..00eed47 -- server/ 排除 L1 产物后为空）

### D. 范围合规复核
- 49 文件逐文件核对在 Spec 输出范围（src/ + 4 配置 + package.json + pnpm-lock + journal + progress + README）
- 禁区零触碰（.coze/AGENTS.md 硬规则/verify.sh/设计文档/跨文档/feature_list.json）
- journal 20 编号未占用

## 输出
- harness-journal/stage-04-coding/20-f006-test-review.md（验证环境表 + 13 标准逐项证据 + 7 决策裁定表 + 问题清单定级 + 结论四要素：环境/通过失败/覆盖率/验证手段）
- progress.txt 追加一行
- README 索引 20 号从预留转实际
- 不修改任何被审代码

## 禁止
- 修改被审代码 / uv.lock / package.json（发现问题只记录，修复属 coder 修订轮）
- 修改 .coze / AGENTS.md / verify.sh / 设计文档 / 跨文档 / feature_list.json
- 调用 skill 产出内容
- 跳过环境验证只做静态阅读（测试与覆盖率必须独立复跑）
- 引用 coder/L1 自报结论代替独立验证（L1 复跑的 14/14 仅作对照参考）
