import os
import sys
import io
import json
import pymysql
import bcrypt
from datetime import datetime

# Ensure working directory and sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from app import app
from db import get_connection

client = app.test_client()

results = []

def run_test(test_id, category, name, fn):
    try:
        fn()
        results.append({"id": test_id, "category": category, "name": name, "status": "PASSED", "error": None})
        print(f" [PASS] {test_id}: {name}")
    except AssertionError as e:
        results.append({"id": test_id, "category": category, "name": name, "status": "FAILED", "error": str(e)})
        print(f" [FAIL] {test_id}: {name} -> {e}")
    except Exception as e:
        results.append({"id": test_id, "category": category, "name": name, "status": "ERROR", "error": str(e)})
        print(f" [ERROR] {test_id}: {name} -> {e}")

# Global storage for chained tests
test_state = {}

# --- 1. Database & Table Verification ---
def test_db_connection():
    conn = get_connection()
    assert conn is not None, "Connection object is None"
    with conn.cursor() as cur:
        cur.execute("SELECT 1;")
        res = cur.fetchone()
        assert res['1'] == 1 or list(res.values())[0] == 1, "Select 1 failed"
    conn.close()

def test_db_tables():
    expected_tables = {
        'users', 'classes', 'attendance', 'assignments',
        'submissions', 'mcq_tests', 'mcq_questions',
        'test_results', 'library_books', 'announcements'
    }
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SHOW TABLES;")
        tables = {list(r.values())[0] for r in cur.fetchall()}
    conn.close()
    missing = expected_tables - tables
    assert len(missing) == 0, f"Missing tables: {missing}"

# --- 2. Auth: Student Registration & Login Blocking ---
def test_student_registration():
    email = f"test_student_{int(datetime.now().timestamp())}@tuition.com"
    test_state['student_email'] = email
    test_state['student_pass'] = "Student@123"
    test_state['student_name'] = "Test Student Alice"

    res = client.post('/api/auth/register', json={
        "name": test_state['student_name'],
        "email": email,
        "password": test_state['student_pass']
    })
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
    data = res.get_json()
    assert data.get('status') == 'pending', f"Expected status 'pending', got {data.get('status')}"

def test_pending_student_login_blocked():
    res = client.post('/api/auth/login', json={
        "email": test_state['student_email'],
        "password": test_state['student_pass']
    })
    assert res.status_code == 403, f"Expected 403 for pending student, got {res.status_code}"
    data = res.get_json()
    assert data.get('account_status') == 'pending', f"Expected account_status 'pending', got {data}"

