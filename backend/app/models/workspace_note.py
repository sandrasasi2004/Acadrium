import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import GUID

class WorkspaceNote(Base):
    __tablename__ = "workspace_notes"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="workspace_notes")

    def to_dict(self):
        owner_name = self.owner.full_name if self.owner else "User"
        created_dt = self.created_at
        formatted_date = created_dt.strftime("%d %B %Y") if created_dt else "N/A"
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content or "",
            "owner_id": str(self.owner_id),
            "owner_name": owner_name,
            "created_at": created_dt.isoformat() if created_dt else None,
            "date": formatted_date,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
