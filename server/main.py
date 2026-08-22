from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.constraints import registry
from server.routes import constraints, harness, projects, sandbox
from server.sandbox import configure_executor
from server.sandbox.probe import probe_docker

AGENTS_MD_PATH = Path(__file__).resolve().parent.parent / "AGENTS.md"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """启动时解析 AGENTS.md + 沙箱探测（三级降级链）。"""
    registry.initialize(AGENTS_MD_PATH.read_text(encoding="utf-8"))
    docker_ok = await probe_docker()
    configure_executor("docker" if docker_ok else "local")
    yield


app = FastAPI(
    title="Harness Platform API",
    description="Meta-application platform powered by Harness Engineering + LangGraph",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(constraints.router, prefix="/api", tags=["constraints"])
app.include_router(harness.router, prefix="/api", tags=["harness"])
app.include_router(sandbox.router, prefix="/api", tags=["sandbox"])


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "harness-platform"}
