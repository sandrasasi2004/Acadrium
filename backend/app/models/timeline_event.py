import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from app.database.session import Base
from app.models.user import GUID

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    event_type = Column(String(50), nullable=False)
    entity_id = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    classroom_id = Column(String(255), nullable=True)
    user_id = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": str(self.id),
            "event_type": self.event_type,
            "entity_id": str(self.entity_id) if self.entity_id else None,
            "title": self.title,
            "description": self.description,
            "classroom_id": str(self.classroom_id) if self.classroom_id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "metadata_json": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
