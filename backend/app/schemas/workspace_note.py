from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class WorkspaceNoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Note Title")
    content: Optional[str] = Field(None, description="Note details or text content")

class WorkspaceNoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Note Title")
    content: Optional[str] = Field(None, description="Note details or text content")

class WorkspaceNoteResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = ""
    owner_id: str
    owner_name: Optional[str] = "User"
    created_at: Optional[str] = None
    date: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
