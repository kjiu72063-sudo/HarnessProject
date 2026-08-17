from fastapi import APIRouter

router = APIRouter()


@router.get("/agent-sessions")
async def list_sessions(project_id: str = "") -> dict:
    return {"sessions": [], "total": 0}
