"""Paper CRUD, search, DOI resolution, citation, and download endpoints."""

import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import (
    PaperCreate,
    PaperUpdate,
    PaperResponse,
    StatusUpdate,
    DOIRequest,
    CitationResponse,
)
from ..services import paper_service, doi_service
from ..services.storage_service import storage_service

router = APIRouter()


@router.get("/papers", response_model=list[PaperResponse])
def get_papers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all papers with optional status filter and pagination."""
    return paper_service.get_all_papers(db, skip=skip, limit=limit, status=status)


@router.get("/papers/search", response_model=list[PaperResponse])
def search_papers(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Search papers by keyword, author, or title."""
    return paper_service.search_papers(db, q)


@router.get("/papers/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get paper counts by reading status."""
    return paper_service.get_paper_stats(db)


@router.get("/papers/{paper_id}", response_model=PaperResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    """Get a single paper by ID."""
    paper = paper_service.get_paper(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.post("/papers", response_model=PaperResponse, status_code=201)
def create_paper(
    title: str = Form(...),
    authors: str = Form(...),
    publication_year: Optional[int] = Form(None),
    doi: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    abstract: Optional[str] = Form(None),
    reading_status: str = Form("not_started"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Create a new paper with optional PDF upload."""
    # Validate using custom library
    validation = doi_service.validate_paper_data(
        {
            "title": title,
            "authors": authors,
            "publication_year": publication_year,
            "doi": doi,
            "reading_status": reading_status,
        }
    )
    if not validation["is_valid"]:
        raise HTTPException(status_code=422, detail=validation["errors"])

    sanitized = validation["sanitized_data"]

    # Handle file upload
    pdf_key = None
    pdf_filename = None
    if file and file.filename:
        pdf_key, pdf_filename = storage_service.upload_file(file)

    paper_data = PaperCreate(
        title=sanitized.get("title", title),
        authors=sanitized.get("authors", authors),
        publication_year=publication_year,
        doi=sanitized.get("doi", doi) or None,
        keywords=keywords,
        abstract=abstract,
        reading_status=reading_status,
    )

    return paper_service.create_paper(db, paper_data, pdf_key, pdf_filename)


@router.put("/papers/{paper_id}", response_model=PaperResponse)
def update_paper(
    paper_id: int,
    title: Optional[str] = Form(None),
    authors: Optional[str] = Form(None),
    publication_year: Optional[int] = Form(None),
    doi: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    abstract: Optional[str] = Form(None),
    reading_status: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Update an existing paper with optional PDF replacement."""
    existing = paper_service.get_paper(db, paper_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Handle file upload / replacement
    pdf_key = None
    pdf_filename = None
    if file and file.filename:
        if existing.pdf_s3_key:
            storage_service.delete_file(existing.pdf_s3_key)
        pdf_key, pdf_filename = storage_service.upload_file(file)

    update_data = PaperUpdate(
        title=title,
        authors=authors,
        publication_year=publication_year,
        doi=doi,
        keywords=keywords,
        abstract=abstract,
        reading_status=reading_status,
    )

    paper = paper_service.update_paper(db, paper_id, update_data, pdf_key, pdf_filename)
    return paper


@router.patch("/papers/{paper_id}/status", response_model=PaperResponse)
def update_reading_status(
    paper_id: int, status_data: StatusUpdate, db: Session = Depends(get_db)
):
    """Update only the reading status of a paper."""
    paper = paper_service.update_status(db, paper_id, status_data.reading_status)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.delete("/papers/{paper_id}", status_code=204)
def delete_paper(paper_id: int, db: Session = Depends(get_db)):
    """Delete a paper, its PDF file, and all associated notes."""
    paper = paper_service.get_paper(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if paper.pdf_s3_key:
        storage_service.delete_file(paper.pdf_s3_key)

    paper_service.delete_paper(db, paper_id)
    return None


@router.post("/papers/resolve-doi")
def resolve_doi(doi_request: DOIRequest):
    """Resolve a DOI to paper metadata using the custom library."""
    try:
        metadata = doi_service.resolve_doi(doi_request.doi)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/papers/{paper_id}/citation", response_model=CitationResponse)
def get_citation(
    paper_id: int,
    format: str = Query("apa", pattern="^(apa|ieee|bibtex)$"),
    db: Session = Depends(get_db),
):
    """Generate a citation for a paper in APA, IEEE, or BibTeX format."""
    paper = paper_service.get_paper(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    paper_dict = {
        "title": paper.title,
        "authors": paper.authors,
        "publication_year": paper.publication_year,
        "doi": paper.doi,
    }

    citation_text = doi_service.generate_citation(paper_dict, format)
    return CitationResponse(citation=citation_text, format=format)


@router.get("/papers/{paper_id}/download")
def download_paper(paper_id: int, db: Session = Depends(get_db)):
    """Download the PDF file attached to a paper."""
    paper = paper_service.get_paper(db, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if not paper.pdf_s3_key:
        raise HTTPException(status_code=404, detail="No PDF file attached to this paper")

    file_path = storage_service.get_file_path(paper.pdf_s3_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server")

    return FileResponse(
        path=file_path,
        filename=paper.pdf_filename or "paper.pdf",
        media_type="application/pdf",
    )
