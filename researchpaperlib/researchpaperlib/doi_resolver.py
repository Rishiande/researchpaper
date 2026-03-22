"""DOI resolution module using the CrossRef API."""

import re
import httpx
from .models import Paper, Author
from .exceptions import DOINotFoundError, DOIFormatError, CrossRefAPIError


class DOIResolver:
    """Resolves DOI strings to paper metadata via CrossRef and DataCite APIs.

    This class provides methods to validate DOI format, fetch raw metadata,
    and resolve a DOI into a structured Paper object. Falls back to DataCite
    when CrossRef returns 404 (e.g. for arXiv DOIs).
    """

    CROSSREF_API_URL = "https://api.crossref.org/works"
    DATACITE_API_URL = "https://api.datacite.org/dois"
    DOI_PATTERN = re.compile(r"^10\.\d{4,9}/[-._;()/:A-Z0-9]+$", re.IGNORECASE)

    def __init__(self, timeout: int = 30):
        """Initialize the DOIResolver with a configurable timeout."""
        self._timeout = timeout

    def validate_doi(self, doi: str) -> bool:
        """Check if a DOI string matches the expected format.

        Args:
            doi: The DOI string to validate.

        Returns:
            True if the DOI format is valid, False otherwise.
        """
        if not doi or not isinstance(doi, str):
            return False
        doi = doi.strip()
        return bool(self.DOI_PATTERN.match(doi))

    def fetch_metadata(self, doi: str) -> dict:
        """Fetch raw metadata for a given DOI from CrossRef, falling back to DataCite.

        Args:
            doi: A valid DOI string.

        Returns:
            A dictionary with keys 'source' ('crossref' or 'datacite') and 'data'.

        Raises:
            DOIFormatError: If the DOI format is invalid.
            DOINotFoundError: If the DOI is not found in any registry.
            CrossRefAPIError: If all API requests fail.
        """
        if not self.validate_doi(doi):
            raise DOIFormatError(doi)

        doi = doi.strip()
        headers = {
            "Accept": "application/json",
            "User-Agent": "ResearchPaperLib/1.0 (mailto:research@example.com)",
        }

        # Try CrossRef first
        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(f"{self.CROSSREF_API_URL}/{doi}", headers=headers)

            if response.status_code == 200:
                data = response.json()
                return {"source": "crossref", "data": data.get("message", {})}
        except (httpx.TimeoutException, httpx.RequestError):
            pass  # fall through to DataCite

        # Fallback to DataCite (handles arXiv, Zenodo, etc.)
        try:
            with httpx.Client(timeout=self._timeout) as client:
                response = client.get(f"{self.DATACITE_API_URL}/{doi}", headers=headers)

            if response.status_code == 200:
                data = response.json()
                return {"source": "datacite", "data": data.get("data", {}).get("attributes", {})}
            elif response.status_code == 404:
                raise DOINotFoundError(doi)
            else:
                raise CrossRefAPIError(response.status_code)
        except (httpx.TimeoutException, httpx.RequestError) as e:
            raise CrossRefAPIError(500, f"Network error: {str(e)}")

    def resolve(self, doi: str) -> Paper:
        """Resolve a DOI to a Paper object with full metadata.

        Args:
            doi: A valid DOI string.

        Returns:
            A Paper object populated with metadata from CrossRef or DataCite.
        """
        result = self.fetch_metadata(doi)
        if result["source"] == "datacite":
            return self._parse_datacite(result["data"], doi)
        return self._parse_crossref(result["data"], doi)

    def _parse_datacite(self, metadata: dict, doi: str) -> Paper:
        """Parse DataCite API response into a Paper model."""
        # Parse authors
        authors = []
        for creator in metadata.get("creators", []):
            name = creator.get("name", "")
            given = creator.get("givenName", "")
            family = creator.get("familyName", "")
            if given and family:
                authors.append(Author(first_name=given, last_name=family))
            elif name:
                parts = name.split(", ", 1)
                if len(parts) == 2:
                    authors.append(Author(first_name=parts[1], last_name=parts[0]))
                else:
                    authors.append(Author(first_name="", last_name=name))

        # Title
        titles = metadata.get("titles", [])
        title = titles[0].get("title", "Unknown Title") if titles else "Unknown Title"

        # Year
        year = metadata.get("publicationYear")

        # Publisher / container
        publisher = metadata.get("publisher")
        container = metadata.get("container", {})
        journal = container.get("title") if container else None

        # Subjects as keywords
        subjects = metadata.get("subjects", [])
        keywords = [s.get("subject", "") for s in subjects if s.get("subject")]

        # Abstract from descriptions
        abstract = None
        for desc in metadata.get("descriptions", []):
            if desc.get("descriptionType") == "Abstract":
                abstract = re.sub(r"<[^>]+>", "", desc.get("description", "")).strip()
                break

        return Paper(
            title=title,
            authors=authors,
            year=year,
            doi=doi.strip(),
            journal=journal,
            volume=None,
            issue=None,
            pages=None,
            publisher=publisher,
            keywords=keywords,
            abstract=abstract,
            url=f"https://doi.org/{doi.strip()}",
        )

    def _parse_crossref(self, metadata: dict, doi: str) -> Paper:
        """Parse CrossRef API response into a Paper model."""
        # Parse authors
        authors = []
        for author_data in metadata.get("author", []):
            authors.append(
                Author(
                    first_name=author_data.get("given", ""),
                    last_name=author_data.get("family", ""),
                    affiliation=(
                        author_data.get("affiliation", [{}])[0].get("name")
                        if author_data.get("affiliation")
                        else None
                    ),
                )
            )

        # Parse title
        title_list = metadata.get("title", [])
        title = title_list[0] if title_list else "Unknown Title"

        # Parse year from various date fields (issued is most common)
        year = None
        for date_field in ("issued", "published-print", "published-online", "created"):
            date_parts = metadata.get(date_field, {})
            if date_parts and "date-parts" in date_parts:
                parts = date_parts["date-parts"]
                if parts and parts[0] and parts[0][0]:
                    year = parts[0][0]
                    break

        # Parse journal
        container = metadata.get("container-title", [])
        journal = container[0] if container else None

        # Parse other fields
        volume = metadata.get("volume")
        issue = metadata.get("issue")
        pages = metadata.get("page")
        publisher = metadata.get("publisher")
        keywords = metadata.get("subject", [])

        # Parse abstract and strip HTML tags
        abstract = metadata.get("abstract", None)
        if abstract:
            abstract = re.sub(r"<[^>]+>", "", abstract).strip()

        return Paper(
            title=title,
            authors=authors,
            year=year,
            doi=doi.strip(),
            journal=journal,
            volume=volume,
            issue=issue,
            pages=pages,
            publisher=publisher,
            keywords=keywords,
            abstract=abstract,
            url=f"https://doi.org/{doi.strip()}",
        )
