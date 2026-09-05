import os
import sys
import time
from fastapi.testclient import TestClient

# Ensure app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def http_post(endpoint, payload, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = client.post(f"/api{endpoint}", json=payload, headers=headers)
    return resp.status_code, resp.json()

def http_put(endpoint, payload, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = client.put(f"/api{endpoint}", json=payload, headers=headers)
    return resp.status_code, resp.json()

def http_get(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = client.get(f"/api{endpoint}", headers=headers)
    return resp.status_code, resp.json()

def http_delete(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = client.delete(f"/api{endpoint}", headers=headers)
    return resp.status_code, resp.json()

def run_regression_test():
    print("=" * 60)
    print("RUNNING AUTHENTICATION & CLASSROOM REGRESSION AUDIT")
    print("=" * 60)

    # 1. Health check
    status_code, data = http_get("/health")
    print(f"\n[AUDIT 1] Health Check GET /api/health -> Status {status_code}: {data}")
    assert status_code == 200

    # 2. Registration Audit (Faculty)
    print("\n[AUDIT 2] Testing Faculty Registration POST /api/auth/register...")
    fac_email = f"fac_audit_{int(time.time())}@test.com"
    code, fac_reg = http_post("/auth/register", {
        "full_name": "Dr. Sarah Audit",
        "email": fac_email,
        "password": "Password123!",
        "role": "faculty"
    })
    print(f"-> Status {code}, User ID: {fac_reg['user']['id']}")
    assert code == 200
    fac_token = fac_reg["access_token"]

    # 3. Login Audit (Faculty)
    print("\n[AUDIT 3] Testing Faculty Login (Role Auto-Detection) POST /api/auth/login...")
    code, fac_login = http_post("/auth/login", {
        "email": fac_email,
        "password": "Password123!"
    })
    print(f"-> Status {code}, Token issued for: {fac_login['user']['email']}, Auto-detected Role: {fac_login['user']['role']}")
    assert code == 200
    assert fac_login["user"]["email"] == fac_email
    assert fac_login["user"]["role"] == "faculty"

    # 4. Session Restore Audit GET /api/auth/me
    print("\n[AUDIT 4] Testing Session Restoration GET /api/auth/me...")
    code, me_data = http_get("/auth/me", token=fac_token)
    print(f"-> Status {code}, Logged in as: {me_data['full_name']} ({me_data['role']})")
    assert code == 200

    # 5. Profile Update Audit PUT /api/auth/me
    print("\n[AUDIT 5] Testing Profile Details Update PUT /api/auth/me...")
    code, updated_me = http_put("/auth/me", {
        "full_name": "Dr. Sarah Updated Audit",
        "department": "Information Technology"
    }, token=fac_token)
    print(f"-> Status {code}, Updated Name: {updated_me.get('full_name')}, Dept: {updated_me.get('department')}")
    assert code == 200
    assert updated_me["full_name"] == "Dr. Sarah Updated Audit"
    assert updated_me["department"] == "Information Technology"

    # 6. Registration Audit (Student)
    print("\n[AUDIT 6] Testing Student Registration POST /api/auth/register...")
    stu_email = f"stu_audit_{int(time.time())}@test.com"
    code, stu_reg = http_post("/auth/register", {
        "full_name": "Alex Audit",
        "email": stu_email,
        "password": "Password123!",
        "role": "student"
    })
    print(f"-> Status {code}, User ID: {stu_reg['user']['id']}")
    assert code == 200
    stu_token = stu_reg["access_token"]

    # 7. Student Login Audit
    print("\n[AUDIT 7] Testing Student Login POST /api/auth/login...")
    code, stu_login = http_post("/auth/login", {
        "email": stu_email,
        "password": "Password123!"
    })
    print(f"-> Status {code}, Token issued for: {stu_login['user']['email']}")
    assert code == 200

    # 8. Classroom Creation Audit (Faculty)
    print("\n[AUDIT 8] Testing Faculty Create Classroom POST /api/classrooms...")
    code, cls_data = http_post("/classrooms", {
        "name": "Audit Database Systems",
        "subject_code": "MCA401",
        "semester": "Semester III",
        "department": "Computer Science"
    }, token=fac_token)
    print(f"-> Status {code}, Classroom Code: {cls_data.get('class_code')}")
    assert code == 201
    class_code = cls_data["class_code"]
    cls_id = cls_data["id"]

    # 9. Student Join Classroom Audit
    print(f"\n[AUDIT 9] Testing Student Join Classroom with Code '{class_code}'...")
    code, join_data = http_post("/classrooms/join", {"class_code": class_code}, token=stu_token)
    print(f"-> Status {code}, Message: {join_data.get('message')}")
    assert code == 200

    # 10. Student Joined Listing Audit
    print("\n[AUDIT 10] Testing Student Enrolled Classrooms GET /api/classrooms/enrolled...")
    code, enrolled_list = http_get("/classrooms/enrolled", token=stu_token)
    print(f"-> Status {code}, Enrolled count: {len(enrolled_list)}")
    assert code == 200 and len(enrolled_list) == 1

    # 11. Student Leave Classroom Audit
    print(f"\n[AUDIT 11] Testing Student Leave Classroom DELETE /api/classrooms/{cls_id}/leave...")
    code, leave_data = http_delete(f"/classrooms/{cls_id}/leave", token=stu_token)
    print(f"-> Status {code}, Response: {leave_data}")
    assert code == 200

    # 12. Faculty Delete Classroom Audit
    print(f"\n[AUDIT 12] Testing Faculty Delete Classroom DELETE /api/classrooms/{cls_id}...")
    code, del_data = http_delete(f"/classrooms/{cls_id}", token=fac_token)
    print(f"-> Status {code}, Response: {del_data}")
    assert code == 200

    print("\n" + "=" * 60)
    print("ALL AUTHENTICATION & CLASSROOM REGRESSION AUDITS PASSED 100%")
    print("=" * 60)

if __name__ == "__main__":
    run_regression_test()
