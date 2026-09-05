import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator

class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str

class AnnouncementCreate(AnnouncementBase):
    classroom_id: str

    @field_validator('classroom_id')
    def validate_uuid(cls, v):
        try:
            uuid.UUID(str(v))
            return str(v)
        except ValueError:
            raise ValueError('Invalid UUID format for classroom_id')

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    content: str
    classroom_id: str
    classroomId: Optional[str] = None
    classroom_name: Optional[str] = "General"
    classroomName: Optional[str] = "General"
    posted_by: str
    postedBy: Optional[str] = None
    author_name: Optional[str] = "Faculty User"
    author: Optional[str] = "Faculty User"
    created_at: Optional[datetime] = None
    date: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AnnouncementDeleteResponse(BaseModel):
    message: str
