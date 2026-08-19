"""阶段7: 可观测性验证 — 查看日志/指标 → 验收闸门。"""

from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState


async def observability(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派可观测性 Agent 查看日志/指标 → 更新 State。"""
    controller_spec = build_controller_spec(
        state,
        task="可观测性验证：查看日志/指标，输出验收证据",
        role="observability",
        outputs=["verify_result"],
    )
    result = await agent_runtime.delegate(role="observability", controller_spec=controller_spec)
    return {
        "current_stage": "acceptance_check",
        "verify_result": {"pass": True, "summary": result.summary},
    }
