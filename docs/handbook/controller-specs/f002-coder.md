[Controller Spec]
任务: 按已 Approved 的 F002 设计文档实现 LangGraph 编排引擎（Harness 8 阶段 StateGraph + 6 闸门 + 循环保护 + 4 个 API 端点）
角色: coder
前置条件:
  - F001 项目初始化与骨架搭建 = passing
  - F011 / F002 设计文档 = Approved，缺陷链闭合
  - 设计审批 HITL 闸门已通过（K总 2026-08-19 批准）
输入:
  - 功能 ID: F002
  - 参考文档（必须全部读取）:
    - docs/design/feature-f002-langgraph.md — 编码直接依据（Approved）
    - docs/design/feature-f011-agent-runtime.md — Node 委派桩规范 / 循环预算 / 6 闸门 actor 分配
    - docs/architecture/state-design.md — HarnessState 完整字段定义（已同步 TechStackSpec / max_iterations / token_usage_total / 多节点 interrupt_before）
    - docs/architecture/boundaries.md — 分层依赖边界（后端 routes → schemas → models → config；nodes → llm → schemas, config）
    - docs/architecture/harness-flow.md — 8 阶段流程与菱形门控
    - docs/reference/api-spec.md — 仅参考；API 以 F002 设计文档「API 变更」段为准（见约束 #14）
    - docs/conventions/coding.md — 编码规范与三大失败模式
    - docs/conventions/testing.md — 测试规范（覆盖率 ≥ 80%，Agent 自验证规则）
    - docs/conventions/pitfalls.md — 踩坑索引 P001-P008
  - 模板: docs/handbook/prompts/coder.md
  - 约束: AGENTS.md 硬性规则 13 条（重点 #2 禁裸 print / #4 Pydantic schema / #5 Node 委派桩 / #8 POST 请求体 BaseModel / #11 单文件 ≤300 行单函数 ≤50 行 / #12 技术栈基线一致 / #13 审计闭环）
输出:
  - server/graph/definition.py — StateGraph 构建 + compile(interrupt_before=...)
  - server/graph/edges.py — 路由函数：route_test_result / route_issue_resolved / route_review / route_loop_budget / 原型确认与设计审批回环路由
  - server/nodes/initializer.py / information_layer.py / feature_breakdown.py / coding_agent.py / validation.py / merge_deploy.py / observability.py / entropy.py — 8 个 Node 委派桩
  - server/schemas/harness_state.py — HarnessState TypedDict + TechStackSpec + TokenUsage
  - server/routes/harness.py — 4 个端点 + ResumeRequest BaseModel
  - server/nodes/runtime.py（或同等位置）— Agent Runtime stub（delegate 接口在、内部 stub 返回，F011 §9 runtime 层后续迭代）
  - server/main.py — 注册 harness 路由（保留现有 projects / agent-sessions 路由不动）
  - server/tests/ 对应测试文件（覆盖 ≥ 80%）
  - verify.sh 14 项全通过
验收标准（逐条可检查，全部满足才算完成）:
  1. StateGraph 可被构建并执行，initializer 到 END 完整路径可达
  2. 8 个 Node（initializer / information_layer / feature_breakdown / coding_agent / validation / merge_deploy / observability / entropy）全部注册且可被调用，内部返回 stub state
  3. 6 个闸门机制全部实现：3 个人类闸门（prototype_confirmation / design_approval / acceptance_check）用 interrupt_before + Command(resume)；2 个自动闸门（test_result / issue_resolved）用 conditional edge；1 个审查闸门默认 Agent、human_intervention=True 时升级逃生口
  4. 反馈循环路径（validation→coding_agent）和 DRR 长循环路径（observability→coding_agent）在图拓扑中可达
  5. 反馈循环和 DRR 长循环共用 route_loop_budget 预算检查，current_iteration > max_iterations 时先设 human_intervention=True 再路由 human_intervention（运算符必须为 >，与 F011 §6 规则 3 一致）
  6. TechStackSpec 为 Pydantic BaseModel 且覆盖前后端双包管理器（frontend_package_manager / backend_package_manager）；initializer Node 入口校验 tech_stack 与 AGENTS.md 技术栈基线一致
  7. POST /api/harness/start 请求体为 Pydantic BaseModel，返回 { session_id, status: "running" }
  8. GET /api/harness/{session_id}/state 返回完整 HarnessState 快照
  9. GET /api/harness/{session_id}/stream SSE 端点可连接并推送 stub 数据（F007 完整实现，本次仅建连 + stub）
  10. POST /api/harness/{session_id}/resume 请求体 ResumeRequest（gate + decision 两字段）
  11. 所有 Node 为委派桩/状态转换器，不含业务逻辑；mypy strict 通过
  12. HarnessState 含 state-design.md 全部字段 + TechStackSpec 类型 + max_iterations（默认 5）/ current_iteration（初始 0）+ token_usage_total
  13. 测试覆盖率 ≥ 80%；verify.sh 14 项全通过
禁止:
  - 不得实现 F003 范围（LLM Provider 层 / openai SDK 调用；Node 内 LLM 相关一律 stub）
  - 不得实现 F006 / F007 / F008 / F009 / F010 范围（前端 / SSE 完整推送 / 熵管理调度 / 数据库持久化 / 第二技术栈）
  - 不得使用 LangGraph 之外的编排库；不引入新依赖（langgraph 已在 pyproject.toml）
  - 不得修改已 Approved 设计文档（F011 / F002 / F003 / F006）
  - 不得修改 AGENTS.md 硬性规则与 sub_id
  - 不得修改 api-spec.md / state-design.md / boundaries.md / harness-flow.md 等跨文档（同步由 L1 统一处理）
  - 不得修改 verify.sh 闸门定义
  - 不得删除或破坏 server/routes/agent_sessions.py 与 projects.py 现有端点
  - 不得自行调用 skill 产出内容
  - 不得跳过 harness-journal 记录与 verify.sh
约束补充:
  - #14 API 路由以 F002 设计文档「API 变更」段为唯一依据（/api/harness/*）；api-spec.md 的 /api/agent-sessions 为 F001 骨架草案，与 F002 并存不冲突，本次不动它
  - Node 委派桩结构与 F011 §2 / F002「Node 委派桩规范」对齐：构造 Controller Spec → agent_runtime.delegate(...) stub → 更新 State 返回
  - entropy 是横切事件驱动任务（图内注册但非线性阶段），实现方式以 F002 设计文档为准
  - 后端依赖管理用 uv（langgraph>=0.2.50 已声明于 pyproject.toml；如 .venv 未同步先 uv sync）
  - journal 编号: 你自己写的编码 journal 使用 stage-04-coding/02-f002-coding.md（02 号已为你预留，勿用其他编号）
