import os
import re
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.resource import Resource
from app.models.workspace_resource import WorkspaceResource
from app.models.workspace_note import WorkspaceNote
from app.models.announcement import Announcement
from app.models.timeline_event import TimelineEvent
from app.models.classroom import Classroom, ClassroomMember
from app.services import groq_service
from app.services.embedding_service import (
    semantic_search_resources, 
    semantic_search_workspace_files,
    generate_embedding,
    compute_cosine_similarity
)

logger = logging.getLogger("acadrium.ai_service")

# Strict RAG System Prompt
GROQ_SYSTEM_PROMPT = (
    "You are Acadrium, an academic assistant.\n\n"
    "Answer ONLY using the provided context.\n\n"
    "Context sources in priority order:\n"
    "1. Classroom Resources\n"
    "2. Classroom Announcements\n"
    "3. Workspace Resources\n"
    "4. Workspace Notes\n"
    "5. Timeline Events\n\n"
    "Rules:\n"
    "1. Generate clean, well-structured academic paragraphs. Do NOT dump raw extracted text or formatting artifacts.\n"
    "2. Understand indirect questions, core concepts, synonyms, dates, exam schedules, holidays, and topic progressions.\n"
    "3. For holiday/date questions (e.g. 'What topics were taught on [Date]?'), if an announcement marks that date as a holiday or no class, state clearly that no academic topics were scheduled on that date according to classroom announcements.\n"
    "4. For file discovery questions ('Which file explains...', 'Which document discusses...', 'Where can I study...'), format the response as:\n"
    "File: <file_name>\n"
    "Location: <location>\n\n"
    "Reason:\n"
    "<brief explanation>\n"
    "5. If the answer cannot be found in the provided context, reply exactly:\n"
    "'I could not find sufficient information in the uploaded resources.'\n"
    "6. Do not invent information or use outside knowledge."
)

FALLBACK_MESSAGE = "I could not find sufficient information in the uploaded resources."

def get_user_announcements_and_events(db: Session, current_user: User) -> List[Dict[str, Any]]:
    """Retrieve all announcements and timeline events accessible to the current user."""
    items = []
    
    if current_user.role == "faculty":
        classroom_ids = [c.id for c in db.query(Classroom.id).filter(Classroom.faculty_id == current_user.id).all()]
    else:
        classroom_ids = [m.classroom_id for m in db.query(ClassroomMember.classroom_id).filter(ClassroomMember.student_id == current_user.id).all()]

    if classroom_ids:
        announcements = db.query(Announcement).filter(Announcement.classroom_id.in_(classroom_ids)).all()
        for ann in announcements:
            cls_name = ann.classroom_name or (ann.classroom.name if ann.classroom else "Classroom")
            items.append({
                "id": str(ann.id),
                "type": "announcement",
                "title": ann.title,
                "content": ann.content,
                "classroom_name": cls_name,
                "academic_date": ann.academic_date.isoformat() if ann.academic_date else None,
                "created_at": ann.created_at.isoformat() if ann.created_at else None
            })

    timeline_query = db.query(TimelineEvent)
    timeline_events = timeline_query.filter(
        (TimelineEvent.user_id == str(current_user.id)) | 
        (TimelineEvent.classroom_id.in_([str(cid) for cid in classroom_ids]))
    ).all()

    for te in timeline_events:
        items.append({
            "id": str(te.id),
            "type": "timeline_event",
            "title": te.title,
            "content": te.description or "",
            "classroom_name": "Timeline",
            "created_at": te.created_at.isoformat() if te.created_at else None
        })

    return items

def get_user_workspace_notes(db: Session, current_user: User) -> List[Dict[str, Any]]:
    """Retrieve all workspace notes belonging to the current user."""
    notes = db.query(WorkspaceNote).filter(WorkspaceNote.owner_id == current_user.id).all()
    items = []
    for n in notes:
        items.append({
            "id": str(n.id),
            "title": n.title,
            "content": n.content or "",
            "classroom_name": "Personal Workspace Note",
            "is_workspace": True
        })
    return items

