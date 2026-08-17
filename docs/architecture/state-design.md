last_updated: 2026-08-17
status: draft

# LangGraph State 设计

## 核心 State 字段

```python
class HarnessState(TypedDict):
    # 项目信息
    project_id: str
    project_name: str
    tech_stack: dict

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

    # 流程控制
    current_stage: str
    next_feature: str | None
    human_intervention: bool
```

## Graph 拓扑

- 8 阶段 Node 序列
- Conditional Edges: 原型确认/设计审批/测试结果/解决成功/审查通过/验收通过
- Cycles: 反馈循环(失败→修复→回到写代码), DRR长循环(验收失败→修正环境→回到写代码)
- Checkpointer: PostgreSQL 持久化
- Human-in-the-loop: interrupt_before=["human_interrupt"]
