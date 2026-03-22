# researchpaperlib

A Python library for research paper management providing DOI resolution, citation generation, and paper data validation.

## Features

- **DOIResolver** — Resolve DOIs to full paper metadata via the CrossRef API
- **CitationGenerator** — Generate APA, IEEE, and BibTeX formatted citations
- **PaperValidator** — Validate paper data and sanitize inputs

## Installation

```bash
pip install researchpaperlib
```

## Usage

```python
from researchpaperlib import DOIResolver, CitationGenerator, PaperValidator

# Resolve a DOI
resolver = DOIResolver()
paper = resolver.resolve("10.1145/3292500.3330648")
print(paper.title, paper.authors_string(), paper.year)

# Generate a citation
generator = CitationGenerator()
citation = generator.to_ieee(paper)
print(citation.text)

# Validate paper data
validator = PaperValidator()
result = validator.validate({"title": "My Paper", "authors": "John Doe"})
print(result.is_valid)
```
