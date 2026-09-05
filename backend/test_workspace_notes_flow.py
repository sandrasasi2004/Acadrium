import os
import sys
import time
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def test_workspace_notes_flow():
    print("\n--- Starting Workspace Notes Module & Security Verification ---")
    timestamp = int(time.time())
    fac_email = f"fac_note_{timestamp}@test.com"
    stu_email = f"stu_note_{timestamp}@test.com"
    password = "Password123!"

    # 1. Faculty Register & Login
    fac_reg = client.post("/api/auth/register", json={
        "username": "Dr. Notes Faculty",
        "email": fac_email,
        "password": password,
        "role": "faculty",
        "department": "Computer Applications"
    })
    assert fac_reg.status_code == 200, f"Faculty registration failed: {fac_reg.text}"

    fac_login = client.post("/api/auth/login", json={"email": fac_email, "password": password})
    assert fac_login.status_code == 200
    fac_token = fac_login.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    # 2. Faculty Creates Note
    create_resp = client.post("/api/workspace/notes", json={
        "title": "Faculty Lecture Outline",
        "content": "Module 1: Advanced Database Systems & PostgreSQL indexing"
    }, headers=fac_headers)
    assert create_resp.status_code == 201, f"Note creation failed: {create_resp.text}"
    note_data = create_resp.json()
    fac_note_id = note_data["id"]
    assert note_data["title"] == "Faculty Lecture Outline"
    print(f"[PASS] Faculty created note {fac_note_id}")

    # 3. Faculty Updates Note
    update_resp = client.put(f"/api/workspace/notes/{fac_note_id}", json={
        "title": "Updated Faculty Lecture Outline",
        "content": "Module 1 & 2: Advanced PostgreSQL Indexing and Query Tuning"
    }, headers=fac_headers)
    assert update_resp.status_code == 200
    updated_note = update_resp.json()
    assert updated_note["title"] == "Updated Faculty Lecture Outline"
    print(f"[PASS] Faculty updated note {fac_note_id}")

    # 4. Student Register & Login
    stu_reg = client.post("/api/auth/register", json={
        "username": "Alex Notes Student",
        "email": stu_email,
        "password": password,
        "role": "student",
        "department": "Computer Applications"
    })
    assert stu_reg.status_code == 200

    stu_login = client.post("/api/auth/login", json={"email": stu_email, "password": password})
    assert stu_login.status_code == 200
    stu_token = stu_login.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # 5. Student Creates Note
    stu_create = client.post("/api/workspace/notes", json={
        "title": "Student Study Checklist",
        "content": "Review chapter 4 SQL Joins and indexing"
    }, headers=stu_headers)
    assert stu_create.status_code == 201
    stu_note_id = stu_create.json()["id"]
    print(f"[PASS] Student created note {stu_note_id}")

    # 6. SECURITY TEST: Student listing notes -> Only student's 1 note returned (Faculty note NOT visible)
    stu_list = client.get("/api/workspace/notes", headers=stu_headers).json()
    assert len(stu_list) == 1
    assert stu_list[0]["id"] == stu_note_id
    print("[PASS] Security Verified: Student notes list contains ONLY student's own private note")

    # 7. SECURITY TEST: Student accessing Faculty note -> 403 Forbidden
    unauth_get = client.get(f"/api/workspace/notes/{fac_note_id}", headers=stu_headers)
    assert unauth_get.status_code == 403
    print("[PASS] Security Blocked: Student direct GET for Faculty note forbidden (HTTP 403)")

    # 8. SECURITY TEST: Student updating Faculty note -> 403 Forbidden
    unauth_put = client.put(f"/api/workspace/notes/{fac_note_id}", json={"title": "Hacked Title"}, headers=stu_headers)
    assert unauth_put.status_code == 403
    print("[PASS] Security Blocked: Student update of Faculty note forbidden (HTTP 403)")

    # 9. SECURITY TEST: Student deleting Faculty note -> 403 Forbidden
    unauth_del = client.delete(f"/api/workspace/notes/{fac_note_id}", headers=stu_headers)
    assert unauth_del.status_code == 403
    print("[PASS] Security Blocked: Student delete of Faculty note forbidden (HTTP 403)")

    # 10. Persistence Test across Relogin
    re_login = client.post("/api/auth/login", json={"email": fac_email, "password": password})
    assert re_login.status_code == 200
    re_headers = {"Authorization": f"Bearer {re_login.json()['access_token']}"}
    
    fac_notes_after_relogin = client.get("/api/workspace/notes", headers=re_headers).json()
    assert len(fac_notes_after_relogin) == 1
    assert fac_notes_after_relogin[0]["title"] == "Updated Faculty Lecture Outline"
    print("[PASS] Faculty Logout/Login Persistence verified: Note present after re-login")

    # 11. Cleanup
    client.delete(f"/api/workspace/notes/{fac_note_id}", headers=fac_headers)
    client.delete(f"/api/workspace/notes/{stu_note_id}", headers=stu_headers)
    print("[PASS] Cleaned up test workspace notes")

    print("\n--- ALL WORKSPACE NOTES TESTS PASSED PERFECTLY ---")

if __name__ == "__main__":
    test_workspace_notes_flow()
