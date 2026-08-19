"""阶段1: 需求与架构规划（信息层）— 需求文档/架构文档/知识库框架。"""

from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState


async def information_layer(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派信息层 Agent 产出需求/架构文档 → 更新 State。"""
    controller_spec = build_controller_spec(
        state,
        task="需求完善 + 架构分析 + 知识库框架 + 原型图开发",
        role="information_layer",
        outputs=["design_docs", "agents_md", "boundaries"],
    )
    result = await agent_runtime.delegate(role="information_layer", controller_spec=controller_spec)
    return {
        "current_stage": "feature_breakdown",
        "design_docs": [
            *state["design_docs"],
            {"source": "information_layer", "status": result.status, "summary": result.summary},
        ],
    }
