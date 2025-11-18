from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Repository, User
from schemas import RepositoryCreate, RepositoryResponse
from typing import List

router = APIRouter()

@router.get("", response_model=List[RepositoryResponse])
async def get_repositories(user_id: str, db: Session = Depends(get_db)):
    """Get all tracked repositories for a user"""
    repositories = db.query(Repository).filter(Repository.user_id == user_id).all()
    return repositories

@router.post("", response_model=RepositoryResponse)
async def create_repository(user_id: str, repo_data: RepositoryCreate, db: Session = Depends(get_db)):
    """Start tracking a new repository"""
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if repository already exists
    existing_repo = db.query(Repository).filter(
        Repository.user_id == user_id,
        Repository.full_name == repo_data.full_name
    ).first()
    
    if existing_repo:
        raise HTTPException(status_code=400, detail="Repository already tracked")
    
    repository = Repository(
        user_id=user_id,
        full_name=repo_data.full_name
    )
    db.add(repository)
    db.commit()
    db.refresh(repository)
    return repository

@router.delete("/{repo_id}")
async def delete_repository(repo_id: str, db: Session = Depends(get_db)):
    """Stop tracking a repository"""
    repository = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    db.delete(repository)
    db.commit()
    return {"message": "Repository deleted successfully"}
