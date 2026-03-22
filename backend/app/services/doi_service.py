"""Service layer integrating the custom researchpaperlib library."""

from researchpaperlib import DOIResolver, CitationGenerator, PaperValidator
from researchpaperlib import Paper as LibPaper, Author as LibAuthor

# Initialize library components
doi_resolver = DOIResolver()
citation_generator = CitationGenerator()
paper_validator = PaperValidator()


def resolve_doi(doi: str) -> dict:
    """Resolve a DOI to paper metadata using DOIResolver.

    Args:
        doi: A valid DOI string.

    Returns:
        A dictionary with paper metadata fields.
    """
    paper = doi_resolver.resolve(doi)
    return {
        "title": paper.title,
        "authors": paper.authors_string(),
        "publication_year": paper.year,
        "doi": paper.doi,
        "keywords": ", ".join(paper.keywords) if paper.keywords else "",
        "abstract": paper.abstract or "",
        "journal": paper.journal or "",
    }


def generate_citation(paper_data: dict, format_type: str) -> str:
    """Generate a citation for a paper in the specified format.

    Args:
        paper_data: Dictionary with paper fields (title, authors, year, doi).
        format_type: One of 'apa', 'ieee', or 'bibtex'.

    Returns:
        The formatted citation text string.
    """
    authors_str = paper_data.get("authors", "")
    authors = []
    for name in authors_str.split(","):
        name = name.strip()
        if not name:
            continue
        parts = name.rsplit(" ", 1)
        if len(parts) == 2:
            authors.append(LibAuthor(first_name=parts[0], last_name=parts[1]))
        else:
            authors.append(LibAuthor(first_name="", last_name=parts[0]))

    paper = LibPaper(
        title=paper_data.get("title", ""),
        authors=authors,
        year=paper_data.get("publication_year"),
        doi=paper_data.get("doi"),
    )

    citation = citation_generator.generate(paper, format_type)
    return citation.text


def validate_paper_data(data: dict) -> dict:
    """Validate paper data using PaperValidator.

    Args:
        data: Dictionary with paper fields to validate.

    Returns:
        Dictionary with is_valid, errors, and sanitized_data.
    """
    result = paper_validator.validate(data)
    return {
        "is_valid": result.is_valid,
        "errors": result.errors,
        "sanitized_data": result.sanitized_data,
    }
