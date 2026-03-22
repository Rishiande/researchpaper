"""Citation generation module supporting APA, IEEE, and BibTeX formats."""

from typing import List
from .models import Paper, Author, Citation


class CitationGenerator:
    """Generates formatted academic citations from Paper objects.

    Supports APA 7th edition, IEEE, and BibTeX citation formats.
    """

    def to_apa(self, paper: Paper) -> Citation:
        """Generate an APA 7th edition citation.

        Args:
            paper: A Paper object with metadata.

        Returns:
            A Citation object with the formatted APA text.
        """
        authors_str = self._format_apa_authors(paper.authors)
        year_str = f"({paper.year})" if paper.year else "(n.d.)"
        title = paper.title

        source = ""
        if paper.journal:
            source = f" *{paper.journal}*"
            if paper.volume:
                source += f", *{paper.volume}*"
            if paper.issue:
                source += f"({paper.issue})"
            if paper.pages:
                source += f", {paper.pages}"

        doi_str = f" https://doi.org/{paper.doi}" if paper.doi else ""

        text = f"{authors_str} {year_str}. {title}.{source}.{doi_str}"

        return Citation(
            text=text.strip(),
            format_type="APA",
            paper_title=paper.title,
        )

    def to_ieee(self, paper: Paper) -> Citation:
        """Generate an IEEE citation.

        Args:
            paper: A Paper object with metadata.

        Returns:
            A Citation object with the formatted IEEE text.
        """
        authors_str = self._format_ieee_authors(paper.authors)
        title = f'"{paper.title},"'

        source = ""
        if paper.journal:
            source = f" *{paper.journal}*"
            if paper.volume:
                source += f", vol. {paper.volume}"
            if paper.issue:
                source += f", no. {paper.issue}"
            if paper.pages:
                source += f", pp. {paper.pages}"

        year_str = f" {paper.year}" if paper.year else ""
        doi_str = f", doi: {paper.doi}" if paper.doi else ""

        text = f"{authors_str}, {title}{source},{year_str}{doi_str}."

        return Citation(
            text=text.strip(),
            format_type="IEEE",
            paper_title=paper.title,
        )

    def to_bibtex(self, paper: Paper) -> Citation:
        """Generate a BibTeX citation entry.

        Args:
            paper: A Paper object with metadata.

        Returns:
            A Citation object with the formatted BibTeX text.
        """
        first_author = (
            paper.authors[0].last_name.lower() if paper.authors else "unknown"
        )
        year = paper.year if paper.year else "0000"
        title_word = paper.title.split()[0].lower() if paper.title else "untitled"
        key = f"{first_author}{year}{title_word}"

        lines = [f"@article{{{key},"]

        if paper.authors:
            authors_str = " and ".join(
                f"{a.last_name}, {a.first_name}" for a in paper.authors
            )
            lines.append(f"  author = {{{authors_str}}},")

        lines.append(f"  title = {{{paper.title}}},")

        if paper.journal:
            lines.append(f"  journal = {{{paper.journal}}},")
        if paper.volume:
            lines.append(f"  volume = {{{paper.volume}}},")
        if paper.issue:
            lines.append(f"  number = {{{paper.issue}}},")
        if paper.pages:
            lines.append(f"  pages = {{{paper.pages}}},")
        if paper.year:
            lines.append(f"  year = {{{paper.year}}},")
        if paper.doi:
            lines.append(f"  doi = {{{paper.doi}}},")
        if paper.publisher:
            lines.append(f"  publisher = {{{paper.publisher}}},")

        lines.append("}")

        text = "\n".join(lines)

        return Citation(
            text=text,
            format_type="BibTeX",
            paper_title=paper.title,
        )

    def generate(self, paper: Paper, format_type: str = "apa") -> Citation:
        """Generate a citation in the specified format.

        Args:
            paper: A Paper object with metadata.
            format_type: One of 'apa', 'ieee', or 'bibtex'.

        Returns:
            A Citation object with the formatted text.

        Raises:
            ValueError: If the format type is not supported.
        """
        format_type = format_type.lower().strip()
        generators = {
            "apa": self.to_apa,
            "ieee": self.to_ieee,
            "bibtex": self.to_bibtex,
        }

        if format_type not in generators:
            raise ValueError(
                f"Unsupported citation format: '{format_type}'. "
                f"Supported: {list(generators.keys())}"
            )

        return generators[format_type](paper)

    def _format_apa_authors(self, authors: List[Author]) -> str:
        """Format authors in APA style (LastName, F.)."""
        if not authors:
            return "Unknown Author"

        if len(authors) == 1:
            a = authors[0]
            return (
                f"{a.last_name}, {a.first_name[0]}." if a.first_name else a.last_name
            )

        if len(authors) == 2:
            parts = []
            for a in authors:
                name = (
                    f"{a.last_name}, {a.first_name[0]}."
                    if a.first_name
                    else a.last_name
                )
                parts.append(name)
            return f"{parts[0]}, & {parts[1]}"

        # 3+ authors
        parts = []
        for a in authors[:-1]:
            name = (
                f"{a.last_name}, {a.first_name[0]}." if a.first_name else a.last_name
            )
            parts.append(name)
        last = authors[-1]
        last_name = (
            f"{last.last_name}, {last.first_name[0]}."
            if last.first_name
            else last.last_name
        )
        return f"{', '.join(parts)}, & {last_name}"

    def _format_ieee_authors(self, authors: List[Author]) -> str:
        """Format authors in IEEE style (F. LastName)."""
        if not authors:
            return "Unknown Author"

        parts = []
        for a in authors:
            if a.first_name:
                parts.append(f"{a.first_name[0]}. {a.last_name}")
            else:
                parts.append(a.last_name)

        if len(parts) == 1:
            return parts[0]
        elif len(parts) == 2:
            return f"{parts[0]} and {parts[1]}"
        else:
            return ", ".join(parts[:-1]) + f", and {parts[-1]}"
