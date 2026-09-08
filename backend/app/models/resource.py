import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import GUID

class Resource(Base):
    __tablename__ = "resources"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # "PDF", "PPT", "DOCX", "IMAGE"
    mime_type = Column(String(100), nullable=False)
    file_size = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    classroom_id = Column(GUID, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Phase 7.5 Metadata Expansion
    uploaded_by_name = Column(String(255), nullable=True)
    classroom_name = Column(String(255), nullable=True)
    page_count = Column(Integer, nullable=True, default=0)
    word_count = Column(Integer, nullable=True, default=0)
    last_processed_at = Column(DateTime(timezone=True), nullable=True)

    extraction_status = Column(String(20), nullable=False, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    extracted_text = Column(Text, nullable=True)
    extraction_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    classroom = relationship("Classroom", back_populates="resources")
    uploader = relationship("User", back_populates="uploaded_resources")

    def to_dict(self):
        uploader_name = self.uploaded_by_name or (self.uploader.full_name if self.uploader else "Faculty User")
        classroom_name = self.classroom_name or (self.classroom.name if self.classroom else "General")
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "tags": self.tags,
            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "file_type": self.file_type,
            "type": self.file_type,
            "mime_type": self.mime_type,
            "file_size": self.file_size,
            "size": self.file_size,
            "file_path": self.file_path,
            "classroom_id": str(self.classroom_id),
            "classroomId": str(self.classroom_id),
            "classroom_name": classroom_name,
            "classroomName": classroom_name,
            "uploaded_by": str(self.uploaded_by),
            "uploaded_by_id": str(self.uploaded_by),
            "uploaded_by_name": uploader_name,
            "uploader_name": uploader_name,
            "uploadedBy": uploader_name,
            "page_count": self.page_count or 0,
            "word_count": self.word_count or 0,
            "last_processed_at": self.last_processed_at.isoformat() if self.last_processed_at else None,
            "extraction_status": self.extraction_status,
            "extracted_text": self.extracted_text,
            "extraction_error": self.extraction_error,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "uploadedDate": self.created_at.strftime("%d %B %Y") if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
