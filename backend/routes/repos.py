from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Repository, User, GitHubInstallation
from schemas import RepositoryCreate, RepositoryResponse
from services.github_service import GitHubService
from services.workflow_scanner import WorkflowScanner
from utils.github_app import GitHubAppAuth
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("", response_model=List[RepositoryResponse])
async def get_repositories(user_id: str, db: Session = Depends(get_db)):
    """Get all tracked repositories for a user"""
    try:
        repositories = db.query(Repository).filter(Repository.user_id == user_id).all()
        return repositories
    except Exception as e:
        logger.error(f"[v0] Error fetching repositories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch repositories")

@router.post("", response_model=RepositoryResponse)
async def create_repository(user_id: str, repo_data: RepositoryCreate, db: Session = Depends(get_db)):
    """Start tracking a new repository"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        installation = db.query(GitHubInstallation).filter(
            GitHubInstallation.user_id == user_id
        ).first()
        
        if not installation:
            raise HTTPException(
                status_code=400, 
                detail="GitHub App not installed. Please install the app first."
            )
        
        github_app = GitHubAppAuth()
        token_data = await github_app.refresh_installation_token_if_needed(
            installation.installation_id,
            installation.access_token,
            installation.token_expires_at
        )
        
        if token_data and token_data["token"] != installation.access_token:
            installation.access_token = token_data["token"]
            db.commit()
        
        # Check if repository already exists
        existing_repo = db.query(Repository).filter(
            Repository.user_id == user_id,
            Repository.full_name == repo_data.full_name
        ).first()
        
        if existing_repo:
            raise HTTPException(status_code=400, detail="Repository already tracked")
        
        owner, repo_name = repo_data.full_name.split("/")
        github_service = GitHubService(installation.access_token, is_app_token=True)
        gh_repo = await github_service.get_repository(owner, repo_name)
        
        if not gh_repo:
            raise HTTPException(
                status_code=404, 
                detail="Repository not found or not accessible. Ensure the GitHub App has access to this repository."
            )
        
        logger.info(f"[v0] Adding repository: {repo_data.full_name} for user {user_id}")
        repository = Repository(
            user_id=user_id,
            full_name=repo_data.full_name
        )
        db.add(repository)
        db.commit()
        db.refresh(repository)
        
        try:
            workflows = await github_service.get_workflows(owner, repo_name)
            logger.info(f"[v0] Found {len(workflows)} workflows to scan for {repo_data.full_name}")
            
            # Scan each workflow for security issues
            for workflow in workflows:
                workflow_content = await github_service.get_workflow_file(
                    owner, repo_name, workflow["path"]
                )
                if workflow_content:
                    findings = WorkflowScanner.scan_workflow(workflow_content, workflow["path"])
                    logger.info(f"[v0] Found {len(findings)} issues in {workflow['path']}")
        except Exception as scan_error:
            logger.warning(f"[v0] Initial scan failed (non-critical): {str(scan_error)}")
        
        return repository
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"[v0] Invalid repository format: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid repository format. Use 'owner/repo'")
    except Exception as e:
        logger.error(f"[v0] Error creating repository: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create repository: {str(e)}")

@router.delete("/{repo_id}")
async def delete_repository(repo_id: str, db: Session = Depends(get_db)):
    """Stop tracking a repository"""
    try:
        repository = db.query(Repository).filter(Repository.id == repo_id).first()
        if not repository:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        logger.info(f"[v0] Removing repository: {repository.full_name}")
        db.delete(repository)
        db.commit()
        return {"message": "Repository deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[v0] Error deleting repository: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete repository")

@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(repo_id: str, db: Session = Depends(get_db)):
    """Get repository details"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repository

@router.get("/available/{user_id}")
async def get_available_repositories(user_id: str, db: Session = Depends(get_db)):
    """Get all repositories accessible through the GitHub App installation"""
    try:
        installation = db.query(GitHubInstallation).filter(
            GitHubInstallation.user_id == user_id
        ).first()
        
        if not installation:
            raise HTTPException(
                status_code=400,
                detail="GitHub App not installed"
            )
        
        # Refresh token if needed
        github_app = GitHubAppAuth()
        token_data = await github_app.refresh_installation_token_if_needed(
            installation.installation_id,
            installation.access_token,
            installation.token_expires_at
        )
        
        if token_data and token_data["token"] != installation.access_token:
            installation.access_token = token_data["token"]
            db.commit()
        
        # Get available repositories
        repositories = await github_app.get_installation_repositories(installation.installation_id)
        
        # Get already tracked repos
        tracked = db.query(Repository).filter(Repository.user_id == user_id).all()
        tracked_names = {repo.full_name for repo in tracked}
        
        # Format response
        available_repos = [
            {
                "full_name": repo["full_name"],
                "private": repo["private"],
                "description": repo.get("description", ""),
                "tracked": repo["full_name"] in tracked_names
            }
            for repo in repositories
        ]
        
        logger.info(f"[v0] Found {len(available_repos)} available repositories for user {user_id}")
        return {"repositories": available_repos}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[v0] Error fetching available repositories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")
