import os
import uuid
import shutil
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember
from app.models.resource import Resource

# Base upload directory relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "resources")

# File format configuration
ALLOWED_EXTENSIONS = {
    "pdf": {"category": "pdf", "file_type": "PDF", "default_mime": "application/pdf"},
    "ppt": {"category": "ppt", "file_type": "PPT", "default_mime": "application/vnd.ms-powerpoint"},
    "pptx": {"category": "ppt", "file_type": "PPT", "default_mime": "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
    "doc": {"category": "doc", "file_type": "DOCX", "default_mime": "application/msword"},
    "docx": {"category": "doc", "file_type": "DOCX", "default_mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    "txt": {"category": "doc", "file_type": "TXT", "default_mime": "text/plain"},
    "png": {"category": "images", "file_type": "IMAGE", "default_mime": "image/png"},
    "jpg": {"category": "images", "file_type": "IMAGE", "default_mime": "image/jpeg"},
    "jpeg": {"category": "images", "file_type": "IMAGE", "default_mime": "image/jpeg"},
    "webp": {"category": "images", "file_type": "IMAGE", "default_mime": "image/webp"}
}

def ensure_storage_directories():
    """Ensure upload subdirectories exist on disk."""
    subfolders = ["pdf", "ppt", "doc", "images"]
    for folder in subfolders:
        path = os.path.join(UPLOAD_DIR, folder)
        os.makedirs(path, exist_ok=True)

def format_file_size(size_in_bytes: int) -> str:
    """Format file size in KB or MB string."""
    if size_in_bytes >= 1024 * 1024:
        return f"{size_in_bytes / (1024 * 1024):.1f} MB"
    elif size_in_bytes >= 1024:
        return f"{size_in_bytes / 1024:.0f} KB"
    else:
        return f"{size_in_bytes} B"

def upload_resource(
    db: Session,
    file: UploadFile,
    classroom_id: str,
    title: str,
    description: Optional[str],
    tags: Optional[str],
    current_user: User
) -> Resource:
    """Upload a resource file to disk and record metadata in PostgreSQL (Faculty owner only)."""
    ensure_storage_directories()

    # 1. Enforce Faculty role check
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only faculty members can upload resources."
        )

    # 2. Verify Classroom existence and Faculty ownership
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target classroom does not exist."
        )
    
    if str(classroom.faculty_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only upload resources to your own classrooms."
        )

    # 3. Validate File Extension
    original_filename = file.filename or "uploaded_file"
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

    # 4. Generate unique stored filename and physical path
    unique_prefix = uuid.uuid4().hex[:12]
    safe_basename = "".join(c for c in original_filename if c.isalnum() or c in (".", "_", "-")).strip()
    stored_filename = f"{unique_prefix}_{safe_basename}"
    
    dest_dir = os.path.join(UPLOAD_DIR, category)
    os.makedirs(dest_dir, exist_ok=True)
    full_path = os.path.join(dest_dir, stored_filename)

    # 5. Save file physically to disk and compute size
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

    size_str = format_file_size(file_size_bytes)

    # 6. Save metadata record in PostgreSQL database
    resource = Resource(
        title=title.strip(),
        description=description.strip() if description else None,
        tags=tags.strip() if tags else None,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_type=file_type,
        mime_type=mime_type,
        file_size=size_str,
        file_path=full_path,
        classroom_id=classroom.id,
        uploaded_by=current_user.id,
        uploaded_by_name=current_user.full_name,
        classroom_name=classroom.name,
        extraction_status="PENDING"
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    # 7. Log RESOURCE_UPLOADED timeline event
    try:
        from app.services import timeline_service
        timeline_service.create_event(
            db=db,
            event_type="RESOURCE_UPLOADED",
            title=f"Resource Uploaded: {resource.title}",
            description=resource.description,
            entity_id=str(resource.id),
            classroom_id=str(classroom.id),
            user_id=str(current_user.id),
            metadata_dict={
                "filename": resource.original_filename,
                "file_type": resource.file_type,
                "file_size": resource.file_size
            }
        )
    except Exception as e:
        print(f"[Timeline Event Warning] Failed to log RESOURCE_UPLOADED event: {e}")

    return resource

def list_user_resources(db: Session, current_user: User) -> List[Resource]:
    """Get all resources accessible to current user based on role."""
    if current_user.role == "faculty":
        # Resources belonging to classrooms created by this faculty
        faculty_classroom_ids = [c.id for c in db.query(Classroom.id).filter(Classroom.faculty_id == current_user.id).all()]
        if not faculty_classroom_ids:
            return []
        return db.query(Resource).filter(Resource.classroom_id.in_(faculty_classroom_ids)).order_by(Resource.created_at.desc()).all()
    else:
        # Resources belonging to classrooms joined by this student
        enrolled_classroom_ids = [m.classroom_id for m in db.query(ClassroomMember.classroom_id).filter(ClassroomMember.student_id == current_user.id).all()]
        if not enrolled_classroom_ids:
            return []
        return db.query(Resource).filter(Resource.classroom_id.in_(enrolled_classroom_ids)).order_by(Resource.created_at.desc()).all()

def list_classroom_resources(db: Session, classroom_id: str, current_user: User) -> List[Resource]:
    """Get resources for a specific classroom after verifying user access."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found."
        )

    # Check access permission
    if current_user.role == "faculty":
        if str(classroom.faculty_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this classroom."
            )
    else:
        is_enrolled = db.query(ClassroomMember).filter(
            ClassroomMember.classroom_id == classroom_id,
            ClassroomMember.student_id == current_user.id
        ).first()
        if not is_enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You must be enrolled in this classroom to view its resources."
            )

    return db.query(Resource).filter(Resource.classroom_id == classroom_id).order_by(Resource.created_at.desc()).all()

def get_resource_details(db: Session, resource_id: str, current_user: User) -> Resource:
    """Get single resource metadata after verifying access."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found."
        )

    # Verify access to classroom
    list_classroom_resources(db, str(resource.classroom_id), current_user)
    return resource

def get_resource_file_for_download(db: Session, resource_id: str, current_user: User) -> Tuple[Resource, str]:
    """Verify permissions and return (resource, physical_file_path) for download."""
    resource = get_resource_details(db, resource_id, current_user)
    
    if not os.path.exists(resource.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on server disk."
        )

    return resource, resource.file_path

def delete_resource(db: Session, resource_id: str, current_user: User) -> dict:
    """Delete a resource record and physical file (Faculty classroom owner only)."""
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only faculty members can delete resources."
        )

    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found."
        )

    # Verify classroom ownership
    classroom = db.query(Classroom).filter(Classroom.id == resource.classroom_id).first()
    if not classroom or str(classroom.faculty_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only delete resources in your own classrooms."
        )

    # Remove physical file on disk
    if os.path.exists(resource.file_path):
        try:
            os.remove(resource.file_path)
        except Exception as e:
            pass  # Continue to delete DB record even if file deletion has minor OS issue

    db.delete(resource)
    db.commit()
    return {"success": True, "message": "Resource deleted successfully."}
