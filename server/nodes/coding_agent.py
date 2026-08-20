"""阶段3+4: 编码 Agent 启动 + 编码实现（约束层接入，Worktree 隔离）。"""

from typing import Any

from server.constraints import registry
from server.nodes.runtime import agent_runtime, build_controller_spec
from server.sandbox import get_executor_type
from server.schemas.harness_state import HarnessState


async def coding_agent(state: HarnessState) -> dict[str, Any]:
    """委派桩：注入激活约束（registry）→ 委派编码 Agent 实现 → 产出写入 State。"""
    constraints = registry.active_constraints(state["project_id"])
    controller_spec = build_controller_spec(
        state,
        task="读取 git log + progress.txt + feature_list → 选定功能 → 编码实现（遵守注入约束）→ verify 全闸门",
        role="coder",
        outputs=["code_artifacts", "worktree_branch"],
    )
    controller_spec["inputs"]["constraints"] = constraints
    controller_spec["inputs"]["sandbox_available"] = get_executor_type() != "disabled"
    result = await agent_runtime.delegate(role="coder", controller_spec=controller_spec)
    return {
        "current_stage": "validation",
        "rules": constraints,
        "code_artifacts": [
            *state["code_artifacts"],
            {"source": "coding_agent", "status": result.status, "summary": result.summary},
        ],
        "worktree_branch": f"worktree/{state['project_id']}",
    }
