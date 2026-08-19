"""阶段2: 功能拆分与设计 — 功能列表 + 设计文档。"""

from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState


async def feature_breakdown(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派功能拆分 Agent 产出功能列表 + 设计文档 → 更新 State。"""
    controller_spec = build_controller_spec(
        state,
        task="功能拆分 + 前后端功能列表 + 设计文档编写",
        role="feature_breakdown",
        outputs=["feature_list", "design_docs"],
    )
    result = await agent_runtime.delegate(role="feature_breakdown", controller_spec=controller_spec)
    return {
        "current_stage": "coding_agent",
        "feature_list": [
            *state["feature_list"],
            {"source": "feature_breakdown", "status": result.status},
        ],
        "design_docs": [
            *state["design_docs"],
            {"source": "feature_breakdown", "status": result.status, "summary": result.summary},
        ],
    }
