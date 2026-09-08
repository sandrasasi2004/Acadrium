#!/usr/bin/env python3
"""
Production Data Cleanup Script for Acadrium
===========================================

Identifies and removes automated test data from PostgreSQL and disk storage.
Ensures real user data is strictly preserved based on safe matching rules.

Usage:
  python cleanup_test_data.py --dry-run
  python cleanup_test_data.py
"""

import sys
import os
import argparse
from pathlib import Path

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import app.models  # Ensures all SQLAlchemy models are registered
from app.database.session import SessionLocal
from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember
from app.models.resource import Resource
from app.models.workspace_resource import WorkspaceResource
from app.models.workspace_note import WorkspaceNote
from app.models.announcement import Announcement
from app.models.timeline_event import TimelineEvent

# Safe Matching Rules
TEST_EMAIL_DOMAINS = ["@test.com", "@example.com", "@acadrium.com"]
TEST_EMAIL_PREFIXES = [
    "test_", "fac_", "faculty_", "stu_", "student_", "audit_", "flow_", "e2e_", "fac2_"
]
TEST_USER_NAMES = [
    "Test Faculty",
    "Test Student",
    "Dr. Timeline Faculty",
    "Dr. Document Processor",
    "Prof. Alan Turing",
    "Dr. Sarah Audit",
    "Dr. Sarah Updated Audit",
    "Faculty Test User",
    "Student Test User"
]

def is_test_user(user: User) -> bool:
    """Determine if a user object represents an automated test user."""
    email_lower = user.email.lower()
    full_name = user.full_name.strip()

    # Domain check
    for domain in TEST_EMAIL_DOMAINS:
        if email_lower.endswith(domain):
            return True

    # Prefix check
    for prefix in TEST_EMAIL_PREFIXES:
        if email_lower.startswith(prefix):
            return True

    # Known name check
    if full_name in TEST_USER_NAMES:
        return True

    return False

def get_upload_dir() -> Path:
    """Return absolute path to uploads directory."""
    return Path(__file__).parent.resolve() / "uploads"

def safe_remove_file(file_path_str: str, dry_run: bool = True) -> bool:
    """Safely delete physical file if inside uploads directory."""
    if not file_path_str:
        return False

    upload_base = get_upload_dir()
    p = Path(file_path_str).resolve()

    # Ensure path is within backend/uploads
    try:
        p.relative_to(upload_base)
    except ValueError:
        # File is outside uploads directory - DO NOT DELETE
        print(f"[SECURITY WARNING] Skipped file outside uploads directory: {file_path_str}")
        return False

    if p.exists() and p.is_file():
        if not dry_run:
            try:
                p.unlink()
                return True
            except Exception as e:
                print(f"[WARN] Failed to delete file {p}: {e}")
                return False
        return True
    return False

