from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SandboxRun, Incident
from schemas import SandboxRunCreate, SandboxRunResponse
from sandbox_orchestrator import run_snippet_in_sandbox

router = APIRouter()

@router.get("/{incident_id}", response_model=SandboxRunResponse)
async def get_sandbox_run(incident_id: str, db: Session = Depends(get_db)):
    """Get sandbox run details for an incident"""
    sandbox_run = db.query(SandboxRun).filter(SandboxRun.incident_id == incident_id).first()
    if not sandbox_run:
        raise HTTPException(status_code=404, detail="Sandbox run not found")
    return sandbox_run

@router.post("/{incident_id}", response_model=SandboxRunResponse)
async def execute_snippet(incident_id: str, sandbox_data: SandboxRunCreate, db: Session = Depends(get_db)):
    """Execute a code snippet in sandbox for an incident"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Run the snippet
    result = run_snippet_in_sandbox(sandbox_data.snippet_executed)
    
    # Create or update sandbox run record
    sandbox_run = db.query(SandboxRun).filter(SandboxRun.incident_id == incident_id).first()
    
    if not sandbox_run:
        sandbox_run = SandboxRun(
            incident_id=incident_id,
            snippet_executed=sandbox_data.snippet_executed,
            verdict=result["verdict"],
            runtime_log=result.get("log", "")
        )
        db.add(sandbox_run)
    else:
        sandbox_run.snippet_executed = sandbox_data.snippet_executed
        sandbox_run.verdict = result["verdict"]
        sandbox_run.runtime_log = result.get("log", "")
    
    db.commit()
    db.refresh(sandbox_run)
    return sandbox_run
