"""阶段6: 合并与部署 — 代码审查 + 合并 + CI/CD + 部署。

审查闸门（F011 §5）：默认 Agent 审查；Agent 发现可疑模式时设置
human_intervention=True 转逃生口（升级阈值由真实审查 Agent 定义，stub 不触发）。
"""

from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState


async def merge_deploy(state: HarnessState) -> dict[str, Any]:
    """委派桩：委派合并部署 Agent（Agent 审查 + 代码合并 + CI/CD）→ 更新 State。"""
    controller_spec = build_controller_spec(
        state,
        task="代码审查（可疑升级人类）→ 代码合并 → CI/CD → 部署",
        role="merge_deploy",
        outputs=["verify_result", "human_intervention"],
    )
    result = await agent_runtime.delegate(role="merge_deploy", controller_spec=controller_spec)
    return {
        "current_stage": "observability",
        "verify_result": {"pass": True, "summary": result.summary},
    }
