from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse # <--- Important
from sqlalchemy.orm import Session
from database import get_db
from models import User, GitHubInstallation
from schemas import UserCreate, UserLoginPassword, UserResponse
from utils.security import hash_password, verify_password, create_access_token
from utils.github_app import GitHubAppAuth
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/signup")
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account with email and password"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if not user_data.password:
            raise HTTPException(status_code=400, detail="Password is required")
        
        logger.info(f"[v0] Signing up new user: {user_data.email}")
        
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        access_token = create_access_token(data={"sub": user.id})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[v0] Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login")
async def login(user_data: UserLoginPassword, db: Session = Depends(get_db)):
    """Authenticate user with email and password"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == user_data.email).first()
        
        if not user or not user.password_hash:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not verify_password(user_data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"[v0] User logged in: {user.email}")
        
        access_token = create_access_token(data={"sub": user.id})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[v0] Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication failed")


@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- THE NEW CLEAN GITHUB FLOW ---

@router.get("/github/app/authorize")
async def github_app_authorize(user_id: str):
    """
    Generate the correct GitHub Installation URL.
    We embed the 'user_id' into the 'state' parameter so we know who they are
    when they come back.
    """
    github_app_name = os.getenv("GITHUB_APP_NAME", "guardian-portal") # Check your .env!
    
    # This constructs: https://github.com/apps/YOUR-APP/installations/new?state=USER_ID
    auth_url = (
        f"https://github.com/apps/{github_app_name}/installations/new"
        f"?state={user_id}"
    )
    
    return {"authorization_url": auth_url}


@router.get("/github/callback")
async def github_callback(
    installation_id: int = Query(...), 
    setup_action: str = Query(...), 
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Backend Callback - called by Frontend after GitHub installation.
    Returns JSON instead of redirecting.
    """
    logger.info(f"[GitHub Callback] Install ID: {installation_id}, User ID: {state}")

    try:
        # 1. Verify the User exists
        user = db.query(User).filter(User.id == state).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 2. Fetch the Token directly from GitHub
        github_app = GitHubAppAuth()
        token_data = await github_app.get_installation_token(installation_id)
        
        if not token_data:
            raise HTTPException(status_code=500, detail="Failed to verify installation with GitHub")
        
        expires_at = datetime.fromisoformat(token_data["expires_at"].replace("Z", "+00:00"))

        # 3. Save/Update the Installation in Database
        installation = db.query(GitHubInstallation).filter(
            GitHubInstallation.installation_id == installation_id
        ).first()

        if installation:
            installation.user_id = user.id
            installation.access_token = token_data["token"]
            installation.token_expires_at = expires_at
            installation.updated_at = datetime.utcnow()
        else:
            installation = GitHubInstallation(
                user_id=user.id,
                installation_id=installation_id,
                github_username="",
                access_token=token_data["token"],
                token_expires_at=expires_at
            )
            db.add(installation)
        
        db.commit()
        logger.info(f"[GitHub Callback] Successfully linked installation {installation_id} to user {user.email}")

        # 4. Return JSON response (Frontend will handle redirect to dashboard)
        return {
            "success": True,
            "message": "Installation verified successfully",
            "installation_id": installation_id,
            "user_id": user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[GitHub Callback] Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify installation")


@router.get("/github/app-status/{user_id}")
async def get_app_status(user_id: str, db: Session = Depends(get_db)):
    """Check status (used by frontend to conditionally show Setup vs Dashboard)"""
    installation = db.query(GitHubInstallation).filter(
        GitHubInstallation.user_id == user_id
    ).first()
    
    return {
        "app_installed": installation is not None
    }