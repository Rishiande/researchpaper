"""researchpaperlib — A Python library for research paper management.

Provides DOI resolution via CrossRef, citation generation (APA, IEEE, BibTeX),
and paper data validation with sanitization.
"""

__version__ = "1.0.0"

from .doi_resolver import DOIResolver
from .citation_generator import CitationGenerator
from .paper_validator import PaperValidator
from .models import Paper, Author, ValidationResult, Citation
from .exceptions import (
    ResearchPaperLibError,
    DOINotFoundError,
    DOIFormatError,
    ValidationError,
    CrossRefAPIError,
)

__all__ = [
    "DOIResolver",
    "CitationGenerator",
    "PaperValidator",
    "Paper",
    "Author",
    "ValidationResult",
    "Citation",
    "ResearchPaperLibError",
    "DOINotFoundError",
    "DOIFormatError",
    "ValidationError",
    "CrossRefAPIError",
]
