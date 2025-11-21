from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Incident, Repository
from schemas import IncidentCreate, IncidentUpdate, IncidentResponse, DashboardStats
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(user_id: str, db: Session = Depends(get_db)):
    """Get aggregated statistics for the dashboard"""
    try:
        # Get all repositories for the user
        repositories = db.query(Repository).filter(Repository.user_id == user_id).all()
        repo_ids = [repo.id for repo in repositories]
        
        # Query incidents
        all_incidents = db.query(Incident).filter(Incident.repo_id.in_(repo_ids)).all() if repo_ids else []
        high_severity = [i for i in all_incidents if i.severity == "High"]
        open_incidents = [i for i in all_incidents if i.status == "Open"]
        
        # Count workflows (unique workflow paths)
        workflows_count = len(set(i.workflow_path for i in all_incidents)) if all_incidents else 0
        
        # Count sandbox runs
        safe_runs = len([i for i in all_incidents if i.sandbox_run and i.sandbox_run.verdict == "Safe"])
        total_runs = len([i for i in all_incidents if i.sandbox_run])
        
        return DashboardStats(
            total_incidents=len(all_incidents),
            high_severity_incidents=len(high_severity),
            open_incidents=len(open_incidents),
            workflows_monitored=workflows_count,
            safe_sandbox_runs=safe_runs,
            total_sandbox_runs=total_runs
        )
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

@router.get("", response_model=List[IncidentResponse])
async def get_incidents(user_id: str, db: Session = Depends(get_db)):
    """Get all incidents for a user's repositories"""
    try:
        repositories = db.query(Repository).filter(Repository.user_id == user_id).all()
        repo_ids = [repo.id for repo in repositories]
        
        incidents = db.query(Incident).filter(Incident.repo_id.in_(repo_ids)).order_by(Incident.created_at.desc()).all() if repo_ids else []
        return incidents
    except Exception as e:
        logger.error(f"Error fetching incidents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch incidents")

@router.post("/{repo_id}", response_model=IncidentResponse)
async def create_incident(repo_id: str, incident_data: IncidentCreate, db: Session = Depends(get_db)):
    """Create a new incident for a repository"""
    try:
        repository = db.query(Repository).filter(Repository.id == repo_id).first()
        if not repository:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        logger.info(f"Creating incident for repo {repo_id}: {incident_data.finding_type}")
        incident = Incident(
            repo_id=repo_id,
            pr_number=incident_data.pr_number,
            workflow_path=incident_data.workflow_path,
            severity=incident_data.severity,
            finding_type=incident_data.finding_type,
            description=incident_data.description
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating incident: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create incident")

@router.put("/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(incident_id: str, update_data: IncidentUpdate, db: Session = Depends(get_db)):
    """Update incident status"""
    try:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        logger.info(f"Updating incident {incident_id} status to {update_data.status}")
        incident.status = update_data.status
        db.commit()
        db.refresh(incident)
        return incident
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating incident: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update incident")

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get details of a specific incident"""
    try:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        return incident
    except Exception as e:
        logger.error(f"Error fetching incident: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch incident")
