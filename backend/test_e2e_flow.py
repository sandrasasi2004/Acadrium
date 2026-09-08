import os
import sys
import time
import pymupdf
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app
from app.services.document_processor import process_uploaded_resource, process_workspace_resource

client = TestClient(app)

def create_sample_pdf(filepath: str, text: str):
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((50, 50), text)
    doc.save(filepath)
    doc.close()

def run_e2e_test_flow():
    print("\n============================================================")
    print("STARTING END-TO-END STABILITY & METADATA FLOW AUDIT TEST")
    print("============================================================")

    timestamp = int(time.time())
    fac_email = f"fac_e2e_{timestamp}@test.com"
    password = "Password123!"
    temp_files = []

    # 1. Create Faculty Account & Login
    reg_resp = client.post("/api/auth/register", json={
        "username": "Prof. Alan Turing",
        "email": fac_email,
        "password": password,
        "role": "faculty",
        "department": "Computer Science"
    })
    assert reg_resp.status_code == 200, f"Faculty registration failed: {reg_resp.text}"

    login_resp = client.post("/api/auth/login", json={"email": fac_email, "password": password})
    assert login_resp.status_code == 200, f"Faculty login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS 1] Created & Authenticated Faculty Account: {fac_email}")

    # 2. Create Classroom
    class_resp = client.post("/api/classrooms", json={
        "subject": "Theory of Computation CS701",
        "description": "Formal languages, automata, and complexity"
    }, headers=headers)
    assert class_resp.status_code == 201
    classroom_data = class_resp.json()
    classroom_id = classroom_data["id"]
    print(f"[PASS 2] Created Classroom: '{classroom_data['name']}' (ID: {classroom_id})")

    try:
        # 3. Upload PDF Resource
        pdf_path = f"temp_e2e_{timestamp}.pdf"
        pdf_text = "Deterministic Finite Automata and Regular Expressions."
        create_sample_pdf(pdf_path, pdf_text)
        temp_files.append(pdf_path)

        with open(pdf_path, "rb") as f:
            upload_pdf = client.post("/api/resources/upload", data={
                "classroom_id": classroom_id,
                "title": "Automata Theory PDF",
                "description": "Lecture notes on DFA"
            }, files={"file": ("automata.pdf", f, "application/pdf")}, headers=headers)

        assert upload_pdf.status_code == 201
        pdf_res = upload_pdf.json()
        pdf_id = pdf_res["id"]
        assert pdf_res["uploaded_by_name"] == "Prof. Alan Turing"
        assert pdf_res["classroom_name"] == "Theory of Computation CS701"

        # Execute extraction background task
        process_uploaded_resource(pdf_id)

        pdf_details = client.get(f"/api/resources/{pdf_id}", headers=headers).json()
        assert pdf_details["extraction_status"] == "COMPLETED"
        assert pdf_details["page_count"] >= 1
        assert pdf_details["word_count"] >= 5
        assert pdf_details["last_processed_at"] is not None
        print(f"[PASS 3] Uploaded & Processed PDF: uploaded_by_name='{pdf_details['uploaded_by_name']}', pages={pdf_details['page_count']}, words={pdf_details['word_count']}")

        # 4. Upload Image Resource
        img_upload = client.post("/api/resources/upload", data={
            "classroom_id": classroom_id,
            "title": "State Transition Diagram",
            "description": "DFA state machine PNG"
        }, files={"file": ("dfa_diagram.png", b"\x89PNG\r\n\x1a\nDummy Image Content", "image/png")}, headers=headers)

        assert img_upload.status_code == 201
        img_id = img_upload.json()["id"]
        process_uploaded_resource(img_id)

        img_details = client.get(f"/api/resources/{img_id}", headers=headers).json()
        assert img_details["uploaded_by_name"] == "Prof. Alan Turing"
        assert img_details["classroom_name"] == "Theory of Computation CS701"
        assert img_details["last_processed_at"] is not None
        print(f"[PASS 4] Uploaded & Processed Image: status={img_details['extraction_status']}, uploaded_by_name='{img_details['uploaded_by_name']}'")

        # 5. Create Announcement
        ann_resp = client.post("/api/announcements", json={
            "classroom_id": classroom_id,
            "title": "Midterm Automata Exam Notice",
            "content": "The midterm exam will cover chapters 1 through 4.",
            "announcement_type": "EXAM"
        }, headers=headers)
        assert ann_resp.status_code == 201
        ann_data = ann_resp.json()
        assert ann_data["announcement_type"] == "EXAM"
        assert ann_data["author_name"] == "Prof. Alan Turing"
        assert ann_data["classroom_name"] == "Theory of Computation CS701"
        print(f"[PASS 5] Created Announcement: type='{ann_data['announcement_type']}', author='{ann_data['author_name']}'")

        # 6. Create Workspace Note
        note_resp = client.post("/api/workspace/notes", json={
            "title": "Research Draft on Turing Machines",
            "content": "Universal Turing Machine formulation and halting problem notes."
        }, headers=headers)
        assert note_resp.status_code == 201
        note_data = note_resp.json()
        assert note_data["word_count"] == 8
        assert note_data["last_modified_at"] is not None
        print(f"[PASS 6] Created Workspace Note: words={note_data['word_count']}, modified={note_data['last_modified_at']}")

        # 7. Upload Workspace File
        with open(pdf_path, "rb") as f:
            ws_file_resp = client.post("/api/workspace/upload", data={
                "title": "Decidability Notes PDF"
            }, files={"file": ("decidability.pdf", f, "application/pdf")}, headers=headers)

        assert ws_file_resp.status_code == 201
        ws_res = ws_file_resp.json()
        ws_id = ws_res["id"]
        assert ws_res["owner_name"] == "Prof. Alan Turing"

        process_workspace_resource(ws_id)

        ws_details = client.get(f"/api/workspace/{ws_id}", headers=headers).json()
        assert ws_details["word_count"] >= 5
        assert ws_details["last_processed_at"] is not None
        print(f"[PASS 7] Uploaded Workspace File: owner_name='{ws_details['owner_name']}', words={ws_details['word_count']}")

        # 8. Simulate Logout & Relogin Persistence Verification
        re_login = client.post("/api/auth/login", json={"email": fac_email, "password": password})
        assert re_login.status_code == 200
        re_token = re_login.json()["access_token"]
        re_headers = {"Authorization": f"Bearer {re_token}"}

        # Verify all records persist after session refresh
        res_list = client.get(f"/api/resources/classroom/{classroom_id}", headers=re_headers).json()
        assert len(res_list) == 2, f"Expected 2 classroom resources, found {len(res_list)}"

        ann_list = client.get(f"/api/announcements/classroom/{classroom_id}", headers=re_headers).json()
        assert len(ann_list) == 1, f"Expected 1 announcement, found {len(ann_list)}"

        ws_list = client.get("/api/workspace", headers=re_headers).json()
        assert len(ws_list) == 1, f"Expected 1 workspace file, found {len(ws_list)}"

        notes_list = client.get("/api/workspace/notes", headers=re_headers).json()
        assert len(notes_list) == 1, f"Expected 1 workspace note, found {len(notes_list)}"

        tl_list = client.get("/api/timeline", headers=re_headers).json()
        assert len(tl_list) >= 6, f"Expected at least 6 timeline events, found {len(tl_list)}"

        print(f"[PASS 8] Session Logout/Login Persistence verified: {len(res_list)} resources, {len(ann_list)} announcements, {len(ws_list)} workspace files, {len(notes_list)} notes, {len(tl_list)} timeline events")

    finally:
        # Clean up test temp files and test classroom
        for tf in temp_files:
            if os.path.exists(tf):
                try:
                    os.remove(tf)
                except Exception:
                    pass
        client.delete(f"/api/classrooms/{classroom_id}", headers=headers)

    print("============================================================")
    print("ALL END-TO-END STABILITY & METADATA FLOW AUDIT TESTS PASSED 100%")
    print("============================================================\n")

if __name__ == "__main__":
    from cleanup_test_data import run_cleanup
    try:
        run_e2e_test_flow()
    finally:
        print("\n[TEARDOWN] Cleaning up end-to-end flow test data...")
        run_cleanup(dry_run=False)

