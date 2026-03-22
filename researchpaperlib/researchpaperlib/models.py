"""Data models for the researchpaperlib library."""

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class Author:
    """Represents a research paper author."""

    first_name: str
    last_name: str
    affiliation: Optional[str] = None

    def full_name(self) -> str:
        """Return the full name of the author."""
        return f"{self.first_name} {self.last_name}".strip()

    def abbreviated_name(self) -> str:
        """Return abbreviated name (e.g., 'J. Smith')."""
        if self.first_name:
            return f"{self.first_name[0]}. {self.last_name}"
        return self.last_name

    def __str__(self) -> str:
        return self.full_name()


@dataclass
class Paper:
    """Represents a research paper with metadata."""

    title: str
    authors: List[Author]
    year: Optional[int] = None
    doi: Optional[str] = None
    journal: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    publisher: Optional[str] = None
    keywords: List[str] = field(default_factory=list)
    abstract: Optional[str] = None
    url: Optional[str] = None
    issn: Optional[str] = None

    def authors_string(self) -> str:
        """Return a comma-separated string of author names."""
        return ", ".join(author.full_name() for author in self.authors)

    def __str__(self) -> str:
        authors_str = self.authors_string()
        return f"{authors_str} ({self.year}). {self.title}."


@dataclass
class ValidationResult:
    """Result of paper data validation."""

    is_valid: bool
    errors: List[str] = field(default_factory=list)
    sanitized_data: Optional[dict] = None

    def __bool__(self) -> bool:
        return self.is_valid


@dataclass
class Citation:
    """Represents a formatted citation."""

    text: str
    format_type: str
    paper_title: str
    generated_at: datetime = field(default_factory=datetime.utcnow)

    def __str__(self) -> str:
        return self.text
