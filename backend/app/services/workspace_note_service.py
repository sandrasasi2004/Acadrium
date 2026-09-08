from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace_note import WorkspaceNote
from app.schemas.workspace_note import WorkspaceNoteCreate, WorkspaceNoteUpdate

from datetime import datetime, timezone

def create_note(db: Session, note_data: WorkspaceNoteCreate, current_user: User) -> WorkspaceNote:
    """Create a private workspace note for current user."""
    content_str = note_data.content.strip() if note_data.content else ""
    w_count = len(content_str.split())
    now_dt = datetime.now(timezone.utc)

    note = WorkspaceNote(
        title=note_data.title.strip(),
        content=content_str,
        owner_id=current_user.id,
        word_count=w_count,
        last_modified_at=now_dt
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    try:
        from app.services import timeline_service
        timeline_service.create_event(
            db=db,
            event_type="NOTE_CREATED",
            title=f"Note Created: {note.title}",
            entity_id=str(note.id),
            user_id=str(current_user.id),
            metadata_dict={"word_count": note.word_count}
        )
    except Exception as e:
        print(f"[Timeline Event Warning] Failed to log NOTE_CREATED event: {e}")

    return note

def list_notes(db: Session, current_user: User) -> List[WorkspaceNote]:
    """Get all private workspace notes owned by current user."""
    return db.query(WorkspaceNote).filter(
        WorkspaceNote.owner_id == current_user.id
    ).order_by(WorkspaceNote.created_at.desc()).all()

def get_note(db: Session, note_id: str, current_user: User) -> WorkspaceNote:
    """Get single note by ID after verifying owner authorization."""
    note = db.query(WorkspaceNote).filter(WorkspaceNote.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace note not found."
        )

    if str(note.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this private note."
        )

    return note

def update_note(db: Session, note_id: str, note_data: WorkspaceNoteUpdate, current_user: User) -> WorkspaceNote:
    """Update title or content of a private note (Owner only)."""
    note = get_note(db, note_id, current_user)

    if note_data.title is not None:
        note.title = note_data.title.strip()
    if note_data.content is not None:
        note.content = note_data.content.strip()

    note.word_count = len((note.content or "").split())
    note.last_modified_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(note)

    try:
        from app.services import timeline_service
        timeline_service.create_event(
            db=db,
            event_type="NOTE_UPDATED",
            title=f"Note Updated: {note.title}",
            entity_id=str(note.id),
            user_id=str(current_user.id),
            metadata_dict={"word_count": note.word_count}
        )
    except Exception as e:
        print(f"[Timeline Event Warning] Failed to log NOTE_UPDATED event: {e}")

    return note

def delete_note(db: Session, note_id: str, current_user: User) -> dict:
    """Delete a private note from PostgreSQL (Owner only)."""
    note = get_note(db, note_id, current_user)

    db.delete(note)
    db.commit()
    return {"success": True, "message": "Workspace note deleted successfully."}
