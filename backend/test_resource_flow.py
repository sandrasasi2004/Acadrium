import os
import sys
import time
from fastapi.testclient import TestClient

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def test_resource_upload_and_access_flow():
    print("\n--- Starting Phase 4 Resource Upload & Management Flow Test ---")
    timestamp = int(time.time())
    fac_email = f"fac_res_{timestamp}@test.com"
    stu_email = f"stu_res_{timestamp}@test.com"
    password = "Password123!"

    # 1. Faculty Register & Login
    fac_reg = client.post("/api/auth/register", json={
        "username": "Dr. Resource Faculty",
        "email": fac_email,
        "password": password,
        "role": "faculty",
        "department": "Computer Science"
    })
    assert fac_reg.status_code == 200, f"Faculty registration failed: {fac_reg.text}"
    
    faculty_login_resp = client.post("/api/auth/login", json={
        "email": fac_email,
        "password": password
    })
    assert faculty_login_resp.status_code == 200, f"Faculty login failed: {faculty_login_resp.text}"
    faculty_token = faculty_login_resp.json()["access_token"]
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    print(f"[PASS] Faculty Register & Login Successful ({fac_email})")

    # 2. Faculty Creates Classroom
    create_class_resp = client.post("/api/classrooms", json={
        "subject": "Phase 4 Resource Test - CS401",
        "description": "Classroom for resource upload testing"
    }, headers=faculty_headers)
    assert create_class_resp.status_code == 201, f"Classroom creation failed: {create_class_resp.text}"
    classroom_data = create_class_resp.json()
    classroom_id = classroom_data["id"]
    join_code = classroom_data["class_code"]
    print(f"[PASS] Created Classroom: {classroom_id} with Code: {join_code}")

    # Track uploaded resources for cleanup
    uploaded_resource_ids = []

    try:
        # 3. Faculty Uploads PDF
        pdf_file = ("sample_doc.pdf", b"%PDF-1.4 Dummy PDF Content for Phase 4 Test", "application/pdf")
        upload_pdf_resp = client.post("/api/resources/upload", data={
            "classroom_id": classroom_id,
            "title": "Course Syllabus PDF",
            "description": "Syllabus document",
            "tags": "syllabus,pdf"
        }, files={"file": pdf_file}, headers=faculty_headers)
        assert upload_pdf_resp.status_code == 201, f"PDF Upload failed: {upload_pdf_resp.text}"
        pdf_res = upload_pdf_resp.json()
        uploaded_resource_ids.append(pdf_res["id"])
        
        # Verify DB Record & Physical File
        assert pdf_res["file_type"] == "PDF"
        assert pdf_res["classroom_id"] == classroom_id
        pdf_file_path = pdf_res["file_path"]
        assert os.path.exists(pdf_file_path), f"Physical file does not exist at {pdf_file_path}"
        print(f"[PASS] Uploaded PDF: {pdf_res['id']} | File on disk: {pdf_file_path}")

        # 4. Faculty Uploads PPTX
        pptx_file = ("presentation.pptx", b"PK\x03\x04 Dummy PPTX Content for Phase 4 Test", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        upload_pptx_resp = client.post("/api/resources/upload", data={
            "classroom_id": classroom_id,
            "title": "Lecture 1 Slides",
            "description": "Introduction slides",
            "tags": "slides,lecture1"
        }, files={"file": pptx_file}, headers=faculty_headers)
        assert upload_pptx_resp.status_code == 201, f"PPTX Upload failed: {upload_pptx_resp.text}"
        pptx_res = upload_pptx_resp.json()
        uploaded_resource_ids.append(pptx_res["id"])
        
        # Verify DB Record & Physical File
        assert pptx_res["file_type"] == "PPT"
        pptx_file_path = pptx_res["file_path"]
        assert os.path.exists(pptx_file_path), f"Physical file does not exist at {pptx_file_path}"
        print(f"[PASS] Uploaded PPTX: {pptx_res['id']} | File on disk: {pptx_file_path}")

        # 5. Faculty Uploads Image
        img_file = ("diagram.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR Dummy PNG Content", "image/png")
        upload_img_resp = client.post("/api/resources/upload", data={
            "classroom_id": classroom_id,
            "title": "Architecture Diagram",
            "description": "System architecture PNG",
            "tags": "diagram,architecture"
        }, files={"file": img_file}, headers=faculty_headers)
        assert upload_img_resp.status_code == 201, f"Image Upload failed: {upload_img_resp.text}"
        img_res = upload_img_resp.json()
        uploaded_resource_ids.append(img_res["id"])
        
        # Verify DB Record & Physical File
        assert img_res["file_type"] == "IMAGE"
        img_file_path = img_res["file_path"]
        assert os.path.exists(img_file_path), f"Physical file does not exist at {img_file_path}"
        print(f"[PASS] Uploaded Image: {img_res['id']} | File on disk: {img_file_path}")

        # 6. Student Register & Login
        stu_reg = client.post("/api/auth/register", json={
            "username": "Alex Resource Student",
            "email": stu_email,
            "password": password,
            "role": "student",
            "department": "Computer Science"
        })
        assert stu_reg.status_code == 200, f"Student registration failed: {stu_reg.text}"

        student_login_resp = client.post("/api/auth/login", json={
            "email": stu_email,
            "password": password
        })
        assert student_login_resp.status_code == 200, f"Student login failed: {student_login_resp.text}"
        student_token = student_login_resp.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        print(f"[PASS] Student Register & Login Successful ({stu_email})")

        # 7. SECURITY TEST: Student attempt to view classroom resources BEFORE joining -> 403 Forbidden
        unauth_class_res = client.get(f"/api/resources/classroom/{classroom_id}", headers=student_headers)
        assert unauth_class_res.status_code == 403, f"Expected 403 for non-joined student, got {unauth_class_res.status_code}"
        print("[PASS] Security Blocked: Student cannot view resources of non-joined classroom")

        # 8. SECURITY TEST: Student attempt to upload resource -> 403 Forbidden
        student_upload_resp = client.post("/api/resources/upload", data={
            "classroom_id": classroom_id,
            "title": "Student Upload Attempt",
        }, files={"file": pdf_file}, headers=student_headers)
        assert student_upload_resp.status_code == 403, f"Expected 403 for student upload, got {student_upload_resp.status_code}"
        print("[PASS] Security Blocked: Student upload forbidden")

        # 9. Student Joins Classroom
        join_resp = client.post("/api/classrooms/join", json={"class_code": join_code}, headers=student_headers)
        assert join_resp.status_code == 200, f"Student join failed: {join_resp.text}"
        print("[PASS] Student Joined Classroom Successfully")

        # 10. Student Views Resources for Classroom
        student_class_resources = client.get(f"/api/resources/classroom/{classroom_id}", headers=student_headers)
        assert student_class_resources.status_code == 200, f"Student resource list failed: {student_class_resources.text}"
        resources_list = student_class_resources.json()
        assert len(resources_list) == 3, f"Expected 3 resources, found {len(resources_list)}"
        print(f"[PASS] Student listed {len(resources_list)} resources for classroom")

        # 11. Student Downloads PDF Resource
        download_resp = client.get(f"/api/resources/{pdf_res['id']}/download", headers=student_headers)
        assert download_resp.status_code == 200, f"Student download failed: {download_resp.status_code}"
        assert len(download_resp.content) > 0, "Downloaded content is empty"
        assert download_resp.content == b"%PDF-1.4 Dummy PDF Content for Phase 4 Test"
        print("[PASS] Student Downloaded PDF Resource successfully with exact content match")

        # 12. SECURITY TEST: Student attempt to delete resource -> 403 Forbidden
        student_delete_resp = client.delete(f"/api/resources/{pdf_res['id']}", headers=student_headers)
        assert student_delete_resp.status_code == 403, f"Expected 403 for student delete, got {student_delete_resp.status_code}"
        print("[PASS] Security Blocked: Student delete forbidden")

        # 13. Faculty Deletes Resources
        for res_id in uploaded_resource_ids:
            # Check physical path before delete
            res_details = client.get(f"/api/resources/{res_id}", headers=faculty_headers).json()
            fpath = res_details["file_path"]
            
            del_resp = client.delete(f"/api/resources/{res_id}", headers=faculty_headers)
            assert del_resp.status_code == 200, f"Faculty delete failed: {del_resp.text}"
            assert not os.path.exists(fpath), f"Physical file still exists after deletion: {fpath}"
            print(f"[PASS] Faculty deleted resource {res_id} and physical file removed")

    finally:
        # 14. Clean up created test classroom
        del_class_resp = client.delete(f"/api/classrooms/{classroom_id}", headers=faculty_headers)
        print(f"[PASS] Cleaned up test classroom {classroom_id}")

    print("\n--- ALL PHASE 4 RESOURCE MODULE TESTS PASSED PERFECTLY ---")

if __name__ == "__main__":
    test_resource_upload_and_access_flow()
