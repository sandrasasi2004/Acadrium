import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resource import Resource
from app.models.workspace_resource import WorkspaceResource
from app.services.embedding_service import semantic_search_resources, semantic_search_workspace_files

logger = logging.getLogger("acadrium.ai_service")

SYSTEM_PROMPT_TEMPLATE = """You are Acadrium AI, an expert academic assistant.
Answer ONLY using the supplied academic documents.
If the answer is not found in the documents, state clearly: "I could not find sufficient information in the uploaded resources."
Never hallucinate facts or pull from outside knowledge not contained in the provided documents.
Always cite the specific source document title and section when explaining details."""

def synthesize_grounded_answer(question: str, retrieved_docs: List[Dict[str, Any]]) -> str:
    """Synthesize a structured, strictly grounded answer with citations based on retrieved context."""
    if not retrieved_docs:
        return "I could not find sufficient information in the uploaded resources to answer your question."

    # Check if top documents have high relevance score (> 0.25)
    relevant_docs = [d for d in retrieved_docs if d.get("similarity", 0) >= 0.22 or any(k in (d.get("title") or "").lower() for k in question.lower().split())]
    if not relevant_docs:
        return "I could not find sufficient information in the uploaded resources to answer your question."

    # Synthesize grounded answer from exact document excerpts
    answer_parts = []
    answer_parts.append(f"Based on your course resources, here is the information regarding **\"{question}\"**:\n")

    for idx, doc in enumerate(relevant_docs[:3], 1):
        title = doc.get("title", "Resource")
        file_type = doc.get("file_type", "Document")
        classroom = doc.get("classroom_name") or doc.get("classroomName") or "Course Material"
        text = doc.get("extracted_text") or doc.get("description") or ""

        # Extract relevant sentences
        sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 15]
        matching_sentences = [s for s in sentences if any(w in s.lower() for w in question.lower().split() if len(w) > 3)]
        
        if not matching_sentences:
            matching_sentences = sentences[:3]
        else:
            matching_sentences = matching_sentences[:3]

        excerpt = ". ".join(matching_sentences) + "." if matching_sentences else "Content available in document."

        answer_parts.append(f"### {idx}. [{title}] ({file_type} — {classroom})")
        answer_parts.append(f"{excerpt}\n")

    answer_parts.append("\n*Source documents are listed in the references panel on the right.*")
    return "\n".join(answer_parts)

def answer_question_with_rag(db: Session, question: str, current_user: User) -> Dict[str, Any]:
    """Execute RAG pipeline: vector search -> document retrieval -> context building -> grounded response synthesis."""
    if not question or not question.strip():
        return {
            "answer": "Please ask a specific academic question.",
            "sources": []
        }

    # Step 1 & 2: Vector search top matching documents
    classroom_matches = semantic_search_resources(db, question, current_user, limit=5)
    workspace_matches = semantic_search_workspace_files(db, question, current_user, limit=3)
    
    combined_docs = classroom_matches + workspace_matches
    combined_docs.sort(key=lambda x: x.get("similarity", 0), reverse=True)
    top_docs = combined_docs[:5]

    # Step 3 & 4: Synthesize grounded response
    answer_text = synthesize_grounded_answer(question, top_docs)

    # Step 5: Format source citations
    sources = []
    for doc in top_docs:
        snippet_text = doc.get("extracted_text") or doc.get("description") or ""
        snippet = snippet_text[:180] + "..." if len(snippet_text) > 180 else snippet_text
        sources.append({
            "id": doc.get("id"),
            "title": doc.get("title"),
            "original_filename": doc.get("original_filename") or doc.get("title"),
            "file_type": doc.get("file_type") or doc.get("type") or "PDF",
            "classroom_name": doc.get("classroom_name") or doc.get("classroomName") or "Workspace",
            "similarity": doc.get("similarity", 0.0),
            "snippet": snippet,
            "page_count": doc.get("page_count", 0),
            "word_count": doc.get("word_count", 0)
        })

    return {
        "answer": answer_text,
        "sources": sources
    }

def generate_resource_summary(db: Session, resource_id: str, is_workspace: bool = False) -> Dict[str, Any]:
    """Generate concise academic summary for a document and persist in database."""
    if is_workspace:
        item = db.query(WorkspaceResource).filter(WorkspaceResource.id == resource_id).first()
    else:
        item = db.query(Resource).filter(Resource.id == resource_id).first()

    if not item:
        raise ValueError(f"Resource {resource_id} not found.")

    if item.resource_summary and len(item.resource_summary.strip()) > 20:
        return {
            "id": str(item.id),
            "title": item.title,
            "summary": item.resource_summary
        }

    text = item.extracted_text or item.description or ""
    if not text.strip():
        summary = "No extractable text found in document to generate summary."
    else:
        # Generate structured concise summary
        paragraphs = [p.strip() for p in text.split("\n") if len(p.strip()) > 30]
        if not paragraphs:
            paragraphs = [text[:300]]
        
        summary_lines = [
            f"### Academic Overview: {item.title}",
            f"**File Format**: {item.file_type} | **Words**: {item.word_count or 0} | **Pages/Slides**: {item.page_count or 1}\n",
            "#### Key Topics Covered:"
        ]
        
        selected_pts = paragraphs[:5]
        for p in selected_pts:
            clean_pt = p[:150] + ("..." if len(p) > 150 else "")
            summary_lines.append(f"• {clean_pt}")

        summary = "\n".join(summary_lines)

    item.resource_summary = summary
    db.commit()
    db.refresh(item)

    return {
        "id": str(item.id),
        "title": item.title,
        "summary": summary
    }
