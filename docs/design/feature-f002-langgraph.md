last_updated: 2026-08-17
status: Draft
owner: @K总

# Feature: LangGraph 编排引擎 (F002)

## Status: Draft

## 目标
实现 Harness 8 阶段的 LangGraph StateGraph 拓扑，含所有 Node、Conditional Edge 和 Cycle，使 Agent 能按 Harness Engineering 流程从需求输入到可部署产物的完整路径执行。

## 非目标
- 不实现各 Node 内部的 LLM 调用逻辑（属于 F003）
- 不实现前端展示（属于 F006）
- 不实现持久化记忆系统（F009，本次用 in-memory Checkpointer）
- 不实现熵管理（F008）
- 不实现 Docker 沙箱执行（F005，本次 verify.sh 本地执行）

## 技术方案

### 涉及的模块
- `server/graph/definition.py` — StateGraph 构建：添加 Node + Edge + Conditional Edge
- `server/graph/edges.py` — Conditional Edge 路由函数（原型确认/设计审批/测试结果/解决成功/审查通过/验收通过）
- `server/nodes/initializer.py` — 阶段0: 初始化 Agent
- `server/nodes/information_layer.py` — 阶段1: 需求与架构规划
- `server/nodes/feature_breakdown.py` — 阶段2: 功能拆分与设计
- `server/nodes/coding_agent.py` — 阶段3+4: 编码 Agent 启动 + 编码实现
- `server/nodes/validation.py` — 阶段5: 自校验与反馈循环
- `server/nodes/merge_deploy.py` — 阶段6: 合并与部署
- `server/nodes/observability.py` — 阶段7: 可观测性验证
- `server/nodes/entropy.py` — 阶段8: 熵管理
- `server/schemas/harness_state.py` — HarnessState TypedDict 定义
- `server/routes/harness.py` — API 路由：启动流程 / 查询状态 / SSE 流

### 数据模型变更
无需数据库变更（F009 持久化时再加）。本次使用 LangGraph 的 in-memory MemorySaver 作为 Checkpointer。

### Graph 拓扑

```
initializer → information_layer → [原型确认?]
  → Yes → feature_breakdown → [设计审批?]
    → Yes → coding_agent → validation → [测试结果?]
      → Pass → merge_deploy → [审查通过?]
        → Yes → observability → [验收通过?]
          → Yes → END
          → No → (DRR长循环) → coding_agent
        → No → coding_agent
      → Fail → [问题分类] → [解决成功?]
        → Yes → validation
        → No → coding_agent
    → No → information_layer
  → No → information_layer

entropy: 穿插于 verify通过/doc反馈/功能完成 后触发
```

### API 变更

```
POST /api/harness/start
Request: { "project_id": str, "requirement": str, "tech_stack": str }
Response: { "session_id": str, "status": "running" }

GET /api/harness/{session_id}/state
Response: HarnessState (完整状态快照)

GET /api/harness/{session_id}/stream
Response: SSE — 每个 Node 执行完成推送 { "node": str, "state": HarnessState, "timestamp": str }
```

### Node 接口规范
每个 Node 必须是纯函数：
```python
def node_name(state: HarnessState) -> HarnessState:
    # 读取 state，执行逻辑，返回更新后的 state
    return { **state, "current_stage": "next_stage" }
```

### Conditional Edge 函数
```python
def route_prototype_confirmation(state: HarnessState) -> str:
    return "feature_breakdown" if state["prototype_confirmed"] else "information_layer"
```

## 验收标准
- StateGraph 可被构建并执行，从 initializer 到 END 完整路径可达
- 8 个 Node 全部注册且可被调用（内部可返回 stub state）
- 6 个 Conditional Edge 路由函数全部实现且返回正确的下一节点名
- 反馈循环路径（validation→coding_agent）和 DRR 长循环路径（observability→coding_agent）可达
- `POST /api/harness/start` 返回 session_id 且状态为 running
- `GET /api/harness/{id}/state` 返回完整 HarnessState
- SSE endpoint 可连接（F007 完整实现，本次仅建立连接+推送 stub 数据）
- 所有 Node 为纯函数，无副作用（mypy strict 通过）
- 测试覆盖率 ≥ 80%
- verify.sh 14 项全通过
- 依赖 F001（已实现）

## 依赖
- F001 项目初始化与骨架搭建（passing）
- LangGraph 库（pip install langgraph）
- F003 为部分 Node 提供 LLM 调用能力（F003 依赖 F002，F002 先用 stub 实现不依赖 F003）
