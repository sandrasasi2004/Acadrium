from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user, require_faculty, require_student
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate, ClassroomJoin
from app.services import classroom_service

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_new_classroom(
    classroom_in: ClassroomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    """Create a new classroom (Faculty only)."""
    classroom = classroom_service.create_classroom(db, classroom_in, current_user)
    return classroom.to_dict()

@router.get("/my")
def get_my_classrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    """Get classrooms created by logged-in faculty member."""
    classrooms = classroom_service.get_faculty_classrooms(db, str(current_user.id))
    return [c.to_dict() for c in classrooms]

@router.get("/enrolled")
def get_enrolled_classrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Get classrooms joined by logged-in student."""
    classrooms = classroom_service.get_student_enrolled_classrooms(db, str(current_user.id))
    return [c.to_dict() for c in classrooms]

@router.get("")
def list_classrooms_by_role(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List classrooms based on current user's role (Faculty: created, Student: enrolled)."""
    if current_user.role == "faculty":
        classrooms = classroom_service.get_faculty_classrooms(db, str(current_user.id))
    else:
        classrooms = classroom_service.get_student_enrolled_classrooms(db, str(current_user.id))
    return [c.to_dict() for c in classrooms]

@router.post("/join")
def join_a_classroom(
    join_in: ClassroomJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Join a classroom using invite class_code (Student only)."""
    classroom = classroom_service.join_classroom(db, join_in, current_user)
    return {
        "success": True,
        "message": f"Successfully joined {classroom.name}!",
        "classroom": classroom.to_dict()
    }

@router.get("/{classroom_id}")
def get_classroom_details(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get classroom details."""
    classroom = classroom_service.get_classroom_by_id(db, classroom_id)
    return classroom.to_dict()

@router.get("/{classroom_id}/students")
def get_classroom_members_list(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of students enrolled in classroom."""
    return classroom_service.get_classroom_members(db, classroom_id, current_user)

@router.put("/{classroom_id}")
def update_existing_classroom(
    classroom_id: str,
    update_in: ClassroomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    """Update classroom details (Faculty creator only)."""
    classroom = classroom_service.update_classroom(db, classroom_id, update_in, current_user)
    return classroom.to_dict()

@router.delete("/{classroom_id}/leave")
def leave_a_classroom(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Leave a classroom membership (Student only)."""
    return classroom_service.leave_classroom(db, classroom_id, current_user)

@router.delete("/{classroom_id}")
def delete_existing_classroom(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty)
):
    """Delete a classroom (Faculty creator only)."""
    return classroom_service.delete_classroom(db, classroom_id, current_user)
