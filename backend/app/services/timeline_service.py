import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.timeline_event import TimelineEvent
from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember

def create_event(
    db: Session,
    event_type: str,
    title: str,
    description: Optional[str] = None,
    entity_id: Optional[str] = None,
    classroom_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata_dict: Optional[dict] = None
) -> TimelineEvent:
    """Create and persist a TimelineEvent record."""
    metadata_json_str = json.dumps(metadata_dict) if metadata_dict else None

    event = TimelineEvent(
        event_type=event_type,
        title=title,
        description=description,
        entity_id=str(entity_id) if entity_id else None,
        classroom_id=str(classroom_id) if classroom_id else None,
        user_id=str(user_id) if user_id else None,
        metadata_json=metadata_json_str
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def list_user_timeline(
    db: Session,
    current_user: User,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    classroom_id: Optional[str] = None,
    event_type: Optional[str] = None
) -> List[TimelineEvent]:
    """Retrieve timeline events accessible to the current user."""
    # Determine accessible classroom IDs for user
    if current_user.role == "faculty":
        user_classroom_ids = [str(c.id) for c in db.query(Classroom.id).filter(Classroom.faculty_id == current_user.id).all()]
    else:
        user_classroom_ids = [str(m.classroom_id) for m in db.query(ClassroomMember.classroom_id).filter(ClassroomMember.student_id == current_user.id).all()]

    query = db.query(TimelineEvent).filter(
        or_(
            TimelineEvent.user_id == str(current_user.id),
            TimelineEvent.classroom_id.in_(user_classroom_ids) if user_classroom_ids else False
        )
    )

    if classroom_id:
        query = query.filter(TimelineEvent.classroom_id == str(classroom_id))

    if event_type:
        query = query.filter(TimelineEvent.event_type == event_type)

    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date)
            query = query.filter(TimelineEvent.created_at >= dt_start)
        except ValueError:
            pass

    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date)
            query = query.filter(TimelineEvent.created_at <= dt_end)
        except ValueError:
            pass

    return query.order_by(TimelineEvent.created_at.desc()).all()
