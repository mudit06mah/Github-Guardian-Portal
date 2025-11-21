from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Repository, Incident, User, GitHubInstallation
from services.workflow_scanner import WorkflowScanner
from services.github_service import GitHubService
from utils.github_app import GitHubAppAuth
import hmac
import hashlib
import json
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

def verify_webhook_signature(request_data: bytes, signature: str, secret: str) -> bool:
    """Verify GitHub webhook signature for security"""
    if not signature.startswith("sha256="):
        return False
    
    expected_signature = "sha256=" + hmac.new(
        secret.encode(),
        request_data,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@router.post("/github/app")
async def github_app_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Single webhook endpoint for GitHub App.
    Configured once in GitHub App settings.
    Handles events for ALL installations.
    """
    try:
        # Verify webhook signature
        signature = request.headers.get("X-Hub-Signature-256", "")
        if not signature:
            logger.warning("[v0] Webhook received without signature")
            raise HTTPException(status_code=400, detail="Missing signature")
        
        webhook_secret = os.getenv("GITHUB_WEBHOOK_SECRET")
        if not webhook_secret:
            logger.error("[v0] GITHUB_WEBHOOK_SECRET not configured")
            raise HTTPException(status_code=500, detail="Webhook secret not configured")
        
        body = await request.body()
        
        if not verify_webhook_signature(body, signature, webhook_secret):
            logger.warning("[v0] Webhook signature verification failed")
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        payload = json.loads(body.decode())
        event_type = request.headers.get("X-GitHub-Event", "")
        
        logger.info(f"[v0] Received webhook event: {event_type}")
        
        # Route to appropriate handler
        if event_type == "installation":
            await handle_installation_event(payload, db)
        elif event_type == "installation_repositories":
            await handle_installation_repositories_event(payload, db)
        elif event_type == "workflow_run":
            await handle_workflow_run_event(payload, db)
        elif event_type == "pull_request":
            await handle_pull_request_event(payload, db)
        else:
            logger.info(f"[v0] Unhandled webhook event type: {event_type}")
        
        return {"status": "ok"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[v0] Webhook processing error: {str(e)}")
        return {"status": "error", "message": str(e)}

async def handle_installation_event(payload: dict, db: Session):
    """Handle app installation/uninstallation events"""
    action = payload.get("action")
    installation = payload.get("installation", {})
    sender = payload.get("sender", {})
    
    installation_id = installation.get("id")
    github_username = sender.get("login")
    
    if not installation_id:
        logger.warning("[v0] Installation event missing installation_id")
        return
    
    logger.info(f"[v0] Installation event: {action} for installation {installation_id}")
    
    if action == "created":
        github_app = GitHubAppAuth()
        token_data = await github_app.get_installation_token(installation_id)
        
        if not token_data:
            logger.error(f"[v0] Failed to generate token for installation {installation_id}")
            return
        
        expires_at = datetime.fromisoformat(token_data["expires_at"].replace("Z", "+00:00"))
        
        # Check if installation already exists (from callback)
        existing = db.query(GitHubInstallation).filter(
            GitHubInstallation.installation_id == installation_id
        ).first()
        
        if existing:
            # Update token
            existing.github_username = github_username or existing.github_username
            existing.access_token = token_data["token"]
            existing.token_expires_at = expires_at
            existing.updated_at = datetime.utcnow()
        else:
            # Create new installation (user might be linked later via callback)
            # For now, create a placeholder user
            placeholder_email = f"{github_username}@github.placeholder"
            user = db.query(User).filter(User.email == placeholder_email).first()
            
            if not user:
                user = User(email=placeholder_email)
                db.add(user)
                db.flush()
            
            github_installation = GitHubInstallation(
                user_id=user.id,
                installation_id=installation_id,
                github_username=github_username or "",
                access_token=token_data["token"],
                token_expires_at=expires_at
            )
            db.add(github_installation)
        
        db.commit()
        logger.info(f"[v0] GitHub App installation {installation_id} processed successfully")
    
    elif action == "deleted":
        # Remove installation
        deleted_count = db.query(GitHubInstallation).filter(
            GitHubInstallation.installation_id == installation_id
        ).delete()
        db.commit()
        logger.info(f"[v0] GitHub App installation {installation_id} deleted ({deleted_count} records)")

async def handle_installation_repositories_event(payload: dict, db: Session):
    """Handle when repositories are added/removed from installation"""
    action = payload.get("action")
    installation_id = payload.get("installation", {}).get("id")
    repositories_added = payload.get("repositories_added", [])
    repositories_removed = payload.get("repositories_removed", [])
    
    logger.info(f"[v0] Installation repositories {action}: +{len(repositories_added)} -{len(repositories_removed)}")
    
    # You can auto-track new repositories here if desired
    # For now, we'll let users manually add repos they want to monitor

async def handle_workflow_run_event(payload: dict, db: Session):
    """Handle workflow run completion events"""
    repo_full_name = payload.get("repository", {}).get("full_name")
    workflow_path = payload.get("workflow", {}).get("path")
    workflow_run = payload.get("workflow_run", {})
    installation_id = payload.get("installation", {}).get("id")

    head_sha = workflow_run.get("head_sha") # <--- This is the version of code that actually ran

    if not repo_full_name or not installation_id or not workflow_path:
        return
    
    if not repo_full_name or not installation_id or not workflow_path:
        logger.warning("[v0] Workflow run event missing required fields")
        return
    
    logger.info(f"[v0] Workflow run event for {repo_full_name}: {workflow_path}")
    
    # Check if this repo is being tracked
    repo = db.query(Repository).filter(Repository.full_name == repo_full_name).first()
    if not repo:
        logger.info(f"[v0] Repository {repo_full_name} not tracked, skipping")
        return
    
    # Get installation to access token
    installation = db.query(GitHubInstallation).filter(
        GitHubInstallation.installation_id == installation_id
    ).first()
    
    if not installation:
        logger.error(f"[v0] Installation {installation_id} not found")
        return
    
    github_app = GitHubAppAuth()
    token_data = await github_app.refresh_installation_token_if_needed(
        installation.installation_id,
        installation.access_token,
        installation.token_expires_at
    )
    
    if token_data and token_data["token"] != installation.access_token:
        installation.access_token = token_data["token"]
        installation.token_expires_at = datetime.fromisoformat(token_data["expires_at"].replace("Z", "+00:00"))
        db.commit()
    
    try:
        # Scan workflow for security issues
        github_service = GitHubService(installation.access_token, is_app_token=True)
        owner, repo_name = repo_full_name.split("/")

        workflow_content = await github_service.get_workflow_file(
            owner, repo_name, workflow_path, ref=head_sha
        )
        
        workflow_content = await github_service.get_workflow_file(owner, repo_name, workflow_path)

        if workflow_content:
            findings = WorkflowScanner.scan_workflow(workflow_content, workflow_path)
            
            logger.info(f"[v0] Found {len(findings)} security findings in {workflow_path}")
            
            for finding in findings:
                # Check if incident already exists
                existing = db.query(Incident).filter(
                    Incident.repo_id == repo.id,
                    Incident.workflow_path == workflow_path,
                    Incident.finding_type == finding["type"],
                    Incident.status != "Resolved"
                ).first()
                
                if not existing:
                    incident = Incident(
                        repo_id=repo.id,
                        workflow_path=workflow_path,
                        severity=finding["severity"],
                        finding_type=finding["type"],
                        description=finding["description"],
                        status="Open"
                    )
                    db.add(incident)
                    logger.info(f"[v0] Created new incident: {finding['type']} in {workflow_path}")
            
            db.commit()
    
    except Exception as e:
        logger.error(f"[v0] Error processing workflow_run event: {str(e)}")

async def handle_pull_request_event(payload: dict, db: Session):
    """Handle pull request events to scan for workflow changes"""
    pr_action = payload.get("action")
    repo_full_name = payload.get("repository", {}).get("full_name")
    installation_id = payload.get("installation", {}).get("id")
    pr_number = payload.get("number")
    
    pull_request = payload.get("pull_request", {})
    head_sha = pull_request.get("head", {}).get("sha")

    if pr_action not in ["opened", "synchronize", "reopened"]:
        return
    
    if not repo_full_name or not installation_id:
        logger.warning("[v0] Pull request event missing required fields")
        return
    
    logger.info(f"[v0] Pull request {pr_action} event for {repo_full_name} PR #{pr_number}")
    
    # Check if repo is tracked
    repo = db.query(Repository).filter(Repository.full_name == repo_full_name).first()
    if not repo:
        logger.info(f"[v0] Repository {repo_full_name} not tracked, skipping")
        return
    
    # Get installation
    installation = db.query(GitHubInstallation).filter(
        GitHubInstallation.installation_id == installation_id
    ).first()
    
    if not installation:
        logger.error(f"[v0] Installation {installation_id} not found")
        return
    
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
    
    try:
        # Scan all workflows in the repo
        github_service = GitHubService(installation.access_token, is_app_token=True)
        owner, repo_name = repo_full_name.split("/")
        
        workflows = await github_service.get_workflows(owner, repo_name)

        for workflow in workflows:
            # 3. FETCH CONTENT FROM THE PR SHA
            workflow_content = await github_service.get_workflow_file(
                owner, repo_name, workflow["path"], ref=head_sha
            )
            
            if workflow_content:
                findings = WorkflowScanner.scan_workflow(workflow_content, workflow["path"])
                
                for finding in findings:
                    # Check if incident exists for this PR specifically
                    existing = db.query(Incident).filter(
                        Incident.repo_id == repo.id,
                        Incident.pr_number == pr_number, # Scope to PR
                        Incident.workflow_path == workflow["path"],
                        Incident.finding_type == finding["type"]
                    ).first()

                    if not existing:
                        incident = Incident(
                            repo_id=repo.id,
                            pr_number=pr_number,
                            workflow_path=workflow["path"],
                            severity=finding["severity"],
                            finding_type=finding["type"],
                            description=finding["description"],
                            status="Open"
                        )
                        db.add(incident)
                        logger.info(f"[v0] Found PR Incident: {finding['type']}")
        
        db.commit()
        logger.info(f"[v0] Completed PR scan for {repo_full_name} PR #{pr_number}")
    
    except Exception as e:
        logger.error(f"[v0] Error processing pull_request event: {str(e)}")