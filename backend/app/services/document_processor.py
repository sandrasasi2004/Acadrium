import os
import time
import logging
import shutil
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember
from app.models.resource import Resource
from app.models.workspace_resource import WorkspaceResource

# Setup logger for document processor module
logger = logging.getLogger("acadrium.document_processor")

def is_tesseract_available() -> bool:
    """Check if Tesseract OCR binary is installed and reachable."""
    try:
        import pytesseract

        # 1. Check custom environment variable overrides
        env_cmd = os.environ.get("TESSERACT_CMD") or os.environ.get("TESSERACT_PATH")
        if env_cmd and os.path.exists(env_cmd):
            pytesseract.pytesseract.tesseract_cmd = env_cmd
            return True

        # 2. Check if tesseract binary is in System PATH
        which_path = shutil.which("tesseract") or shutil.which("tesseract.exe")
        if which_path:
            pytesseract.pytesseract.tesseract_cmd = which_path
            return True

        # 3. Check standard Windows installation paths
        win_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
            r"C:\ProgramData\chocolatey\bin\tesseract.exe",
            r"C:\ProgramData\chocolatey\lib\tesseract\tools\tesseract.exe",
        ]
        for path in win_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                return True

        return False
    except Exception as e:
        logger.warning(f"Error checking Tesseract OCR availability: {e}")
        return False

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from all pages of a PDF using PyMuPDF (pymupdf/fitz)."""
    import pymupdf  # fitz
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Physical file not found at path: {file_path}")

    doc = pymupdf.open(file_path)
    text_chunks = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()
        if page_text and page_text.strip():
            text_chunks.append(page_text.strip())
    doc.close()
    
    extracted = "\n\n".join(text_chunks).strip()
    return extracted

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from paragraphs, headings, and tables of a Word document using python-docx."""
    import docx
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Physical file not found at path: {file_path}")

    doc = docx.Document(file_path)
    text_chunks = []
    
    for paragraph in doc.paragraphs:
        if paragraph.text and paragraph.text.strip():
            text_chunks.append(paragraph.text.strip())

    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                text_chunks.append(" | ".join(row_text))

    return "\n".join(text_chunks).strip()

def extract_text_from_pptx(file_path: str) -> str:
    """Extract text from slide titles, text boxes, and bullets of a PowerPoint presentation using python-pptx."""
    import pptx
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Physical file not found at path: {file_path}")

    prs = pptx.Presentation(file_path)
    text_chunks = []
    
    for slide_idx, slide in enumerate(prs.slides, 1):
        slide_title = ""
        if slide.shapes.title and slide.shapes.title.text:
            slide_title = slide.shapes.title.text.strip()
            text_chunks.append(f"Slide {slide_idx}: {slide_title}")
        else:
            text_chunks.append(f"Slide {slide_idx}")

        for shape in slide.shapes:
            if shape.has_text_frame and shape != slide.shapes.title:
                for paragraph in shape.text_frame.paragraphs:
                    if paragraph.text and paragraph.text.strip():
                        text_chunks.append(paragraph.text.strip())

    return "\n\n".join(text_chunks).strip()

