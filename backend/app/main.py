"""FastAPI application entry point with lifespan, CORS, and router registration."""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import papers, notes, auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("research_paper_organizer")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup: create tables and upload directory
    logger.info("Starting Research Paper Organizer API...")
    Base.metadata.create_all(bind=engine)

    # Auto-migrate: add user_id column and fix DOI constraint
    from sqlalchemy import text, inspect
    inspector = inspect(engine)
    paper_columns = [c["name"] for c in inspector.get_columns("papers")]
    if "user_id" not in paper_columns:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE papers ADD COLUMN user_id INTEGER "
                "REFERENCES users(id) ON DELETE CASCADE"
            ))
        logger.info("Migrated: added user_id column to papers table.")

    # Replace global DOI unique constraint with per-user constraint
    existing_constraints = [
        c["name"] for c in inspector.get_unique_constraints("papers")
    ]
    if "papers_doi_key" in existing_constraints:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE papers DROP CONSTRAINT papers_doi_key"
            ))
            conn.execute(text(
                "ALTER TABLE papers ADD CONSTRAINT uq_papers_doi_user "
                "UNIQUE (doi, user_id)"
            ))
        logger.info("Migrated: DOI unique constraint now per-user.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("Database tables created / verified.")
    yield
    # Shutdown
    logger.info("Shutting down Research Paper Organizer API.")


app = FastAPI(
    title="Research Paper Organizer API",
    description="API for managing academic research papers, notes, DOI resolution, and citations.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(papers.router, prefix="/api", tags=["Papers"])
app.include_router(notes.router, prefix="/api", tags=["Notes"])


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}
