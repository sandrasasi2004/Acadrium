import os
import sys
import time
from fastapi.testclient import TestClient

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def test_workspace_flow():
    print("\n--- Starting Phase 6 Personal Workspace Upload & Management Verification ---")
    timestamp = int(time.time())
    fac_email = f"fac_ws_{timestamp}@test.com"
    stu_email = f"stu_ws_{timestamp}@test.com"
    password = "Password123!"

    # 1. Faculty Register & Login
    fac_reg = client.post("/api/auth/register", json={
        "username": "Dr. Workspace Faculty",
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
    print(f"[PASS] Faculty Register & Login Successful ({fac_email})")

    fac_file_ids = []
    fac_file_paths = []

    try:
        # 2. Faculty Uploads PDF
        pdf_file = ("faculty_doc.pdf", b"%PDF-1.4 Private Faculty Workspace Document", "application/pdf")
        upload_pdf_resp = client.post("/api/workspace/upload", data={
            "title": "Faculty Lecture Notes PDF",
            "description": "Private research draft",
            "tags": "research,pdf"
        }, files={"file": pdf_file}, headers=fac_headers)
        assert upload_pdf_resp.status_code == 201, f"PDF Upload failed: {upload_pdf_resp.text}"
        pdf_res = upload_pdf_resp.json()
        fac_file_ids.append(pdf_res["id"])
        fac_file_paths.append(pdf_res["file_path"])
        assert pdf_res["file_type"] == "PDF"
        assert os.path.exists(pdf_res["file_path"]), f"Physical file missing at {pdf_res['file_path']}"
        print(f"[PASS] Faculty uploaded PDF: {pdf_res['id']} | Physical file verified")

        # 3. Faculty Uploads PPTX
        pptx_file = ("faculty_slides.pptx", b"PK\x03\x04 Private Faculty Presentation", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        upload_pptx_resp = client.post("/api/workspace/upload", data={
            "title": "Faculty Conference Slides",
            "description": "Presentation slides draft",
            "tags": "slides,private"
        }, files={"file": pptx_file}, headers=fac_headers)
        assert upload_pptx_resp.status_code == 201, f"PPTX Upload failed: {upload_pptx_resp.text}"
        pptx_res = upload_pptx_resp.json()
        fac_file_ids.append(pptx_res["id"])
        fac_file_paths.append(pptx_res["file_path"])
        assert pptx_res["file_type"] == "PPT"
        assert os.path.exists(pptx_res["file_path"]), f"Physical file missing at {pptx_res['file_path']}"
        print(f"[PASS] Faculty uploaded PPTX: {pptx_res['id']} | Physical file verified")

        # 4. Faculty Uploads Image
        img_file = ("faculty_photo.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR Private Image", "image/png")
        upload_img_resp = client.post("/api/workspace/upload", data={
            "title": "Faculty Chart Image",
            "description": "Research chart PNG",
            "tags": "chart,image"
        }, files={"file": img_file}, headers=fac_headers)
        assert upload_img_resp.status_code == 201, f"Image Upload failed: {upload_img_resp.text}"
        img_res = upload_img_resp.json()
        fac_file_ids.append(img_res["id"])
        fac_file_paths.append(img_res["file_path"])
        assert img_res["file_type"] == "IMAGE"
        assert os.path.exists(img_res["file_path"]), f"Physical file missing at {img_res['file_path']}"
        print(f"[PASS] Faculty uploaded Image: {img_res['id']} | Physical file verified")

        # 5. Faculty Logout & Relogin Persistence Verification
        re_login = client.post("/api/auth/login", json={"email": fac_email, "password": password})
        assert re_login.status_code == 200
        re_headers = {"Authorization": f"Bearer {re_login.json()['access_token']}"}
        
        ws_list = client.get("/api/workspace", headers=re_headers)
        assert ws_list.status_code == 200
        fac_files_after_relogin = ws_list.json()
        assert len(fac_files_after_relogin) == 3, f"Expected 3 files after relogin, found {len(fac_files_after_relogin)}"
        print("[PASS] Faculty Logout/Login Persistence verified: All 3 files present after session restore")

        # 6. Student Register & Login
        stu_reg = client.post("/api/auth/register", json={
            "username": "Alex Workspace Student",
            "email": stu_email,
            "password": password,
            "role": "student",
            "department": "Computer Science"
        })
        assert stu_reg.status_code == 200, f"Student registration failed: {stu_reg.text}"

        stu_login = client.post("/api/auth/login", json={"email": stu_email, "password": password})
        assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
        stu_token = stu_login.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}
        print(f"[PASS] Student Register & Login Successful ({stu_email})")

        # 7. Student Uploads PDF
        stu_pdf = ("student_assignment.pdf", b"%PDF-1.4 Private Student Assignment Document", "application/pdf")
        upload_stu_resp = client.post("/api/workspace/upload", data={
            "title": "My Private Study Notes",
            "description": "Student homework notes",
            "tags": "notes,private"
        }, files={"file": stu_pdf}, headers=stu_headers)
        assert upload_stu_resp.status_code == 201, f"Student Upload failed: {upload_stu_resp.text}"
        stu_res = upload_stu_resp.json()
        stu_file_id = stu_res["id"]
        stu_file_path = stu_res["file_path"]
        assert os.path.exists(stu_file_path), f"Student physical file missing at {stu_file_path}"
        print(f"[PASS] Student uploaded PDF: {stu_file_id} | Physical file verified")

        # 8. SECURITY TEST: Student listing workspace files -> Only student's 1 file returned (Faculty files NOT visible)
        stu_ws_list = client.get("/api/workspace", headers=stu_headers).json()
        assert len(stu_ws_list) == 1, f"Expected 1 student file, got {len(stu_ws_list)}"
        assert stu_ws_list[0]["id"] == stu_file_id
        print("[PASS] Security Verified: Student workspace list contains ONLY student's own private file")

        # 9. SECURITY TEST: Student direct access to Faculty's private file -> 403 Forbidden
        fac_file_id = fac_file_ids[0]
        unauth_get = client.get(f"/api/workspace/{fac_file_id}", headers=stu_headers)
        assert unauth_get.status_code == 403, f"Expected 403 for unauthorized details GET, got {unauth_get.status_code}"
        print("[PASS] Security Blocked: Student direct metadata GET for Faculty file forbidden (HTTP 403)")

        # 10. SECURITY TEST: Student download attempt of Faculty's private file -> 403 Forbidden
        unauth_dl = client.get(f"/api/workspace/{fac_file_id}/download", headers=stu_headers)
        assert unauth_dl.status_code == 403, f"Expected 403 for unauthorized download, got {unauth_dl.status_code}"
        print("[PASS] Security Blocked: Student download of Faculty file forbidden (HTTP 403)")

        # 11. SECURITY TEST: Student delete attempt of Faculty's private file -> 403 Forbidden
        unauth_del = client.delete(f"/api/workspace/{fac_file_id}", headers=stu_headers)
        assert unauth_del.status_code == 403, f"Expected 403 for unauthorized delete, got {unauth_del.status_code}"
        print("[PASS] Security Blocked: Student delete of Faculty file forbidden (HTTP 403)")

        # 12. SECURITY TEST: Faculty direct access to Student's private file -> 403 Forbidden
        fac_get_stu = client.get(f"/api/workspace/{stu_file_id}", headers=fac_headers)
        assert fac_get_stu.status_code == 403, f"Expected 403 for Faculty accessing Student file, got {fac_get_stu.status_code}"
        print("[PASS] Security Blocked: Faculty access to Student workspace file forbidden (HTTP 403)")

        # 13. Student Downloads Own File with Exact Byte Match
        stu_download_resp = client.get(f"/api/workspace/{stu_file_id}/download", headers=stu_headers)
        assert stu_download_resp.status_code == 200, f"Student download failed: {stu_download_resp.status_code}"
        assert stu_download_resp.content == b"%PDF-1.4 Private Student Assignment Document"
        print("[PASS] Student Downloaded Own File successfully with exact binary content match")

        # 14. Cleanup Student File
        stu_del_resp = client.delete(f"/api/workspace/{stu_file_id}", headers=stu_headers)
        assert stu_del_resp.status_code == 200
        assert not os.path.exists(stu_file_path), "Student physical file still exists after deletion"
        print(f"[PASS] Student deleted workspace file {stu_file_id} and physical file removed")

    finally:
        # 15. Cleanup Faculty Files
        for res_id, fpath in zip(fac_file_ids, fac_file_paths):
            del_resp = client.delete(f"/api/workspace/{res_id}", headers=fac_headers)
            if del_resp.status_code == 200:
                assert not os.path.exists(fpath), f"Faculty file still exists on disk: {fpath}"
        print("[PASS] Cleaned up test faculty workspace files")

    print("\n--- ALL PHASE 6 PERSONAL WORKSPACE TESTS PASSED PERFECTLY ---")

if __name__ == "__main__":
    test_workspace_flow()
