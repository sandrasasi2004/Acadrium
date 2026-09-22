from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementDeleteResponse
)
from app.services import announcement_service

router = APIRouter(prefix="/announcements", tags=["Announcements"])

@router.post("", status_code=status.HTTP_201_CREATED)
def create_announcement(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    return announcement_service.create_announcement(db, current_user, data)

@router.get("")
def list_user_announcements(
    academic_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    return announcement_service.get_user_announcements(db, current_user, academic_date=academic_date)

@router.get("/classroom/{classroom_id}")
def list_classroom_announcements(
    classroom_id: str,
    academic_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    return announcement_service.get_classroom_announcements(db, current_user, classroom_id, academic_date=academic_date)

@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: str,
    data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    return announcement_service.update_announcement(db, current_user, announcement_id, data)

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    return announcement_service.delete_announcement(db, current_user, announcement_id)
