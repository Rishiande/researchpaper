"""Paper data validation and sanitization module."""

import re
from typing import Optional
from .models import ValidationResult
from .exceptions import ValidationError


class PaperValidator:
    """Validates and sanitizes research paper data.

    Checks required fields, field lengths, DOI format, year range,
    reading status values, and sanitizes text inputs to prevent
    XSS and injection attacks.
    """

    REQUIRED_FIELDS = ["title", "authors"]
    MAX_TITLE_LENGTH = 500
    MAX_AUTHORS_LENGTH = 1000
    DOI_PATTERN = re.compile(r"^10\.\d{4,9}/[-._;()/:A-Z0-9]+$", re.IGNORECASE)

    def validate(self, data: dict) -> ValidationResult:
        """Validate paper data and return a ValidationResult.

        Args:
            data: Dictionary containing paper fields to validate.

        Returns:
            A ValidationResult with is_valid, errors, and sanitized_data.
        """
        errors = []
        errors.extend(self._check_required_fields(data))
        errors.extend(self._check_field_lengths(data))

        if data.get("doi") and not self._validate_doi_format(data["doi"]):
            errors.append("Invalid DOI format. Expected: '10.xxxx/xxxxx'")

        errors.extend(self._validate_year(data.get("publication_year")))
        errors.extend(self._validate_reading_status(data.get("reading_status")))

        if errors:
            return ValidationResult(is_valid=False, errors=errors)

        sanitized = self._sanitize_data(data)
        return ValidationResult(is_valid=True, errors=[], sanitized_data=sanitized)

    def check_required_fields(self, data: dict) -> bool:
        """Check if all required fields are present and non-empty.

        Args:
            data: Dictionary containing paper fields.

        Returns:
            True if all required fields are present, False otherwise.
        """
        return len(self._check_required_fields(data)) == 0

    def sanitize_input(self, text: str) -> str:
        """Sanitize a text input by removing potentially dangerous characters.

        Args:
            text: The raw text input to sanitize.

        Returns:
            The sanitized text string.
        """
        if not text:
            return ""
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", "", text)
        # Remove script-like patterns
        text = re.sub(r"javascript:", "", text, flags=re.IGNORECASE)
        text = re.sub(r"on\w+\s*=", "", text, flags=re.IGNORECASE)
        # Strip leading/trailing whitespace
        text = text.strip()
        return text

    def _check_required_fields(self, data: dict) -> list:
        """Check required fields are present and non-empty."""
        errors = []
        for fld in self.REQUIRED_FIELDS:
            value = data.get(fld)
            if not value or (isinstance(value, str) and not value.strip()):
                errors.append(f"'{fld}' is required and cannot be empty.")
        return errors

    def _check_field_lengths(self, data: dict) -> list:
        """Validate field length constraints."""
        errors = []
        title = data.get("title", "")
        if isinstance(title, str) and len(title) > self.MAX_TITLE_LENGTH:
            errors.append(
                f"Title exceeds maximum length of {self.MAX_TITLE_LENGTH} characters."
            )

        authors = data.get("authors", "")
        if isinstance(authors, str) and len(authors) > self.MAX_AUTHORS_LENGTH:
            errors.append(
                f"Authors exceeds maximum length of {self.MAX_AUTHORS_LENGTH} characters."
            )
        return errors

    def _validate_doi_format(self, doi: str) -> bool:
        """Validate DOI format."""
        if not doi:
            return True
        return bool(self.DOI_PATTERN.match(doi.strip()))

    def _validate_year(self, year) -> list:
        """Validate publication year."""
        errors = []
        if year is not None:
            try:
                year_int = int(year)
                if year_int < 1900 or year_int > 2030:
                    errors.append("Publication year must be between 1900 and 2030.")
            except (ValueError, TypeError):
                errors.append("Publication year must be a valid integer.")
        return errors

    def _validate_reading_status(self, status: Optional[str]) -> list:
        """Validate reading status value."""
        errors = []
        valid_statuses = {"not_started", "reading", "completed"}
        if status and status not in valid_statuses:
            errors.append(
                f"Reading status must be one of: {', '.join(valid_statuses)}"
            )
        return errors

    def _sanitize_data(self, data: dict) -> dict:
        """Sanitize all string fields in the data dictionary."""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = self.sanitize_input(value)
            else:
                sanitized[key] = value
        return sanitized
