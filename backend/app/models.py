"""SQLAlchemy ORM models for Paper and Note entities."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Paper(Base):
    """Represents a research paper stored in the system."""

    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(Text, nullable=False)
    publication_year = Column(Integer, nullable=True)
    doi = Column(String(255), unique=True, nullable=True)
    keywords = Column(Text, nullable=True)
    abstract = Column(Text, nullable=True)
    reading_status = Column(String(20), default="not_started")
    pdf_s3_key = Column(String(500), nullable=True)
    pdf_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    notes = relationship("Note", back_populates="paper", cascade="all, delete-orphan")


class Note(Base):
    """Represents a user note attached to a research paper."""

    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(
        Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False
    )
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    paper = relationship("Paper", back_populates="notes")
