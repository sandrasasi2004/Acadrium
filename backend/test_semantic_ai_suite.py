import os
import sys
import time
import io
from PIL import Image, ImageDraw, ImageFont
from docx import Document as DocxDocument
from pptx import Presentation

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.classroom import Classroom
from app.models.resource import Resource
from cleanup_test_data import run_cleanup

client = TestClient(app)
def create_test_pdf():
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 180 >>\nstream\n"
        b"BT\n/F1 12 Tf\n50 700 Td\n(Java Programming Language Fundamentals and Concepts) Tj\n0 -20 Td\n(Java is an object-oriented programming language designed for portability and security.) Tj\n0 -20 Td\n(The Java Virtual Machine JVM executes bytecode.) Tj\nET\n"
        b"endstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000246 00000 n \n0000000478 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n558\n%%EOF"
    )
    return pdf_content

def create_test_docx():
    doc = DocxDocument()
    doc.add_heading("Database Management Systems and Normalization", level=1)
    doc.add_paragraph("Normalization in DBMS is the process of organizing database relations to reduce redundancy.")
    doc.add_paragraph("First Normal Form (1NF) ensures atomic column values.")
    doc.add_paragraph("Second Normal Form (2NF) removes partial functional dependencies.")
    doc.add_paragraph("Third Normal Form (3NF) eliminates transitive functional dependencies.")
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.getvalue()

def create_test_ppt():
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = "Computer Architecture and Microprocessors"
    slide.placeholders[1].text = "CPU components include ALU, Control Unit, and Registers.\nInstruction cycle: Fetch, Decode, Execute."
    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf.getvalue()

