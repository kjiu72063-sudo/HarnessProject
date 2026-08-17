from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    name: str
    tech_stack: str = "java-springboot"


class ProjectResponse(BaseModel):
    id: str
    name: str
    status: str
    tech_stack: str
