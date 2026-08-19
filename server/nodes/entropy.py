"""横切: 熵管理 — 事件驱动任务（verify 通过/文档反馈/功能完成后触发）。

非线性阶段节点：在图内注册但不接入线性边（F002 设计文档），
触发接线由 F008 熵管理后台任务实现。
"""

from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState


async def entropy(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派熵管理 Agent（后台清理 / Doc-Gardening / 质量基线更新）→ 更新 State。"""
    controller_spec = build_controller_spec(
        state,
        task="熵管理：后台清理 + Doc-Gardening + 质量基线更新（事件驱动）",
        role="entropy",
        outputs=["feedback_log"],
    )
    result = await agent_runtime.delegate(role="entropy", controller_spec=controller_spec)
    return {
        "feedback_log": [
            *state["feedback_log"],
            {"event": "entropy", "status": result.status, "summary": result.summary},
        ],
    }
