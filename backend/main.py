from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from routes import auth, repos, incidents, sandbox, webhooks
from database import Base, engine

Base.metadata.create_all(bind=engine)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[v0] GitHub Guardian Backend Starting...")
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("[v0] GitHub Guardian Backend Shutting Down...")

app = FastAPI(
    title="GitHub Guardian API",
    description="Security monitoring for GitHub CI/CD workflows",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(repos.router, prefix="/api/repos", tags=["repos"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(sandbox.router, prefix="/api/sandbox", tags=["sandbox"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "GitHub Guardian API", "version": "2.0.0"}

@app.get("/")
async def root():
    return {
        "message": "GitHub Guardian API is running",
        "version": "2.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
