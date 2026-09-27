import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import GUID

class AIChat(Base):
    __tablename__ = "ai_chats"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", backref="ai_chats")
    messages = relationship("AIMessage", back_populates="chat", cascade="all, delete-orphan", order_by="AIMessage.created_at")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages is not None else 0
        }

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    chat_id = Column(GUID, ForeignKey("ai_chats.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # "user" or "bot"
    text = Column(Text, nullable=False)
    sources_json = Column(Text, nullable=True)  # JSON string of source citations
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    chat = relationship("AIChat", back_populates="messages")

    def to_dict(self):
        sources = []
        if self.sources_json:
            try:
                sources = json.loads(self.sources_json)
            except Exception:
                sources = []

        return {
            "id": str(self.id),
            "chat_id": str(self.chat_id),
            "sender": self.sender,
            "role": "assistant" if self.sender == "bot" else "user",
            "text": self.text,
            "content": self.text,
            "sources": sources,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "time": self.created_at.strftime("%I:%M %p") if self.created_at else None
        }
