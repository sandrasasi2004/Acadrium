import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import GUID

class WorkspaceResource(Base):
    __tablename__ = "workspace_resources"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # "PDF", "PPT", "DOC", "IMAGE"
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="workspace_resources")

    def to_dict(self):
        owner_name = self.owner.full_name if self.owner else "User"
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
            "owner_id": str(self.owner_id),
            "owner_name": owner_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "uploadedDate": self.created_at.strftime("%d %B %Y") if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
