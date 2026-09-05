from typing import Optional, List
from pydantic import BaseModel, Field

class ResourceCreate(BaseModel):
    title: str
    classroom_id: str
    description: Optional[str] = None
    tags: Optional[str] = None

class ResourceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None
    original_filename: str
    stored_filename: str
    file_type: str
    type: str
    mime_type: str
    file_size: str
    size: str
    file_path: str
    classroom_id: str
    classroomId: str
    classroom_name: str
    classroomName: str
    uploaded_by: str
    uploader_name: str
    uploadedBy: str
    extraction_status: str
    created_at: Optional[str] = None
    uploadedDate: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class ResourceListResponse(BaseModel):
    success: bool = True
    data: List[ResourceResponse]

class ResourceDeleteResponse(BaseModel):
    success: bool = True
    message: str
