from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    github_installations = relationship("GitHubInstallation", back_populates="user", cascade="all, delete-orphan")
    repositories = relationship("Repository", back_populates="user", cascade="all, delete-orphan")

class GitHubInstallation(Base):
    __tablename__ = "github_installations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    installation_id = Column(Integer, nullable=False, unique=True)
    github_username = Column(String(255), nullable=True)
    access_token = Column(String(255), nullable=False)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="github_installations")

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    full_name = Column(String(255), nullable=False)
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
    severity = Column(String(50), default="Low")
    finding_type = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    repository = relationship("Repository", back_populates="incidents")
    sandbox_run = relationship("SandboxRun", back_populates="incident", uselist=False, cascade="all, delete-orphan")

class SandboxRun(Base):
    __tablename__ = "sandbox_runs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id"), unique=True, nullable=False)
    snippet_executed = Column(Text, nullable=False)
    verdict = Column(String(50), default="Unknown")
    runtime_log = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    incident = relationship("Incident", back_populates="sandbox_run")
