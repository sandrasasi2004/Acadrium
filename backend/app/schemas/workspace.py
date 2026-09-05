from typing import Optional, List, Union
from pydantic import BaseModel, Field

class WorkspaceResourceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None

class WorkspaceResourceResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None
    original_filename: str
    stored_filename: str
    file_type: str
    type: str
    mime_type: str
    file_size: Union[int, str]
    size: Union[int, str]
    file_path: str
    owner_id: str
    owner_name: str
    created_at: Optional[str] = None
    uploadedDate: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class WorkspaceResourceListResponse(BaseModel):
    success: bool = True
    data: List[WorkspaceResourceResponse]

class WorkspaceResourceDeleteResponse(BaseModel):
    success: bool = True
    message: str
