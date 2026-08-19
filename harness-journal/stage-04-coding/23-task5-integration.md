# 23 · Task 5 前后端集成验证（L3 coder 执行记录）

- **步骤名称**: Sprint 1 Task 5 — 前后端集成验证（双栈启动 + 端到端主路径 + API 契约运行时一致性）
- **执行时间**: 2026-08-19T16:35Z（UTC）
- **执行角色**: L3 编码 Agent (coder)
- **前置条件**: Controller Spec `docs/handbook/controller-specs/task5-integration-coder.md`（8 验收标准 + 8 禁止）；F002/F003/F006 全部 passing；代码基线 = HEAD c6b6a56（被验证代码 = commit 00eed47，其后仅 L1 委派产物，src/ 与 server/ 零变动）
- **验证对象**: F002 LangGraph 编排引擎 + F003 LLM 提供商层 + F006 前端 UI 的**跨栈集成**（单栈质量已由审查链 05→08→12 / 16 / 20 覆盖，不重复深挖）

## 一、验证环境表

| 项 | 值（实测） |
|---|---|
| Python | 3.12.3（.venv 与系统一致） |
| uv | 0.12.5（本次后端启动未用 uv 命令，直接 .venv/bin/python 调 uvicorn） |
| fastapi | 0.141.1 |
| langgraph | 1.2.11 |
| langgraph-checkpoint | 4.2.0 |
| openai | 3.2.0 |
| uvicorn | 0.52.3 |
| pydantic | 2.13.4 |
| node | v24.19.0 |
| pnpm | 9.15.9 |
| 前端 | Vite dev server（平台预览进程，`pnpm exec vite --host 0.0.0.0 --port 5000`，与 scripts/dev.sh 前端启动方式一致） |
| 端口 | 前端 5000（读自 .preview: expose_port=5000）；后端 8000（AGENTS.md 规则 #6） |
| git | HEAD c6b6a56，工作区 clean |
| 环境防护 | UV_DEFAULT_INDEX/UV_INDEX_URL 均为空（无 P010 残留）；verify.sh 复跑前置 UV_FROZEN=1 |

环境说明：.venv 已存在且为 lock 等价环境（版本与 journal 19/21 记录一致），server.main:app 导入成功（8 routes）——本次**未执行 uv sync**（P009 风险路径未触发），后端以 `.venv/bin/python -m uvicorn server.main:app --host 0.0.0.0 --port 8000` 启动，与 dev.sh 的 `uv run uvicorn` 调用等效且完全绕开 uv 命令（零 lock 重写风险）。

## 二、验收标准逐条核对

### 标准 1: 双栈启动成功 — 通过

| 步骤 | 实测命令 | 输出摘要 |
|---|---|---|
| 后端启动 | `nohup .venv/bin/python -m uvicorn server.main:app --host 0.0.0.0 --port 8000` | `Uvicorn running on http://0.0.0.0:8000`，`Application startup complete` |
| 后端健康 | `curl http://localhost:8000/api/health` | `{"status":"ok","service":"harness-platform"}` |
| 前端存活 | `curl -o /dev/null -w "%{http_code}" http://localhost:5000/` | HTTP 200，index.html（title: MetaForge · 一键开发元应用平台） |
| 代理链路 | `curl http://localhost:5000/api/health` | `{"status":"ok","service":"harness-platform"}`（vite.config.ts `/api` → `http://127.0.0.1:8000` 生效） |

端口均按 .preview（5000）与 AGENTS.md 规则 #6（8000）核对，curl 目标无 hardcode 代码新增（本次零代码变更）。前端 dev server 为平台预览进程（pid 315，与本会话工作区同一目录、watch 轮询生效，serve 当前基线源码——经模块转换内容核实）。

### 标准 2: 端到端主路径走通（后端 API 层实调，全程经 5000 代理链路）— 通过

