from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.routes import projects, agent_sessions
from server.config.settings import settings

app = FastAPI(
    title="Harness Platform API",
    description="Meta-application platform powered by Harness Engineering + LangGraph",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(agent_sessions.router, prefix="/api", tags=["agent-sessions"])


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "harness-platform"}
