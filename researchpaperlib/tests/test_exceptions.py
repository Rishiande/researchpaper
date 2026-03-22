"""Unit tests for researchpaperlib custom exceptions."""

import pytest
from researchpaperlib.exceptions import (
    ResearchPaperLibError,
    DOINotFoundError,
    DOIFormatError,
    ValidationError,
    CrossRefAPIError,
)


class TestDOINotFoundError:
    def test_default_message(self):
        err = DOINotFoundError("10.1234/test")
        assert err.doi == "10.1234/test"
        assert "10.1234/test" in str(err)

    def test_custom_message(self):
        err = DOINotFoundError("10.1234/test", message="Custom msg")
        assert str(err) == "Custom msg"

    def test_is_base_error(self):
        assert issubclass(DOINotFoundError, ResearchPaperLibError)


class TestDOIFormatError:
    def test_message(self):
        err = DOIFormatError("bad-doi")
        assert err.doi == "bad-doi"
        assert "Invalid DOI format" in str(err)

    def test_is_base_error(self):
        assert issubclass(DOIFormatError, ResearchPaperLibError)


class TestValidationError:
    def test_single_error(self):
        err = ValidationError(["Title required"])
        assert err.errors == ["Title required"]
        assert "Title required" in str(err)

    def test_multiple_errors(self):
        err = ValidationError(["Error A", "Error B"])
        assert len(err.errors) == 2
        assert "Error A" in str(err)
        assert "Error B" in str(err)

    def test_is_base_error(self):
        assert issubclass(ValidationError, ResearchPaperLibError)


class TestCrossRefAPIError:
    def test_default_message(self):
        err = CrossRefAPIError(500)
        assert err.status_code == 500
        assert "HTTP 500" in str(err)

    def test_custom_message(self):
        err = CrossRefAPIError(403, "Forbidden")
        assert str(err) == "Forbidden"

    def test_is_base_error(self):
        assert issubclass(CrossRefAPIError, ResearchPaperLibError)
