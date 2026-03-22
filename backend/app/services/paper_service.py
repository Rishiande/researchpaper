"""Service layer for paper CRUD operations and search."""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from ..models import Paper
from ..schemas import PaperCreate, PaperUpdate


def get_all_papers(
    db: Session, skip: int = 0, limit: int = 50, status: Optional[str] = None
) -> List[Paper]:
    """Retrieve all papers with optional pagination and status filter."""
    query = db.query(Paper)
    if status:
        query = query.filter(Paper.reading_status == status)
    return query.order_by(Paper.created_at.desc()).offset(skip).limit(limit).all()


def get_paper(db: Session, paper_id: int) -> Optional[Paper]:
    """Retrieve a single paper by ID."""
    return db.query(Paper).filter(Paper.id == paper_id).first()


def create_paper(
    db: Session,
    paper_data: PaperCreate,
    pdf_key: str = None,
    pdf_filename: str = None,
) -> Paper:
    """Create a new paper record."""
    paper = Paper(
        title=paper_data.title,
        authors=paper_data.authors,
        publication_year=paper_data.publication_year,
        doi=paper_data.doi if paper_data.doi else None,
        keywords=paper_data.keywords,
        abstract=paper_data.abstract,
        reading_status=paper_data.reading_status,
        pdf_s3_key=pdf_key,
        pdf_filename=pdf_filename,
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)
    return paper


def update_paper(
    db: Session,
    paper_id: int,
    paper_data: PaperUpdate,
    pdf_key: str = None,
    pdf_filename: str = None,
) -> Optional[Paper]:
    """Update an existing paper record."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        return None

    update_dict = paper_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(paper, key, value)

    if pdf_key is not None:
        paper.pdf_s3_key = pdf_key
        paper.pdf_filename = pdf_filename

    db.commit()
    db.refresh(paper)
    return paper


def update_status(db: Session, paper_id: int, status: str) -> Optional[Paper]:
    """Update only the reading status of a paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        return None
    paper.reading_status = status
    db.commit()
    db.refresh(paper)
    return paper


def delete_paper(db: Session, paper_id: int) -> Optional[Paper]:
    """Delete a paper and its cascading notes."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        return None
    db.delete(paper)
    db.commit()
    return paper


def search_papers(db: Session, query: str) -> List[Paper]:
    """Search papers by title, authors, or keywords (case-insensitive)."""
    search_term = f"%{query}%"
    return (
        db.query(Paper)
        .filter(
            or_(
                Paper.title.ilike(search_term),
                Paper.authors.ilike(search_term),
                Paper.keywords.ilike(search_term),
            )
        )
        .order_by(Paper.created_at.desc())
        .all()
    )


def get_paper_stats(db: Session) -> dict:
    """Get paper count statistics by reading status."""
    total = db.query(Paper).count()
    not_started = (
        db.query(Paper).filter(Paper.reading_status == "not_started").count()
    )
    reading = db.query(Paper).filter(Paper.reading_status == "reading").count()
    completed = db.query(Paper).filter(Paper.reading_status == "completed").count()
    return {
        "total": total,
        "not_started": not_started,
        "reading": reading,
        "completed": completed,
    }
