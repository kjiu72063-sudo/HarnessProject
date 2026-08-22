"""Harness API 路由 — F002 设计文档「API 变更」段 4 端点。

POST /api/harness/start                     启动 Harness 流程
GET  /api/harness/{session_id}/state        HarnessState 完整快照
GET  /api/harness/{session_id}/stream       SSE 实时状态推送 (F007)
POST /api/harness/{session_id}/resume       恢复人类闸门决策

会话表为 in-memory（持久化属 F009，本次非目标）。
"""

import asyncio
import json
import logging
import time
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langgraph.types import Command

from server.graph.callbacks import (
    SSECallbackHandler,
    get_event_queue,
    remove_event_queue,
)
from server.graph.definition import build_harness_graph, make_thread_config
from server.schemas.harness import (
    HarnessResumeResponse,
    HarnessStartRequest,
    HarnessStartResponse,
    ResumeRequest,
    SessionListItem,
    SessionListResponse,
    SessionMeta,
)
from server.schemas.harness_state import TechStackSpec, TokenUsage, build_initial_state
from server.schemas.sse import HEARTBEAT_INTERVAL_S

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/harness", tags=["harness"])

RESUMABLE_GATES = {
    "prototype_confirmation",
    "design_approval",
    "acceptance_check",
    "human_intervention",
}

_sessions: dict[str, Any] = {}
_session_meta: dict[str, SessionMeta] = {}


def _get_session(session_id: str) -> Any:
    app = _sessions.get(session_id)
    if app is None:
        raise HTTPException(status_code=404, detail=f"session {session_id} not found")
    return app


def _serialize_value(value: Any) -> Any:
    """把 State 中的 Pydantic 模型转为可 JSON 化的 dict。"""
    if isinstance(value, (TechStackSpec, TokenUsage)):
        return value.model_dump()
    return value


def _session_status(next_nodes: tuple[str, ...], values: dict[str, Any]) -> str:
    """从 LangGraph 快照推导会话状态。"""
    if next_nodes:
        return "interrupted"
    if values.get("current_stage") == "completed":
        return "completed"
    return "ended"


def _snapshot(app: Any, session_id: str) -> dict[str, Any]:
    snapshot = app.get_state(make_thread_config(session_id))
    values = {k: _serialize_value(v) for k, v in snapshot.values.items()}
    return {
        "session_id": session_id,
        "status": _session_status(snapshot.next, snapshot.values),
        "next": list(snapshot.next),
        "state": values,
    }


def _sse_line(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/start", response_model=HarnessStartResponse)
async def start_harness(request: HarnessStartRequest) -> HarnessStartResponse:
    """启动 Harness 流程：构建图 → 初始化 State → 运行至首个人类闸门。

    歧义β裁决：SSECallbackHandler 在此构造并注入 ainvoke config，
    与执行同生；首事件 snapshot 兜底补偿 start→首订阅间事件。
    """
    session_id = uuid.uuid4().hex[:12]
    app = build_harness_graph()
    _sessions[session_id] = app
    _session_meta[session_id] = SessionMeta(
        requirement=request.requirement,
        started_at=time.time(),
    )
    initial_state = build_initial_state(
        project_id=request.project_id,
        tech_stack=request.tech_stack,
        project_name=request.project_id,
    )
    queue: asyncio.Queue[str] = asyncio.Queue()
    handler = SSECallbackHandler(session_id, queue)
    config = make_thread_config(session_id)
    config["callbacks"] = [handler]
    try:
        await app.ainvoke(initial_state, config=config)
    except ValueError as exc:
        remove_event_queue(session_id)
        del _sessions[session_id]
        _session_meta.pop(session_id, None)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    final_status = _session_status(
        app.get_state(make_thread_config(session_id)).next,
        app.get_state(make_thread_config(session_id)).values,
    )
    if final_status in ("completed", "ended"):
        await handler.emit_done()
    else:
        await handler.emit_status(final_status)
    logger.info("harness session %s started (project=%s)", session_id, request.project_id)
    return HarnessStartResponse(session_id=session_id, status="running")


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions() -> SessionListResponse:
    """会话列表：遍历 _sessions，按 started_at 倒序返回摘要。"""
    items: list[SessionListItem] = []
    for sid, app in _sessions.items():
        meta = _session_meta.get(sid)
        snapshot = app.get_state(make_thread_config(sid))
        items.append(
            SessionListItem(
                session_id=sid,
                status=_session_status(snapshot.next, snapshot.values),
                project_id=snapshot.values.get("project_id", ""),
                current_stage=snapshot.values.get("current_stage", ""),
                requirement_summary=(meta.requirement[:80] if meta else ""),
                started_at=(meta.started_at if meta else 0.0),
            )
        )
    items.sort(key=lambda x: x.started_at, reverse=True)
    return SessionListResponse(sessions=items, total=len(items))


@router.get("/{session_id}/state")
async def get_harness_state(session_id: str) -> dict[str, Any]:
    """返回完整 HarnessState 快照（含当前状态/下一闸门）。"""
    app = _get_session(session_id)
    return _snapshot(app, session_id)


@router.get("/{session_id}/stream")
async def stream_harness(session_id: str) -> StreamingResponse:
    """SSE 实时状态推送 (F007)：方案 B 回调触发，生成器消费 queue。"""
    app = _get_session(session_id)
    queue = get_event_queue(session_id)

    async def event_source() -> AsyncIterator[str]:
        yield _sse_line("snapshot", _snapshot(app, session_id))
        if queue is None:
            yield _sse_line("done", {})
            return
        heartbeat_timer = HEARTBEAT_INTERVAL_S
        try:
            while True:
                try:
                    line = await asyncio.wait_for(queue.get(), timeout=heartbeat_timer)
                    yield line
                    heartbeat_timer = HEARTBEAT_INTERVAL_S
                    if "event: done" in line or "event: error" in line:
                        break
                except TimeoutError:
                    from server.schemas.sse import SSEHeartbeatEvent
                    hb = SSEHeartbeatEvent().model_dump()
                    yield _sse_line("heartbeat", hb)
                    heartbeat_timer = HEARTBEAT_INTERVAL_S
        except asyncio.CancelledError:
            remove_event_queue(session_id)
            raise

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/{session_id}/resume", response_model=HarnessResumeResponse)
async def resume_harness(session_id: str, request: ResumeRequest) -> HarnessResumeResponse:
    """恢复人类闸门：注入 Command(resume={"gate_decision": decision}) 继续执行。"""
    if request.gate not in RESUMABLE_GATES:
        raise HTTPException(status_code=422, detail=f"unknown gate: {request.gate}")
    app = _get_session(session_id)
    snapshot = app.get_state(make_thread_config(session_id))
    if request.gate not in snapshot.next:
        raise HTTPException(
            status_code=409,
            detail=f"session not paused at gate '{request.gate}' (next={list(snapshot.next)})",
        )
    queue = get_event_queue(session_id)
    config = make_thread_config(session_id)
    if queue is not None:
        handler = SSECallbackHandler(session_id, queue)
        config["callbacks"] = [handler]
    await app.ainvoke(
        Command(resume={"gate_decision": request.decision}),
        config=config,
    )
    result = _snapshot(app, session_id)
    if queue is not None and result["status"] in ("completed", "ended"):
        from server.schemas.sse import SSEDoneEvent
        await queue.put(_sse_line("done", SSEDoneEvent().model_dump()))
    logger.info("harness session %s resumed at %s -> %s", session_id, request.gate, result["status"])
    return HarnessResumeResponse(
        status=result["status"],
        next=result["next"],
        state=result["state"],
    )
