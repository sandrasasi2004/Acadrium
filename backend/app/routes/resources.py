from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user, require_faculty
from app.services import resource_service

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_classroom_resource(
    file: UploadFile = File(...),
    classroom_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    """Upload a resource file (Faculty only)."""
    resource = resource_service.upload_resource(
        db=db,
        file=file,
        classroom_id=classroom_id,
        title=title,
        description=description,
        tags=tags,
        current_user=current_user
    )
    return resource.to_dict()

@router.get("")
def list_user_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List resources accessible to current user (Role aware)."""
    resources = resource_service.list_user_resources(db, current_user)
    return [r.to_dict() for r in resources]

@router.get("/classroom/{classroom_id}")
def list_classroom_resources(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List resources belonging to a specific classroom."""
    resources = resource_service.list_classroom_resources(db, classroom_id, current_user)
    return [r.to_dict() for r in resources]

@router.get("/{resource_id}")
def get_resource_details(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get metadata for a specific resource."""
    resource = resource_service.get_resource_details(db, resource_id, current_user)
    return resource.to_dict()

@router.get("/{resource_id}/download")
def download_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download the actual physical resource file."""
    resource, file_path = resource_service.get_resource_file_for_download(db, resource_id, current_user)
    return FileResponse(
        path=file_path,
        media_type=resource.mime_type,
        filename=resource.original_filename,
        headers={"Content-Disposition": f'attachment; filename="{resource.original_filename}"'}
    )

@router.get("/{resource_id}/preview")
def preview_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview classroom resource file inline (Faculty owner or enrolled student)."""
    resource, file_path = resource_service.get_resource_file_for_download(db, resource_id, current_user)
    return FileResponse(
        path=file_path,
        media_type=resource.mime_type or "application/octet-stream",
        filename=resource.original_filename,
        headers={"Content-Disposition": f'inline; filename="{resource.original_filename}"'}
    )

@router.delete("/{resource_id}")
def delete_classroom_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    """Delete a resource file and database record (Faculty classroom owner only)."""
    return resource_service.delete_resource(db, resource_id, current_user)
