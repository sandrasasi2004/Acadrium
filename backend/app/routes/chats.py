from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services import chat_service

router = APIRouter(prefix="/chats", tags=["AI Chat History"])

class CreateChatRequest(BaseModel):
    title: Optional[str] = None

class SendChatMessageRequest(BaseModel):
    message: str

class RenameChatRequest(BaseModel):
    title: str

@router.get("", response_model=List[Dict[str, Any]])
def list_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all persistent AI conversations belonging to the authenticated user."""
    return chat_service.list_user_chats(db, current_user)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_new_chat(
    req: Optional[CreateChatRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI chat conversation session."""
    title = req.title if req else None
    return chat_service.create_chat(db, current_user, title)

@router.get("/{chat_id}")
def get_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat details and full message history with citations."""
    return chat_service.get_chat_details(db, chat_id, current_user)

@router.post("/{chat_id}/messages")
def send_message_in_chat(
    chat_id: str,
    req: SendChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send user message into an existing chat session and execute RAG answer generation."""
    return chat_service.send_chat_message(db, chat_id, req.message, current_user)

@router.put("/{chat_id}")
def rename_chat(
    chat_id: str,
    req: RenameChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename conversation title."""
    return chat_service.rename_chat(db, chat_id, req.title, current_user)

@router.delete("/{chat_id}")
def delete_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete chat conversation and message history."""
    return chat_service.delete_chat(db, chat_id, current_user)
