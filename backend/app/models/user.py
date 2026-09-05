import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.database.session import Base

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's native UUID type, otherwise uses String(36).
    """
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(str(value)))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            else:
                return value

class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student") # "faculty" or "student"
    department = Column(String(255), nullable=True)
    semester = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    created_classrooms = relationship("Classroom", back_populates="faculty", cascade="all, delete-orphan")
    memberships = relationship("ClassroomMember", back_populates="student", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "full_name": self.full_name,
            "name": self.full_name,
            "email": self.email,
            "role": self.role,
            "department": self.department or "Computer Applications",
            "semester": self.semester or ("Semester II" if self.role == "student" else None),
            "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" if self.role == "faculty" else "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

