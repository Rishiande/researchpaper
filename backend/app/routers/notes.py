"""Notes CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Note, Paper
from ..schemas import NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()


@router.get("/papers/{paper_id}/notes", response_model=list[NoteResponse])
def get_notes(paper_id: int, db: Session = Depends(get_db)):
    """Get all notes for a specific paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    notes = (
        db.query(Note)
        .filter(Note.paper_id == paper_id)
        .order_by(Note.created_at.desc())
        .all()
    )
    return notes


@router.post("/papers/{paper_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(paper_id: int, note_data: NoteCreate, db: Session = Depends(get_db)):
    """Add a new note to a paper."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    note = Note(paper_id=paper_id, content=note_data.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    """Update an existing note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    note.content = note_data.content
    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    """Delete a note."""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return None
