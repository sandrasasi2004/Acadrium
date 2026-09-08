from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services import workspace_service
from app.services.document_processor import process_workspace_resource

router = APIRouter(prefix="/workspace", tags=["Workspace"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_workspace_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a private workspace file. Background extraction starts asynchronously."""
    res = workspace_service.upload_workspace_file(
        db=db,
        file=file,
        title=title,
        description=description,
        tags=tags,
        current_user=current_user
    )
    background_tasks.add_task(process_workspace_resource, str(res.id))
    return res.to_dict()

@router.get("")
def list_workspace_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List private workspace files belonging to current user only."""
    files = workspace_service.list_workspace_files(db, current_user)
    return [f.to_dict() for f in files]

@router.get("/{id}")
def get_workspace_file_details(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get metadata for a private workspace file (Owner only)."""
    res = workspace_service.get_workspace_file(db, id, current_user)
    return res.to_dict()

@router.get("/{id}/extraction-status")
def get_workspace_extraction_status(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get extraction status for private workspace file (Owner only)."""
    res = workspace_service.get_workspace_file(db, id, current_user)
    return {"status": res.extraction_status}

@router.get("/{id}/download")
def download_workspace_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download private workspace file (Owner only)."""
    res, file_path = workspace_service.get_workspace_file_for_download(db, id, current_user)
    return FileResponse(
        path=file_path,
        media_type=res.mime_type,
        filename=res.original_filename,
        headers={"Content-Disposition": f'attachment; filename="{res.original_filename}"'}
    )

@router.get("/{id}/preview")
def preview_workspace_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview private workspace file inline (Owner only)."""
    res, file_path = workspace_service.get_workspace_file_for_download(db, id, current_user)
    return FileResponse(
        path=file_path,
        media_type=res.mime_type or "application/octet-stream",
        filename=res.original_filename,
        headers={"Content-Disposition": f'inline; filename="{res.original_filename}"'}
    )

@router.delete("/{id}")
def delete_workspace_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a private workspace file (Owner only)."""
    return workspace_service.delete_workspace_file(db, id, current_user)