def extract_text_from_textfile(file_path: str) -> str:
    """Read plain text directly from file with fallback encodings."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Physical file not found at path: {file_path}")

    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                return f.read().strip()
        except UnicodeDecodeError:
            continue

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read().strip()

def extract_text_from_image(file_path: str) -> str:
    """Perform OCR extraction on image file using Pillow and pytesseract."""
    import pytesseract
    from PIL import Image

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Physical file not found at path: {file_path}")

    if not is_tesseract_available():
        error_msg = (
            "Tesseract OCR executable not found on host machine. "
            "Please install Tesseract-OCR to enable image text extraction."
        )
        logger.error(error_msg)
        raise RuntimeError(error_msg)

    img = Image.open(file_path)
    text = pytesseract.image_to_string(img)
    return text.strip()

def extract_text_by_file_path(file_path: str, original_filename: str) -> str:
    """Detect file type by extension and delegate to appropriate extraction method."""
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""

    if ext == "pdf":
        return extract_text_from_pdf(file_path)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_path)
    elif ext in ("pptx", "ppt"):
        return extract_text_from_pptx(file_path)
    elif ext == "txt":
        return extract_text_from_textfile(file_path)
    elif ext in ("png", "jpg", "jpeg", "webp"):
        return extract_text_from_image(file_path)
    else:
        return extract_text_from_textfile(file_path)

def compute_file_metadata(file_path: str, original_filename: str, extracted_text: str) -> Tuple[int, int]:
    """Calculate page count and word count for document metadata."""
    word_count = len(extracted_text.split()) if extracted_text else 0
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else ""
    page_count = 1

    try:
        if ext == "pdf":
            import pymupdf
            doc = pymupdf.open(file_path)
            page_count = max(1, len(doc))
            doc.close()
        elif ext in ("docx", "doc"):
            import docx
            doc = docx.Document(file_path)
            page_count = max(1, len(doc.paragraphs))
        elif ext in ("pptx", "ppt"):
            import pptx
            prs = pptx.Presentation(file_path)
            page_count = max(1, len(prs.slides))
    except Exception:
        page_count = 1

    return page_count, word_count

def process_uploaded_resource(resource_id: str, db: Optional[Session] = None) -> Optional[Resource]:
    """Process document text extraction for a Classroom Resource in PostgreSQL in background."""
    close_db_when_done = False
    if db is None:
        from app.database.session import SessionLocal
        db = SessionLocal()
        close_db_when_done = True

    try:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            logger.error(f"Resource {resource_id} not found in database for extraction.")
            return None

        # Ensure metadata snapshots are populated
        if not resource.uploaded_by_name and resource.uploader:
            resource.uploaded_by_name = resource.uploader.full_name
        if not resource.classroom_name and resource.classroom:
            resource.classroom_name = resource.classroom.name

        is_image_file = (resource.file_type or "").upper() == "IMAGE"
        
        logger.info(f"File Uploaded | Extraction Started | resource_id={resource.id} | file_type={resource.file_type}")
        resource.extraction_status = "PROCESSING"
        if is_image_file:
            resource.ocr_status = "PROCESSING" if is_tesseract_available() else "UNAVAILABLE"
        else:
            resource.ocr_status = "NOT_APPLICABLE"
        resource.updated_at = datetime.now(timezone.utc)
        db.commit()

        start_time = time.time()
        try:
            extracted = extract_text_by_file_path(resource.file_path, resource.original_filename)
            processing_time = round(time.time() - start_time, 3)

            page_cnt, word_cnt = compute_file_metadata(resource.file_path, resource.original_filename, extracted)

            resource.extracted_text = extracted
            resource.page_count = page_cnt
            resource.word_count = word_cnt
            
            # Phase 2 — Generate vector embedding if extracted text is available
            if extracted and extracted.strip():
                try:
                    from app.services.embedding_service import generate_embedding
                    emb = generate_embedding(extracted)
                    if emb:
                        resource.embedding = emb
                        logger.info(f"Vector Embedding Generated | resource_id={resource.id} | dimensions={len(emb)}")
                except Exception as emb_err:
                    logger.error(f"Failed to generate embedding for resource {resource.id}: {emb_err}")

            resource.last_processed_at = datetime.now(timezone.utc)
            resource.extraction_status = "COMPLETED"
            if is_image_file:
                resource.ocr_status = "COMPLETED"
            resource.extraction_error = None
            resource.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(resource)

            logger.info(
                f"Extraction Completed | resource_id={resource.id} | "
                f"file_type={resource.file_type} | processing_time={processing_time}s | "
                f"extracted_length={len(extracted)} chars | pages={page_cnt} | words={word_cnt}"
            )
            return resource
        except Exception as e:
            processing_time = round(time.time() - start_time, 3)
            page_cnt, word_cnt = compute_file_metadata(resource.file_path, resource.original_filename, "")

            resource.extraction_status = "FAILED"
            if is_image_file:
                resource.ocr_status = "UNAVAILABLE" if not is_tesseract_available() else "FAILED"
            resource.extraction_error = str(e)
            resource.page_count = resource.page_count or page_cnt
            resource.word_count = resource.word_count or word_cnt
            resource.last_processed_at = datetime.now(timezone.utc)
            resource.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(resource)

            logger.error(
                f"Extraction Failed | resource_id={resource.id} | "
                f"file_type={resource.file_type} | processing_time={processing_time}s | "
                f"error={str(e)}"
            )
            return resource
    finally:
        if close_db_when_done:
            db.close()

def process_workspace_resource(resource_id: str, db: Optional[Session] = None) -> Optional[WorkspaceResource]:
    """Process document text extraction for a Workspace Resource in PostgreSQL in background."""
    close_db_when_done = False
    if db is None:
        from app.database.session import SessionLocal
        db = SessionLocal()
        close_db_when_done = True

    try:
        workspace_res = db.query(WorkspaceResource).filter(WorkspaceResource.id == resource_id).first()
        if not workspace_res:
            logger.error(f"WorkspaceResource {resource_id} not found in database for extraction.")
            return None

        # Ensure owner_name snapshot is populated
        if not workspace_res.owner_name and workspace_res.owner:
            workspace_res.owner_name = workspace_res.owner.full_name

        is_image_file = (workspace_res.file_type or "").upper() == "IMAGE"

        logger.info(f"File Uploaded | Extraction Started | resource_id={workspace_res.id} | file_type={workspace_res.file_type}")
        workspace_res.extraction_status = "PROCESSING"
        if is_image_file:
            workspace_res.ocr_status = "PROCESSING" if is_tesseract_available() else "UNAVAILABLE"
        else:
            workspace_res.ocr_status = "NOT_APPLICABLE"
        workspace_res.updated_at = datetime.now(timezone.utc)
        db.commit()

        start_time = time.time()
        try:
            extracted = extract_text_by_file_path(workspace_res.file_path, workspace_res.original_filename)
            processing_time = round(time.time() - start_time, 3)

            page_cnt, word_cnt = compute_file_metadata(workspace_res.file_path, workspace_res.original_filename, extracted)

            workspace_res.extracted_text = extracted
            workspace_res.page_count = page_cnt
            workspace_res.word_count = word_cnt

            # Phase 2 — Generate vector embedding if extracted text is available
            if extracted and extracted.strip():
                try:
                    from app.services.embedding_service import generate_embedding
                    emb = generate_embedding(extracted)
                    if emb:
                        workspace_res.embedding = emb
                        logger.info(f"Vector Embedding Generated | workspace_resource_id={workspace_res.id} | dimensions={len(emb)}")
                except Exception as emb_err:
                    logger.error(f"Failed to generate embedding for workspace resource {workspace_res.id}: {emb_err}")

            workspace_res.last_processed_at = datetime.now(timezone.utc)
            workspace_res.extraction_status = "COMPLETED"
            if is_image_file:
                workspace_res.ocr_status = "COMPLETED"
            workspace_res.extraction_error = None
            workspace_res.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(workspace_res)

            logger.info(
                f"Extraction Completed | resource_id={workspace_res.id} | "
                f"file_type={workspace_res.file_type} | processing_time={processing_time}s | "
                f"extracted_length={len(extracted)} chars | pages={page_cnt} | words={word_cnt}"
            )
            return workspace_res
        except Exception as e:
            processing_time = round(time.time() - start_time, 3)
            page_cnt, word_cnt = compute_file_metadata(workspace_res.file_path, workspace_res.original_filename, "")

            workspace_res.extraction_status = "FAILED"
            if is_image_file:
                workspace_res.ocr_status = "UNAVAILABLE" if not is_tesseract_available() else "FAILED"
            workspace_res.extraction_error = str(e)
            workspace_res.page_count = workspace_res.page_count or page_cnt
            workspace_res.word_count = workspace_res.word_count or word_cnt
            workspace_res.last_processed_at = datetime.now(timezone.utc)
            workspace_res.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(workspace_res)

            logger.error(
                f"Extraction Failed | resource_id={workspace_res.id} | "
                f"file_type={workspace_res.file_type} | processing_time={processing_time}s | "
                f"error={str(e)}"
            )
            return workspace_res
    finally:
        if close_db_when_done:
            db.close()

def reprocess_all_uploaded_resources(db: Session) -> List[Resource]:
    """Reprocess all classroom resources in the database."""
    resources = db.query(Resource).all()
    processed_list = []
    for r in resources:
        res = process_uploaded_resource(str(r.id), db=db)
        if res:
            processed_list.append(res)
    return processed_list

def reprocess_all_workspace_resources(db: Session, owner_id: Optional[str] = None) -> List[WorkspaceResource]:
    """Reprocess all workspace resources in the database."""
    query = db.query(WorkspaceResource)
    if owner_id:
        query = query.filter(WorkspaceResource.owner_id == owner_id)
    resources = query.all()
    processed_list = []
    for r in resources:
        res = process_workspace_resource(str(r.id), db=db)
        if res:
            processed_list.append(res)
    return processed_list

def search_resources_by_text(db: Session, query: str, current_user: User) -> List[Resource]:
    """Search classroom resources by extracted text using PostgreSQL ILIKE."""
    pattern = f"%{query.strip()}%"
    if current_user.role == "faculty":
        faculty_classroom_ids = [c.id for c in db.query(Classroom.id).filter(Classroom.faculty_id == current_user.id).all()]
        if not faculty_classroom_ids:
            return []
        return db.query(Resource).filter(
            Resource.classroom_id.in_(faculty_classroom_ids),
            Resource.extracted_text.ilike(pattern)
        ).all()
    else:
        enrolled_classroom_ids = [m.classroom_id for m in db.query(ClassroomMember.classroom_id).filter(ClassroomMember.student_id == current_user.id).all()]
        if not enrolled_classroom_ids:
            return []
        return db.query(Resource).filter(
            Resource.classroom_id.in_(enrolled_classroom_ids),
            Resource.extracted_text.ilike(pattern)
        ).all()

def search_workspace_files_by_text(db: Session, query: str, current_user: User) -> List[WorkspaceResource]:
    """Search personal workspace files by extracted text using PostgreSQL ILIKE."""
    pattern = f"%{query.strip()}%"
    return db.query(WorkspaceResource).filter(
        WorkspaceResource.owner_id == current_user.id,
        WorkspaceResource.extracted_text.ilike(pattern)
    ).all()