| 步骤 | 实测命令与输出 |
|---|---|
| a. start | `POST /api/harness/start`（project_id=task5-e2e，合法 TechStackSpec: react-19/python-3.12/postgresql/openai/pnpm/uv）→ `{"session_id":"05265b654979","status":"running"}` |
| b. state | `GET /api/harness/05265b654979/state` → `status:"interrupted"`, `next:["prototype_confirmation"]`, state 非 null（24 字段完整）, `current_stage:"feature_breakdown"`（已推进过 initializer/information_layer）, `token_usage_total:{prompt_tokens:0,completion_tokens:0,total_tokens:0}` |
| c. resume ×3 | `POST .../resume {"gate":"prototype_confirmation","decision":true}` → next=[design_approval], stage=coding_agent, code_artifacts 1 条；`{"gate":"design_approval","decision":true}` → next=[acceptance_check]；`{"gate":"acceptance_check","decision":true}` → **status=completed, next=[], current_stage=completed** |
| d. 完整一轮 | 三闸门全过后流程抵达 END：`verify_result:{pass:true,...}`、`test_result:{pass:true,...}`（test_result/review 自动闸门在流程内部通过，stub 语义） |

补充错误路径抽查（均经代理）：未知会话 `GET /api/harness/nonexistent-session/state` → 404 `{"detail":"session nonexistent-session not found"}`；错误闸门 resume → 409 `session not paused at gate 'design_approval' (next=['prototype_confirmation'])`（detail 字段可被前端 extractErrorMessage 消费）。SSE 端点冒烟（Spec 标注可不测，本次顺手覆盖）：`GET .../stream` → `event: snapshot` / `event: status` / `event: done` 三事件正常推送。

### 标准 3: 前端 4 页面路由可达（HTTP 层）— 通过（含验证边界声明）

- 前端为 SPA 条件渲染（App.tsx handleNavigate → setPage，无 URL 路由器），HTTP 层验证口径 = 入口 + 模块图可达：
  - `GET /src/index.tsx` → 200；`GET /src/App.tsx` → 200（JSX 已转换，含 HMR/react-refresh 注入）
  - `GET /src/pages/RequirementPage.tsx` / `PipelinePage.tsx` / `ConstraintsPage.tsx` / `ArtifactsPage.tsx` → 全部 200（Vite 模块转换成功 = 4 页面组件可加载渲染）
- **验证边界（如实记录）**: 本会话无浏览器/交互能力，未执行真实点击、表单提交、DAG 渲染等交互级验证；组件级行为由既有 83 个 vitest 用例覆盖（mock fetch）。"4 页面路由可达"结论止于 HTTP 层 + 模块服务层，不虚构交互验证结论。

### 标准 4: API 契约运行时一致性抽查 — 通过

方法：写一次性比对脚本（/tmp/t5-contract-check.py，不入仓库）——解析 `src/types/harness.ts` 全部接口定义（含嵌套接口递归展开），与经 5000 代理实测的 start/state/resume×3 响应**逐字段**比对类型。

- 实测结果：**294 个字段级类型断言全部一致，零偏差**
- 覆盖契约：HarnessStartResponse{session_id,status} / HarnessStateSnapshot{session_id,status,next,state}（status 实测值 running/interrupted/completed 均在 HarnessSessionStatus 联合内）/ HarnessState 24 字段（含 tech_stack 6 字段、token_usage_total 3 字段、issue_type:null、next_feature:null、max_iterations:int、gate_decision:bool 等）/ HarnessResumeResponse{status,next,state} / ResumeRequest{gate,decision} 请求体被正确接收
- 关键集成点人工复核：前端 RequirementPage 默认 TechStackSpec（react-19/python-3.12/postgresql/openai/pnpm/uv）与后端 BASELINE_TECH_STACK **逐值一致**（不一致会 422 拒绝启动，实测通过即证明一致）；前端请求体三字段 {project_id, requirement, tech_stack} 与 HarnessStartRequest 对齐

### 标准 5: 集成缺陷 — 未发现缺陷，零代码变更

