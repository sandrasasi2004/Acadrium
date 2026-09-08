import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import GUID

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    classroom_id = Column(GUID, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    posted_by = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Phase 7.5 Metadata Expansion
    announcement_type = Column(String(50), nullable=False, default="GENERAL")
    author_name = Column(String(255), nullable=True)
    classroom_name = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    classroom = relationship("Classroom", back_populates="announcements")
    author = relationship("User", back_populates="announcements")

    def to_dict(self):
        author_name = self.author_name or (self.author.full_name if self.author else "Faculty User")
        classroom_name = self.classroom_name or (self.classroom.name if self.classroom else "General")
        return {
            "id": str(self.id),
            "title": self.title,
            "content": self.content,
            "announcement_type": self.announcement_type,
            "classroom_id": str(self.classroom_id),
            "classroomId": str(self.classroom_id),
            "classroom_name": classroom_name,
            "classroomName": classroom_name,
            "posted_by": str(self.posted_by),
            "postedBy": str(self.posted_by),
            "author_name": author_name,
            "author": author_name,
            "author_role": self.author.role if self.author else "faculty",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "date": self.created_at.strftime("%d %B %Y") if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
