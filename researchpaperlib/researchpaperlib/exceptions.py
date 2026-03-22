"""Custom exceptions for the researchpaperlib library."""


class ResearchPaperLibError(Exception):
    """Base exception for researchpaperlib."""
    pass


class DOINotFoundError(ResearchPaperLibError):
    """Raised when a DOI cannot be resolved."""

    def __init__(self, doi: str, message: str = None):
        self.doi = doi
        self.message = message or f"DOI '{doi}' could not be resolved."
        super().__init__(self.message)


class DOIFormatError(ResearchPaperLibError):
    """Raised when a DOI has an invalid format."""

    def __init__(self, doi: str):
        self.doi = doi
        self.message = f"Invalid DOI format: '{doi}'. Expected format: '10.xxxx/xxxxx'"
        super().__init__(self.message)


class ValidationError(ResearchPaperLibError):
    """Raised when paper data fails validation."""

    def __init__(self, errors: list):
        self.errors = errors
        self.message = f"Validation failed: {'; '.join(errors)}"
        super().__init__(self.message)


class CrossRefAPIError(ResearchPaperLibError):
    """Raised when the CrossRef API returns an error."""

    def __init__(self, status_code: int, message: str = None):
        self.status_code = status_code
        self.message = message or f"CrossRef API error: HTTP {status_code}"
        super().__init__(self.message)
