from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserResponse

router = APIRouter()

@router.post("/login", response_model=dict)
async def login(user_data: UserCreate, db: Session = Depends(get_db)):
    """Mock authentication endpoint - returns a mock JWT token"""
    # Check if user exists
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user:
        # Create new user
        user = User(
            github_username=user_data.github_username,
            email=user_data.email,
            api_token=user_data.api_token
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "access_token": f"mock-jwt-token-{user.id}",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "github_username": user.github_username,
            "email": user.email
        }
    }

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.github_username == user_data.github_username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = User(
        github_username=user_data.github_username,
        email=user_data.email,
        api_token=user_data.api_token
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
