import random
import string
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.classroom import Classroom, ClassroomMember
from app.models.user import User
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate, ClassroomJoin

def generate_unique_class_code(db: Session) -> str:
    """Generates a random unique classroom code in format ACDR-XXXX-XXXX."""
    chars = string.ascii_uppercase + string.digits
    # Exclude easily confused characters like '0', 'O', '1', 'I' if desired, but standard alphanumeric is fine.
    max_attempts = 100
    for _ in range(max_attempts):
        part1 = ''.join(random.choices(chars, k=4))
        part2 = ''.join(random.choices(chars, k=4))
        code = f"ACDR-{part1}-{part2}"
        
        # Check uniqueness in DB
        existing = db.query(Classroom).filter(Classroom.class_code == code).first()
        if not existing:
            return code
            
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate unique classroom code. Please try again."
    )

def create_classroom(db: Session, classroom_in: ClassroomCreate, faculty_user: User) -> Classroom:
    if faculty_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can create classrooms."
        )

    name = classroom_in.get_name()
    subject_code = classroom_in.get_subject_code()
    class_code = generate_unique_class_code(db)

    classroom = Classroom(
        name=name,
        subject_code=subject_code,
        semester=classroom_in.semester,
        department=classroom_in.department,
        class_code=class_code,
        faculty_id=faculty_user.id
    )

    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom

def get_faculty_classrooms(db: Session, faculty_id: str) -> List[Classroom]:
    return db.query(Classroom).filter(Classroom.faculty_id == faculty_id).order_by(Classroom.created_at.desc()).all()

def get_student_enrolled_classrooms(db: Session, student_id: str) -> List[Classroom]:
    memberships = db.query(ClassroomMember).filter(ClassroomMember.student_id == student_id).all()
    classroom_ids = [m.classroom_id for m in memberships]
    if not classroom_ids:
        return []
    return db.query(Classroom).filter(Classroom.id.in_(classroom_ids)).order_by(Classroom.created_at.desc()).all()

def get_classroom_by_id(db: Session, classroom_id: str) -> Classroom:
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found."
        )
    return classroom

def update_classroom(db: Session, classroom_id: str, update_data: ClassroomUpdate, faculty_user: User) -> Classroom:
    classroom = get_classroom_by_id(db, classroom_id)
    if str(classroom.faculty_id) != str(faculty_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit classrooms that you created."
        )

    name = update_data.name or update_data.subject
    if name:
        classroom.name = name.strip()
    subject_code = update_data.subject_code or update_data.courseCode
    if subject_code:
        classroom.subject_code = subject_code.strip()
    if update_data.semester:
        classroom.semester = update_data.semester
    if update_data.department:
        classroom.department = update_data.department

    db.commit()
    db.refresh(classroom)
    return classroom

def delete_classroom(db: Session, classroom_id: str, faculty_user: User):
    classroom = get_classroom_by_id(db, classroom_id)
    if str(classroom.faculty_id) != str(faculty_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete classrooms that you created."
        )

    db.delete(classroom)
    db.commit()
    return {"detail": "Classroom deleted successfully."}

def join_classroom(db: Session, join_in: ClassroomJoin, student_user: User) -> Classroom:
    if student_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can join classrooms."
        )

    code = join_in.get_code().upper()
    classroom = db.query(Classroom).filter(Classroom.class_code == code).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid classroom code. Please check the code provided by your faculty."
        )

    # Check for duplicate joining
    existing_member = db.query(ClassroomMember).filter(
        ClassroomMember.classroom_id == classroom.id,
        ClassroomMember.student_id == student_user.id
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already joined '{classroom.name}'."
        )

    membership = ClassroomMember(
        classroom_id=classroom.id,
        student_id=student_user.id
    )

    db.add(membership)
    db.commit()
    db.refresh(classroom)
    return classroom

def leave_classroom(db: Session, classroom_id: str, student_user: User):
    if student_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can leave classrooms."
        )

    membership = db.query(ClassroomMember).filter(
        ClassroomMember.classroom_id == classroom_id,
        ClassroomMember.student_id == student_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not enrolled in this classroom."
        )

    db.delete(membership)
    db.commit()
    return {"detail": "Successfully left classroom."}

def get_classroom_members(db: Session, classroom_id: str, current_user: User) -> List[dict]:
    classroom = get_classroom_by_id(db, classroom_id)
    # Check access: faculty owner or enrolled student
    is_owner = (str(classroom.faculty_id) == str(current_user.id))
    is_member = db.query(ClassroomMember).filter(
        ClassroomMember.classroom_id == classroom_id,
        ClassroomMember.student_id == current_user.id
    ).first() is not None

    if not is_owner and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to classroom roll-call."
        )

    members = db.query(ClassroomMember).filter(ClassroomMember.classroom_id == classroom_id).all()
    return [m.to_dict() for m in members]
