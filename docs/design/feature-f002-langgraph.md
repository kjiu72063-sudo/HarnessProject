last_updated: 2026-08-18
status: Approved
owner: @K总

# Feature: LangGraph 编排引擎 (F002)

## Status: Draft

## 目标
实现 Harness 8 阶段（阶段 0-7）的 LangGraph StateGraph 拓扑，含所有 Node、闸门机制和 Cycle，使 Agent 能按 Harness Engineering 流程从需求输入到可部署产物的完整路径执行。

## 非目标
- 不实现各 Node 内部的 LLM 调用逻辑（属于 F003）
- 不实现前端展示（属于 F006）
- 不实现持久化记忆系统（F009，本次用 in-memory Checkpointer）
- 不实现熵管理（F008）
- 不实现 Docker 沙箱执行（F005，本次 verify.sh 本地执行）

## 技术方案

### 涉及的模块
- `server/graph/definition.py` — StateGraph 构建：添加 Node + Edge + Conditional Edge + interrupt_before
- `server/graph/edges.py` — 自动闸门 Conditional Edge 路由函数（测试结果/解决成功）+ 循环预算路由
- `server/nodes/initializer.py` — 阶段0: 初始化 Agent
- `server/nodes/information_layer.py` — 阶段1: 需求与架构规划
- `server/nodes/feature_breakdown.py` — 阶段2: 功能拆分与设计
- `server/nodes/coding_agent.py` — 阶段3+4: 编码 Agent 启动 + 编码实现
- `server/nodes/validation.py` — 阶段5: 自校验与反馈循环
- `server/nodes/merge_deploy.py` — 阶段6: 合并与部署
- `server/nodes/observability.py` — 阶段7: 可观测性验证
- `server/nodes/entropy.py` — 横切: 熵管理（事件驱动，非线性阶段）
- `server/schemas/harness_state.py` — HarnessState TypedDict 定义 + TechStackSpec
- `server/routes/harness.py` — API 路由：启动流程 / 查询状态 / SSE 流 / 闸门恢复

> entropy 不是线性阶段节点，而是横切关注点——在 verify 通过/文档反馈/功能完成后触发的事件驱动任务。不计入阶段编号。

### 数据模型变更
无需数据库变更（F009 持久化时再加）。本次使用 LangGraph 的 in-memory MemorySaver 作为 Checkpointer。

HarnessState 新增字段和类型变更（与 F011 §6 和 state-design.md 对齐）：

```python
class TechStackSpec(BaseModel):
    frontend: str                    # 如 "react-19"
    backend: str                     # 如 "python-3.12"
    database: str                    # 如 "postgresql"
    llm: str                         # 如 "openai"
    frontend_package_manager: str    # 如 "pnpm"
    backend_package_manager: str     # 如 "uv"

class HarnessState(TypedDict):
    # ... 现有字段保持不变 ...
    tech_stack: TechStackSpec   # [CHANGE] 从 dict 改为 TechStackSpec

    # [NEW] 循环预算 — F011 §6 定义
    max_iterations: int         # 默认 5
    current_iteration: int      # 初始 0
```

### Graph 拓扑

```
initializer → information_layer → [原型确认]
  → Yes → feature_breakdown → [设计审批]
    → Yes → coding_agent → validation → [测试结果]
      → Pass → merge_deploy → [审查通过]
        → Yes → observability → [验收通过]
          → Yes → END
          → No → (DRR长循环) → coding_agent
        → No → coding_agent
      → Fail → [问题分类] → [解决成功]
        → Yes → validation
        → No → coding_agent
    → No → information_layer
  → No → information_layer

entropy: 横切关注点——verify通过/doc反馈/功能完成后触发（事件驱动，非线性阶段）
```

### API 变更

```
POST /api/harness/start
Request: { "project_id": str, "requirement": str, "tech_stack": TechStackSpec }
Response: { "session_id": str, "status": "running" }

GET /api/harness/{session_id}/state
Response: HarnessState (完整状态快照)

GET /api/harness/{session_id}/stream
Response: SSE — 每个 Node 执行完成推送 { "node": str, "state": HarnessState, "timestamp": str }

POST /api/harness/{session_id}/resume
Request: ResumeRequest
Response: { "status": "resumed" }
```

ResumeRequest 定义（符合 AGENTS.md 规则 #8）：

```python
class ResumeRequest(BaseModel):
    gate: str       # 恢复哪个闸门: "prototype_confirmation" | "design_approval" | "acceptance_check"
    decision: bool  # True=通过, False=驳回
```

### Node 委派桩规范
每个 Node 是委派桩/状态转换器，不含业务逻辑：

1. 接收 State
2. 构造 Controller Spec（或调用 F011 Agent Runtime）
3. 委派对应角色的 L3 Agent 执行
4. 等待 L3 Agent 产出
5. 将产出写入 State 并返回更新后的 State

```python
async def node_name(state: HarnessState) -> dict:
    # 委派桩：构造请求 → Agent Runtime 执行 → 返回状态更新
    result = await agent_runtime.delegate(
        role="coder",
        controller_spec=build_spec(state),
    )
    return {**state, "current_stage": "next_stage", "code_artifacts": result.artifacts}
```

initializer Node 入口校验 tech_stack 一致性（与 AGENTS.md 技术栈基线比对）：

```python
async def initializer(state: HarnessState) -> dict:
    validate_tech_stack(state["tech_stack"])  # 校验与基线一致
    return {**state, "current_stage": "information_layer"}
```