def create_test_image():
    img = Image.new('RGB', (800, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 80), "Machine Learning Supervised Learning Concepts", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf.getvalue()

def run_semantic_ai_suite():
    print("\n========================================================")
    print("  ACADRIUM SEMANTIC SEARCH & AI SUITE VERIFICATION")
    print("========================================================\n")
    
    # 1. Setup Test User and Classroom via API
    timestamp = int(time.time())
    fac_email = f"ai_test_fac_{timestamp}@acadrium.edu"
    password = "Password123!"

    reg_resp = client.post("/api/auth/register", json={
        "username": "Prof. AI Tester",
        "email": fac_email,
        "password": password,
        "role": "faculty",
        "department": "Computer Science"
    })
    assert reg_resp.status_code == 200, f"Registration failed: {reg_resp.text}"

    login_resp = client.post("/api/auth/login", json={"email": fac_email, "password": password})
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    class_resp = client.post("/api/classrooms", json={
        "subject": "AI & Computer Science 101",
        "description": "Testing Ground"
    }, headers=headers)
    assert class_resp.status_code == 201, f"Classroom creation failed: {class_resp.text}"
    classroom_id = class_resp.json()["id"]

    db = SessionLocal()
    try:
        print(f"[SETUP PASS] Registered & Logged in Faculty User ({fac_email}) & Classroom ({classroom_id})")

        # TEST 1: PDF Upload & Vector Generation
        print("\n--- TEST 1: PDF Upload & Vector Embedding Generation ---")
        pdf_bytes = create_test_pdf()
        res = client.post(
            "/api/resources/upload",
            headers=headers,
            data={"classroom_id": classroom_id, "title": "Java Fundamentals Guide", "description": "Core concepts of Java", "tags": "java,programming"},
            files={"file": ("java_guide.pdf", pdf_bytes, "application/pdf")}
        )
        assert res.status_code in [200, 201], f"PDF upload failed: {res.text}"
        pdf_data = res.json()
        pdf_id = pdf_data["id"]
        print(f"[PASS] PDF Uploaded: ID = {pdf_id}")

        # TEST 2: DOCX Upload & Vector Generation
        print("\n--- TEST 2: DOCX Upload & Vector Embedding Generation ---")
        docx_bytes = create_test_docx()
        res = client.post(
            "/api/resources/upload",
            headers=headers,
            data={"classroom_id": classroom_id, "title": "DBMS Normalization Overview", "description": "Database design principles", "tags": "dbms,sql"},
            files={"file": ("dbms_norm.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        assert res.status_code in [200, 201], f"DOCX upload failed: {res.text}"
        docx_data = res.json()
        docx_id = docx_data["id"]
        print(f"[PASS] DOCX Uploaded: ID = {docx_id}")

        # TEST 3: PPT Upload & Vector Generation
        print("\n--- TEST 3: PPT Upload & Vector Embedding Generation ---")
        ppt_bytes = create_test_ppt()
        res = client.post(
            "/api/resources/upload",
            headers=headers,
            data={"classroom_id": classroom_id, "title": "Computer Architecture Slides", "description": "CPU and ALU notes", "tags": "hardware,cpu"},
            files={"file": ("architecture.pptx", ppt_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation")}
        )
        assert res.status_code in [200, 201], f"PPT upload failed: {res.text}"
        ppt_data = res.json()
        ppt_id = ppt_data["id"]
        print(f"[PASS] PPT Uploaded: ID = {ppt_id}")

        # TEST 4: IMAGE Upload & OCR Vector Generation
        print("\n--- TEST 4: IMAGE Upload & OCR Embedding Generation ---")
        img_bytes = create_test_image()
        res = client.post(
            "/api/resources/upload",
            headers=headers,
            data={"classroom_id": classroom_id, "title": "Machine Learning Diagram Notes", "description": "Supervised learning overview", "tags": "ml,ai"},
            files={"file": ("ml_notes.png", img_bytes, "image/png")}
        )
        assert res.status_code in [200, 201], f"Image upload failed: {res.text}"
        img_data = res.json()
        img_id = img_data["id"]
        print(f"[PASS] Image Uploaded: ID = {img_id}")

        # Verify background processing & embedding persistence
        print("\n--- Verifying Processing & Vector Persistence in DB ---")
        time.sleep(2)  # brief pause for processing thread completion
        
        resource_ids = [pdf_id, docx_id, ppt_id, img_id]
        for rid in resource_ids:
            r = db.query(Resource).filter(Resource.id == rid).first()
            assert r is not None, f"Resource {rid} missing from DB"
            print(f"Resource '{r.title}': Status = {r.extraction_status}, Extracted Text Len = {len(r.extracted_text or '')}, Embedding Present = {r.embedding is not None}")
            assert r.extracted_text is not None and len(r.extracted_text) > 0, f"Extracted text empty for {r.title}"
            assert r.embedding is not None, f"Embedding vector missing for {r.title}"
        
        print("[PASS] All 4 resource types (PDF, DOCX, PPT, IMAGE) successfully extracted text & persisted embeddings!")

        # TEST 5: Vector Semantic Search API
        print("\n--- TEST 5: Vector Semantic Search Endpoint ---")
        search_res = client.post(
            "/api/search/resources",
            headers=headers,
            json={"query": "Explain object oriented programming and JVM", "classroom_id": classroom_id}
        )
        assert search_res.status_code == 200, f"Semantic search API error: {search_res.text}"
        search_results = search_res.json()
        print(f"Query: 'Explain object oriented programming and JVM'")
        print(f"Returned {len(search_results)} search results.")
        assert len(search_results) > 0, "No semantic search results returned"
        top_match = search_results[0]
        print(f"Top Match: Title = '{top_match['title']}', Similarity = {top_match['similarity']}")
        assert "Java" in top_match["title"], f"Expected Java guide as top match, got '{top_match['title']}'"
        print("[PASS] Semantic vector similarity search returned correct top document!")

        # TEST 6: AI Assistant Grounded RAG Query
        print("\n--- TEST 6: AI Assistant Ask Endpoint (RAG) ---")
        ai_res = client.post(
            "/api/ai/ask",
            headers=headers,
            json={"question": "What is normalization in database management?", "classroom_id": classroom_id}
        )
        assert ai_res.status_code == 200, f"AI ask endpoint error: {ai_res.text}"
        ai_data = ai_res.json()
        print(f"Question: 'What is normalization in database management?'")
        print(f"AI Answer:\n{ai_data['answer']}")
        print(f"Sources Provided ({len(ai_data['sources'])}):")
        for s in ai_data['sources']:
            print(f"  - {s['title']} ({s['file_type']}) | Similarity: {s['similarity']}")
        
        assert len(ai_data['sources']) > 0, "AI answer missing sources"
        assert "DBMS Normalization Overview" in [s['title'] for s in ai_data['sources']], "Correct DBMS source missing from citations"
        assert "redundancy" in ai_data['answer'].lower() or "normal form" in ai_data['answer'].lower() or "database" in ai_data['answer'].lower(), "AI answer not grounded in document content"
        print("[PASS] AI Assistant grounded RAG answer generated with valid source citations!")

        # TEST 7: AI Document Summary Generation
        print("\n--- TEST 7: AI Document Summary Feature ---")
        sum_res = client.post(
            f"/api/ai/resources/{pdf_id}/summary",
            headers=headers
        )
        assert sum_res.status_code == 200, f"Summary endpoint error: {sum_res.text}"
        sum_data = sum_res.json()
        print(f"Resource: '{sum_data['title']}'")
        print(f"Generated Summary:\n{sum_data['summary']}")
        assert len(sum_data['summary']) > 10, "Summary too short"

        # Verify stored in DB
        db.refresh(r)
        pdf_db = db.query(Resource).filter(Resource.id == pdf_id).first()
        assert pdf_db.resource_summary is not None, "resource_summary not persisted in database column"
        print("[PASS] Resource summary generated and verified in database!")

        print("\n========================================================")
        print("  ALL 7 SEMANTIC & AI VERIFICATION TESTS PASSED PERFECTLY!")
        print("========================================================\n")

    finally:
        db.close()
        # Clean up created test data cleanly
        run_cleanup(dry_run=False)

if __name__ == "__main__":
    run_semantic_ai_suite()
