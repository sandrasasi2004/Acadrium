import os
import sys
import time
from fastapi.testclient import TestClient

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def test_announcement_flow():
    print("\n--- Starting Phase 5 Announcement Management Flow Test ---")
    timestamp = int(time.time())
    fac_email = f"faculty_ann_{timestamp}@test.com"
    stu_email = f"student_ann_{timestamp}@test.com"
    password = "Password123!"

    # 1. Faculty Register & Login
    fac_reg = client.post("/api/auth/register", json={
        "username": "Dr. Announcement Faculty",
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
        "subject": "Phase 5 Announcement Test - CS501",
        "description": "Classroom for announcement testing"
    }, headers=faculty_headers)
    assert create_class_resp.status_code == 201, f"Classroom creation failed: {create_class_resp.text}"
    classroom_data = create_class_resp.json()
    classroom_id = classroom_data["id"]
    join_code = classroom_data["class_code"]
    print(f"[PASS] Faculty Created Classroom: {classroom_id} with Code: {join_code}")

    # 3. Faculty Creates Announcement
    create_ann_resp = client.post("/api/announcements", json={
        "title": "Midterm Exam Schedule",
        "content": "The midterm exam will take place next Monday at 10 AM in Hall A.",
        "classroom_id": classroom_id
    }, headers=faculty_headers)
    assert create_ann_resp.status_code == 201, f"Faculty announcement creation failed: {create_ann_resp.text}"
    ann_data = create_ann_resp.json()
    announcement_id = ann_data["id"]
    assert ann_data["title"] == "Midterm Exam Schedule"
    assert ann_data["classroom_id"] == classroom_id
    print(f"[PASS] Faculty Posted Announcement: ID={announcement_id}")

    # 4. Faculty Updates Announcement
    update_ann_resp = client.put(f"/api/announcements/{announcement_id}", json={
        "title": "Updated Midterm Exam Schedule",
        "content": "The midterm exam will take place next Monday at 11 AM in Hall B."
    }, headers=faculty_headers)
    assert update_ann_resp.status_code == 200, f"Faculty announcement update failed: {update_ann_resp.text}"
    updated_ann_data = update_ann_resp.json()
    assert updated_ann_data["title"] == "Updated Midterm Exam Schedule"
    assert "Hall B" in updated_ann_data["content"]
    print(f"[PASS] Faculty Updated Announcement: ID={announcement_id}")

    # 5. Student Register & Login
    stu_reg = client.post("/api/auth/register", json={
        "username": "Jane Announcement Student",
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

    # 6. Student Joins Classroom
    join_resp = client.post("/api/classrooms/join", json={
        "class_code": join_code
    }, headers=student_headers)
    assert join_resp.status_code == 200, f"Student classroom join failed: {join_resp.text}"
    print(f"[PASS] Student Joined Classroom with Code: {join_code}")

    # 7. Student Views Classroom Announcements
    view_ann_resp = client.get(f"/api/announcements/classroom/{classroom_id}", headers=student_headers)
    assert view_ann_resp.status_code == 200, f"Student view announcements failed: {view_ann_resp.text}"
    stu_anns = view_ann_resp.json()
    assert len(stu_anns) == 1
    assert stu_anns[0]["id"] == announcement_id
    assert stu_anns[0]["title"] == "Updated Midterm Exam Schedule"
    print(f"[PASS] Student Viewed Classroom Announcement Successfully")

    # 8. Student Attempts to Create Announcement (Expect 403 Forbidden)
    stu_create_resp = client.post("/api/announcements", json={
        "title": "Unauthorized Student Post",
        "content": "This should be blocked.",
        "classroom_id": classroom_id
    }, headers=student_headers)
    assert stu_create_resp.status_code == 403, f"Expected 403 on student create, got: {stu_create_resp.status_code}"
    print(f"[PASS] Forbidden Check: Student Create Announcement Blocked (403 Forbidden)")

    # 9. Student Attempts to Update Announcement (Expect 403 Forbidden)
    stu_update_resp = client.put(f"/api/announcements/{announcement_id}", json={
        "title": "Hacked Title",
        "content": "Hacked content"
    }, headers=student_headers)
    assert stu_update_resp.status_code == 403, f"Expected 403 on student update, got: {stu_update_resp.status_code}"
    print(f"[PASS] Forbidden Check: Student Update Announcement Blocked (403 Forbidden)")

    # 10. Student Attempts to Delete Announcement (Expect 403 Forbidden)
    stu_del_resp = client.delete(f"/api/announcements/{announcement_id}", headers=student_headers)
    assert stu_del_resp.status_code == 403, f"Expected 403 on student delete, got: {stu_del_resp.status_code}"
    print(f"[PASS] Forbidden Check: Student Delete Announcement Blocked (403 Forbidden)")

    # 11. Faculty Deletes Announcement
    fac_del_resp = client.delete(f"/api/announcements/{announcement_id}", headers=faculty_headers)
    assert fac_del_resp.status_code == 200, f"Faculty announcement delete failed: {fac_del_resp.text}"
    print(f"[PASS] Faculty Deleted Announcement: ID={announcement_id}")

    # 12. Verify List is Empty
    verify_empty_resp = client.get(f"/api/announcements/classroom/{classroom_id}", headers=faculty_headers)
    assert verify_empty_resp.status_code == 200
    assert len(verify_empty_resp.json()) == 0
    print(f"[PASS] Verified Announcement Stream is Empty After Deletion")

    print("\n--- ALL PHASE 5 ANNOUNCEMENT FLOW TESTS PASSED SUCCESSFULLY! ---\n")

if __name__ == "__main__":
    from cleanup_test_data import run_cleanup
    try:
        test_announcement_flow()
    finally:
        print("\n[TEARDOWN] Cleaning up announcement flow test data...")
        run_cleanup(dry_run=False)

