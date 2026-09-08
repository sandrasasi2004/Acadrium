import os
import sys
import time
import pymupdf
from fastapi.testclient import TestClient

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app
from app.services.document_processor import process_uploaded_resource, process_workspace_resource

client = TestClient(app)

def create_dummy_pdf(filepath: str, text: str):
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), text)
    doc.save(filepath)
    doc.close()

def test_timeline_and_metadata_flow():
    print("\n============================================================")
    print("STARTING PHASE 7.5 TIMELINE & METADATA INFRASTRUCTURE VERIFICATION")
    print("============================================================")

    timestamp = int(time.time())
    fac_email = f"fac_tl_{timestamp}@test.com"
    stu_email = f"stu_tl_{timestamp}@test.com"
    password = "Password123!"
    temp_files = []

    # 1. Faculty Register & Login
    fac_reg = client.post("/api/auth/register", json={
        "username": "Dr. Timeline Faculty",
        "email": fac_email,
        "password": password,
        "role": "faculty",
        "department": "Computer Science"
    })
    assert fac_reg.status_code == 200, f"Faculty registration failed: {fac_reg.text}"

    fac_login = client.post("/api/auth/login", json={"email": fac_email, "password": password})
    assert fac_login.status_code == 200, f"Faculty login failed: {fac_login.text}"
    fac_token = fac_login.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}
    print(f"[PASS 1] Faculty Register & Login Successful ({fac_email})")

    # 2. Faculty Creates Classroom -> Verify CLASSROOM_CREATED event
    create_class_resp = client.post("/api/classrooms", json={
        "subject": "Phase 7.5 Timeline CS601",
        "description": "Classroom for timeline event testing"
    }, headers=fac_headers)
    assert create_class_resp.status_code == 201, f"Classroom creation failed: {create_class_resp.text}"
    class_data = create_class_resp.json()
    classroom_id = class_data["id"]
    join_code = class_data["class_code"]
    print(f"[PASS 2] Faculty created classroom {classroom_id} with code {join_code}")

    # 3. Student Register & Login & Join Classroom -> Verify CLASSROOM_JOINED event
    stu_reg = client.post("/api/auth/register", json={
        "username": "Alex Timeline Student",
        "email": stu_email,
        "password": password,
        "role": "student",
        "department": "Computer Science"
    })
    assert stu_reg.status_code == 200

    stu_login = client.post("/api/auth/login", json={"email": stu_email, "password": password})
    assert stu_login.status_code == 200
    stu_token = stu_login.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    join_resp = client.post("/api/classrooms/join", json={"class_code": join_code}, headers=stu_headers)
    assert join_resp.status_code == 200
    print("[PASS 3] Student joined classroom successfully")

    try:
        # 4. Resource Upload & Metadata Extraction -> Verify RESOURCE_UPLOADED event and metadata fields
        pdf_path = f"temp_tl_{timestamp}.pdf"
        pdf_text = "Timeline infrastructure enables chronological tracking of academic memory."
        create_dummy_pdf(pdf_path, pdf_text)
        temp_files.append(pdf_path)

        with open(pdf_path, "rb") as f:
            upload_res = client.post("/api/resources/upload", data={
                "classroom_id": classroom_id,
                "title": "Timeline Architecture PDF",
                "description": "System specification"
            }, files={"file": ("timeline_arch.pdf", f, "application/pdf")}, headers=fac_headers)

        assert upload_res.status_code == 201
        res_data = upload_res.json()
        res_id = res_data["id"]
        assert res_data["uploaded_by_name"] == "Dr. Timeline Faculty"
        assert res_data["classroom_name"] == "Phase 7.5 Timeline CS601"

        # Trigger background processing synchronously
        process_uploaded_resource(res_id)

        res_details = client.get(f"/api/resources/{res_id}", headers=fac_headers).json()
        assert res_details["page_count"] >= 1
        assert res_details["word_count"] >= 5
        assert res_details["last_processed_at"] is not None
        print(f"[PASS 4] Resource Metadata verified: uploaded_by_name='{res_details['uploaded_by_name']}', pages={res_details['page_count']}, words={res_details['word_count']}")

        # 5. Workspace File Upload -> Verify WORKSPACE_FILE_UPLOADED event
        with open(pdf_path, "rb") as f:
            ws_upload = client.post("/api/workspace/upload", data={
                "title": "Private Research PDF"
            }, files={"file": ("private_research.pdf", f, "application/pdf")}, headers=fac_headers)

        assert ws_upload.status_code == 201
        ws_data = ws_upload.json()
        ws_id = ws_data["id"]
        assert ws_data["owner_name"] == "Dr. Timeline Faculty"

        process_workspace_resource(ws_id)

        ws_details = client.get(f"/api/workspace/{ws_id}", headers=fac_headers).json()
        assert ws_details["word_count"] >= 5
        assert ws_details["last_processed_at"] is not None
        print(f"[PASS 5] Workspace File Metadata verified: owner_name='{ws_details['owner_name']}', words={ws_details['word_count']}")

        # 6. Workspace Note Create & Update -> Verify NOTE_CREATED & NOTE_UPDATED events & metadata
        create_note_resp = client.post("/api/workspace/notes", json={
            "title": "Initial Study Note",
            "content": "First draft of study notes for timeline."
        }, headers=fac_headers)
        assert create_note_resp.status_code == 201
        note_data = create_note_resp.json()
        note_id = note_data["id"]
        assert note_data["word_count"] == 7

        update_note_resp = client.put(f"/api/workspace/notes/{note_id}", json={
            "title": "Updated Study Note Title",
            "content": "Expanded study note content with more detailed academic information."
        }, headers=fac_headers)
        assert update_note_resp.status_code == 200
        updated_note = update_note_resp.json()
        assert updated_note["word_count"] == 9
        assert updated_note["last_modified_at"] is not None
        print(f"[PASS 6] Workspace Note Metadata verified: word_count={updated_note['word_count']}, last_modified_at={updated_note['last_modified_at']}")

        # 7. Announcement Create & Update -> Verify ANNOUNCEMENT_CREATED & ANNOUNCEMENT_UPDATED events & announcement_type
        create_ann_resp = client.post("/api/announcements", json={
            "classroom_id": classroom_id,
            "title": "Midterm Examination Date Announcement",
            "content": "The midterm exam will be conducted next Monday.",
            "announcement_type": "EXAM"
        }, headers=fac_headers)
        assert create_ann_resp.status_code == 201
        ann_data = create_ann_resp.json()
        ann_id = ann_data["id"]
        assert ann_data["announcement_type"] == "EXAM"
        assert ann_data["author_name"] == "Dr. Timeline Faculty"
        assert ann_data["classroom_name"] == "Phase 7.5 Timeline CS601"

        update_ann_resp = client.put(f"/api/announcements/{ann_id}", json={
            "title": "Updated Midterm Exam Details",
            "announcement_type": "NOTICE"
        }, headers=fac_headers)
        assert update_ann_resp.status_code == 200
        updated_ann = update_ann_resp.json()
        assert updated_ann["announcement_type"] == "NOTICE"
        print(f"[PASS 7] Announcement Metadata verified: type='{updated_ann['announcement_type']}', author='{updated_ann['author_name']}', classroom='{updated_ann['classroom_name']}'")

        # 8. Timeline API GET /api/timeline Verification
        tl_resp = client.get("/api/timeline", headers=fac_headers)
        assert tl_resp.status_code == 200
        timeline_events = tl_resp.json()
        assert len(timeline_events) >= 6
        event_types = [e["event_type"] for e in timeline_events]
        assert "CLASSROOM_CREATED" in event_types
        assert "RESOURCE_UPLOADED" in event_types
        assert "WORKSPACE_FILE_UPLOADED" in event_types
        assert "NOTE_CREATED" in event_types
        assert "NOTE_UPDATED" in event_types
        assert "ANNOUNCEMENT_CREATED" in event_types
        assert "ANNOUNCEMENT_UPDATED" in event_types
        print(f"[PASS 8] GET /api/timeline returned {len(timeline_events)} events for Faculty including all event types: {set(event_types)}")

        # 9. Student Timeline Verification
        stu_tl_resp = client.get("/api/timeline", headers=stu_headers)
        assert stu_tl_resp.status_code == 200
        stu_events = stu_tl_resp.json()
        stu_event_types = [e["event_type"] for e in stu_events]
        assert "CLASSROOM_JOINED" in stu_event_types
        assert "RESOURCE_UPLOADED" in stu_event_types
        assert "ANNOUNCEMENT_CREATED" in stu_event_types
        print(f"[PASS 9] Student timeline verified: accessible classroom events visible ({len(stu_events)} events)")

        # 10. Timeline Query Param Filtering Verification
        filtered_tl = client.get(f"/api/timeline?classroom_id={classroom_id}&event_type=ANNOUNCEMENT_CREATED", headers=fac_headers)
        assert filtered_tl.status_code == 200
        filtered_events = filtered_tl.json()
        assert len(filtered_events) == 1
        assert filtered_events[0]["event_type"] == "ANNOUNCEMENT_CREATED"
        print(f"[PASS 10] Timeline query filtering verified: classroom_id & event_type filter returned exactly 1 event")

    finally:
        # Cleanup
        for tf in temp_files:
            if os.path.exists(tf):
                try:
                    os.remove(tf)
                except Exception:
                    pass
        client.delete(f"/api/classrooms/{classroom_id}", headers=fac_headers)

    print("============================================================")
    print("ALL PHASE 7.5 TIMELINE & METADATA TESTS PASSED 100%")
    print("============================================================\n")

if __name__ == "__main__":
    from cleanup_test_data import run_cleanup
    try:
        test_timeline_and_metadata_flow()
    finally:
        print("\n[TEARDOWN] Cleaning up timeline flow test data...")
        run_cleanup(dry_run=False)

