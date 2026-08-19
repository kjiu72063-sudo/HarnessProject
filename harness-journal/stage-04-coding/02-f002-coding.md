# 02 · F002 LangGraph 编排引擎编码实现

- **步骤名称**: F002 — Harness 8 阶段 StateGraph + 6 闸门 + 循环保护 + 4 API 端点
- **执行时间**: 2026-08-19 12:54
- **执行角色**: L3 编码 Agent (coder)
- **前置条件**:
  - F001 项目初始化 = passing
  - F011 / F002 设计文档 = Approved；设计审批 HITL 闸门已通过（K总 2026-08-19 批准）
  - 启动提示词: docs/handbook/launch-prompts/f002-coding-launch.md

## 执行内容

按 Approved 的 F002 设计文档实现 LangGraph 编排引擎，严格不越界（LLM 调用/F003、前端/F006、持久化/F009、熵调度/F008、Docker/F005 全部 stub 或不做）。

1. **HarnessState**（`server/schemas/harness_state.py`）：TypedDict 覆盖 state-design.md 全部字段，含 `tech_stack: TechStackSpec`、`max_iterations=5` / `current_iteration=0`、`token_usage_total`、`human_intervention`、`feedback_log` 等；`TechStackSpec` 为 Pydantic BaseModel（前后端双包管理器）；`TokenUsage`（prompt/completion/total）；`build_initial_state` 工厂。
2. **Agent Runtime stub**（`server/nodes/runtime.py`）：`delegate(controller_spec, state) -> dict`，per-node Controller Spec 构造 + stub 返回（真实 Agent Runtime 属 F011 runtime 层后续迭代）；`deep_copy_state` 防共享引用。
3. **8 个 Node 委派桩**：initializer（含 AGENTS.md 技术栈基线校验 `BASELINE_TECH_STACK`）、information_layer、feature_breakdown、coding_agent、validation、merge_deploy、observability、entropy。全部为「构造 Controller Spec → runtime.delegate stub → 更新 State 返回」，不含业务逻辑。
4. **3 个人类闸门节点**（`server/nodes/gates.py`）：prototype_confirmation / design_approval / acceptance_check，节点内 `interrupt()` + `Command(resume={"gate_decision": ...})`。
5. **路由函数**（`server/graph/edges.py`）：`route_test_result`（自动门：pass→merge_deploy，fail→问题分类，budget 超限→逃生口）、`route_issue_resolved`（resolved→merge_deploy / 否→coding_agent 反馈循环）、`route_review`（审查门：默认 Agent→observability，human_intervention=True→逃生口）、`route_loop_budget`（运算符 `>` 判断 `current_iteration > max_iterations`）、`route_acceptance`、`route_abort`。
6. **StateGraph 构建**（`server/graph/definition.py`）：`build_harness_graph()` 拓扑 = initializer → information_layer → [原型确认] → feature_breakdown → [设计审批] → coding_agent → validation → [测试结果] → merge_deploy → [审查通过] → observability → [验收通过] → END；两条回环（原型/设计驳回→information_layer；验收 No→coding_agent DRR 长循环）；`compile(interrupt_before=[三个闸门], checkpointer=MemorySaver)`；`_make_checkpointer` 注入 msgpack serde 白名单（`server.nodes`/`server.schemas`）。
7. **4 个 API 端点**（`server/routes/harness.py`，注册进 main.py，保留 projects/agent_sessions 不动）：`POST /api/harness/start`（HarnessStartRequest → {session_id, status:"running"}）、`GET /api/harness/{sid}/state`（完整快照 values+next+status）、`GET /api/harness/{sid}/stream`（SSE stub 事件流）、`POST /api/harness/{sid}/resume`（ResumeRequest: gate+decision）。基线不匹配返回 500（与 api-spec 统一错误格式一致）。

## 产出物

- server/schemas/harness_state.py、server/schemas/harness.py
- server/nodes/：runtime.py、initializer.py、information_layer.py、feature_breakdown.py、coding_agent.py、validation.py、merge_deploy.py、observability.py、entropy.py、gates.py、__init__.py
- server/graph/：definition.py、edges.py、__init__.py
- server/routes/harness.py；server/main.py（新增 include_router）
- server/tests/：test_harness_state.py、test_initializer.py、test_edges.py、test_graph_definition.py、test_harness_api.py（共 60 个新测试）

## 验证结果

- `bash scripts/verify.sh`：**14 passed / 0 failed**（mypy strict、ruff、import-linter 分层、覆盖率、文件行数、文档新鲜度等全过）
- pytest：60 passed；`--cov=server` 总覆盖率 **99.18%**（≥80% 要求满足）
- 单文件最大 254 行 ≤ 300；单函数 ≤ 50 行
- 冒烟：happy path 四段 resume 走到 END；原型驳回回 information_layer；验收驳回回 coding_agent（iteration +1）；超限（6>5）先进逃生口（human_intervention=True）再 resume 放弃 → END；逃生口继续则 iteration 重置 0（F011 §6 规则 4）

## 备注（踩坑与技术决策）

1. **langgraph 1.2.11 机制验证**：实测 `compile(interrupt_before=...)` 单独使用时 `Command(resume)` payload 无法送达被暂停的节点（gate 节点拿不到 gate_decision，无法路由 Yes/No）。采用 **interrupt_before 声明 + 节点内 `interrupt()` 组合**：interrupt_before 触发暂停，resume payload 被 interrupt() 消费且不产生二次暂停——同时满足 F002「interrupt_before + Command(resume)」的设计表述与功能路由需求。已用最小原型在编码前验证。
2. **langgraph 1.2 msgpack serde 警告**：自定义类（TechStackSpec）进入 checkpoint 触发未来版本硬阻断警告；无公开注册 API，通过 `JsonPlusSerializer(allowed_msgpack_modules=[...])` + MemorySaver(serde=...) 白名单解决。
3. **发现并修复一个状态残留 bug**：problem_classification 节点超限时已置 `human_intervention=True`，若人工选择"继续"后该标志残留，会导致 merge_deploy 审查门被错误升级到逃生口。修复：逃生口"继续"决策时重置 `human_intervention=False` + `current_iteration=0`（对齐 F011 §6 规则 4/5）。
4. **Node async 化**：Node 全部为 async 函数（runtime.delegate 预留 async），路由层与测试统一用 `ainvoke`。
5. API 以 F002「API 变更」段为唯一依据（/api/harness/*）；api-spec.md 的 /api/agent-sessions 为 F001 骨架草案，未触碰。
6. 后端环境用 uv 同步（langgraph 1.2.11、langgraph-checkpoint 2.1.2 实际落地；pyproject 已声明 `langgraph>=0.2.50`，1.x 满足约束，未新增依赖）。