全量验证（双栈 + 主路径 + 错误路径 + SSE + 契约 294 断言 + 页面模块图）未发现任何集成缺陷，无需动用最小集成修复权。不存在静默绕过：所有验证为真实调用，无 mock 顶替（比对脚本仅做响应断言，不伪造调用）。

### 标准 6: verify.sh 复跑 — 14/14 通过

- 命令：`UV_FROZEN=1 bash scripts/verify.sh`（P010 防护；运行前确认 UV_DEFAULT_INDEX/UV_INDEX_URL 为空）
- 结果：**14 passed, 0 failed, EXIT=0**
- 后端 82 passed + 1 skipped，覆盖率 99.55%（≥80% 闸门过）；前端 83 passed（15 文件）；uv.lock `git diff` = 零漂移（UV_FROZEN=1 有效，lock 干净）

### 标准 7: journal 完整性 — 本文件

验证环境表（第一节）+ 每条验收标准实测命令与输出摘要（第二节）+ 问题清单（第三节）齐备。

### 标准 8: 改动范围合规 — 通过

- 代码变更：**零**（src/ server/ package.json pnpm-lock.yaml uv.lock pyproject.toml 全部无 diff）
- 本次产物仅 3 文件：journal 23（本文件）+ harness-journal/README.md 索引行 + progress.txt 追加一行
- verify.sh / AGENTS.md / .coze / 设计文档 / feature_list.json / docs/ 全部未触碰；journal 24 未占用；未引入 e2e 框架或任何新依赖

## 三、问题清单（定级）

| # | 级别 | 问题 | 处理 |
|---|---|---|---|
| — | — | 无必须修复项 | — |
| O1 | 观察 | 会话环境无浏览器，交互级前端验证不可执行 | 如实记录验证边界（标准 3），以 HTTP 层 + 83 个既有 vitest 用例为佐证，未虚构交互结论 |
| O2 | 观察 | 未产出集成测试代码（Spec 标注可选） | 裁定不产出：verify.sh 禁改，新测试无法纳入闸门体系；且 start/state/resume 主路径已有后端 14 个 API 用例覆盖，契约一致性已由本次 294 断言机械验证。脚本留 /tmp 不入仓库 |

## 四、结论四要素

| 要素 | 值 |
|---|---|
| 通过 / 需改进 | **通过**：8 条验收标准全过（标准 3 含验证边界声明），零集成缺陷，零代码变更 |
| 测试数 | 后端 82 passed + 1 skipped；前端 83 passed；集成实调 = start×4 会话 + state + resume×6 + 错误路径×2 + SSE×1 + 契约断言 294 |
| 覆盖率 | 后端 99.55%（verify.sh 闸门口径）；前端 lines 97.66%（journal 20 口径，本次复跑 vitest 83 全绿） |
| verify.sh | 14/14 PASS（UV_FROZEN=1，uv.lock 零漂移） |

**集成验证结论: 通过**。F002 编排引擎 + F003 LLM 层 + F006 前端 UI 在双栈真实运行环境下集成跑通：Vite 代理链路（5000→8000）连通、Harness 主路径 start→state→resume×3→completed 完整走通、闸门暂停/错误路径语义正确、前后端契约逐字段一致。报告交 K总 转交 L1 流程验收 → test-reviewer 审查（journal 24 预留）。

## 备注

- 前端 dev server 复用平台预览进程而非重启：与 dev.sh 启动方式一致（同命令、同端口、同 host），重启属破坏性操作（kill 平台进程）且无验证增益；已核实其 watch 轮询生效、serve 当前基线源码（App.tsx 转换内容含当前代码）。
- 后端进程保留运行（8000），与前端 5000 构成完整双栈预览终态。
- 复现命令：`curl -X POST http://localhost:5000/api/harness/start -H 'Content-Type: application/json' -d '{"project_id":"x","requirement":"y","tech_stack":{"frontend":"react-19","backend":"python-3.12","database":"postgresql","llm":"openai","frontend_package_manager":"pnpm","backend_package_manager":"uv"}}'` → 携 session_id 调 state/resume。
