from typing import Optional
from pydantic import BaseModel, Field

class ClassroomCreate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    subject_code: Optional[str] = None
    courseCode: Optional[str] = None
    semester: str = "Semester III"
    department: str = "Computer Applications"

    def get_name(self) -> str:
        val = self.name or self.subject
        if not val or not val.strip():
            raise ValueError("Classroom name or subject is required.")
        return val.strip()

    def get_subject_code(self) -> str:
        val = self.subject_code or self.courseCode or "MCA"
        return val.strip()

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    subject_code: Optional[str] = None
    courseCode: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None

class ClassroomJoin(BaseModel):
    class_code: Optional[str] = None
    inviteCode: Optional[str] = None

    def get_code(self) -> str:
        code = self.class_code or self.inviteCode
        if not code or not code.strip():
            raise ValueError("Classroom code is required.")
        return code.strip()

class ClassroomResponse(BaseModel):
    id: str
    name: str
    subject: str
    subject_code: str
    courseCode: str
    semester: str
    department: str
    class_code: str
    inviteCode: str
    faculty_id: str
    faculty_name: str
    facultyName: str
    student_count: int = 0
    studentCount: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
