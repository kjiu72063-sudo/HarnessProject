last_updated: 2026-08-18
status: active
owner: @K总

# LangGraph State 设计

## 核心 State 字段

```python
class HarnessState(TypedDict):
    # 项目信息
    project_id: str
    project_name: str
    tech_stack: TechStackSpec  # [CHANGE] dict → TechStackSpec (F002)

    # 上下文层
    agents_md: str
    rules: list[dict]
    boundaries: str

    # 持久化记忆
    progress: str
    feature_list: list[dict]
    git_log: str

    # 设计文档
    design_docs: list[dict]

    # 编码产物
    code_artifacts: list[dict]
    worktree_branch: str

    # 校验结果
    verify_result: dict
    test_result: dict

    # 反馈循环
    feedback_log: list[dict]
    issue_type: str | None
    issue_resolved: bool

    # 循环预算 (F011 §6 / F002)
    max_iterations: int  # [NEW] 默认 5
    current_iteration: int  # [NEW] 初始 0, per-loop 重置

    # LLM 用量 (F003)
    token_usage_total: TokenUsage  # [NEW] 累计 token 用量

    # 流程控制
    current_stage: str
    next_feature: str | None
    human_intervention: bool
```

## TechStackSpec 定义 (F002)

```python
class TechStackSpec(BaseModel):
    frontend: str        # 如 "React 19"
    backend: str         # 如 "Python 3.12 + FastAPI"
    database: str        # 如 "PostgreSQL"
    llm: str             # 如 "OpenAI"
    frontend_package_manager: str  # 如 "pnpm"
    backend_package_manager: str   # 如 "uv"
```

## TokenUsage 定义 (F003)

```python
class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
```

## Graph 拓扑

- 8 阶段 Node 序列（阶段 0-7）
- HITL 闸门: interrupt_before=["prototype_confirmation","design_approval","acceptance_check"]（多节点拓扑，F002/F011 §5）
- Conditional Edges: 测试结果/解决成功/审查通过（自动闸门）
- Cycles: 反馈循环(失败→修复→回到写代码), DRR长循环(验收失败→修正环境→回到写代码)
- 循环预算: max_iterations + current_iteration, per-loop 重置（F011 §6）
- Checkpointer: PostgreSQL 持久化
- 横切关注点: 熵管理（事件驱动，非线性阶段，F002）
