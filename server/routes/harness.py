"""Harness API 路由 — F002 设计文档「API 变更」段 4 端点。

POST /api/harness/start                     启动 Harness 流程
GET  /api/harness/{session_id}/state        HarnessState 完整快照
GET  /api/harness/{session_id}/stream       SSE 事件流（stub 数据）
POST /api/harness/{session_id}/resume       恢复人类闸门决策

会话表为 in-memory（持久化属 F009，本次非目标）。
"""

import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langgraph.types import Command

from server.graph.definition import build_harness_graph, make_thread_config
from server.schemas.harness import (
    HarnessResumeResponse,
    HarnessStartRequest,
    HarnessStartResponse,
    ResumeRequest,
)
from server.schemas.harness_state import TechStackSpec, TokenUsage, build_initial_state

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/harness", tags=["harness"])

RESUMABLE_GATES = {
    "prototype_confirmation",
    "design_approval",
    "acceptance_check",
    "human_intervention",
}

_sessions: dict[str, Any] = {}


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


@router.post("/start", response_model=HarnessStartResponse)
async def start_harness(request: HarnessStartRequest) -> HarnessStartResponse:
    """启动 Harness 流程：构建图 → 初始化 State → 运行至首个人类闸门。"""
    session_id = uuid.uuid4().hex[:12]
    app = build_harness_graph()
    _sessions[session_id] = app
    initial_state = build_initial_state(
        project_id=request.project_id,
        tech_stack=request.tech_stack,
        project_name=request.project_id,
    )
    try:
        await app.ainvoke(initial_state, config=make_thread_config(session_id))
    except ValueError as exc:
        del _sessions[session_id]
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    logger.info("harness session %s started (project=%s)", session_id, request.project_id)
    return HarnessStartResponse(session_id=session_id, status="running")


@router.get("/{session_id}/state")
async def get_harness_state(session_id: str) -> dict[str, Any]:
    """返回完整 HarnessState 快照（含当前状态/下一闸门）。"""
    app = _get_session(session_id)
    return _snapshot(app, session_id)


@router.get("/{session_id}/stream")
async def stream_harness(session_id: str) -> StreamingResponse:
    """SSE 事件流：推送当前快照与状态事件（stub 数据，流式框架属 F006/F009）。"""
    app = _get_session(session_id)

    async def event_source() -> AsyncIterator[str]:
        snapshot = _snapshot(app, session_id)
        yield f"event: snapshot\ndata: {json.dumps(snapshot, ensure_ascii=False)}\n\n"
        yield f"event: status\ndata: {json.dumps({'status': snapshot['status']})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
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
    await app.ainvoke(
        Command(resume={"gate_decision": request.decision}),
        config=make_thread_config(session_id),
    )
    result = _snapshot(app, session_id)
    logger.info("harness session %s resumed at %s -> %s", session_id, request.gate, result["status"])
    return HarnessResumeResponse(
        status=result["status"],
        next=result["next"],
        state=result["state"],
    )
