from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.routes import agent_sessions, harness, projects

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
app.include_router(harness.router, prefix="/api", tags=["harness"])


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "harness-platform"}
