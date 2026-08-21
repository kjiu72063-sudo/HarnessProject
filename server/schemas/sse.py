"""SSE 事件 Pydantic schema — F007 8 事件类型，对齐设计 §1 事件契约。"""

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field

SSEEventType = Literal[
    "stage-start", "stage-end", "snapshot",
    "status", "gate", "done", "error", "heartbeat",
]

HEARTBEAT_INTERVAL_S = 15


def _utc_now() -> str:
    return datetime.now(UTC).isoformat()


class SSEStageEvent(BaseModel):
    """stage-start / stage-end 负载。"""
    node: str
    stage: str
    timestamp: str = Field(default_factory=_utc_now)


class SSESnapshotEvent(BaseModel):
    """snapshot 事件负载——与 GET /{session_id}/state 返回体同构。"""
    session_id: str
    status: str
    next: list[str] = []
    state: dict = {}


class SSEStatusEvent(BaseModel):
    """status 事件负载。"""
    status: str


class SSEGateEvent(BaseModel):
    """gate 事件负载。"""
    gate: str
    next: list[str]


class SSEErrorEvent(BaseModel):
    """error 事件负载。"""
    message: str
    node: str | None = None


class SSEHeartbeatEvent(BaseModel):
    """heartbeat 事件负载。"""
    ts: str = Field(default_factory=_utc_now)


class SSEDoneEvent(BaseModel):
    """done 事件空负载。"""
    pass


SSEEventPayload = (
    SSEStageEvent | SSESnapshotEvent | SSEStatusEvent
    | SSEGateEvent | SSEErrorEvent | SSEHeartbeatEvent | SSEDoneEvent
)

EVENT_PAYLOAD_MAP: dict[SSEEventType, type[BaseModel]] = {
    "stage-start": SSEStageEvent,
    "stage-end": SSEStageEvent,
    "snapshot": SSESnapshotEvent,
    "status": SSEStatusEvent,
    "gate": SSEGateEvent,
    "done": SSEDoneEvent,
    "error": SSEErrorEvent,
    "heartbeat": SSEHeartbeatEvent,
}
