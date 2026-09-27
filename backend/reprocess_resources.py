import os
import sys
import logging

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.services.document_processor import (
    reprocess_all_uploaded_resources,
    reprocess_all_workspace_resources,
    is_tesseract_available
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("acadrium.reprocess_cli")

def main():
    print("\n============================================================")
    print("        ACADRIUM DOCUMENT REPROCESSING CLI TOOL            ")
    print("============================================================")
    
    tesseract_ok = is_tesseract_available()
    print(f"[*] Tesseract OCR Status: {'AVAILABLE' if tesseract_ok else 'UNAVAILABLE (Image OCR will log graceful error)'}")
    
    db = SessionLocal()
    try:
        print("\n[1/2] Reprocessing Classroom Resources...")
        classroom_results = reprocess_all_uploaded_resources(db)
        print(f" -> Processed {len(classroom_results)} classroom resource files.")
        for r in classroom_results:
            status = r.extraction_status
            words = r.word_count or 0
            print(f"    - [{status}] '{r.title}' ({r.file_type}) | Words: {words} | ID: {r.id}")

        print("\n[2/2] Reprocessing Workspace Resources...")
        workspace_results = reprocess_all_workspace_resources(db)
        print(f" -> Processed {len(workspace_results)} workspace files.")
        for wr in workspace_results:
            status = wr.extraction_status
            words = wr.word_count or 0
            print(f"    - [{status}] '{wr.title}' ({wr.file_type}) | Words: {words} | ID: {wr.id}")

        print("\n============================================================")
        print("          DOCUMENT REPROCESSING COMPLETED SUCCESSFULLY       ")
        print("============================================================\n")
    except Exception as e:
        logger.error(f"Error during document reprocessing: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