def format_sources_section(sources: List[Dict[str, Any]]) -> str:
    """Format text sources attribution section at the end of the AI answer."""
    if not sources:
        return ""

    if len(sources) == 1:
        src = sources[0]
        title = src.get("original_filename") or src.get("title") or "Resource"
        loc = src.get("classroom_name") or src.get("classroomName") or "Personal Workspace"
        return f"\n\nSource:\nFile: {title}\nLocation: {loc}"

    lines = ["\n\nSources:\n"]
    for idx, src in enumerate(sources, 1):
        title = src.get("original_filename") or src.get("title") or "Resource"
        loc = src.get("classroom_name") or src.get("classroomName") or "Personal Workspace"
        lines.append(f"{idx}. File: {title}")
        lines.append(f"   Location: {loc}\n")
    
    return "\n".join(lines).strip()

def build_source_payload_item(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Format unified source document payload item for frontend UI & DocumentViewer integration."""
    snippet_text = doc.get("extracted_text") or doc.get("content") or doc.get("description") or ""
    snippet = snippet_text[:180] + "..." if len(snippet_text) > 180 else snippet_text
    
    cls_id = doc.get("classroom_id")
    loc = doc.get("classroom_name") or doc.get("classroomName") or ("DBMS Classroom" if cls_id else "Personal Workspace")

    return {
        "id": str(doc.get("id")),
        "title": doc.get("title") or doc.get("original_filename") or "Document",
        "original_filename": doc.get("original_filename") or doc.get("title"),
        "stored_filename": doc.get("stored_filename"),
        "file_type": (doc.get("file_type") or doc.get("type") or "PDF").upper() if isinstance(doc.get("file_type"), str) else "PDF",
        "mime_type": doc.get("mime_type"),
        "classroom_id": str(cls_id) if cls_id else None,
        "classroom_name": loc,
        "classroomName": loc,
        "location": loc,
        "similarity": round(float(doc.get("similarity", 0.0)), 4),
        "snippet": snippet,
        "extracted_text": doc.get("extracted_text") or doc.get("content"),
        "description": doc.get("description"),
        "page_count": doc.get("page_count", 0),
        "word_count": doc.get("word_count", 0),
        "is_workspace": not bool(cls_id)
    }

def clean_academic_prose(text: str) -> str:
    """Fallback prose cleaning function when LLM is unconfigured or unreachable."""
    if not text:
        return ""
    
    text = re.sub(r'#+\s*', '', text)
    text = re.sub(r'\*+', '', text)
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 15]
    
    combined = " ".join(lines)
    sentences = [s.strip() for s in combined.split('.') if len(s.strip()) > 10]
    
    if not sentences:
        return text[:400]
    
    p1 = ". ".join(sentences[:3]) + "." if len(sentences) >= 3 else ". ".join(sentences) + "."
    p2 = ". ".join(sentences[3:6]) + "." if len(sentences) > 3 else ""
    p3 = ". ".join(sentences[6:8]) + "." if len(sentences) > 6 else ""

    paragraphs = [p for p in [p1, p2, p3] if p and len(p) > 20]
    return "\n\n".join(paragraphs)

def build_rag_context(
    classroom_docs: List[Dict[str, Any]], 
    announcements_events: List[Dict[str, Any]],
    workspace_docs: List[Dict[str, Any]],
    workspace_notes: List[Dict[str, Any]]
) -> str:
    """
    Construct RAG context adhering strictly to Source Priority Order:
    1. Classroom Resources
    2. Classroom Announcements
    3. Workspace Resources
    4. Workspace Notes
    5. Timeline Events
    """
    context_blocks = []
    
    # Priority 1: Classroom Resources
    for doc in classroom_docs:
        title = doc.get("title") or doc.get("original_filename") or "Classroom Document"
        loc = doc.get("classroom_name") or "Classroom"
        text = (doc.get("extracted_text") or doc.get("description") or "").strip()
        truncated = text[:3000] if len(text) > 3000 else text
        context_blocks.append(f"CLASSROOM RESOURCE: {title}\nLOCATION: {loc}\n\nCONTENT:\n{truncated}")

    # Priority 2: Classroom Announcements
    for ae in announcements_events:
        if ae.get("type") == "announcement":
            title = ae.get("title", "Announcement")
            loc = ae.get("classroom_name", "Classroom")
            content = (ae.get("content", "")).strip()
            date_info = f" (Date: {ae['academic_date']})" if ae.get("academic_date") else ""
            context_blocks.append(f"CLASSROOM ANNOUNCEMENT: {title}{date_info}\nLOCATION: {loc}\n\nCONTENT:\n{content}")

    # Priority 3: Workspace Resources
    for wdoc in workspace_docs:
        title = wdoc.get("title") or wdoc.get("original_filename") or "Workspace File"
        loc = "Personal Workspace"
        text = (wdoc.get("extracted_text") or wdoc.get("description") or "").strip()
        truncated = text[:3000] if len(text) > 3000 else text
        context_blocks.append(f"WORKSPACE RESOURCE: {title}\nLOCATION: {loc}\n\nCONTENT:\n{truncated}")

    # Priority 4: Workspace Notes
    for note in workspace_notes:
        title = note.get("title", "Personal Note")
        loc = "Personal Workspace Note"
        content = (note.get("content", "")).strip()
        context_blocks.append(f"WORKSPACE NOTE: {title}\nLOCATION: {loc}\n\nCONTENT:\n{content}")

    # Priority 5: Timeline Events
    for te in announcements_events:
        if te.get("type") == "timeline_event":
            title = te.get("title", "Event")
            loc = "Timeline"
            content = (te.get("content", "")).strip()
            context_blocks.append(f"TIMELINE EVENT: {title}\nLOCATION: {loc}\n\nCONTENT:\n{content}")

    return "\n\n---\n\n".join(context_blocks)

def answer_question_with_rag(db: Session, question: str, current_user: User) -> Dict[str, Any]:
    """
    Acadrium Contextual RAG Engine:
    - Source Priority: Classroom Resources > Announcements > Workspace Resources > Workspace Notes
    - Robust Semantic Search (Direct & Indirect Questions)
    - Groq LLM (Qwen) Answer Synthesis
    - Date, Holiday, Exam Schedule & Topic Progression Reasoning
    - Strict Zero-Hallucination Fallback
    - Source Attribution Formatting
    """
    if not question or not question.strip():
        return {
            "answer": "Please ask a specific academic question.",
            "sources": []
        }

    clean_q = question.strip()
    q_low = clean_q.lower()

    # Step 1: Search Classroom Resources
    classroom_matches = semantic_search_resources(db, clean_q, current_user, limit=8)
    
    # Step 2: Search Workspace Resources
    workspace_matches = semantic_search_workspace_files(db, clean_q, current_user, limit=5)
    
    # Step 3: Search Classroom Announcements & Timeline Events
    announcements_events = get_user_announcements_and_events(db, current_user)
    
    # Step 4: Search Workspace Notes
    workspace_notes = get_user_workspace_notes(db, current_user)

    # Filter matching workspace notes by keywords if relevant
    q_words = [w.lower() for w in re.findall(r'\w+', q_low) if len(w) > 3]
    matching_notes = []
    for note in workspace_notes:
        note_text = (note.get("title", "") + " " + note.get("content", "")).lower()
        if any(w in note_text for w in q_words):
            matching_notes.append(note)

    # Sort documents by similarity
    classroom_matches.sort(key=lambda x: x.get("similarity", 0), reverse=True)
    workspace_matches.sort(key=lambda x: x.get("similarity", 0), reverse=True)

    # Determine relevant docs (broaden threshold for indirect concept queries)
    relevant_classroom_docs = [
        d for d in classroom_matches 
        if d.get("similarity", 0.0) >= 0.05 or any(w in (d.get("title", "") + " " + (d.get("extracted_text") or "")).lower() for w in q_words)
    ]
    
    relevant_workspace_docs = [
        d for d in workspace_matches 
        if d.get("similarity", 0.0) >= 0.05 or any(w in (d.get("title", "") + " " + (d.get("extracted_text") or "")).lower() for w in q_words)
    ]

    # Combine all sources in Priority Order
    has_any_context = bool(relevant_classroom_docs or announcements_events or relevant_workspace_docs or matching_notes)

    # Strict Zero-Hallucination Fallback if no context exists
    if not has_any_context:
        return {
            "answer": FALLBACK_MESSAGE,
            "sources": []
        }

    # Build Sources Attribution Payload (up to 4 top items)
    sources_payload = []
    seen_ids = set()

    for d in (relevant_classroom_docs + relevant_workspace_docs):
        doc_id = str(d.get("id"))
        if doc_id not in seen_ids:
            sources_payload.append(build_source_payload_item(d))
            seen_ids.add(doc_id)
        if len(sources_payload) >= 3:
            break

    # Construct RAG Context string
    context_text = build_rag_context(
        relevant_classroom_docs[:4],
        announcements_events[:5],
        relevant_workspace_docs[:3],
        matching_notes[:3]
    )

    user_prompt = f"USER QUESTION: {clean_q}\n\nCONTEXT:\n{context_text}"

    # Query Groq LLM (Qwen)
    groq_answer = groq_service.generate_groq_answer(
        system_prompt=GROQ_SYSTEM_PROMPT,
        user_prompt=user_prompt
    )

    if groq_answer:
        clean_groq = groq_answer.strip()
        # Check strict fallback trigger from Groq
        if "I could not find sufficient information in the uploaded resources" in clean_groq:
            return {
                "answer": FALLBACK_MESSAGE,
                "sources": []
            }
        
        # Append mandatory sources section if not already present
        if "Source:" not in clean_groq and "Sources:" not in clean_groq and sources_payload:
            clean_groq += format_sources_section(sources_payload)

        return {
            "answer": clean_groq,
            "sources": sources_payload
        }

    # Fallback to clean_academic_prose if Groq API is unavailable
    logger.info("Falling back to clean_academic_prose() for answer synthesis.")
    top_docs = relevant_classroom_docs[:2] + relevant_workspace_docs[:2]
    combined_raw_text = "\n\n".join([(d.get("extracted_text") or d.get("description") or "") for d in top_docs])
    fallback_answer = clean_academic_prose(combined_raw_text)

    if not fallback_answer or len(fallback_answer.strip()) < 20:
        fallback_answer = f"The uploaded study resources provide academic details regarding {clean_q}."

    final_answer_text = fallback_answer + format_sources_section(sources_payload)

    return {
        "answer": final_answer_text,
        "sources": sources_payload
    }

def generate_resource_summary(db: Session, resource_id: str, is_workspace: bool = False, force: bool = False) -> Dict[str, Any]:
    """Generate concise academic summary for a document using Groq LLM with rule-based fallback."""
    if is_workspace:
        item = db.query(WorkspaceResource).filter(WorkspaceResource.id == resource_id).first()
    else:
        item = db.query(Resource).filter(Resource.id == resource_id).first()

    if not item:
        raise ValueError(f"Resource {resource_id} not found.")

    if not force and item.resource_summary and len(item.resource_summary.strip()) > 20:
        return {
            "id": str(item.id),
            "title": item.title,
            "summary": item.resource_summary,
            "cached": True
        }

    text = item.extracted_text or item.description or ""
    if not text.strip():
        summary = "No extractable text found in document to generate summary."
    else:
        summary_prompt = (
            f"Generate a clean, structured academic summary for the document below.\n"
            f"Include an overview paragraph and bullet points for key topics covered.\n\n"
            f"DOCUMENT TITLE: {item.title}\n"
            f"CONTENT:\n{text[:4000]}"
        )
        sys_prompt = "You are Acadrium AI. Summarize the provided academic document cleanly and concisely."
        groq_summary = groq_service.generate_groq_answer(sys_prompt, summary_prompt)

        if groq_summary and len(groq_summary.strip()) > 30:
            summary = groq_summary.strip()
        else:
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
