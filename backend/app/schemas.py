"""Pydantic schemas for request validation and response serialization."""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth Schemas ───────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Paper Schemas ──────────────────────────────────────────

class PaperCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    authors: str = Field(..., min_length=1)
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    keywords: Optional[str] = None
    abstract: Optional[str] = None
    reading_status: str = Field(default="not_started")


class PaperUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    authors: Optional[str] = Field(None, min_length=1)
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    keywords: Optional[str] = None
    abstract: Optional[str] = None
    reading_status: Optional[str] = None


class PaperResponse(BaseModel):
    id: int
    title: str
    authors: str
    publication_year: Optional[int] = None
    doi: Optional[str] = None
    keywords: Optional[str] = None
    abstract: Optional[str] = None
    reading_status: str
    pdf_filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    reading_status: str = Field(..., pattern="^(not_started|reading|completed)$")


class DOIRequest(BaseModel):
    doi: str = Field(..., min_length=1)


class CitationResponse(BaseModel):
    citation: str
    format: str


class DownloadResponse(BaseModel):
    download_url: str
    filename: str


# ── Note Schemas ───────────────────────────────────────────

class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1)


class NoteUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class NoteResponse(BaseModel):
    id: int
    paper_id: int
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
