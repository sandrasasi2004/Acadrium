import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.user import GUID

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    subject_code = Column(String(50), nullable=False)
    semester = Column(String(50), nullable=False)
    department = Column(String(255), nullable=False, default="Computer Applications")
    class_code = Column(String(20), unique=True, index=True, nullable=False)
    faculty_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    faculty = relationship("User", back_populates="created_classrooms")
    members = relationship("ClassroomMember", back_populates="classroom", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="classroom", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="classroom", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "subject": self.name,
            "subject_code": self.subject_code,
            "courseCode": self.subject_code,
            "semester": self.semester,
            "department": self.department,
            "class_code": self.class_code,
            "inviteCode": self.class_code,
            "faculty_id": str(self.faculty_id),
            "faculty_name": self.faculty.full_name if self.faculty else "Faculty User",
            "facultyName": self.faculty.full_name if self.faculty else "Faculty User",
            "student_count": len(self.members) if self.members is not None else 0,
            "studentCount": len(self.members) if self.members is not None else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ClassroomMember(Base):
    __tablename__ = "classroom_members"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    classroom_id = Column(GUID, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint('classroom_id', 'student_id', name='unique_classroom_student'),
    )

    # Relationships
    classroom = relationship("Classroom", back_populates="members")
    student = relationship("User", back_populates="memberships")

    def to_dict(self):
        return {
            "id": str(self.id),
            "classroom_id": str(self.classroom_id),
            "student_id": str(self.student_id),
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "student_name": self.student.full_name if self.student else None,
            "name": self.student.full_name if self.student else None,
            "email": self.student.email if self.student else None,
            "rollNo": self.student.semester or "N/A"
        }
