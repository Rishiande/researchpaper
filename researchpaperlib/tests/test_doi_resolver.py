"""Unit tests for the DOIResolver class (mocked HTTP calls)."""

import pytest
from unittest.mock import patch, MagicMock
from researchpaperlib.doi_resolver import DOIResolver
from researchpaperlib.exceptions import DOIFormatError, DOINotFoundError, CrossRefAPIError


@pytest.fixture
def resolver():
    return DOIResolver(timeout=5)


# ── validate_doi Tests ─────────────────────────────────────

class TestValidateDOI:
    def test_valid_doi(self, resolver):
        assert resolver.validate_doi("10.1234/test.123") is True

    def test_valid_doi_with_slash(self, resolver):
        assert resolver.validate_doi("10.1000/xyz123") is True

    def test_valid_doi_complex(self, resolver):
        assert resolver.validate_doi("10.1038/nature12373") is True

    def test_invalid_doi_no_prefix(self, resolver):
        assert resolver.validate_doi("not-a-doi") is False

    def test_invalid_doi_empty(self, resolver):
        assert resolver.validate_doi("") is False

    def test_invalid_doi_none(self, resolver):
        assert resolver.validate_doi(None) is False

    def test_invalid_doi_wrong_prefix(self, resolver):
        assert resolver.validate_doi("11.1234/test") is False

    def test_doi_with_whitespace(self, resolver):
        assert resolver.validate_doi("  10.1234/test  ") is True


# ── fetch_metadata Tests (mocked) ─────────────────────────

class TestFetchMetadata:
    def test_invalid_doi_raises(self, resolver):
        with pytest.raises(DOIFormatError):
            resolver.fetch_metadata("bad-doi")

    @patch("researchpaperlib.doi_resolver.httpx.Client")
    def test_crossref_success(self, mock_client_cls, resolver):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": {"title": ["Test Paper"]}}

        mock_client = MagicMock()
        mock_client.get.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = resolver.fetch_metadata("10.1234/test")
        assert result["source"] == "crossref"
        assert result["data"]["title"] == ["Test Paper"]

    @patch("researchpaperlib.doi_resolver.httpx.Client")
    def test_datacite_fallback_on_crossref_timeout(self, mock_client_cls, resolver):
        import httpx

        # First call (CrossRef) raises timeout, second call (DataCite) succeeds
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)

        datacite_response = MagicMock()
        datacite_response.status_code = 200
        datacite_response.json.return_value = {
            "data": {"attributes": {"titles": [{"title": "DataCite Paper"}]}}
        }

        mock_client.get.side_effect = [
            httpx.TimeoutException("timeout"),
            datacite_response,
        ]
        mock_client_cls.return_value = mock_client

        result = resolver.fetch_metadata("10.1234/test")
        assert result["source"] == "datacite"

    @patch("researchpaperlib.doi_resolver.httpx.Client")
    def test_not_found_raises(self, mock_client_cls, resolver):
        import httpx

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)

        crossref_timeout = httpx.TimeoutException("timeout")
        datacite_404 = MagicMock()
        datacite_404.status_code = 404

        mock_client.get.side_effect = [crossref_timeout, datacite_404]
        mock_client_cls.return_value = mock_client

        with pytest.raises(DOINotFoundError):
            resolver.fetch_metadata("10.1234/nonexistent")


# ── resolve Tests (mocked) ────────────────────────────────

class TestResolve:
    @patch("researchpaperlib.doi_resolver.httpx.Client")
    def test_resolve_crossref_paper(self, mock_client_cls, resolver):
        crossref_data = {
            "message": {
                "title": ["Neural Networks"],
                "author": [
                    {"given": "Alex", "family": "Net", "affiliation": []},
                ],
                "issued": {"date-parts": [[2023]]},
                "container-title": ["AI Journal"],
                "volume": "10",
                "issue": "2",
                "page": "50-75",
                "publisher": "Elsevier",
                "subject": ["Computer Science"],
            }
        }

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = crossref_data

        mock_client = MagicMock()
        mock_client.get.return_value = mock_response
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client_cls.return_value = mock_client

        paper = resolver.resolve("10.1234/nn.2023")
        assert paper.title == "Neural Networks"
        assert len(paper.authors) == 1
        assert paper.authors[0].first_name == "Alex"
        assert paper.authors[0].last_name == "Net"
        assert paper.year == 2023
        assert paper.journal == "AI Journal"
        assert paper.volume == "10"
        assert paper.pages == "50-75"
        assert paper.doi == "10.1234/nn.2023"
        assert paper.url == "https://doi.org/10.1234/nn.2023"

    @patch("researchpaperlib.doi_resolver.httpx.Client")
    def test_resolve_datacite_paper(self, mock_client_cls, resolver):
        import httpx

        datacite_data = {
            "data": {
                "attributes": {
                    "titles": [{"title": "DataCite Paper"}],
                    "creators": [
                        {"givenName": "Bob", "familyName": "Builder"},
                    ],
                    "publicationYear": 2021,
                    "publisher": "Zenodo",
                    "subjects": [{"subject": "Engineering"}],
                }
            }
        }

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)

        datacite_response = MagicMock()
        datacite_response.status_code = 200
        datacite_response.json.return_value = datacite_data

        mock_client.get.side_effect = [
            httpx.TimeoutException("timeout"),
            datacite_response,
        ]
        mock_client_cls.return_value = mock_client

        paper = resolver.resolve("10.5281/zenodo.123")
        assert paper.title == "DataCite Paper"
        assert paper.authors[0].first_name == "Bob"
        assert paper.year == 2021
        assert paper.publisher == "Zenodo"
