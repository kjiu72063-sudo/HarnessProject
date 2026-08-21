"""F007 SSE 推送回调 — 方案 B 自定义回调，不侵入 Node 业务逻辑。

SSECallbackHandler 实现 LangGraph BaseCallbackHandler 接口，
仅在 8 阶段 Node + 闸门 Node 的 start/end 边界发事件，
忽略 LLM 子链回调。推送是编排/路由层横切能力。
"""

import asyncio
import json
import logging
from typing import Any

from langchain_core.callbacks import BaseCallbackHandler

from server.schemas.sse import (
    SSEDoneEvent,
    SSEErrorEvent,
    SSEGateEvent,
    SSEStageEvent,
    SSEStatusEvent,
)

logger = logging.getLogger(__name__)

STAGE_NODES = frozenset({
    "initializer", "information_layer", "feature_breakdown",
    "coding_agent", "validation", "merge_deploy", "observability",
    "problem_classification",
})

GATE_NODES = frozenset({
    "prototype_confirmation", "design_approval",
    "acceptance_check", "human_intervention",
})

MONITORED_NODES = STAGE_NODES | GATE_NODES

GATE_LABELS: dict[str, str] = {
    "prototype_confirmation": "原型确认",
    "design_approval": "设计审批",
    "acceptance_check": "验收检查",
    "human_intervention": "人工介入",
}

_event_queues: dict[str, asyncio.Queue[str]] = {}


def get_event_queue(session_id: str) -> asyncio.Queue[str] | None:
    return _event_queues.get(session_id)


def remove_event_queue(session_id: str) -> None:
    _event_queues.pop(session_id, None)


def _sse_line(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


class SSECallbackHandler(BaseCallbackHandler):
    """LangGraph 回调 → asyncio.Queue，每 session 一个 handler + queue。

    歧义β裁决：在 start_harness() 构造并注入 ainvoke config，
    与执行同生；首事件 snapshot 兜底补偿 start→首订阅间事件。
    """

    def __init__(self, session_id: str, queue: asyncio.Queue[str]) -> None:
        self.session_id = session_id
        self.queue = queue
        _event_queues[session_id] = queue

    async def on_chain_start(
        self, serialized: dict[str, Any], inputs: dict[str, Any],
        *, run_id: Any, parent_run_id: Any | None = None,
        tags: list[str] | None = None, metadata: dict[str, Any] | None = None,
        run_name: str = "", **kwargs: Any,
    ) -> None:
        if run_name not in MONITORED_NODES:
            return
        payload = SSEStageEvent(node=run_name, stage=run_name).model_dump()
        await self.queue.put(_sse_line("stage-start", payload))
        if run_name in GATE_NODES:
            gate_payload = SSEGateEvent(
                gate=run_name, next=list(GATE_NODES),
            ).model_dump()
            await self.queue.put(_sse_line("gate", gate_payload))

    async def on_chain_end(
        self, outputs: dict[str, Any],
        *, run_id: Any, parent_run_id: Any | None = None,
        tags: list[str] | None = None, metadata: dict[str, Any] | None = None,
        run_name: str = "", **kwargs: Any,
    ) -> None:
        if run_name not in MONITORED_NODES:
            return
        payload = SSEStageEvent(node=run_name, stage=run_name).model_dump()
        await self.queue.put(_sse_line("stage-end", payload))
        if run_name in STAGE_NODES:
            status_payload = SSEStatusEvent(status="running").model_dump()
            await self.queue.put(_sse_line("status", status_payload))

    async def on_chain_error(
        self, error: BaseException,
        *, run_id: Any, parent_run_id: Any | None = None,
        tags: list[str] | None = None, metadata: dict[str, Any] | None = None,
        run_name: str = "", **kwargs: Any,
    ) -> None:
        err_payload = SSEErrorEvent(message=str(error), node=run_name or None).model_dump()
        await self.queue.put(_sse_line("error", err_payload))

    async def emit_done(self) -> None:
        payload = SSEDoneEvent().model_dump()
        await self.queue.put(_sse_line("done", payload))

    async def emit_status(self, status: str) -> None:
        payload = SSEStatusEvent(status=status).model_dump()
        await self.queue.put(_sse_line("status", payload))
