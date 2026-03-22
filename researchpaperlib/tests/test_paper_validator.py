"""Unit tests for the PaperValidator class."""

import pytest
from researchpaperlib.paper_validator import PaperValidator


@pytest.fixture
def validator():
    return PaperValidator()


class TestValidate:
    """Tests for the validate() method."""

    def test_valid_paper(self, validator):
        data = {"title": "Machine Learning", "authors": "John Smith"}
        result = validator.validate(data)
        assert result.is_valid is True
        assert result.errors == []
        assert result.sanitized_data is not None

    def test_missing_title(self, validator):
        data = {"authors": "John Smith"}
        result = validator.validate(data)
        assert result.is_valid is False
        assert any("title" in e.lower() for e in result.errors)

    def test_missing_authors(self, validator):
        data = {"title": "Some Paper"}
        result = validator.validate(data)
        assert result.is_valid is False
        assert any("authors" in e.lower() for e in result.errors)

    def test_empty_title(self, validator):
        data = {"title": "   ", "authors": "A"}
        result = validator.validate(data)
        assert result.is_valid is False

    def test_empty_authors(self, validator):
        data = {"title": "Paper", "authors": "  "}
        result = validator.validate(data)
        assert result.is_valid is False

    def test_title_too_long(self, validator):
        data = {"title": "A" * 501, "authors": "Smith"}
        result = validator.validate(data)
        assert result.is_valid is False
        assert any("maximum length" in e.lower() for e in result.errors)

    def test_authors_too_long(self, validator):
        data = {"title": "Paper", "authors": "A" * 1001}
        result = validator.validate(data)
        assert result.is_valid is False
        assert any("maximum length" in e.lower() for e in result.errors)

    def test_valid_doi(self, validator):
        data = {"title": "Paper", "authors": "Smith", "doi": "10.1234/test.123"}
        result = validator.validate(data)
        assert result.is_valid is True

    def test_invalid_doi(self, validator):
        data = {"title": "Paper", "authors": "Smith", "doi": "not-a-doi"}
        result = validator.validate(data)
        assert result.is_valid is False
        assert any("doi" in e.lower() for e in result.errors)

    def test_valid_year(self, validator):
        data = {"title": "Paper", "authors": "Smith", "publication_year": 2024}
        result = validator.validate(data)
        assert result.is_valid is True

    def test_year_too_old(self, validator):
        data = {"title": "Paper", "authors": "Smith", "publication_year": 1800}
        result = validator.validate(data)
        assert result.is_valid is False

    def test_year_too_future(self, validator):
        data = {"title": "Paper", "authors": "Smith", "publication_year": 2050}
        result = validator.validate(data)
        assert result.is_valid is False

    def test_invalid_year_string(self, validator):
        data = {"title": "Paper", "authors": "Smith", "publication_year": "abc"}
        result = validator.validate(data)
        assert result.is_valid is False

    def test_valid_reading_status(self, validator):
        for status in ["not_started", "reading", "completed"]:
            data = {"title": "Paper", "authors": "Smith", "reading_status": status}
            result = validator.validate(data)
            assert result.is_valid is True, f"Status '{status}' should be valid"

    def test_invalid_reading_status(self, validator):
        data = {"title": "Paper", "authors": "Smith", "reading_status": "invalid"}
        result = validator.validate(data)
        assert result.is_valid is False

    def test_no_optional_fields(self, validator):
        data = {"title": "Paper", "authors": "Smith"}
        result = validator.validate(data)
        assert result.is_valid is True

    def test_multiple_errors(self, validator):
        data = {}
        result = validator.validate(data)
        assert result.is_valid is False
        assert len(result.errors) >= 2


class TestCheckRequiredFields:
    """Tests for check_required_fields()."""

    def test_all_present(self, validator):
        assert validator.check_required_fields({"title": "T", "authors": "A"}) is True

    def test_missing_field(self, validator):
        assert validator.check_required_fields({"title": "T"}) is False

    def test_empty_dict(self, validator):
        assert validator.check_required_fields({}) is False


class TestSanitizeInput:
    """Tests for sanitize_input() — XSS prevention."""

    def test_strips_html_tags(self, validator):
        result = validator.sanitize_input("<script>alert('xss')</script>Hello")
        assert "<script>" not in result
        assert "Hello" in result

    def test_strips_javascript_protocol(self, validator):
        result = validator.sanitize_input("javascript:alert(1)")
        assert "javascript:" not in result

    def test_strips_event_handlers(self, validator):
        result = validator.sanitize_input('onerror=alert(1)')
        assert "onerror=" not in result

    def test_strips_whitespace(self, validator):
        result = validator.sanitize_input("  hello world  ")
        assert result == "hello world"

    def test_empty_string(self, validator):
        assert validator.sanitize_input("") == ""

    def test_none_input(self, validator):
        assert validator.sanitize_input(None) == ""

    def test_clean_text_unchanged(self, validator):
        text = "A perfectly normal research paper title"
        assert validator.sanitize_input(text) == text

    def test_sanitized_data_in_result(self, validator):
        data = {"title": "  <b>Bold</b> Title  ", "authors": "Smith"}
        result = validator.validate(data)
        assert result.is_valid is True
        assert "<b>" not in result.sanitized_data["title"]
        assert "Bold" in result.sanitized_data["title"]
