"""阶段0: 初始化 Agent — 入口校验 tech_stack 与 AGENTS.md 技术栈基线一致。"""

import logging
from typing import Any

from server.nodes.runtime import agent_runtime, build_controller_spec
from server.schemas.harness_state import HarnessState, TechStackSpec

logger = logging.getLogger(__name__)

BASELINE_TECH_STACK = TechStackSpec(
    frontend="react-19",
    backend="python-3.12",
    database="postgresql",
    llm="openai",
    frontend_package_manager="pnpm",
    backend_package_manager="uv",
)


def _normalize(value: str) -> str:
    return value.strip().lower().replace(" ", "-")


def validate_tech_stack(spec: TechStackSpec, baseline: TechStackSpec = BASELINE_TECH_STACK) -> None:
    """校验请求技术栈与基线一致（F002：initializer Node 入口校验）。"""
    mismatches = [
        f"{field}: expected {baseline_value!r}, got {getattr(spec, field)!r}"
        for field, baseline_value in baseline.model_dump().items()
        if _normalize(getattr(spec, field)) != _normalize(baseline_value)
    ]
    if mismatches:
        raise ValueError(f"tech_stack mismatch with AGENTS.md baseline: {'; '.join(mismatches)}")


async def initializer(state: HarnessState) -> dict[str, Any]:
    """委派桩：校验技术栈 → 委派初始化 Agent → 更新 State。"""
    validate_tech_stack(state["tech_stack"])
    controller_spec = build_controller_spec(
        state,
        task="初始化项目环境（progress.txt + feature_list.json + Git 初始提交）",
        role="initializer",
        outputs=["agents_md", "rules"],
    )
    result = await agent_runtime.delegate(role="initializer", controller_spec=controller_spec)
    logger.info("initializer done: project=%s (%s)", state["project_id"], result.status)
    return {"current_stage": "information_layer"}
