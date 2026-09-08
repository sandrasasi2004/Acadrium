from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services import timeline_service

router = APIRouter(prefix="/timeline", tags=["Timeline"])

@router.get("")
def get_timeline(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    classroom_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve accessible timeline events for current user."""
    events = timeline_service.list_user_timeline(
        db=db,
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        classroom_id=classroom_id,
        event_type=event_type
    )
    return [e.to_dict() for e in events]