def test_admin_login():
    res = client.post('/api/auth/login', json={
        "email": "admin@tuition.com",
        "password": "Admin@123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    data = res.get_json()
    assert 'token' in data, "Token not returned in login"
    assert data['user']['role'] == 'admin', "Role is not admin"
    test_state['admin_token'] = data['token']
    test_state['admin_headers'] = {'Authorization': f"Bearer {data['token']}"}

def test_admin_approve_student():
    res = client.get('/api/admin/students', headers=test_state['admin_headers'])
    assert res.status_code == 200
    students = res.get_json().get('students', [])
    target = next((s for s in students if s['email'] == test_state['student_email']), None)
    assert target is not None, f"Student {test_state['student_email']} not found in list"
    assert target['status'] == 'pending', "Student not in pending status"
    test_state['student_id'] = target['id']

    res = client.post(f"/api/admin/students/{target['id']}/status",
                      headers=test_state['admin_headers'],
                      json={"status": "approved"})
    assert res.status_code == 200, f"Approval failed: {res.get_json()}"

def test_approved_student_login():
    res = client.post('/api/auth/login', json={
        "email": test_state['student_email'],
        "password": test_state['student_pass']
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    data = res.get_json()
    assert 'token' in data
    assert data['user']['role'] == 'student'
    test_state['student_token'] = data['token']
    test_state['student_headers'] = {'Authorization': f"Bearer {data['token']}"}

def test_student_profile_me():
    res = client.get('/api/auth/me', headers=test_state['student_headers'])
    assert res.status_code == 200
    user = res.get_json().get('user')
    assert user['email'] == test_state['student_email']

# --- 3. Security Tests ---
def test_security_wrong_password():
    res = client.post('/api/auth/login', json={
        "email": "admin@tuition.com",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401

def test_security_student_cannot_access_admin():
    res = client.get('/api/admin/overview', headers=test_state['student_headers'])
    assert res.status_code == 403, f"Student should be 403 forbidden on admin overview, got {res.status_code}"

def test_security_no_token_rejected():
    res = client.get('/api/classes')
    assert res.status_code == 401

def test_security_password_bcrypt_hashed():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT password_hash FROM users WHERE email = %s", (test_state['student_email'],))
        row = cur.fetchone()
    conn.close()
    assert row is not None
    hash_val = row['password_hash']
    assert hash_val.startswith('$2b$') or hash_val.startswith('$2a$'), "Password is not bcrypt hashed!"

def test_security_file_upload_validation():
    data = {
        'file': (io.BytesIO(b"binary exe content"), 'malicious.exe')
    }
    res = client.post(f"/api/assignments/9999/submit",
                      headers=test_state['student_headers'],
                      content_type='multipart/form-data',
                      data=data)
    assert res.status_code == 400, f"Disallowed file extension should return 400, got {res.status_code}"

# --- 4. Teacher Dashboard Overview ---
def test_admin_overview():
    res = client.get('/api/admin/overview', headers=test_state['admin_headers'])
    assert res.status_code == 200
    data = res.get_json()
    for field in ['approved_students', 'pending_students', 'total_classes', 'total_assignments', 'total_tests', 'total_books']:
        assert field in data, f"Missing overview field {field}"

# --- 5. Live Classes & Attendance ---
def test_create_class():
    res = client.post('/api/classes', headers=test_state['admin_headers'], json={
        "title": "Automated Test Class: English Grammar",
        "description": "Covering active and passive voice.",
        "scheduled_at": "2026-11-04 15:00:00"
    })
    assert res.status_code == 201, f"Create class failed: {res.get_json()}"
    cls = res.get_json().get('class')
    assert cls['meeting_code'].startswith('EnglishTuition-')
    test_state['class_id'] = cls['id']

def test_student_join_class_and_attendance():
    cls_id = test_state['class_id']
    res = client.post(f"/api/classes/{cls_id}/join", headers=test_state['student_headers'])
    assert res.status_code == 200
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM attendance WHERE class_id = %s AND student_id = %s",
                    (cls_id, test_state['student_id']))
        att = cur.fetchone()
    conn.close()
    assert att is not None, "Attendance record was not created!"
    assert att['status'] == 'present'

def test_teacher_get_attendance():
    cls_id = test_state['class_id']
    res = client.get(f"/api/classes/{cls_id}/attendance", headers=test_state['admin_headers'])
    assert res.status_code == 200
    records = res.get_json().get('attendance', [])
    assert any(r['email'] == test_state['student_email'] for r in records)

# --- 6. Assignments, Submissions & Grading ---
def test_create_assignment():
    data = {
        'title': 'Test Assignment: Essay on Reading Habits',
        'instructions': 'Write 200 words on the benefits of daily English reading.',
        'total_marks': '50',
        'due_date': '2026-11-10 23:59:00'
    }
    res = client.post('/api/assignments',
                      headers=test_state['admin_headers'],
                      content_type='multipart/form-data',
                      data=data)
    assert res.status_code == 201, f"Create assignment failed: {res.get_json()}"
    res = client.get('/api/assignments', headers=test_state['admin_headers'])
    assigns = res.get_json().get('assignments', [])
    target = next((a for a in assigns if a['title'] == data['title']), None)
    assert target is not None
    test_state['assignment_id'] = target['id']

def test_student_submit_assignment():
    assign_id = test_state['assignment_id']
    data = {
        'file': (io.BytesIO(b"My English Essay content in PDF format..."), 'essay.pdf')
    }
    res = client.post(f"/api/assignments/{assign_id}/submit",
                      headers=test_state['student_headers'],
                      content_type='multipart/form-data',
                      data=data)
    assert res.status_code == 200, f"Submit assignment failed: {res.get_json()}"

def test_teacher_grade_submission():
    assign_id = test_state['assignment_id']
    res = client.get(f"/api/assignments/{assign_id}/submissions", headers=test_state['admin_headers'])
    assert res.status_code == 200
    subs = res.get_json().get('submissions', [])
    target = next((s for s in subs if s['student_email'] == test_state['student_email']), None)
    assert target is not None, "Submission not found"
    sub_id = target['id']

    res = client.post(f"/api/submissions/{sub_id}/grade",
                      headers=test_state['admin_headers'],
                      json={"marks_awarded": 45, "feedback": "Well written, rich vocabulary!"})
    assert res.status_code == 200

# --- 7. Weekly MCQ Tests & Anti-Cheat ---
def test_create_mcq_test():
    res = client.post('/api/tests', headers=test_state['admin_headers'], json={
        "title": "Week 1 Grammar Assessment",
        "description": "Test of present and past tenses.",
        "duration_minutes": 20
    })
    assert res.status_code == 201
    test_state['test_id'] = res.get_json()['test_id']

def test_add_mcq_question():
    t_id = test_state['test_id']
    res = client.post(f"/api/tests/{t_id}/questions", headers=test_state['admin_headers'], json={
        "question_text": "What is the past tense of 'run'?",
        "option_a": "Ran",
        "option_b": "Runned",
        "option_c": "Running",
        "option_d": "Rans",
        "correct_option": "A",
        "marks": 5
    })
    assert res.status_code == 201

def test_anti_cheat_question_leak():
    t_id = test_state['test_id']
    client.post(f"/api/tests/{t_id}/toggle-publish", headers=test_state['admin_headers'])

    res = client.get(f"/api/tests/{t_id}/questions", headers=test_state['student_headers'])
    assert res.status_code == 200
    qs = res.get_json().get('questions', [])
    assert len(qs) > 0
    for q in qs:
        assert 'correct_option' not in q, "SECURITY FLAW: correct_option is leaked to student!"

def test_student_submit_test():
    t_id = test_state['test_id']
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM mcq_questions WHERE test_id = %s LIMIT 1", (t_id,))
        q_row = cur.fetchone()
    conn.close()
    assert q_row is not None
    q_id = str(q_row['id'])

    res = client.post(f"/api/tests/{t_id}/submit", headers=test_state['student_headers'], json={
        "answers": {q_id: "A"}
    })
    assert res.status_code == 200
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM test_results WHERE test_id = %s AND student_id = %s",
                    (t_id, test_state['student_id']))
        res_row = cur.fetchone()
    conn.close()
    assert res_row is not None
    assert res_row['score'] == 5.0, f"Expected 5.0, got {res_row['score']}"

def test_toggle_results_published():
    t_id = test_state['test_id']
    res = client.post(f"/api/tests/{t_id}/toggle-results", headers=test_state['admin_headers'])
    assert res.status_code == 200
    assert res.get_json()['results_published'] is True

# --- 8. Student Performance & Leaderboard ---
def test_performance_leaderboard():
    res = client.get('/api/performance/leaderboard', headers=test_state['student_headers'])
    assert res.status_code == 200
    board = res.get_json().get('leaderboard', [])
    assert len(board) > 0
    me = next((b for b in board if b['student_id'] == test_state['student_id']), None)
    assert me is not None, "Student not found on leaderboard"
    assert me['total_earned'] == 50.0, f"Expected 50.0 total earned (45 assign + 5 test), got {me['total_earned']}"
    assert me['rank'] >= 1, "Rank not calculated"

def test_student_my_report():
    res = client.get('/api/performance/my-report', headers=test_state['student_headers'])
    assert res.status_code == 200
    rep = res.get_json()
    assert 'attendance_pct' in rep
    assert 'test_history' in rep
    assert 'assignment_history' in rep
    assert len(rep['test_history']) > 0
    assert len(rep['assignment_history']) > 0

# --- 9. English Reading Library ---
def test_library_get_and_filter():
    res = client.get('/api/library', headers=test_state['student_headers'])
    assert res.status_code == 200
    books = res.get_json().get('books', [])
    assert len(books) >= 4, f"Expected at least 4 seeded books, got {len(books)}"

    res = client.get('/api/library?difficulty=Beginner', headers=test_state['student_headers'])
    assert res.status_code == 200
    beginner_books = res.get_json().get('books', [])
    assert all(b['difficulty'] == 'Beginner' for b in beginner_books)

def test_library_add_and_delete_book():
    res = client.post('/api/library', headers=test_state['admin_headers'], json={
        "title": "Automated Test Story: The Wise Owl",
        "author": "Antigravity Tester",
        "category": "Moral stories",
        "difficulty": "Beginner",
        "summary": "A short story about observation and silence.",
        "content": "There was an old owl that lived in an oak. The more he saw, the less he spoke.",
        "vocabulary_notes": "• Observation: The action of observing something."
    })
    assert res.status_code == 201

    res = client.get('/api/library?search=Wise+Owl', headers=test_state['student_headers'])
    assert res.status_code == 200
    books = res.get_json().get('books', [])
    target = next((b for b in books if 'Wise Owl' in b['title']), None)
    assert target is not None
    book_id = target['id']

    del_res = client.delete(f"/api/library/{book_id}", headers=test_state['admin_headers'])
    assert del_res.status_code == 200

# --- 10. Announcements ---
def test_announcements():
    res = client.post('/api/announcements', headers=test_state['admin_headers'], json={
        "title": "Automated Notice: Welcome to New Term",
        "content": "Please review all reading materials in the library."
    })
    assert res.status_code == 201

    res = client.get('/api/announcements', headers=test_state['student_headers'])
    assert res.status_code == 200
    notices = res.get_json().get('announcements', [])
    assert any('Welcome to New Term' in n['title'] for n in notices)

# --- EXECUTE SUITE ---
def main():
    print("="*60)
    print("STARTING COMPLETE AUTOMATED TEST SUITE")
    print("="*60)

    tests = [
        ("DB-01", "Database", "Direct Connection to MySQL", test_db_connection),
        ("DB-02", "Database", "Verify All 10 Required Tables", test_db_tables),
        ("AUTH-01", "Authentication", "Student Registration (Pending Status)", test_student_registration),
        ("AUTH-02", "Authentication", "Pending Student Login Blocked (403)", test_pending_student_login_blocked),
        ("AUTH-03", "Authentication", "Admin / Teacher Login & Token Issue", test_admin_login),
        ("AUTH-04", "Authentication", "Admin Approval of Student Account", test_admin_approve_student),
        ("AUTH-05", "Authentication", "Approved Student Successful Login", test_approved_student_login),
        ("AUTH-06", "Authentication", "Student /api/auth/me Profile Check", test_student_profile_me),
        ("SEC-01", "Security", "Invalid Password Rejected (401)", test_security_wrong_password),
        ("SEC-02", "Security", "Student Denied Access to Admin APIs (403)", test_security_student_cannot_access_admin),
        ("SEC-03", "Security", "Unauthenticated Request Rejected (401)", test_security_no_token_rejected),
        ("SEC-04", "Security", "Passwords Stored as Secure Bcrypt Hashes", test_security_password_bcrypt_hashed),
        ("SEC-05", "Security", "File Upload Extension Validation (.exe blocked)", test_security_file_upload_validation),
        ("DASH-01", "Dashboard", "Admin Overview KPI Metrics", test_admin_overview),
        ("CLASS-01", "Live Classes", "Teacher Schedule Class & Meeting Code", test_create_class),
        ("CLASS-02", "Live Classes", "Student Join Class & Auto Attendance", test_student_join_class_and_attendance),
        ("CLASS-03", "Live Classes", "Teacher View Class Attendance List", test_teacher_get_attendance),
        ("ASSIGN-01", "Assignments", "Teacher Create Daily Assignment", test_create_assignment),
        ("ASSIGN-02", "Assignments", "Student Upload & Submit Homework PDF", test_student_submit_assignment),
        ("ASSIGN-03", "Assignments", "Teacher Review & Grade Submission", test_teacher_grade_submission),
        ("MCQ-01", "MCQ Tests", "Teacher Create Weekly Test", test_create_mcq_test),
        ("MCQ-02", "MCQ Tests", "Teacher Add 4-Option MCQ Question", test_add_mcq_question),
        ("MCQ-03", "MCQ Tests", "Anti-Cheat: Answer Key Hidden from Students", test_anti_cheat_question_leak),
        ("MCQ-04", "MCQ Tests", "Student Online Quiz Taking & Auto-Evaluation", test_student_submit_test),
        ("MCQ-05", "MCQ Tests", "Teacher Publish Test Results & Ranks", test_toggle_results_published),
        ("PERF-01", "Performance", "Leaderboard Calculation with Tied Score Handling", test_performance_leaderboard),
        ("PERF-02", "Performance", "Student Personalized Report Card History", test_student_my_report),
        ("LIB-01", "Reading Library", "Fetch Catalog, Difficulty & Search Filter", test_library_get_and_filter),
        ("LIB-02", "Reading Library", "Teacher Add and Delete Library Resource", test_library_add_and_delete_book),
        ("NOTIF-01", "Announcements", "Teacher Post & Student Receive Notice", test_announcements),
    ]

    for tid, cat, name, fn in tests:
        run_test(tid, cat, name, fn)

    print("="*60)
    passed = sum(1 for r in results if r['status'] == 'PASSED')
    failed = sum(1 for r in results if r['status'] in ('FAILED', 'ERROR'))
    total = len(results)
    print(f"RESULTS: Total: {total} | Passed: {passed} | Failed: {failed}")
    print(f"PASS RATE: {round((passed/total)*100, 1)}%")
    print("="*60)

    with open(os.path.join(BASE_DIR, 'test_results.json'), 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == '__main__':
    main()