### HITL 闸门机制

与 F011 §5 闸门 actor 分配表对齐，采用多节点 interrupt_before 拓扑。

**人类闸门**（原型确认/设计审批/验收通过）用 `interrupt_before` + `Command(resume=...)`：

```python
graph = StateGraph(HarnessState)
graph.add_node("prototype_confirmation", prototype_confirmation_node)
graph.compile(
    interrupt_before=["prototype_confirmation", "design_approval", "acceptance_check"],
    checkpointer=checkpointer,
)

def resume_gate(request: ResumeRequest) -> Command:
    # gate 标识恢复哪个闸门（多节点 interrupt_before 场景），decision 为人类决策
    return Command(resume={"gate_decision": request.decision})
```

**自动闸门**（测试结果/解决成功）用 conditional edge 路由函数：

```python
def route_test_result(state: HarnessState) -> str:
    return "merge_deploy" if state["test_result"]["pass"] else "problem_classification"

def route_issue_resolved(state: HarnessState) -> str:
    return "validation" if state["issue_resolved"] else "coding_agent"
```

**审查通过闸门**：默认 Agent 审查，可疑时设置 `human_intervention = True` 转逃生口（与 F011 §5 对齐）：

```python
def route_review(state: HarnessState) -> str:
    if state["human_intervention"]:
        return "human_intervention"
    return "observability"
```

### 循环预算

反馈循环和 DRR 长循环共用循环预算（F011 §6 定义），超限转 human_intervention：

```python
def route_loop_budget(state: HarnessState) -> str:
    """反馈循环和 DRR 长循环共用的预算检查路由函数。

    两种循环共用同一 current_iteration 计数器（详见 F011 §6 共享预算设计决策）。
    超限时先设置 human_intervention 标志位再路由到逃生口。
    """
    if state["current_iteration"] > state["max_iterations"]:
        state["human_intervention"] = True
        return "human_intervention"
    return "next_stage"
```

循环预算运行规则详见 F011 §6，包括成功重置（per-loop 不跨循环累积）。

## 验收标准
- StateGraph 可被构建并执行，从 initializer 到 END 完整路径可达
- 8 个 Node 全部注册且可被调用（内部可返回 stub state）
- 6 个闸门机制全部实现：3 个人类闸门用 interrupt_before + Command(resume)，2 个自动闸门用 conditional edge，1 个审查闸门默认 Agent 可疑升级
- 反馈循环路径（validation→coding_agent）和 DRR 长循环路径（observability→coding_agent）可达
- 反馈循环和 DRR 长循环有 max_iterations 终止保护，超限转 human_intervention
- tech_stack 字段有 Pydantic 校验（TechStackSpec 覆盖前后端双包管理器），initializer Node 入口校验技术栈一致性
- `POST /api/harness/start` 返回 session_id 且状态为 running
- `GET /api/harness/{id}/state` 返回完整 HarnessState
- SSE endpoint 可连接（F007 完整实现，本次仅建立连接+推送 stub 数据）
- 所有 Node 为委派桩，不含业务逻辑（mypy strict 通过）
- 测试覆盖率 ≥ 80%
- verify.sh 14 项全通过
- 依赖 F001（已实现）

## 依赖
- F001 项目初始化与骨架搭建（passing）
- LangGraph 库（pip install langgraph）
- F003 为部分 Node 提供 LLM 调用能力（F003 依赖 F002，F002 先用 stub 实现不依赖 F003）
- F011 Agent Runtime（已 Approved）— F002 Node 实现依赖 F011 定义的 Agent Runtime：Node 作为委派桩，构造 Controller Spec → 调用 Agent Runtime → L3 Agent 执行 → 产出回 Node → Node 更新 State。详见 F011 §2 Controller Spec 格式和 §4 Skill ≠ Agent 约束。

> **跨文档同步待办**: state-design.md 需在跨文档同步阶段更新以下 3 项：
> 1. tech_stack: dict → TechStackSpec
> 2. 新增 max_iterations: int + current_iteration: int
> 3. interrupt_before: 单节点 → 多节点 ["prototype_confirmation", "design_approval", "acceptance_check"]

> **跨文档同步待办**: boundaries.md line 15 需从"Harness Node 实现（纯函数）"更新为
> "Harness Node 实现（委派桩/状态转换器）"。（F011 line 264 已有相同标注）

---

## 修订记录

- Round 1（2026-08-18）：修复 6 项致命缺陷（纯函数矛盾→委派桩/HITL布尔路由→interrupt机制/循环无终止→预算保护/熵管理矛盾→横切/阶段编号不自洽→0-7/tech_stack缺校验→TechStackSpec）+ 新增 F011 引用段，详见 17-f002-revision-r1.md。
- Round 2（2026-08-18）：修复 L3 校验发现的 6 项缺陷（#1 DRR长循环预算检查→route_loop_budget共用函数/#2 state-design.md同步待办/#3 boundaries.md同步待办/#4 ResumeRequest BaseModel+gate参数说明/#5 TechStackSpec双包管理器/#6 标志位设置一致性），详见 20-f002-revision-r2.md。
- Round 3（2026-08-18）：修复跨文档缺陷——route_loop_budget 比较运算符 `>=` 改为 `>`，与 F011 §6 规则 3（`current_iteration > max_iterations`）对齐。详见 24-f002-revision-r3.md。
