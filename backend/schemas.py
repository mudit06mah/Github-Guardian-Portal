from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    github_username: Optional[str] = None
    api_token: Optional[str] = None

class UserLoginPassword(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    github_username: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Repository Schemas
class RepositoryCreate(BaseModel):
    full_name: str

class RepositoryResponse(BaseModel):
    id: str
    full_name: str
    is_active: bool
    last_sync_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Incident Schemas
class IncidentCreate(BaseModel):
    pr_number: Optional[int] = None
    workflow_path: str
    severity: str
    finding_type: str
    description: str

class IncidentUpdate(BaseModel):
    status: str

class IncidentResponse(BaseModel):
    id: str
    pr_number: Optional[int]
    workflow_path: str
    severity: str
    finding_type: str
    description: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# SandboxRun Schemas
class SandboxRunCreate(BaseModel):
    snippet_executed: str
    verdict: str
    runtime_log: Optional[str] = None

class SandboxRunResponse(BaseModel):
    id: str
    snippet_executed: str
    verdict: str
    runtime_log: Optional[str]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Dashboard Statistics
class DashboardStats(BaseModel):
    total_incidents: int
    high_severity_incidents: int
    open_incidents: int
    workflows_monitored: int
    safe_sandbox_runs: int
    total_sandbox_runs: int
