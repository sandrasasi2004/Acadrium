import os
import re
import logging
from datetime import datetime
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
    semantic_search_workspace_files
)

logger = logging.getLogger("acadrium.ai_service")

# Base RAG System Prompt Template
GROQ_SYSTEM_PROMPT_TEMPLATE = (
    "CURRENT SYSTEM DATE: {current_date_str} ({current_day})\n\n"
    "You are Acadrium, an academic AI assistant.\n\n"
    "Answer ONLY using the provided context.\n\n"
    "Context sources in priority order:\n"
    "1. Classroom Resources\n"
    "2. Classroom Announcements\n"
    "3. Workspace Resources\n"
    "4. Workspace Notes\n"
    "5. Timeline Events\n\n"
    "Rules:\n"
    "1. Generate clean, well-structured academic prose. Do NOT dump raw extracted text or markdown formatting artifacts.\n"
    "2. DATE & TIME AWARENESS:\n"
    "   - Evaluate all relative date expressions ('today', 'tomorrow', 'this month', 'next week', 'upcoming', 'recent', 'current semester') relative to CURRENT SYSTEM DATE ({current_date_str}).\n"
    "   - When asked 'important dates this month' or 'events this month', check events in the current month of CURRENT SYSTEM DATE. If no events occur in this month, explicitly state that no important dates are scheduled in this month, and then list the next scheduled upcoming events in future months.\n"
    "   - For 'Upcoming events', list ONLY events occurring on or after CURRENT SYSTEM DATE.\n"
    "   - For 'What happened on [Date]?' or 'What topics were covered on [Date]?', check announcements for that date. If an announcement marks that date as a holiday or no class, state clearly that no academic classes or topics were scheduled on that date due to the holiday announcement.\n"
    "3. For file discovery questions ('Which file explains...', 'Which document discusses...'), format as:\n"
    "File: <file_name>\n"
    "Location: <location>\n\n"
    "Reason:\n"
    "<brief explanation>\n"
    "4. If the answer cannot be found in the provided context, reply exactly:\n"
    "'I could not find sufficient information in the uploaded resources.'\n"
    "5. Do not invent information or use outside knowledge."
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
            date_str = ann.academic_date.strftime("%d %b %Y") if ann.academic_date else (ann.created_at.strftime("%d %b %Y") if ann.created_at else "")
            raw_date = ann.academic_date or (ann.created_at.date() if ann.created_at else None)
            
            title_low = (ann.title or "").lower()
            content_low = (ann.content or "").lower()
            is_holiday = any(kw in title_low or kw in content_low for kw in ["holiday", "vacation", "no class", "closed", "leave"])

            display_title = "Holiday Announcement" if is_holiday else "Announcement"

            items.append({
                "id": str(ann.id),
                "type": "announcement",
                "title": ann.title,
                "display_title": display_title,
                "content": ann.content,
                "classroom_name": cls_name,
                "classroom_id": str(ann.classroom_id),
                "academic_date": date_str,
                "raw_date": raw_date,
                "is_holiday": is_holiday,
                "created_at": ann.created_at.isoformat() if ann.created_at else None
            })

    timeline_query = db.query(TimelineEvent)
    timeline_events = timeline_query.filter(
        (TimelineEvent.user_id == str(current_user.id)) | 
        (TimelineEvent.classroom_id.in_([str(cid) for cid in classroom_ids]))
    ).all()

    for te in timeline_events:
        raw_date = te.created_at.date() if te.created_at else None
        date_str = te.created_at.strftime("%d %b %Y") if te.created_at else ""
        items.append({
            "id": str(te.id),
            "type": "timeline_event",
            "title": te.title,
            "display_title": f"Timeline Event: {te.title}",
            "content": te.description or "",
            "classroom_name": "Timeline",
            "academic_date": date_str,
            "raw_date": raw_date,
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
    """Format text sources attribution section matching exact user spec."""
    if not sources:
        return ""

    if len(sources) == 1:
        src = sources[0]
        stype = src.get("source_type") or src.get("file_type")
        
        if stype == "ANNOUNCEMENT" or "Announcement" in str(src.get("display_title", "")) or "Announcement" in str(src.get("title", "")):
            if src.get("is_holiday") or "Holiday" in str(src.get("display_title", "")) or "Holiday" in str(src.get("title", "")):
                date_str = src.get("academic_date") or ""
                return f"\n\nSource:\nHoliday Announcement\nDate: {date_str}"
            else:
                cls_name = src.get("classroom_name") or src.get("location") or "DBMS"
                date_str = src.get("academic_date") or ""
                date_part = f"\nDate: {date_str}" if date_str else ""
                return f"\n\nSource:\nAnnouncement\nClassroom: {cls_name}{date_part}"
        elif stype == "NOTE" or "Workspace Note" in str(src.get("title", "")):
            note_title = src.get("note_title") or src.get("title") or "Internal Exam Planning"
            if note_title.startswith("Workspace Note: "):
                note_title = note_title[16:]
            if note_title.startswith("Title: "):
                note_title = note_title[7:]
            return f"\n\nSource:\nWorkspace Note\nTitle: {note_title}"
        else:
            title = src.get("original_filename") or src.get("title") or "Resource"
            loc = src.get("classroom_name") or src.get("location") or "DBMS"
            return f"\n\nSource:\n{title}\nLocation: {loc}"

    lines = ["\n\nSources:"]
    for idx, src in enumerate(sources, 1):
        stype = src.get("source_type") or src.get("file_type")
        if stype == "ANNOUNCEMENT" or "Announcement" in str(src.get("display_title", "")) or "Announcement" in str(src.get("title", "")):
            if src.get("is_holiday") or "Holiday" in str(src.get("display_title", "")) or "Holiday" in str(src.get("title", "")):
                date_str = src.get("academic_date") or ""
                lines.append(f"{idx}. Holiday Announcement (Date: {date_str})")
            else:
                cls_name = src.get("classroom_name") or src.get("location") or "DBMS"
                date_str = src.get("academic_date") or ""
                date_part = f", Date: {date_str}" if date_str else ""
                lines.append(f"{idx}. Announcement (Classroom: {cls_name}{date_part})")
        elif stype == "NOTE" or "Workspace Note" in str(src.get("title", "")):
            note_title = src.get("note_title") or src.get("title") or "Workspace Note"
            if note_title.startswith("Workspace Note: "):
                note_title = note_title[16:]
            if note_title.startswith("Title: "):
                note_title = note_title[7:]
            lines.append(f"{idx}. Workspace Note (Title: {note_title})")
        else:
            title = src.get("original_filename") or src.get("title") or "Resource"
            loc = src.get("classroom_name") or src.get("location") or "DBMS"
            lines.append(f"{idx}. File: {title} (Location: {loc})")
    
    return "\n".join(lines)

def build_source_payload_item(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Format unified source document payload item for frontend UI citation panel."""
    stype = doc.get("source_type")
    
    if stype == "ANNOUNCEMENT":
        display_t = doc.get("display_title") or ("Holiday Announcement" if doc.get("is_holiday") else "Announcement")
        loc = doc.get("classroom_name") or "Classroom"
        date_str = doc.get("academic_date") or ""
        snippet = (doc.get("content") or doc.get("snippet") or "")[:180]
        return {
            "id": str(doc.get("id")),
            "title": display_t,
            "original_filename": display_t,
            "file_type": "ANNOUNCEMENT",
            "classroom_id": str(doc.get("classroom_id")) if doc.get("classroom_id") else None,
            "classroom_name": loc,
            "classroomName": loc,
            "location": f"Classroom: {loc}" + (f" | Date: {date_str}" if date_str else ""),
            "academic_date": date_str,
            "similarity": 1.0,
            "snippet": snippet,
            "extracted_text": doc.get("content"),
            "source_type": "ANNOUNCEMENT",
            "is_workspace": False
        }
    elif stype == "NOTE":
        note_t = doc.get("title") or "Personal Note"
        snippet = (doc.get("content") or doc.get("snippet") or "")[:180]
        return {
            "id": str(doc.get("id")),
            "title": "Workspace Note",
            "original_filename": f"Workspace Note: {note_t}",
            "file_type": "NOTE",
            "classroom_name": "Personal Workspace Note",
            "classroomName": "Personal Workspace Note",
            "location": f"Title: {note_t}",
            "note_title": note_t,
            "similarity": 1.0,
            "snippet": snippet,
            "extracted_text": doc.get("content"),
            "source_type": "NOTE",
            "is_workspace": True
        }
    else:
        # Resource file (Classroom or Workspace)
        snippet_text = doc.get("extracted_text") or doc.get("content") or doc.get("description") or ""
        snippet = snippet_text[:180] + "..." if len(snippet_text) > 180 else snippet_text
        cls_id = doc.get("classroom_id")
        loc = doc.get("classroom_name") or doc.get("classroomName") or ("DBMS" if cls_id else "Personal Workspace")

        return {
            "id": str(doc.get("id")),
            "title": doc.get("original_filename") or doc.get("title") or "Document",
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
            "source_type": "RESOURCE",
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
    """Construct RAG context string from provided items."""
    context_blocks = []
    
    # Priority 1: Classroom Resources
    for doc in classroom_docs:
        title = doc.get("original_filename") or doc.get("title") or "Classroom Document"
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
            date_info = f" (Academic Date: {ae['academic_date']})" if ae.get("academic_date") else ""
            context_blocks.append(f"CLASSROOM ANNOUNCEMENT: {title}{date_info}\nLOCATION: {loc}\n\nCONTENT:\n{content}")

    # Priority 3: Workspace Resources
    for wdoc in workspace_docs:
        title = wdoc.get("original_filename") or wdoc.get("title") or "Workspace File"
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
            date_info = f" (Date: {te['academic_date']})" if te.get("academic_date") else ""
            context_blocks.append(f"TIMELINE EVENT: {title}{date_info}\nLOCATION: {loc}\n\nCONTENT:\n{content}")

    return "\n\n---\n\n".join(context_blocks)

def answer_question_with_rag(db: Session, question: str, current_user: User) -> Dict[str, Any]:
    """
    Acadrium RAG Engine with Exact Source Attribution & Current Date Reasoning.
    """
    if not question or not question.strip():
        return {
            "answer": "Please ask a specific academic question.",
            "sources": []
        }

    clean_q = question.strip()
    q_low = clean_q.lower()

    # System Date Configuration (Current Date: e.g. 28 Sep 2026)
    now = datetime.now()
    current_date_str = now.strftime("%d %B %Y")
    current_day = now.strftime("%A")

    # Fetch available database objects
    classroom_matches = semantic_search_resources(db, clean_q, current_user, limit=8)
    workspace_matches = semantic_search_workspace_files(db, clean_q, current_user, limit=5)
    announcements_events = get_user_announcements_and_events(db, current_user)
    workspace_notes = get_user_workspace_notes(db, current_user)

    # Detect Query Intent
    is_date_or_schedule_query = any(kw in q_low for kw in [
        "date", "dates", "schedule", "when", "today", "tomorrow", "this month", "next week",
        "upcoming", "recent", "holiday", "event", "covered on", "taught on", "happened on", "exam"
    ]) or bool(re.search(r'\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b', q_low))

    # Detect specific date mention (e.g. "10 Oct", "18 Nov", "15 Nov")
    specific_date_matches = []
    if is_date_or_schedule_query:
        for ae in announcements_events:
            date_str = (ae.get("academic_date") or "").lower()
            title_text = (ae.get("title") or "").lower()
            content_text = (ae.get("content") or "").lower()
            
            # Check if user query matches date or announcement text
            words_in_q = [w for w in re.findall(r'\w+', q_low) if len(w) >= 3]
            if (date_str and any(w in date_str for w in words_in_q if w in ["10", "oct", "october", "18", "nov", "november", "15"])) or \
               any(w in title_text or w in content_text for w in words_in_q if len(w) > 3):
                ae["source_type"] = "ANNOUNCEMENT"
                specific_date_matches.append(ae)

    # Detect Workspace Note match
    matching_notes = []
    q_words = [w for w in re.findall(r'\w+', q_low) if len(w) > 3]
    for note in workspace_notes:
        note_text = (note.get("title", "") + " " + note.get("content", "")).lower()
        if any(w in note_text for w in q_words):
            note["source_type"] = "NOTE"
            matching_notes.append(note)

    # Filter vector search resources (only keep strong semantic matches: similarity >= 0.18 or keyword match in title)
    relevant_classroom_docs = []
    for d in classroom_matches:
        sim = d.get("similarity", 0.0)
        title_low = (d.get("title") or d.get("original_filename") or "").lower()
        has_title_kw = any(w in title_low for w in q_words if w not in ["what", "which", "topics", "covered", "dates", "month"])
        if sim >= 0.18 or has_title_kw:
            d["source_type"] = "RESOURCE"
            relevant_classroom_docs.append(d)

    relevant_workspace_docs = []
    for d in workspace_matches:
        sim = d.get("similarity", 0.0)
        title_low = (d.get("title") or d.get("original_filename") or "").lower()
        has_title_kw = any(w in title_low for w in q_words if w not in ["what", "which", "topics", "covered", "dates", "month"])
        if sim >= 0.18 or has_title_kw:
            d["source_type"] = "RESOURCE"
            relevant_workspace_docs.append(d)

    # Source Selection Logic (Prevent displaying un-used vector matches for date/announcement queries)
    used_classroom_docs = []
    used_workspace_docs = []
    used_announcements = []
    used_notes = []

    if is_date_or_schedule_query and (specific_date_matches or announcements_events):
        # Date query: Prioritize announcements & events
        used_announcements = specific_date_matches if specific_date_matches else announcements_events[:5]
        # Only include resource docs if they are high similarity (> 0.25)
        used_classroom_docs = [d for d in relevant_classroom_docs if d.get("similarity", 0.0) >= 0.25]
        used_workspace_docs = [d for d in relevant_workspace_docs if d.get("similarity", 0.0) >= 0.25]
    elif matching_notes and not relevant_classroom_docs:
        # Note query
        used_notes = matching_notes[:3]
    else:
        # Resource query or mixed query
        used_classroom_docs = relevant_classroom_docs[:4]
        used_workspace_docs = relevant_workspace_docs[:3]
        used_announcements = specific_date_matches[:3] if specific_date_matches else []
        used_notes = matching_notes[:2] if matching_notes else []

    has_any_context = bool(used_classroom_docs or used_announcements or used_workspace_docs or used_notes)

    # Strict Zero-Hallucination Fallback if no context exists
    if not has_any_context:
        return {
            "answer": FALLBACK_MESSAGE,
            "sources": []
        }

    # Build exact sources payload for UI citations & backend attribution
    sources_payload = []
    seen_keys = set()

    for item in (used_classroom_docs + used_announcements + used_workspace_docs + used_notes):
        item_key = f"{item.get('id')}_{item.get('title')}"
        if item_key not in seen_keys:
            sources_payload.append(build_source_payload_item(item))
            seen_keys.add(item_key)
        if len(sources_payload) >= 4:
            break

    # Build Context string for Groq Qwen LLM
    context_text = build_rag_context(
        used_classroom_docs,
        used_announcements,
        used_workspace_docs,
        used_notes
    )

    sys_prompt = GROQ_SYSTEM_PROMPT_TEMPLATE.format(
        current_date_str=current_date_str,
        current_day=current_day
    )

    user_prompt = f"USER QUESTION: {clean_q}\n\nCONTEXT:\n{context_text}"

    # Query Groq LLM (Qwen)
    groq_answer = groq_service.generate_groq_answer(
        system_prompt=sys_prompt,
        user_prompt=user_prompt
    )

    if groq_answer:
        clean_groq = groq_answer.strip()
        if "I could not find sufficient information in the uploaded resources" in clean_groq:
            return {
                "answer": FALLBACK_MESSAGE,
                "sources": []
            }
        
        # Append formatted text attribution block if not already present
        if "Source:" not in clean_groq and "Sources:" not in clean_groq and sources_payload:
            clean_groq += format_sources_section(sources_payload)

        return {
            "answer": clean_groq,
            "sources": sources_payload
        }

    # Fallback to clean_academic_prose if Groq API is unreachable
    logger.info("Falling back to clean_academic_prose() for answer synthesis.")
    top_docs = used_classroom_docs[:2] + used_workspace_docs[:2]
    combined_raw_text = "\n\n".join([(d.get("extracted_text") or d.get("description") or d.get("content") or "") for d in (top_docs + used_announcements)])
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
