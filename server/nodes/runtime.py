"""Agent Runtime stub（F011 §9 runtime 层的占位实现）。

Node 委派桩通过 agent_runtime.delegate(...) 委派 L3 Agent；
当前为 stub：接口在、内部直接返回 stub 产出。
runtime 层落地后（后续迭代）由真实 Agent 会话派生机制替换。
"""

import logging
from typing import Any

from pydantic import BaseModel

from server.schemas.harness_state import HarnessState

logger = logging.getLogger(__name__)


class DelegateResult(BaseModel):
    """delegate() 的返回契约：L3 Agent 产出的状态化摘要。"""

    role: str
    status: str = "stub_completed"
    artifacts: list[dict[str, Any]] = []
    summary: str = ""


def build_controller_spec(
    state: HarnessState,
    task: str,
    role: str,
    outputs: list[str],
) -> dict[str, Any]:
    """按 F011 §2 Controller Spec 格式构造任务卡（Node 委派桩共用）。"""
    return {
        "task": task,
        "role": role,
        "inputs": {
            "project_id": state.get("project_id", ""),
            "current_stage": state.get("current_stage", ""),
            "tech_stack": state.get("tech_stack"),
        },
        "outputs": outputs,
    }


class AgentRuntime:
    """Agent Runtime stub：真实实现将在 runtime 层迭代中接入。"""

    async def delegate(self, role: str, controller_spec: dict[str, Any]) -> DelegateResult:
        logger.debug("delegate[stub] role=%s task=%s", role, controller_spec.get("task", ""))
        return DelegateResult(
            role=role,
            status="stub_completed",
            artifacts=[],
            summary=f"stub: {controller_spec.get('task', role)} completed by {role}",
        )


agent_runtime = AgentRuntime()
