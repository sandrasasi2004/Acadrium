import os
import uuid
import shutil
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace_resource import WorkspaceResource

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "workspace")

ALLOWED_EXTENSIONS = {
    "pdf": {"category": "pdf", "file_type": "PDF", "default_mime": "application/pdf"},
    "ppt": {"category": "ppt", "file_type": "PPT", "default_mime": "application/vnd.ms-powerpoint"},
    "pptx": {"category": "ppt", "file_type": "PPT", "default_mime": "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
    "doc": {"category": "doc", "file_type": "DOC", "default_mime": "application/msword"},
    "docx": {"category": "doc", "file_type": "DOC", "default_mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    "png": {"category": "images", "file_type": "IMAGE", "default_mime": "image/png"},
    "jpg": {"category": "images", "file_type": "IMAGE", "default_mime": "image/jpeg"},
    "jpeg": {"category": "images", "file_type": "IMAGE", "default_mime": "image/jpeg"}
}

def ensure_workspace_directories():
    """Ensure workspace upload directories exist on disk."""
    subfolders = ["pdf", "ppt", "doc", "images"]
    for folder in subfolders:
        path = os.path.join(UPLOAD_DIR, folder)
        os.makedirs(path, exist_ok=True)

def upload_workspace_file(
    db: Session,
    file: UploadFile,
    title: str,
    description: Optional[str],
    tags: Optional[str],
    current_user: User
) -> WorkspaceResource:
    """Upload a private workspace file for the logged in user."""
    ensure_workspace_directories()

    original_filename = file.filename or "workspace_file"
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, PNG, JPG, JPEG."
        )

    config = ALLOWED_EXTENSIONS[ext]
    category = config["category"]
    file_type = config["file_type"]
    mime_type = file.content_type or config["default_mime"]

    unique_prefix = uuid.uuid4().hex[:12]
    safe_basename = "".join(c for c in original_filename if c.isalnum() or c in (".", "_", "-")).strip()
    stored_filename = f"{unique_prefix}_{safe_basename}"

    dest_dir = os.path.join(UPLOAD_DIR, category)
    os.makedirs(dest_dir, exist_ok=True)
    full_path = os.path.join(dest_dir, stored_filename)

    try:
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size_bytes = os.path.getsize(full_path)
    except Exception as e:
        if os.path.exists(full_path):
            os.remove(full_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )

    workspace_res = WorkspaceResource(
        title=title.strip(),
        description=description.strip() if description else None,
        tags=tags.strip() if tags else None,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_type=file_type,
        mime_type=mime_type,
        file_size=file_size_bytes,
        file_path=full_path,
        owner_id=current_user.id
    )

    db.add(workspace_res)
    db.commit()
    db.refresh(workspace_res)
    return workspace_res

def list_workspace_files(db: Session, current_user: User) -> List[WorkspaceResource]:
    """Get all private workspace files owned by current user."""
    return db.query(WorkspaceResource).filter(
        WorkspaceResource.owner_id == current_user.id
    ).order_by(WorkspaceResource.created_at.desc()).all()

def get_workspace_file(db: Session, file_id: str, current_user: User) -> WorkspaceResource:
    """Get single workspace file metadata after verifying owner authorization."""
    res = db.query(WorkspaceResource).filter(WorkspaceResource.id == file_id).first()
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace file not found."
        )

    if str(res.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this private workspace file."
        )

    return res

def get_workspace_file_for_download(db: Session, file_id: str, current_user: User) -> Tuple[WorkspaceResource, str]:
    """Verify ownership and return file for download."""
    res = get_workspace_file(db, file_id, current_user)
    if not os.path.exists(res.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on disk."
        )
    return res, res.file_path

def delete_workspace_file(db: Session, file_id: str, current_user: User) -> dict:
    """Delete a workspace file from PostgreSQL and disk (Owner only)."""
    res = get_workspace_file(db, file_id, current_user)

    if os.path.exists(res.file_path):
        try:
            os.remove(res.file_path)
        except Exception:
            pass

    db.delete(res)
    db.commit()
    return {"success": True, "message": "Workspace file deleted successfully."}
