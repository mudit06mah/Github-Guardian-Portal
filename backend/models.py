from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    github_username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    api_token = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repositories = relationship("Repository", back_populates="user", cascade="all, delete-orphan")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    full_name = Column(String(255), nullable=False)  # e.g., "owner/repo-name"
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="repositories")
    incidents = relationship("Incident", back_populates="repository", cascade="all, delete-orphan")

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repo_id = Column(String(36), ForeignKey("repositories.id"), nullable=False)
    pr_number = Column(Integer, nullable=True)
    workflow_path = Column(String(255), nullable=False)
    severity = Column(String(50), default="Low")  # Low, Medium, High, Ambiguous
    finding_type = Column(String(255), nullable=False)  # e.g., "Unpinned Action", "Curl/Bash Pattern"
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")  # Open, Fixed, Dismissed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repository = relationship("Repository", back_populates="incidents")
    sandbox_run = relationship("SandboxRun", back_populates="incident", uselist=False, cascade="all, delete-orphan")

class SandboxRun(Base):
    __tablename__ = "sandbox_runs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id"), unique=True, nullable=False)
    snippet_executed = Column(Text, nullable=False)
    verdict = Column(String(50), default="Unknown")  # Safe, Unsafe, Unknown
    runtime_log = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    incident = relationship("Incident", back_populates="sandbox_run")