def run_cleanup(dry_run: bool = True):
    """Main cleanup logic."""
    db = SessionLocal()
    mode_str = "[DRY-RUN MODE]" if dry_run else "[LIVE EXECUTION MODE]"
    print("=" * 65)
    print(f"  ACADRIUM PRODUCTION DATA CLEANUP AUDIT {mode_str}")
    print("=" * 65)

    try:
        # 1. Identify Test Users
        all_users = db.query(User).all()
        test_users = [u for u in all_users if is_test_user(u)]
        test_user_ids = {u.id for u in test_users}

        # 2. Identify Test Classrooms (created by test user OR test classroom name)
        all_classrooms = db.query(Classroom).all()
        test_classrooms = [
            c for c in all_classrooms
            if c.faculty_id in test_user_ids or "Phase " in (c.name or "") or "Audit Database Systems" in (c.name or "")
        ]
        test_classroom_ids = {c.id for c in test_classrooms}

        # 3. Identify Test Resources
        all_resources = db.query(Resource).all()
        test_resources = [
            r for r in all_resources
            if r.uploaded_by in test_user_ids or r.classroom_id in test_classroom_ids
        ]
        test_resource_ids = {r.id for r in test_resources}

        # 4. Identify Test Workspace Resources
        all_workspace_resources = db.query(WorkspaceResource).all()
        test_workspace_resources = [
            wr for wr in all_workspace_resources
            if wr.owner_id in test_user_ids
        ]
        test_workspace_resource_ids = {wr.id for wr in test_workspace_resources}

        # 5. Identify Test Workspace Notes
        all_workspace_notes = db.query(WorkspaceNote).all()
        test_workspace_notes = [
            wn for wn in all_workspace_notes
            if wn.owner_id in test_user_ids
        ]
        test_workspace_note_ids = {wn.id for wn in test_workspace_notes}

        # 6. Identify Test Announcements
        all_announcements = db.query(Announcement).all()
        test_announcements = [
            a for a in all_announcements
            if a.posted_by in test_user_ids or a.classroom_id in test_classroom_ids
        ]
        test_announcement_ids = {a.id for a in test_announcements}

        # 7. Identify Test Timeline Events
        test_user_id_strs = {str(uid) for uid in test_user_ids}
        test_classroom_id_strs = {str(cid) for cid in test_classroom_ids}
        test_entity_ids = test_user_id_strs | test_classroom_id_strs | {str(rid) for rid in test_resource_ids} | {str(wrid) for wrid in test_workspace_resource_ids} | {str(wnid) for wnid in test_workspace_note_ids} | {str(aid) for aid in test_announcement_ids}

        all_timeline_events = db.query(TimelineEvent).all()
        test_timeline_events = [
            te for te in all_timeline_events
            if (te.user_id and str(te.user_id) in test_user_id_strs) or
               (te.classroom_id and str(te.classroom_id) in test_classroom_id_strs) or
               (te.entity_id and str(te.entity_id) in test_entity_ids)
        ]

        # 8. Identify Physical Files to Delete
        files_to_delete = []
        for r in test_resources:
            if r.file_path and Path(r.file_path).exists():
                files_to_delete.append((r.file_path, f"Resource: '{r.title}'"))
        for wr in test_workspace_resources:
            if wr.file_path and Path(wr.file_path).exists():
                files_to_delete.append((wr.file_path, f"WorkspaceResource: '{wr.title}'"))

        # Display Summary
        print(f"\n[IDENTIFICATION REPORT]")
        print(f"  • Test Users to delete: {len(test_users)}")
        for u in test_users:
            print(f"      - {u.full_name} ({u.email}) [ID: {u.id}]")

        print(f"  • Test Classrooms to delete: {len(test_classrooms)}")
        for c in test_classrooms:
            print(f"      - {c.name} [Code: {c.class_code}] [ID: {c.id}]")

        print(f"  • Test Resources to delete: {len(test_resources)}")
        for r in test_resources:
            print(f"      - {r.title} ({r.file_type}) [ID: {r.id}]")

        print(f"  • Test Workspace Resources to delete: {len(test_workspace_resources)}")
        for wr in test_workspace_resources:
            print(f"      - {wr.title} ({wr.file_type}) [ID: {wr.id}]")

        print(f"  • Test Workspace Notes to delete: {len(test_workspace_notes)}")
        for wn in test_workspace_notes:
            print(f"      - {wn.title} [ID: {wn.id}]")

        print(f"  • Test Announcements to delete: {len(test_announcements)}")
        for a in test_announcements:
            print(f"      - {a.title} [ID: {a.id}]")

        print(f"  • Test Timeline Events to delete: {len(test_timeline_events)}")

        print(f"  • Physical Upload Files to delete: {len(files_to_delete)}")
        for fpath, label in files_to_delete:
            print(f"      - {fpath} ({label})")

        if dry_run:
            print(f"\n[DRY-RUN COMPLETED] No changes were made to PostgreSQL or disk files.")
            print(f"To perform real deletion, run: python cleanup_test_data.py\n")
            return

        # LIVE EXECUTION DELETION
        print("\n[PERFORMING LIVE DELETION]")

        # Delete Physical Files First
        deleted_files_count = 0
        for fpath, label in files_to_delete:
            if safe_remove_file(fpath, dry_run=False):
                deleted_files_count += 1
                print(f"  [DISK DELETED] {fpath}")

        # Delete Database Records (Cascading order)
        for te in test_timeline_events:
            db.delete(te)
        for a in test_announcements:
            db.delete(a)
        for wn in test_workspace_notes:
            db.delete(wn)
        for wr in test_workspace_resources:
            db.delete(wr)
        for r in test_resources:
            db.delete(r)

        # Delete classroom members for test classrooms
        if test_classroom_ids:
            members_to_del = db.query(ClassroomMember).filter(
                (ClassroomMember.classroom_id.in_(test_classroom_ids)) |
                (ClassroomMember.student_id.in_(test_user_ids))
            ).all()
            for m in members_to_del:
                db.delete(m)

        for c in test_classrooms:
            db.delete(c)
        for u in test_users:
            db.delete(u)

        db.commit()
        print("[SUCCESS] All test records and physical files committed deletion successfully.")

        # Print Final Table Counts
        print("\n============================================================")
        print("FINAL POSTGRESQL DATABASE ROW COUNTS AFTER CLEANUP")
        print("============================================================")
        print(f"  users:               {db.query(User).count()}")
        print(f"  classrooms:          {db.query(Classroom).count()}")
        print(f"  classroom_members:   {db.query(ClassroomMember).count()}")
        print(f"  resources:           {db.query(Resource).count()}")
        print(f"  workspace_resources: {db.query(WorkspaceResource).count()}")
        print(f"  workspace_notes:     {db.query(WorkspaceNote).count()}")
        print(f"  announcements:       {db.query(Announcement).count()}")
        print(f"  timeline_events:     {db.query(TimelineEvent).count()}")
        print("============================================================\n")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Cleanup failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean up Acadrium test data from DB and disk.")
    parser.add_argument("--dry-run", action="store_true", help="Print items to delete without executing deletion.")
    args = parser.parse_args()

    run_cleanup(dry_run=args.dry_run)
