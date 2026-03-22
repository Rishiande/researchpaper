"""Unit tests for the CitationGenerator class."""

import pytest
from researchpaperlib.citation_generator import CitationGenerator
from researchpaperlib.models import Paper, Author


@pytest.fixture
def generator():
    return CitationGenerator()


@pytest.fixture
def sample_paper():
    return Paper(
        title="Deep Learning for NLP",
        authors=[
            Author(first_name="John", last_name="Smith"),
            Author(first_name="Jane", last_name="Doe"),
        ],
        year=2023,
        doi="10.1234/dl.2023",
        journal="Journal of AI",
        volume="15",
        issue="3",
        pages="100-120",
        publisher="Springer",
    )


@pytest.fixture
def single_author_paper():
    return Paper(
        title="Solo Research",
        authors=[Author(first_name="Alice", last_name="Brown")],
        year=2022,
    )


@pytest.fixture
def three_author_paper():
    return Paper(
        title="Collaborative Work",
        authors=[
            Author(first_name="A", last_name="One"),
            Author(first_name="B", last_name="Two"),
            Author(first_name="C", last_name="Three"),
        ],
        year=2024,
        journal="Science",
    )


# ── APA Tests ──────────────────────────────────────────────

class TestToAPA:
    def test_basic_apa(self, generator, sample_paper):
        citation = generator.to_apa(sample_paper)
        assert citation.format_type == "APA"
        assert "Smith, J." in citation.text
        assert "Doe, J." in citation.text
        assert "(2023)" in citation.text
        assert "Deep Learning for NLP" in citation.text

    def test_apa_includes_journal(self, generator, sample_paper):
        assert "Journal of AI" in generator.to_apa(sample_paper).text

    def test_apa_includes_doi(self, generator, sample_paper):
        assert "10.1234/dl.2023" in generator.to_apa(sample_paper).text

    def test_apa_single_author(self, generator, single_author_paper):
        text = generator.to_apa(single_author_paper).text
        assert "Brown, A." in text

    def test_apa_three_authors(self, generator, three_author_paper):
        text = generator.to_apa(three_author_paper).text
        assert "&" in text

    def test_apa_no_year(self, generator):
        paper = Paper(title="No Year Paper", authors=[Author(first_name="X", last_name="Y")])
        text = generator.to_apa(paper).text
        assert "(n.d.)" in text

    def test_apa_no_authors(self, generator):
        paper = Paper(title="Orphan Paper", authors=[], year=2020)
        text = generator.to_apa(paper).text
        assert "Unknown Author" in text


# ── IEEE Tests ─────────────────────────────────────────────

class TestToIEEE:
    def test_basic_ieee(self, generator, sample_paper):
        citation = generator.to_ieee(sample_paper)
        assert citation.format_type == "IEEE"
        assert "J. Smith" in citation.text
        assert "J. Doe" in citation.text

    def test_ieee_title_in_quotes(self, generator, sample_paper):
        text = generator.to_ieee(sample_paper).text
        assert '"Deep Learning for NLP,"' in text

    def test_ieee_volume_notation(self, generator, sample_paper):
        text = generator.to_ieee(sample_paper).text
        assert "vol. 15" in text

    def test_ieee_issue_notation(self, generator, sample_paper):
        text = generator.to_ieee(sample_paper).text
        assert "no. 3" in text

    def test_ieee_pages_notation(self, generator, sample_paper):
        text = generator.to_ieee(sample_paper).text
        assert "pp. 100-120" in text

    def test_ieee_no_authors(self, generator):
        paper = Paper(title="Test", authors=[], year=2020)
        text = generator.to_ieee(paper).text
        assert "Unknown Author" in text


# ── BibTeX Tests ───────────────────────────────────────────

class TestToBibTeX:
    def test_basic_bibtex(self, generator, sample_paper):
        citation = generator.to_bibtex(sample_paper)
        assert citation.format_type == "BibTeX"
        assert "@article{" in citation.text
        assert "author = {" in citation.text
        assert "title = {Deep Learning for NLP}" in citation.text

    def test_bibtex_key_format(self, generator, sample_paper):
        text = generator.to_bibtex(sample_paper).text
        assert text.startswith("@article{smith2023deep,")

    def test_bibtex_journal(self, generator, sample_paper):
        assert "journal = {Journal of AI}" in generator.to_bibtex(sample_paper).text

    def test_bibtex_year(self, generator, sample_paper):
        assert "year = {2023}" in generator.to_bibtex(sample_paper).text

    def test_bibtex_doi(self, generator, sample_paper):
        assert "doi = {10.1234/dl.2023}" in generator.to_bibtex(sample_paper).text

    def test_bibtex_publisher(self, generator, sample_paper):
        assert "publisher = {Springer}" in generator.to_bibtex(sample_paper).text

    def test_bibtex_no_authors_key(self, generator):
        paper = Paper(title="Orphan", authors=[], year=2020)
        text = generator.to_bibtex(paper).text
        assert "@article{unknown2020orphan," in text


# ── generate() dispatch Tests ──────────────────────────────

class TestGenerate:
    def test_generate_apa(self, generator, sample_paper):
        assert generator.generate(sample_paper, "apa").format_type == "APA"

    def test_generate_ieee(self, generator, sample_paper):
        assert generator.generate(sample_paper, "ieee").format_type == "IEEE"

    def test_generate_bibtex(self, generator, sample_paper):
        assert generator.generate(sample_paper, "bibtex").format_type == "BibTeX"

    def test_generate_case_insensitive(self, generator, sample_paper):
        assert generator.generate(sample_paper, "APA").format_type == "APA"
        assert generator.generate(sample_paper, "IEEE").format_type == "IEEE"

    def test_generate_unsupported_format(self, generator, sample_paper):
        with pytest.raises(ValueError, match="Unsupported citation format"):
            generator.generate(sample_paper, "mla")
