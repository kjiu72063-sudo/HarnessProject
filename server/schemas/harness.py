"""Harness API 请求/响应 schema（F002「API 变更」段）。"""

from typing import Any

from pydantic import BaseModel, Field

from server.schemas.harness_state import TechStackSpec


class HarnessStartRequest(BaseModel):
    """POST /api/harness/start 请求体（AGENTS.md 规则 #8：Pydantic Body 模型）。"""

    project_id: str
    requirement: str
    tech_stack: TechStackSpec


class ResumeRequest(BaseModel):
    """POST /api/harness/{session_id}/resume 请求体。

    gate: 恢复哪个闸门 — prototype_confirmation / design_approval /
    acceptance_check（人类闸门）；human_intervention 为循环预算逃生口。
    """

    gate: str = Field(description="待恢复的闸门节点名")
    decision: bool = Field(description="True=通过/继续, False=驳回/放弃")


class HarnessStartResponse(BaseModel):
    session_id: str
    status: str


class HarnessResumeResponse(BaseModel):
    status: str
    next: list[str] = []
    state: dict[str, Any] = {}
