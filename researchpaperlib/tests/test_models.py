"""Unit tests for researchpaperlib data models."""

import pytest
from researchpaperlib.models import Author, Paper, ValidationResult, Citation


class TestAuthor:
    """Tests for the Author dataclass."""

    def test_full_name(self):
        author = Author(first_name="John", last_name="Smith")
        assert author.full_name() == "John Smith"

    def test_full_name_empty_first(self):
        author = Author(first_name="", last_name="Smith")
        assert author.full_name() == "Smith"

    def test_abbreviated_name(self):
        author = Author(first_name="John", last_name="Smith")
        assert author.abbreviated_name() == "J. Smith"

    def test_abbreviated_name_empty_first(self):
        author = Author(first_name="", last_name="Smith")
        assert author.abbreviated_name() == "Smith"

    def test_str(self):
        author = Author(first_name="Jane", last_name="Doe")
        assert str(author) == "Jane Doe"

    def test_affiliation_default_none(self):
        author = Author(first_name="A", last_name="B")
        assert author.affiliation is None

    def test_affiliation_set(self):
        author = Author(first_name="A", last_name="B", affiliation="MIT")
        assert author.affiliation == "MIT"


class TestPaper:
    """Tests for the Paper dataclass."""

    def test_authors_string_single(self):
        paper = Paper(
            title="Test Paper",
            authors=[Author(first_name="Alice", last_name="Brown")],
        )
        assert paper.authors_string() == "Alice Brown"

    def test_authors_string_multiple(self):
        paper = Paper(
            title="Test",
            authors=[
                Author(first_name="A", last_name="One"),
                Author(first_name="B", last_name="Two"),
            ],
        )
        assert paper.authors_string() == "A One, B Two"

    def test_str(self):
        paper = Paper(
            title="Deep Learning",
            authors=[Author(first_name="Ian", last_name="Goodfellow")],
            year=2016,
        )
        assert str(paper) == "Ian Goodfellow (2016). Deep Learning."

    def test_default_fields(self):
        paper = Paper(title="T", authors=[])
        assert paper.year is None
        assert paper.doi is None
        assert paper.journal is None
        assert paper.keywords == []
        assert paper.abstract is None
        assert paper.url is None


class TestValidationResult:
    """Tests for the ValidationResult dataclass."""

    def test_bool_valid(self):
        result = ValidationResult(is_valid=True)
        assert bool(result) is True

    def test_bool_invalid(self):
        result = ValidationResult(is_valid=False, errors=["Missing title"])
        assert bool(result) is False

    def test_default_errors_empty(self):
        result = ValidationResult(is_valid=True)
        assert result.errors == []

    def test_sanitized_data_default_none(self):
        result = ValidationResult(is_valid=True)
        assert result.sanitized_data is None


class TestCitation:
    """Tests for the Citation dataclass."""

    def test_str(self):
        citation = Citation(text="Some citation text", format_type="APA", paper_title="Paper")
        assert str(citation) == "Some citation text"

    def test_generated_at_auto(self):
        citation = Citation(text="T", format_type="APA", paper_title="P")
        assert citation.generated_at is not None
