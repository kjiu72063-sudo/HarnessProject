from fastapi import APIRouter

from server.schemas.project import CreateProjectRequest, ProjectResponse

router = APIRouter()


@router.get("/projects")
async def list_projects() -> dict:
    return {"projects": [], "total": 0}


@router.post("/projects", response_model=ProjectResponse)
async def create_project(req: CreateProjectRequest) -> ProjectResponse:
    return ProjectResponse(
        id="placeholder",
        name=req.name,
        status="init",
        tech_stack=req.tech_stack,
    )
