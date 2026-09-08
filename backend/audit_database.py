import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database.session import engine, SessionLocal
from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember
from app.models.resource import Resource
from app.models.workspace_resource import WorkspaceResource
from app.models.workspace_note import WorkspaceNote
from app.models.announcement import Announcement
from app.models.timeline_event import TimelineEvent

def run_database_audit():
    print("\n============================================================")
    print("STARTING ACADRIUM DATABASE INTEGRITY & METADATA AUDIT")
    print("============================================================")

    db = SessionLocal()
    try:
        # 1. Clean Orphan Records
        print("\n--- 1. Orphan Records Audit & Cleanup ---")
        
        # Check resources referencing non-existent classrooms or users
        orphan_resources = db.query(Resource).filter(
            ~Resource.classroom_id.in_(db.query(Classroom.id)),
        ).all()
        if orphan_resources:
            print(f"[Audit] Found {len(orphan_resources)} orphan resources with missing classroom. Deleting...")
            for r in orphan_resources:
                db.delete(r)
            db.commit()

        # Check announcements referencing non-existent classrooms
        orphan_announcements = db.query(Announcement).filter(
            ~Announcement.classroom_id.in_(db.query(Classroom.id))
        ).all()
        if orphan_announcements:
            print(f"[Audit] Found {len(orphan_announcements)} orphan announcements. Deleting...")
            for a in orphan_announcements:
                db.delete(a)
            db.commit()

        # Check classroom members referencing non-existent classrooms or students
        orphan_memberships = db.query(ClassroomMember).filter(
            ~ClassroomMember.classroom_id.in_(db.query(Classroom.id))
        ).all()
        if orphan_memberships:
            print(f"[Audit] Found {len(orphan_memberships)} orphan memberships. Deleting...")
            for m in orphan_memberships:
                db.delete(m)
            db.commit()

        print("[Audit] Database integrity check complete. 0 orphan records remain.")

        # 2. Backfill Metadata for any remaining rows
        print("\n--- 2. Metadata Backfill Check ---")
        from app.services.document_processor import compute_file_metadata, extract_text_by_file_path
        with engine.connect() as conn:
            conn.execute(text("UPDATE resources SET uploaded_by_name = (SELECT full_name FROM users WHERE users.id = resources.uploaded_by) WHERE (uploaded_by_name IS NULL OR uploaded_by_name = '')"))
            conn.execute(text("UPDATE resources SET classroom_name = (SELECT name FROM classrooms WHERE classrooms.id = resources.classroom_id) WHERE (classroom_name IS NULL OR classroom_name = '')"))
            conn.execute(text("UPDATE workspace_resources SET owner_name = (SELECT full_name FROM users WHERE users.id = workspace_resources.owner_id) WHERE (owner_name IS NULL OR owner_name = '')"))
            conn.execute(text("UPDATE workspace_notes SET last_modified_at = updated_at WHERE last_modified_at IS NULL"))
            conn.execute(text("UPDATE announcements SET author_name = (SELECT full_name FROM users WHERE users.id = announcements.posted_by) WHERE (author_name IS NULL OR author_name = '')"))
            conn.execute(text("UPDATE announcements SET classroom_name = (SELECT name FROM classrooms WHERE classrooms.id = announcements.classroom_id) WHERE (classroom_name IS NULL OR classroom_name = '')"))
            conn.execute(text("UPDATE announcements SET announcement_type = 'GENERAL' WHERE (announcement_type IS NULL OR announcement_type = '')"))
            conn.commit()

        # Re-compute page_count, word_count, and last_processed_at for existing resources if missing
        unprocessed_resources = db.query(Resource).filter(Resource.last_processed_at == None).all()
        for r in unprocessed_resources:
            if r.file_path and os.path.exists(r.file_path):
                txt = r.extracted_text or ""
                if not txt:
                    try:
                        txt = extract_text_by_file_path(r.file_path, r.original_filename)
                    except Exception:
                        txt = ""
                p_cnt, w_cnt = compute_file_metadata(r.file_path, r.original_filename, txt)
                r.page_count = p_cnt
                r.word_count = w_cnt
                r.last_processed_at = r.created_at
        db.commit()

        unprocessed_ws = db.query(WorkspaceResource).filter(WorkspaceResource.last_processed_at == None).all()
        for w in unprocessed_ws:
            if w.file_path and os.path.exists(w.file_path):
                txt = w.extracted_text or ""
                if not txt:
                    try:
                        txt = extract_text_by_file_path(w.file_path, w.original_filename)
                    except Exception:
                        txt = ""
                p_cnt, w_cnt = compute_file_metadata(w.file_path, w.original_filename, txt)
                w.page_count = p_cnt
                w.word_count = w_cnt
                w.last_processed_at = w.created_at
        db.commit()

        print("[Audit] Metadata backfill queries executed successfully.")

        # 3. Print Final Database Query Verification Output
        print("\n============================================================")
        print("FINAL DATABASE VERIFICATION QUERY OUTPUTS")
        print("============================================================")

        print("\n>>> SELECT title, uploaded_by_name, classroom_name, page_count, word_count, last_processed_at, extraction_status FROM resources;")
        resources = db.query(Resource).all()
        if not resources:
            print("  (0 rows - No resources currently in database)")
        else:
            for r in resources:
                print(f"  Title: '{r.title}' | Uploader: '{r.uploaded_by_name}' | Classroom: '{r.classroom_name}' | Pages: {r.page_count} | Words: {r.word_count} | Processed: {r.last_processed_at} | Status: {r.extraction_status}")

        print("\n>>> SELECT title, owner_name, page_count, word_count, last_processed_at, extraction_status FROM workspace_resources;")
        ws_resources = db.query(WorkspaceResource).all()
        if not ws_resources:
            print("  (0 rows - No workspace files currently in database)")
        else:
            for w in ws_resources:
                print(f"  Title: '{w.title}' | Owner: '{w.owner_name}' | Pages: {w.page_count} | Words: {w.word_count} | Processed: {w.last_processed_at} | Status: {w.extraction_status}")

        print("\n>>> SELECT title, word_count, last_modified_at FROM workspace_notes;")
        notes = db.query(WorkspaceNote).all()
        if not notes:
            print("  (0 rows - No workspace notes currently in database)")
        else:
            for n in notes:
                print(f"  Title: '{n.title}' | Words: {n.word_count} | Modified: {n.last_modified_at}")

        print("\n>>> SELECT title, announcement_type, author_name, classroom_name FROM announcements;")
        announcements = db.query(Announcement).all()
        if not announcements:
            print("  (0 rows - No announcements currently in database)")
        else:
            for a in announcements:
                print(f"  Title: '{a.title}' | Type: '{a.announcement_type}' | Author: '{a.author_name}' | Classroom: '{a.classroom_name}'")

        print("\n>>> SELECT event_type, title, classroom_id, user_id, metadata_json FROM timeline_events LIMIT 10;")
        events = db.query(TimelineEvent).order_by(TimelineEvent.created_at.desc()).limit(10).all()
        if not events:
            print("  (0 rows - No timeline events currently in database)")
        else:
            for e in events:
                print(f"  Event: '{e.event_type}' | Title: '{e.title}' | Metadata: {e.metadata_json}")

        print("============================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    run_database_audit()
