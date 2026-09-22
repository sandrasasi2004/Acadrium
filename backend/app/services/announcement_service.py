import uuid
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.announcement import Announcement
from app.models.classroom import Classroom, ClassroomMember
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate

logger = logging.getLogger("acadrium.services.announcement")

def create_announcement(db: Session, current_user: User, data: AnnouncementCreate) -> dict:
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can create announcements."
        )

    try:
        classroom_uuid = uuid.UUID(data.classroom_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid classroom ID format."
        )

    classroom = db.query(Classroom).filter(Classroom.id == classroom_uuid).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_44_NOT_FOUND if hasattr(status, 'HTTP_404_NOT_FOUND') else 404,
            detail="Classroom not found."
        )

    if str(classroom.faculty_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty can only create announcements for their own classrooms."
        )

    announcement = Announcement(
        title=data.title.strip(),
        content=data.content.strip(),
        announcement_type=data.announcement_type or "GENERAL",
        academic_date=data.academic_date,
        author_name=current_user.full_name,
        classroom_name=classroom.name,
        classroom_id=classroom_uuid,
        posted_by=current_user.id
    )

    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    try:
        from app.services import timeline_service
        meta = {"announcement_type": announcement.announcement_type}
        if announcement.academic_date:
            meta["academic_date"] = announcement.academic_date.isoformat()
        timeline_service.create_event(
            db=db,
            event_type="ANNOUNCEMENT_CREATED",
            title=f"Announcement Posted: {announcement.title}",
            description=announcement.content,
            entity_id=str(announcement.id),
            classroom_id=str(classroom.id),
            user_id=str(current_user.id),
            metadata_dict=meta
        )
    except Exception as e:
        print(f"[Timeline Event Warning] Failed to log ANNOUNCEMENT_CREATED event: {e}")

    logger.info(f"[Announcement Service] Created announcement '{announcement.title}' (ID: {announcement.id}) in classroom '{classroom.name}'")
    return announcement.to_dict()

def get_classroom_announcements(db: Session, current_user: User, classroom_id_str: str, academic_date: str = None) -> list:
    try:
        classroom_uuid = uuid.UUID(classroom_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid classroom ID format."
        )

    classroom = db.query(Classroom).filter(Classroom.id == classroom_uuid).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found."
        )

    # Check access permission
    if current_user.role == "faculty":
        if str(classroom.faculty_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Faculty can only view announcements for their own classrooms."
            )
    else:
        # Student must be enrolled member
        membership = db.query(ClassroomMember).filter(
            ClassroomMember.classroom_id == classroom_uuid,
            ClassroomMember.student_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students can only view announcements for enrolled classrooms."
            )

    query = db.query(Announcement).filter(
        Announcement.classroom_id == classroom_uuid
    )
    if academic_date:
        query = query.filter(Announcement.academic_date == academic_date)

    announcements = query.order_by(Announcement.created_at.desc()).all()

    return [a.to_dict() for a in announcements]

def get_user_announcements(db: Session, current_user: User, academic_date: str = None) -> list:
    if current_user.role == "faculty":
        # Get all classrooms owned by faculty
        owned_classrooms = db.query(Classroom.id).filter(Classroom.faculty_id == current_user.id).all()
        classroom_ids = [c.id for c in owned_classrooms]
    else:
        # Get all classrooms joined by student
        joined_classrooms = db.query(ClassroomMember.classroom_id).filter(ClassroomMember.student_id == current_user.id).all()
        classroom_ids = [c.classroom_id for c in joined_classrooms]

    if not classroom_ids:
        return []

    query = db.query(Announcement).filter(
        Announcement.classroom_id.in_(classroom_ids)
    )
    if academic_date:
        query = query.filter(Announcement.academic_date == academic_date)

    announcements = query.order_by(Announcement.created_at.desc()).all()

    return [a.to_dict() for a in announcements]

def update_announcement(db: Session, current_user: User, announcement_id_str: str, data: AnnouncementUpdate) -> dict:
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can edit announcements."
        )

    try:
        announcement_uuid = uuid.UUID(announcement_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid announcement ID format."
        )

    announcement = db.query(Announcement).filter(Announcement.id == announcement_uuid).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found."
        )

    if str(announcement.posted_by) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty can only update announcements they posted."
        )

    if data.title is not None and data.title.strip():
        announcement.title = data.title.strip()
    if data.content is not None and data.content.strip():
        announcement.content = data.content.strip()
    if data.announcement_type is not None:
        announcement.announcement_type = data.announcement_type
    if "academic_date" in data.model_fields_set:
        announcement.academic_date = data.academic_date

    db.commit()
    db.refresh(announcement)

    try:
        from app.services import timeline_service
        meta = {"announcement_type": announcement.announcement_type}
        if announcement.academic_date:
            meta["academic_date"] = announcement.academic_date.isoformat()
        timeline_service.create_event(
            db=db,
            event_type="ANNOUNCEMENT_UPDATED",
            title=f"Announcement Updated: {announcement.title}",
            description=announcement.content,
            entity_id=str(announcement.id),
            classroom_id=str(announcement.classroom_id),
            user_id=str(current_user.id),
            metadata_dict=meta
        )
    except Exception as e:
        print(f"[Timeline Event Warning] Failed to log ANNOUNCEMENT_UPDATED event: {e}")

    logger.info(f"[Announcement Service] Updated announcement (ID: {announcement.id})")
    return announcement.to_dict()

def delete_announcement(db: Session, current_user: User, announcement_id_str: str) -> dict:
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only faculty members can delete announcements."
        )

    try:
        announcement_uuid = uuid.UUID(announcement_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid announcement ID format."
        )

    announcement = db.query(Announcement).filter(Announcement.id == announcement_uuid).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found."
        )

    if str(announcement.posted_by) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty can only delete announcements they posted."
        )

    db.delete(announcement)
    db.commit()
    logger.info(f"[Announcement Service] Deleted announcement (ID: {announcement_id_str})")
    return {"message": "Announcement deleted successfully."}
