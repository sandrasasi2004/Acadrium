from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services import ai_service
from app.services import resource_service
from app.services import workspace_service

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class AskQuestionRequest(BaseModel):
    question: str

@router.post("/ask")
def ask_ai_assistant(
    req: AskQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI Assistant endpoint: RAG vector search + grounded answer synthesis + source citations."""
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")
    
    result = ai_service.answer_question_with_rag(db, req.question.strip(), current_user)
    return result

@router.post("/resources/{resource_id}/summary")
def generate_classroom_resource_summary(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate and store concise academic summary for a classroom resource."""
    # Verify access to resource
    resource_service.get_resource_details(db, resource_id, current_user)
    summary_res = ai_service.generate_resource_summary(db, resource_id, is_workspace=False)
    return summary_res

@router.post("/workspace/{file_id}/summary")
def generate_workspace_resource_summary(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate and store concise academic summary for a workspace file."""
    # Verify ownership
    workspace_service.get_workspace_file(db, file_id, current_user)
    summary_res = ai_service.generate_resource_summary(db, file_id, is_workspace=True)
    return summary_res
