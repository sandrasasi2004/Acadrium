import sys
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("STARTING ACADRIUM PHASE 3 CLASSROOM MANAGEMENT END-TO-END VERIFICATION")
    print("=" * 60)

    import time
    timestamp = int(time.time())
    fac_email = f"fac_flow_{timestamp}@test.com"
    stu_email = f"stu_flow_{timestamp}@test.com"

    # 1. Register & Login Faculty
    print(f"\n[TEST 1] Registering & Logging in as Faculty ({fac_email})...")
    fac_reg = client.post("/api/auth/register", json={
        "username": "Dr. Sarah Jenkins",
        "email": fac_email,
        "password": "Password123!",
        "role": "faculty",
        "department": "Computer Applications"
    })
    assert fac_reg.status_code == 200, f"Faculty registration failed: {fac_reg.text}"
    fac_token = fac_reg.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}
    print("-> Faculty registered & authenticated successfully.")

    # 1b. Test Faculty Login with Role Auto-Detection (No role in payload)
    fac_login = client.post("/api/auth/login", json={
        "email": fac_email,
        "password": "Password123!"
    })
    assert fac_login.status_code == 200, f"Faculty login failed: {fac_login.text}"
    assert fac_login.json()["user"]["role"] == "faculty", "Auto-detected role mismatch!"
    print("-> Faculty login with role auto-detection verified.")

    # 2. Register & Login Student
    print(f"\n[TEST 2] Registering & Logging in as Student ({stu_email})...")
    stu_reg = client.post("/api/auth/register", json={
        "username": "Alex Johnson",
        "email": stu_email,
        "password": "Password123!",
        "role": "student",
        "department": "Computer Applications",
        "semester": "Semester III"
    })
    assert stu_reg.status_code == 200, f"Student registration failed: {stu_reg.text}"
    stu_token = stu_reg.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}
    print("-> Student registered & authenticated successfully.")

    # 2b. Test Student Login with Role Auto-Detection (No role in payload)
    stu_login = client.post("/api/auth/login", json={
        "email": stu_email,
        "password": "Password123!"
    })
    assert stu_login.status_code == 200, f"Student login failed: {stu_login.text}"
    assert stu_login.json()["user"]["role"] == "student", "Auto-detected role mismatch!"
    print("-> Student login with role auto-detection verified.")

    # 3. Faculty Creates Classroom
    print("\n[TEST 3] Faculty creating classroom 'Advanced DBMS'...")
    create_res = client.post("/api/classrooms", json={
        "name": "Advanced DBMS",
        "subject_code": "MCA401",
        "semester": "Semester III",
        "department": "Computer Applications"
    }, headers=fac_headers)
    assert create_res.status_code == 201, f"Create classroom failed: {create_res.text}"
    created_data = create_res.json()
    classroom_id = created_data["id"]
    class_code = created_data["class_code"]
    
    print(f"-> Classroom Created successfully!")
    print(f"   - ID: {classroom_id}")
    print(f"   - Name: {created_data['name']}")
    print(f"   - Generated Class Code: {class_code}")
    print(f"   - Faculty ID: {created_data['faculty_id']}")
    assert class_code.startswith("ACDR-"), f"Class code does not match format: {class_code}"

    # Verify saved in PostgreSQL
    db = SessionLocal()
    db_cls = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    assert db_cls is not None, "Classroom not found in PostgreSQL!"
    assert db_cls.class_code == class_code, "Class code mismatch in PostgreSQL!"
    db.close()
    print("-> Verified persistence in PostgreSQL DB.")

    # 4. Get Faculty Classrooms
    print("\n[TEST 4] Fetching Faculty Classrooms GET /api/classrooms/my...")
    my_cls = client.get("/api/classrooms/my", headers=fac_headers)
    assert my_cls.status_code == 200, f"Get my classrooms failed: {my_cls.text}"
    my_list = my_cls.json()
    assert len(my_list) == 1
    assert my_list[0]["id"] == classroom_id
    print("-> Faculty classroom list contains created classroom.")

    # 5. Student Joins Classroom using code
    print("\n[TEST 5] Student joining classroom using code:", class_code)
    join_res = client.post("/api/classrooms/join", json={"class_code": class_code}, headers=stu_headers)
    assert join_res.status_code == 200, f"Student join failed: {join_res.text}"
    join_data = join_res.json()
    assert join_data["success"] is True
    print(f"-> Student joined successfully: {join_data['message']}")

    # Verify membership saved in PostgreSQL
    db = SessionLocal()
    membership = db.query(ClassroomMember).filter(ClassroomMember.classroom_id == classroom_id).first()
    assert membership is not None, "Membership not saved in PostgreSQL!"
    print("-> Verified membership record in PostgreSQL DB.")
    db.close()

    # 6. Get Student Joined Classrooms
    print("\n[TEST 6] Fetching Student Joined Classrooms GET /api/classrooms/enrolled...")
    enrolled_res = client.get("/api/classrooms/enrolled", headers=stu_headers)
    assert enrolled_res.status_code == 200, f"Enrolled list failed: {enrolled_res.text}"
    enrolled_list = enrolled_res.json()
    assert len(enrolled_list) == 1
    assert enrolled_list[0]["id"] == classroom_id
    print("-> Enrolled classroom visible in Student Dashboard.")

    # 7. Prevent Duplicate Joining
    print("\n[TEST 7] Attempting duplicate student join with same code...")
    dup_res = client.post("/api/classrooms/join", json={"class_code": class_code}, headers=stu_headers)
    assert dup_res.status_code == 400, f"Expected 400 Bad Request, got: {dup_res.status_code}"
    print(f"-> Duplicate join correctly prevented: {dup_res.json()['detail']}")

    # 8. Test Invalid Code Join
    print("\n[TEST 8] Student joining with invalid classroom code...")
    invalid_res = client.post("/api/classrooms/join", json={"class_code": "ACDR-0000-0000"}, headers=stu_headers)
    assert invalid_res.status_code == 404, f"Expected 404 Not Found, got: {invalid_res.status_code}"
    print(f"-> Invalid code correctly rejected: {invalid_res.json()['detail']}")

    # 9. Role-Based Access Control Tests
    print("\n[TEST 9] Testing Role Restrictions...")
    
    # 9a. Student trying to create classroom -> 403 Forbidden
    stu_create = client.post("/api/classrooms", json={
        "name": "Unauthorized Class",
        "subject_code": "STU101",
        "semester": "Sem I",
        "department": "Computer Applications"
    }, headers=stu_headers)
    assert stu_create.status_code == 403, f"Expected 403 Forbidden, got {stu_create.status_code}"
    print("-> Student classroom creation correctly blocked with 403 Forbidden.")

    # 9b. Student trying to edit classroom -> 403 Forbidden
    stu_edit = client.put(f"/api/classrooms/{classroom_id}", json={"name": "Hacked DBMS"}, headers=stu_headers)
    assert stu_edit.status_code == 403, f"Expected 403 Forbidden, got {stu_edit.status_code}"
    print("-> Student classroom edit correctly blocked with 403 Forbidden.")

    # 9c. Student trying to delete classroom -> 403 Forbidden
    stu_del = client.delete(f"/api/classrooms/{classroom_id}", headers=stu_headers)
    assert stu_del.status_code == 403, f"Expected 403 Forbidden, got {stu_del.status_code}"
    print("-> Student classroom deletion correctly blocked with 403 Forbidden.")

    # 9d. Faculty 2 trying to edit Faculty 1's classroom -> 403 Forbidden
    fac2_email = f"fac2_flow_{timestamp}@test.com"
    fac2_reg = client.post("/api/auth/register", json={
        "username": "Dr. Robert Smith",
        "email": fac2_email,
        "password": "Password123!",
        "role": "faculty",
        "department": "Computer Applications"
    })
    fac2_headers = {"Authorization": f"Bearer {fac2_reg.json()['access_token']}"}
    fac2_edit = client.put(f"/api/classrooms/{classroom_id}", json={"name": "Stolen DBMS"}, headers=fac2_headers)
    assert fac2_edit.status_code == 403, f"Expected 403 Forbidden for non-owner faculty, got {fac2_edit.status_code}"
    print("-> Other faculty editing non-owned classroom correctly blocked with 403 Forbidden.")

    # 10. Roll-Call API
    print("\n[TEST 10] Testing Roll-call student list GET /api/classrooms/{id}/students...")
    rollcall_res = client.get(f"/api/classrooms/{classroom_id}/students", headers=fac_headers)
    assert rollcall_res.status_code == 200
    rollcall = rollcall_res.json()
    assert len(rollcall) == 1
    assert rollcall[0]["email"] == stu_email
    print("-> Roll-call retrieved successfully with student details.")

    # 11. Student Leaves Classroom
    print("\n[TEST 11] Student leaving classroom DELETE /api/classrooms/{id}/leave...")
    leave_res = client.delete(f"/api/classrooms/{classroom_id}/leave", headers=stu_headers)
    assert leave_res.status_code == 200
    enrolled_after_leave = client.get("/api/classrooms/enrolled", headers=stu_headers).json()
    assert len(enrolled_after_leave) == 0
    print("-> Student successfully left classroom.")

    # Rejoin for clean test
    client.post("/api/classrooms/join", json={"class_code": class_code}, headers=stu_headers)

    # 12. Faculty Deletes Classroom
    print("\n[TEST 12] Faculty deleting classroom DELETE /api/classrooms/{id}...")
    del_res = client.delete(f"/api/classrooms/{classroom_id}", headers=fac_headers)
    assert del_res.status_code == 200
    my_after_del = client.get("/api/classrooms/my", headers=fac_headers).json()
    assert len(my_after_del) == 0
    print("-> Classroom deleted successfully.")

    # 13. Verify Phase 2 Authentication is still intact
    print("\n[TEST 13] Verifying Phase 2 Authentication still works...")
    me_res = client.get("/api/auth/me", headers=fac_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == fac_email
    print("-> /api/auth/me working properly.")

    print("\n" + "=" * 60)
    print("ALL CLASSROOM MANAGEMENT END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    from cleanup_test_data import run_cleanup
    try:
        run_tests()
    finally:
        print("\n[TEARDOWN] Cleaning up classroom flow test data...")
        run_cleanup(dry_run=False)

