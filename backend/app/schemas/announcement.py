import uuid
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

class AnnouncementBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: str
    announcement_type: Optional[str] = Field("GENERAL", description="Allowed: GENERAL, ACADEMIC, EXAM, ASSIGNMENT, NOTICE, EVENT")
    academic_date: Optional[date] = None

    @field_validator('academic_date', mode='before')
    @classmethod
    def validate_academic_date(cls, v: Any) -> Optional[date]:
        if v is None or v == "":
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return None
            try:
                return datetime.strptime(v_str, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("academic_date must be a valid date in YYYY-MM-DD format")
        raise ValueError("Invalid date format for academic_date")

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
    announcement_type: Optional[str] = None
    academic_date: Optional[date] = None

    @field_validator('academic_date', mode='before')
    @classmethod
    def validate_academic_date(cls, v: Any) -> Optional[date]:
        if v is None or v == "":
            return None
        if isinstance(v, date):
            return v
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return None
            try:
                return datetime.strptime(v_str, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("academic_date must be a valid date in YYYY-MM-DD format")
        raise ValueError("Invalid date format for academic_date")

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    content: str
    announcement_type: Optional[str] = "GENERAL"
    academic_date: Optional[date] = None
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
