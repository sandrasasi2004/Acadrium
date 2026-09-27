from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.embedding_service import (
    semantic_search_resources,
    semantic_search_workspace_files
)

router = APIRouter(prefix="/search", tags=["Semantic Search"])

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10

@router.post("/resources")
def search_classroom_resources_semantic(
    req: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Semantic vector search across classroom resources using sentence-transformers & pgvector cosine similarity."""
    if not req.query or not req.query.strip():
        return []
    results = semantic_search_resources(db, req.query, current_user, limit=req.limit or 10)
    return results

@router.post("/workspace")
def search_workspace_files_semantic(
    req: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Semantic vector search across personal workspace files using sentence-transformers & pgvector cosine similarity."""
    if not req.query or not req.query.strip():
        return []
    results = semantic_search_workspace_files(db, req.query, current_user, limit=req.limit or 10)
    return results
