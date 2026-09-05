from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.workspace_note import WorkspaceNoteCreate, WorkspaceNoteUpdate
from app.services import workspace_note_service

router = APIRouter(prefix="/workspace/notes", tags=["Workspace Notes"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_workspace_note(
    note_data: WorkspaceNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a private workspace note for current user."""
    note = workspace_note_service.create_note(db, note_data, current_user)
    return note.to_dict()

@router.get("")
def list_workspace_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all private workspace notes belonging to current user."""
    notes = workspace_note_service.list_notes(db, current_user)
    return [n.to_dict() for n in notes]

@router.get("/{id}")
def get_workspace_note_details(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single private note details (Owner only)."""
    note = workspace_note_service.get_note(db, id, current_user)
    return note.to_dict()

@router.put("/{id}")
def update_workspace_note(
    id: str,
    note_data: WorkspaceNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update title or content of a private note (Owner only)."""
    note = workspace_note_service.update_note(db, id, note_data, current_user)
    return note.to_dict()

@router.delete("/{id}")
def delete_workspace_note(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a private note (Owner only)."""
    return workspace_note_service.delete_note(db, id, current_user)
