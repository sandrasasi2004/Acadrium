import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.chat import AIChat, AIMessage
from app.services import ai_service

logger = logging.getLogger("acadrium.chat_service")

def generate_chat_title(question: str) -> str:
    """Generate a clean, concise title from the user's first prompt."""
    if not question:
        return "New Conversation"
    
    clean = question.strip()
    # Strip common question starters
    words = clean.split()
    if len(words) <= 5:
        return clean.capitalize().rstrip("?")
    
    # Take first 4-5 meaningful words
    short_title = " ".join(words[:4]).capitalize().rstrip("?")
    return short_title

def list_user_chats(db: Session, current_user: User) -> List[Dict[str, Any]]:
    """Retrieve all chats belonging exclusively to the current user."""
    chats = db.query(AIChat).filter(AIChat.user_id == current_user.id).order_by(AIChat.updated_at.desc()).all()
    return [c.to_dict() for c in chats]

def create_chat(db: Session, current_user: User, title: Optional[str] = None) -> Dict[str, Any]:
    """Create a new AI conversation session for the current user."""
    chat_title = title.strip() if title and title.strip() else "New Conversation"
    chat = AIChat(
        user_id=current_user.id,
        title=chat_title
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    
    logger.info(f"[Chat Service] Created new chat {chat.id} for user {current_user.email}")
    return chat.to_dict()

def get_chat_details(db: Session, chat_id: str, current_user: User) -> Dict[str, Any]:
    """Get conversation details and all message history with strict user isolation."""
    chat = db.query(AIChat).filter(AIChat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat conversation not found.")
    
    if str(chat.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this chat conversation.")
    
    messages = [m.to_dict() for m in chat.messages]
    chat_dict = chat.to_dict()
    chat_dict["messages"] = messages
    return chat_dict

def send_chat_message(db: Session, chat_id: str, question: str, current_user: User) -> Dict[str, Any]:
    """Process user prompt, execute RAG AI synthesis, and persist turn in PostgreSQL database."""
    chat = db.query(AIChat).filter(AIChat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat conversation not found.")
    
    if str(chat.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this chat conversation.")

    clean_question = question.strip()
    if not clean_question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question prompt cannot be empty.")

    # 1. Store User Message
    user_msg = AIMessage(
        chat_id=chat.id,
        sender="user",
        text=clean_question,
        sources_json=None
    )
    db.add(user_msg)

    # Auto title generation if default title
    if chat.title == "New Conversation" or len(chat.messages) <= 1:
        chat.title = generate_chat_title(clean_question)

    # 2. Execute RAG AI Answer Generation
    ai_response = ai_service.answer_question_with_rag(db, clean_question, current_user)
    answer_text = ai_response.get("answer", "")
    sources = ai_response.get("sources", [])

    # 3. Store Assistant Message with Sources
    bot_msg = AIMessage(
        chat_id=chat.id,
        sender="bot",
        text=answer_text,
        sources_json=json.dumps(sources) if sources else None
    )
    db.add(bot_msg)

    chat.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_msg)
    db.refresh(bot_msg)
    db.refresh(chat)

    return {
        "chat_id": str(chat.id),
        "chat_title": chat.title,
        "user_message": user_msg.to_dict(),
        "bot_message": bot_msg.to_dict(),
        "sources": sources
    }

def rename_chat(db: Session, chat_id: str, new_title: str, current_user: User) -> Dict[str, Any]:
    """Rename conversation title."""
    chat = db.query(AIChat).filter(AIChat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat conversation not found.")
    
    if str(chat.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this chat conversation.")

    if not new_title or not new_title.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title cannot be empty.")

    chat.title = new_title.strip()
    chat.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(chat)

    logger.info(f"[Chat Service] Renamed chat {chat.id} to '{chat.title}'")
    return chat.to_dict()

def delete_chat(db: Session, chat_id: str, current_user: User) -> Dict[str, Any]:
    """Delete conversation and all messages with user isolation."""
    chat = db.query(AIChat).filter(AIChat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat conversation not found.")
    
    if str(chat.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this chat conversation.")

    db.delete(chat)
    db.commit()

    logger.info(f"[Chat Service] Deleted chat {chat_id} for user {current_user.email}")
    return {"message": "Chat conversation deleted successfully.", "id": chat_id}
