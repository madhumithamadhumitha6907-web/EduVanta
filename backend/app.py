import os
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import bcrypt
import jwt
import pymysql
from db import get_connection, init_database

# Explicitly load .env from the backend directory
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

JWT_SECRET = os.getenv('JWT_SECRET', 'tuition_super_secret_jwt_key_2026')
JWT_ALGORITHM = 'HS256'

# Upload configuration
UPLOAD_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'docx', 'doc', 'txt'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Ensure database and tables exist
init_database()

# Seed English Reading Library if empty
def seed_initial_library():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as cnt FROM library_books")
            if cursor.fetchone()['cnt'] == 0:
                books = [
                    (
                        "The Tortoise and the Hare",
                        "Aesop",
                        "Moral stories",
                        "Beginner",
                        "A classic English moral fable about consistency, modesty, and perseverance.",
                        """Once upon a time, a boastful Hare ridiculed a slow-moving Tortoise.
"You are so slow! You must take an eternity to reach anywhere," mocked the Hare.
The Tortoise smiled calmly and replied, "Though I am slow, I will beat you in a race."

The Hare, thinking it was an absurd joke, eagerly accepted the challenge. The Fox was appointed as the umpire and marked the finish line at the foot of an old oak tree.

The race began. The Hare darted ahead like the wind. Reaching halfway and looking back to see the Tortoise miles behind, the Hare said to himself, "I have plenty of time. Let me take a quick nap under this shady pine tree."

The Hare fell into a deep sleep. Meanwhile, the Tortoise plodded along step by step, never stopping, never wavering. Hours passed. When the Hare finally woke up, he sprinted desperately toward the goal, but to his dismay, the Tortoise was already across the finish line!

Moral: Slow and steady wins the race.""",
                        "• Boastful (Adjective): Showing excessive pride in oneself.\n• Ridiculed (Verb): Made fun of someone in an unkind way.\n• Wavering (Verb): Hesitating or losing determination.\n• Plodded (Verb): Walked slowly and deliberately with heavy steps."
                    ),
                    (
                        "The Boy Who Cried Wolf",
                        "Traditional Fable",
                        "Short stories with simple vocabulary",
                        "Beginner",
                        "A foundational story teaching the value of honesty and truthfulness.",
                        """A young shepherd boy tended his master's sheep near a dark forest on the slope of a mountain. To pass the quiet time, he thought of a trick to amuse himself.

He rushed toward the village screaming, "Wolf! Wolf! The wolf is attacking the sheep!"
The villagers dropped their work and ran to his rescue, armed with axes and clubs, only to find the boy laughing heartily at their panicked expressions.

A few days later, he played the same trick again. Once more, the kind villagers rushed up the hill, only to be laughed at.

Then, one evening, a ferocious wolf truly emerged from the shadowy woods. Terrified, the boy cried at the top of his lungs: "Wolf! Please help! A real wolf is here!"
The villagers heard him, but they shook their heads and said, "He is just lying again to fool us."

Nobody came. The wolf scattered the flock and carried off sheep into the deep forest.

Moral: Nobody believes a liar, even when they speak the truth.""",
                        "• Shepherd (Noun): A person whose job is to take care of sheep.\n• Amuse (Verb): To provide entertainment or enjoyment.\n• Ferocious (Adjective): Savagely fierce, cruel, or aggressive.\n• Scattered (Verb): Threw or moved in various random directions."
                    ),
                    (
                        "Daily Conversations: At a Restaurant & Ordering Food",
                        "English Speaking Club",
                        "Daily-use English conversations",
                        "Intermediate",
                        "Practical dialogues for ordering meals, asking for recommendations, and settling the bill.",
                        """Waiter: Good evening! Welcome to The Green Garden Bistro. Do you have a reservation?
Customer: Good evening. No, we don't. Do you have a table available for two?
Waiter: Absolutely! Please follow me. Here are your menus. Would you like to start with something to drink?
Customer: Yes, please. Could we have two glasses of sparkling mineral water with lemon?
Waiter: Certainly. I'll be back in a few minutes to take your order.

[Ten minutes later]
Waiter: Are you ready to order, or would you like another moment?
Customer: We are ready. What do you recommend for the main course?
Waiter: Our chef's specialty today is grilled salmon with garlic asparagus and herb roasted potatoes. It's freshly prepared and very popular.
Customer: That sounds delightful. I'll have the grilled salmon, please. And for my friend, could we have the vegetable pasta with extra parmesan?
Waiter: Wonderful choice. How would you like the salmon cooked?
Customer: Medium, please.
Waiter: Excellent. Your food will be served shortly!

[After the meal]
Customer: Excuse me, waiter? Could we please have the bill?
Waiter: Here you are, sir. You can pay by card or cash at your convenience.
Customer: Thank you! The food was delicious.""",
                        "• Reservation (Noun): An arrangement to have a table kept for you.\n• Specialty (Noun): A product or dish that someone specializes in.\n• Delightful (Adjective): Highly pleasing and enjoyable.\n• At your convenience (Idiom): Whenever it is easiest and best for you."
                    ),
                    (
                        "Mastering English Tenses: The Golden Rules",
                        "Prof. Michael Davies",
                        "English grammar",
                        "Intermediate",
                        "Clear rules, structures, and common pitfalls of Present, Past, and Future tenses.",
                        """Tenses tell us WHEN an action happens. Master these 3 foundational tenses:

1. SIMPLE PRESENT TENSE
• Formula: Subject + Verb 1 (add -s/-es for he/she/it)
• Use: For daily habits, routines, and universal truths.
• Examples:
  - "The sun rises in the east." (Universal truth)
  - "She drinks warm green tea every morning." (Daily routine)
• Common Mistake: Writing "He go to school" instead of "He goes to school".

2. PRESENT CONTINUOUS TENSE
• Formula: Subject + is / am / are + Verb (-ing)
• Use: For actions happening right at this very moment.
• Examples:
  - "I am studying English grammar right now."
  - "They are playing football in the garden."

3. SIMPLE PAST TENSE
• Formula: Subject + Verb 2 (Past form)
• Use: For completed actions in the past.
• Examples:
  - "I visited London last summer."
  - "He wrote an impressive essay yesterday."

4. PRESENT PERFECT TENSE
• Formula: Subject + has / have + Verb 3 (Past participle)
• Use: For experiences where the exact time isn't mentioned, or recent actions with present impact.
• Examples:
  - "I have completed all my tuition homework."
  - "She has lived in Cambridge for three years." """,
                        "• Habitual (Adjective): Done or doing constantly as a habit.\n• Universal Truth (Noun Phrase): A fact that is always true everywhere.\n• Participle (Noun): A verb form used as an adjective or to create compound tenses."
                    )
                ]
                for title, author, cat, diff, summary, content, vocab in books:
                    cursor.execute("""
                    INSERT INTO library_books (title, author, category, difficulty, summary, content, vocabulary_notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (title, author, cat, diff, summary, content, vocab))
    finally:
        conn.close()

seed_initial_library()

# In-memory storage for active class whiteboard states
whiteboard_rooms = {}

# --- Helper: JWT Token Generator & Decorator ---

def create_jwt_token(user):
    payload = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'status': user['status'],
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token is missing or invalid.'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.current_user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid session token.'}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user') or request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Access denied: Administrator privileges required.'}), 403
        return f(*args, **kwargs)
    return decorated

# --- Health Check ---
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'database': 'MySQL Connected',
        'message': 'English Tuition API is running smoothly!'
    })

# --- File Serving ---
@app.route('/api/uploads/<folder>/<filename>', methods=['GET'])
def serve_upload(folder, filename):
    safe_folder = 'assignments' if folder == 'assignments' else 'submissions'
    return send_from_directory(os.path.join(UPLOAD_BASE, safe_folder), filename)

# --- Authentication Routes ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    salt = bcrypt.gensalt()
    pw_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'error': 'An account with this email already exists.'}), 409

            cursor.execute("""
            INSERT INTO users (name, email, password_hash, role, status)
            VALUES (%s, %s, %s, 'student', 'pending')
            """, (name, email, pw_hash))
            
        return jsonify({
            'message': 'Registration successful! Your account is now pending approval by the teacher.',
            'status': 'pending'
        }), 201
    except Exception as e:
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid email or password.'}), 401

        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password.'}), 401

        if user['role'] == 'student':
            if user['status'] == 'pending':
                return jsonify({
                    'error': 'Your registration is pending approval by the teacher. Please wait for access to be granted.',
                    'account_status': 'pending'
                }), 403
            elif user['status'] == 'rejected':
                return jsonify({
                    'error': 'Your registration request was rejected. Please contact the teacher for clarification.',
                    'account_status': 'rejected'
                }), 403
            elif user['status'] == 'suspended':
                return jsonify({
                    'error': 'Your student account has been suspended. Please contact the teacher.',
                    'account_status': 'suspended'
                }), 403

        token = create_jwt_token(user)
        return jsonify({
            'message': 'Login successful!',
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'status': user['status']
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Login error: {str(e)}'}), 500
    finally:
        conn.close()

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    user = request.current_user
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, email, role, status, created_at FROM users WHERE id = %s", (user['id'],))
            fresh = cursor.fetchone()
        if not fresh:
            return jsonify({'error': 'User not found.'}), 404
        return jsonify({'user': fresh})
    finally:
        conn.close()

# --- Admin Student Management Routes ---

@app.route('/api/admin/students', methods=['GET'])
@token_required
@admin_required
def list_students():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT id, name, email, role, status, created_at 
            FROM users 
            WHERE role = 'student' 
            ORDER BY created_at DESC
            """)
            students = cursor.fetchall()
            for s in students:
                if s.get('created_at'):
                    s['created_at'] = s['created_at'].strftime('%Y-%m-%d %H:%M')
            return jsonify({'students': students})
    finally:
        conn.close()

@app.route('/api/admin/students/<int:student_id>/status', methods=['POST'])
@token_required
@admin_required
def update_student_status(student_id):
    data = request.get_json() or {}
    new_status = data.get('status')

    if new_status not in ['approved', 'rejected', 'suspended', 'pending']:
        return jsonify({'error': 'Invalid status.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET status = %s WHERE id = %s AND role = 'student'", (new_status, student_id))
        return jsonify({'message': f"Student status changed to '{new_status}'.", 'status': new_status})
    finally:
        conn.close()

@app.route('/api/admin/students/<int:student_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_student(student_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE id = %s AND role = 'student'", (student_id,))
        return jsonify({'message': 'Student deleted successfully.'})
    finally:
        conn.close()

@app.route('/api/admin/overview', methods=['GET'])
@token_required
@admin_required
def admin_overview():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND status = 'approved'")
            approved_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND status = 'pending'")
            pending_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM classes")
            classes_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM assignments")
            assignments_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM mcq_tests")
            tests_count = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM library_books")
            books_count = cursor.fetchone()['count']

        return jsonify({
            'approved_students': approved_count,
            'pending_students': pending_count,
            'total_classes': classes_count,
            'total_assignments': assignments_count,
            'total_tests': tests_count,
            'total_books': books_count
        })
    finally:
        conn.close()

# --- Classes & Attendance Routes ---

@app.route('/api/classes', methods=['GET'])
@token_required
def get_classes():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT id, title, description, scheduled_at, meeting_code, status, created_at 
            FROM classes 
            ORDER BY scheduled_at ASC
            """)
            classes = cursor.fetchall()
            for c in classes:
                if c.get('scheduled_at'):
                    c['scheduled_at'] = c['scheduled_at'].strftime('%Y-%m-%d %H:%M')
                if c.get('created_at'):
                    c['created_at'] = c['created_at'].strftime('%Y-%m-%d %H:%M')
            return jsonify({'classes': classes})
    finally:
        conn.close()

@app.route('/api/classes', methods=['POST'])
@token_required
@admin_required
def create_class():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    scheduled_at = data.get('scheduled_at', '').strip()

    if not title or not scheduled_at:
        return jsonify({'error': 'Title and scheduled time are required.'}), 400

    meeting_code = f"EnglishTuition-{uuid.uuid4().hex[:8]}"

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            INSERT INTO classes (title, description, scheduled_at, meeting_code, status)
            VALUES (%s, %s, %s, %s, 'upcoming')
            """, (title, description, scheduled_at, meeting_code))
            class_id = cursor.lastrowid
        return jsonify({
            'message': 'Class scheduled successfully!',
            'class': {
                'id': class_id,
                'title': title,
                'meeting_code': meeting_code,
                'scheduled_at': scheduled_at,
                'status': 'upcoming'
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/classes/<int:class_id>/status', methods=['POST'])
@token_required
@admin_required
def update_class_status(class_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ['upcoming', 'live', 'completed', 'cancelled']:
        return jsonify({'error': 'Invalid status.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE classes SET status = %s WHERE id = %s", (new_status, class_id))
        return jsonify({'message': f"Class status updated to '{new_status}'."})
    finally:
        conn.close()

@app.route('/api/classes/<int:class_id>/join', methods=['POST'])
@token_required
def join_class(class_id):
    user = request.current_user
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM classes WHERE id = %s", (class_id,))
            cls = cursor.fetchone()
            if not cls:
                return jsonify({'error': 'Class not found.'}), 404

            if user['role'] == 'student':
                cursor.execute("""
                SELECT id FROM attendance WHERE class_id = %s AND student_id = %s
                """, (class_id, user['id']))
                if not cursor.fetchone():
                    cursor.execute("""
                    INSERT INTO attendance (class_id, student_id, status)
                    VALUES (%s, %s, 'present')
                    """, (class_id, user['id']))

            return jsonify({
                'message': 'Joined class successfully.',
                'meeting_code': cls['meeting_code'],
                'class_title': cls['title'],
                'status': cls['status']
            })
    finally:
        conn.close()

@app.route('/api/classes/<int:class_id>/attendance', methods=['GET'])
@token_required
@admin_required
def get_class_attendance(class_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT a.id, u.name, u.email, a.status, a.marked_at
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            WHERE a.class_id = %s
            ORDER BY a.marked_at ASC
            """, (class_id,))
            records = cursor.fetchall()
            for r in records:
                if r.get('marked_at'):
                    r['marked_at'] = r['marked_at'].strftime('%Y-%m-%d %H:%M:%S')
            return jsonify({'attendance': records})
    finally:
        conn.close()

# --- Daily Assignments and Homework Routes ---

@app.route('/api/assignments', methods=['GET'])
@token_required
def get_assignments():
    user = request.current_user
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if user['role'] == 'admin':
                cursor.execute("""
                SELECT a.*, COUNT(s.id) as submissions_count
                FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignment_id
                GROUP BY a.id
                ORDER BY a.due_date DESC
                """)
                assignments = cursor.fetchall()
            else:
                cursor.execute("""
                SELECT a.*, 
                       s.id as submission_id, s.file_url as submission_file,
                       s.submitted_at, s.marks_awarded, s.feedback, s.status as submission_status
                FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = %s
                ORDER BY a.due_date DESC
                """, (user['id'],))
                assignments = cursor.fetchall()

            for item in assignments:
                if item.get('due_date'):
                    item['due_date'] = item['due_date'].strftime('%Y-%m-%d %H:%M')
                if item.get('created_at'):
                    item['created_at'] = item['created_at'].strftime('%Y-%m-%d %H:%M')
                if item.get('submitted_at'):
                    item['submitted_at'] = item['submitted_at'].strftime('%Y-%m-%d %H:%M')

            return jsonify({'assignments': assignments})
    finally:
        conn.close()

@app.route('/api/assignments', methods=['POST'])
@token_required
@admin_required
def create_assignment():
    title = request.form.get('title', '').strip()
    instructions = request.form.get('instructions', '').strip()
    total_marks = int(request.form.get('total_marks', 100))
    due_date = request.form.get('due_date', '').strip()

    if not title or not instructions or not due_date:
        return jsonify({'error': 'Title, instructions, and due date are required.'}), 400

    attachment_url = None
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            fname = f"assign_{uuid.uuid4().hex[:10]}.{ext}"
            file.save(os.path.join(UPLOAD_BASE, 'assignments', fname))
            attachment_url = f"/api/uploads/assignments/{fname}"

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            INSERT INTO assignments (title, instructions, total_marks, due_date, attachment_url)
            VALUES (%s, %s, %s, %s, %s)
            """, (title, instructions, total_marks, due_date, attachment_url))
        return jsonify({'message': 'Assignment created and published successfully!'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/assignments/<int:assignment_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_assignment(assignment_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM assignments WHERE id = %s", (assignment_id,))
        return jsonify({'message': 'Assignment deleted successfully.'})
    finally:
        conn.close()

@app.route('/api/assignments/<int:assignment_id>/submissions', methods=['GET'])
@token_required
@admin_required
def get_assignment_submissions(assignment_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT s.id, s.file_url, s.submitted_at, s.marks_awarded, s.feedback, s.status,
                   u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN users u ON s.student_id = u.id
            WHERE s.assignment_id = %s
            ORDER BY s.submitted_at DESC
            """, (assignment_id,))
            submissions = cursor.fetchall()
            for s in submissions:
                if s.get('submitted_at'):
                    s['submitted_at'] = s['submitted_at'].strftime('%Y-%m-%d %H:%M')
            return jsonify({'submissions': submissions})
    finally:
        conn.close()

@app.route('/api/assignments/<int:assignment_id>/submit', methods=['POST'])
@token_required
def submit_assignment(assignment_id):
    user = request.current_user
    if user['role'] != 'student':
        return jsonify({'error': 'Only students can submit assignments.'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded.'}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({'error': 'No file selected.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file format. Allowed types: PDF, PNG, JPG, JPEG, DOCX.'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    fname = f"sub_{user['id']}_{uuid.uuid4().hex[:8]}.{ext}"
    file.save(os.path.join(UPLOAD_BASE, 'submissions', fname))
    file_url = f"/api/uploads/submissions/{fname}"

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM submissions WHERE assignment_id = %s AND student_id = %s", (assignment_id, user['id']))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("""
                UPDATE submissions 
                SET file_url = %s, submitted_at = CURRENT_TIMESTAMP, status = 'submitted'
                WHERE id = %s
                """, (file_url, existing['id']))
            else:
                cursor.execute("""
                INSERT INTO submissions (assignment_id, student_id, file_url, status)
                VALUES (%s, %s, %s, 'submitted')
                """, (assignment_id, user['id'], file_url))

        return jsonify({'message': 'Assignment homework submitted successfully!', 'file_url': file_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/submissions/<int:submission_id>/grade', methods=['POST'])
@token_required
@admin_required
def grade_submission(submission_id):
    data = request.get_json() or {}
    marks_awarded = data.get('marks_awarded')
    feedback = data.get('feedback', '').strip()

    if marks_awarded is None:
        return jsonify({'error': 'Marks are required.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            UPDATE submissions 
            SET marks_awarded = %s, feedback = %s, status = 'graded'
            WHERE id = %s
            """, (float(marks_awarded), feedback, submission_id))
        return jsonify({'message': 'Grade and feedback saved successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# --- Weekly MCQ Test System Routes ---

@app.route('/api/tests', methods=['GET'])
@token_required
def get_tests():
    user = request.current_user
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if user['role'] == 'admin':
                cursor.execute("""
                SELECT t.*, 
                       (SELECT COUNT(*) FROM mcq_questions WHERE test_id = t.id) as question_count,
                       (SELECT COUNT(*) FROM test_results WHERE test_id = t.id) as submissions_count
                FROM mcq_tests t
                ORDER BY t.created_at DESC
                """)
                tests = cursor.fetchall()
            else:
                cursor.execute("""
                SELECT t.id, t.title, t.description, t.duration_minutes, t.results_published,
                       (SELECT COUNT(*) FROM mcq_questions WHERE test_id = t.id) as question_count,
                       r.id as result_id, r.score, r.total_marks, r.submitted_at
                FROM mcq_tests t
                LEFT JOIN test_results r ON t.id = r.test_id AND r.student_id = %s
                WHERE t.is_published = TRUE
                ORDER BY t.created_at DESC
                """, (user['id'],))
                tests = cursor.fetchall()

            for t in tests:
                if t.get('created_at'):
                    t['created_at'] = t['created_at'].strftime('%Y-%m-%d %H:%M')
                if t.get('submitted_at'):
                    t['submitted_at'] = t['submitted_at'].strftime('%Y-%m-%d %H:%M')

            return jsonify({'tests': tests})
    finally:
        conn.close()

@app.route('/api/tests', methods=['POST'])
@token_required
@admin_required
def create_test():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    duration_minutes = int(data.get('duration_minutes', 30))

    if not title:
        return jsonify({'error': 'Test title is required.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            INSERT INTO mcq_tests (title, description, duration_minutes, is_published, results_published)
            VALUES (%s, %s, %s, FALSE, FALSE)
            """, (title, description, duration_minutes))
            test_id = cursor.lastrowid
        return jsonify({'message': 'MCQ Test created! Now you can add questions.', 'test_id': test_id}), 201
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>/toggle-publish', methods=['POST'])
@token_required
@admin_required
def toggle_test_publish(test_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT is_published FROM mcq_tests WHERE id = %s", (test_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Test not found.'}), 404
            new_val = not bool(row['is_published'])
            cursor.execute("UPDATE mcq_tests SET is_published = %s WHERE id = %s", (new_val, test_id))
        return jsonify({'message': f"Test {'published for students' if new_val else 'hidden (draft mode)'}!", 'is_published': new_val})
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>/toggle-results', methods=['POST'])
@token_required
@admin_required
def toggle_results_publish(test_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT results_published FROM mcq_tests WHERE id = %s", (test_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Test not found.'}), 404
            new_val = not bool(row['results_published'])
            cursor.execute("UPDATE mcq_tests SET results_published = %s WHERE id = %s", (new_val, test_id))
        return jsonify({'message': f"Test scores {'published for students' if new_val else 'hidden'}!", 'results_published': new_val})
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>/questions', methods=['GET'])
@token_required
def get_test_questions(test_id):
    user = request.current_user
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if user['role'] == 'admin':
                cursor.execute("SELECT * FROM mcq_questions WHERE test_id = %s ORDER BY id ASC", (test_id,))
            else:
                cursor.execute("""
                SELECT id, test_id, question_text, option_a, option_b, option_c, option_d, marks 
                FROM mcq_questions 
                WHERE test_id = %s 
                ORDER BY id ASC
                """, (test_id,))
            questions = cursor.fetchall()
            return jsonify({'questions': questions})
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>/questions', methods=['POST'])
@token_required
@admin_required
def add_question(test_id):
    data = request.get_json() or {}
    q_text = data.get('question_text', '').strip()
    opt_a = data.get('option_a', '').strip()
    opt_b = data.get('option_b', '').strip()
    opt_c = data.get('option_c', '').strip()
    opt_d = data.get('option_d', '').strip()
    correct = data.get('correct_option', '').strip().upper()
    marks = int(data.get('marks', 1))

    if not q_text or not opt_a or not opt_b or not opt_c or not opt_d or correct not in ['A', 'B', 'C', 'D']:
        return jsonify({'error': 'Question text, all 4 options, and a valid correct option (A, B, C, or D) are required.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            INSERT INTO mcq_questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (test_id, q_text, opt_a, opt_b, opt_c, opt_d, correct, marks))
        return jsonify({'message': 'Question added successfully!'}), 201
    finally:
        conn.close()

@app.route('/api/questions/<int:question_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_question(question_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM mcq_questions WHERE id = %s", (question_id,))
        return jsonify({'message': 'Question deleted.'})
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>/submit', methods=['POST'])
@token_required
def submit_test(test_id):
    user = request.current_user
    if user['role'] != 'student':
        return jsonify({'error': 'Only students can submit tests.'}), 403

    data = request.get_json() or {}
    student_answers = data.get('answers', {})

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM test_results WHERE test_id = %s AND student_id = %s", (test_id, user['id']))
            if cursor.fetchone():
                return jsonify({'error': 'You have already submitted this test.'}), 400

            cursor.execute("SELECT id, correct_option, marks FROM mcq_questions WHERE test_id = %s", (test_id,))
            questions = cursor.fetchall()

            total_possible_marks = 0
            earned_marks = 0

            for q in questions:
                q_id = str(q['id'])
                q_marks = q['marks']
                total_possible_marks += q_marks

                given_ans = student_answers.get(q_id, '').upper()
                if given_ans == q['correct_option']:
                    earned_marks += q_marks

            cursor.execute("""
            INSERT INTO test_results (test_id, student_id, score, total_marks)
            VALUES (%s, %s, %s, %s)
            """, (test_id, user['id'], earned_marks, total_possible_marks))

            cursor.execute("SELECT results_published FROM mcq_tests WHERE id = %s", (test_id,))
            test_row = cursor.fetchone()
            is_published = test_row['results_published'] if test_row else False

        return jsonify({
            'message': 'Test submitted successfully! Your answers have been recorded.',
            'results_published': is_published,
            'score': earned_marks if is_published else None,
            'total_marks': total_possible_marks
        })
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>/results', methods=['GET'])
@token_required
@admin_required
def get_test_results(test_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            SELECT r.id, r.score, r.total_marks, r.submitted_at,
                   u.name as student_name, u.email as student_email
            FROM test_results r
            JOIN users u ON r.student_id = u.id
            WHERE r.test_id = %s
            ORDER BY r.score DESC, r.submitted_at ASC
            """, (test_id,))
            results = cursor.fetchall()
            for r in results:
                if r.get('submitted_at'):
                    r['submitted_at'] = r['submitted_at'].strftime('%Y-%m-%d %H:%M')
            return jsonify({'results': results})
    finally:
        conn.close()

@app.route('/api/tests/<int:test_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_test(test_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM mcq_tests WHERE id = %s", (test_id,))
        return jsonify({'message': 'Test deleted successfully.'})
    finally:
        conn.close()

# --- English Reading Library Routes ---

@app.route('/api/library', methods=['GET'])
@token_required
def get_library_books():
    category = request.args.get('category', '').strip()
    search = request.args.get('search', '').strip()
    difficulty = request.args.get('difficulty', '').strip()

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            query = "SELECT id, title, author, category, difficulty, summary, vocabulary_notes, created_at FROM library_books WHERE 1=1"
            params = []

            if category and category != 'All':
                query += " AND category = %s"
                params.append(category)

            if difficulty and difficulty != 'All':
                query += " AND difficulty = %s"
                params.append(difficulty)

            if search:
                query += " AND (title LIKE %s OR author LIKE %s OR summary LIKE %s)"
                term = f"%{search}%"
                params.extend([term, term, term])

            query += " ORDER BY id ASC"
            cursor.execute(query, tuple(params))
            books = cursor.fetchall()

            for b in books:
                if b.get('created_at'):
                    b['created_at'] = b['created_at'].strftime('%Y-%m-%d')

            return jsonify({'books': books})
    finally:
        conn.close()

@app.route('/api/library/<int:book_id>', methods=['GET'])
@token_required
def get_book_details(book_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM library_books WHERE id = %s", (book_id,))
            book = cursor.fetchone()
            if not book:
                return jsonify({'error': 'Reading resource not found.'}), 404
            if book.get('created_at'):
                book['created_at'] = book['created_at'].strftime('%Y-%m-%d')
            return jsonify({'book': book})
    finally:
        conn.close()

@app.route('/api/library', methods=['POST'])
@token_required
@admin_required
def add_library_book():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    author = data.get('author', '').strip()
    category = data.get('category', '').strip()
    difficulty = data.get('difficulty', 'Beginner')
    summary = data.get('summary', '').strip()
    content = data.get('content', '').strip()
    vocabulary_notes = data.get('vocabulary_notes', '').strip()

    if not title or not author or not category or not content:
        return jsonify({'error': 'Title, author, category, and reading content are required.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            INSERT INTO library_books (title, author, category, difficulty, summary, content, vocabulary_notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (title, author, category, difficulty, summary, content, vocabulary_notes))
        return jsonify({'message': 'Reading material added to the library successfully!'}), 201
    finally:
        conn.close()

@app.route('/api/library/<int:book_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_library_book(book_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM library_books WHERE id = %s", (book_id,))
        return jsonify({'message': 'Book removed from library.'})
    finally:
        conn.close()

# --- Student Performance, Ranking, & Analytics Routes ---

@app.route('/api/performance/leaderboard', methods=['GET'])
@token_required
def get_leaderboard():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Total classes count
            cursor.execute("SELECT COUNT(*) as cnt FROM classes")
            total_classes = cursor.fetchone()['cnt']

            # Get all approved students
            cursor.execute("""
            SELECT id, name, email FROM users WHERE role = 'student' AND status = 'approved'
            """)
            students = cursor.fetchall()

            leaderboard = []
            for s in students:
                s_id = s['id']

                # Test scores
                cursor.execute("""
                SELECT COALESCE(SUM(score), 0) as earned, COALESCE(SUM(total_marks), 0) as total, COUNT(id) as cnt
                FROM test_results WHERE student_id = %s
                """, (s_id,))
                test_stat = cursor.fetchone()

                # Assignment scores
                cursor.execute("""
                SELECT COALESCE(SUM(s.marks_awarded), 0) as earned, COALESCE(SUM(a.total_marks), 0) as total, COUNT(s.id) as cnt
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                WHERE s.student_id = %s AND s.marks_awarded IS NOT NULL
                """, (s_id,))
                assign_stat = cursor.fetchone()

                # Attendance count
                cursor.execute("SELECT COUNT(*) as cnt FROM attendance WHERE student_id = %s", (s_id,))
                attended_classes = cursor.fetchone()['cnt']
                attendance_pct = round((attended_classes / total_classes * 100) if total_classes > 0 else 100, 1)

                total_earned = float(test_stat['earned']) + float(assign_stat['earned'])
                total_possible = float(test_stat['total']) + float(assign_stat['total'])

                overall_pct = round((total_earned / total_possible * 100) if total_possible > 0 else 0, 1)

                leaderboard.append({
                    'student_id': s_id,
                    'name': s['name'],
                    'email': s['email'],
                    'test_score': float(test_stat['earned']),
                    'test_total': float(test_stat['total']),
                    'tests_taken': test_stat['cnt'],
                    'assignment_score': float(assign_stat['earned']),
                    'assignment_total': float(assign_stat['total']),
                    'assignments_graded': assign_stat['cnt'],
                    'attended_classes': attended_classes,
                    'total_classes': total_classes,
                    'attendance_pct': attendance_pct,
                    'total_earned': total_earned,
                    'total_possible': total_possible,
                    'overall_pct': overall_pct
                })

            # Sort by total_earned DESC, then attendance_pct DESC
            leaderboard.sort(key=lambda x: (x['total_earned'], x['attendance_pct']), reverse=True)

            # Assign ranks with tie handling
            current_rank = 1
            for idx, item in enumerate(leaderboard):
                if idx > 0 and item['total_earned'] == leaderboard[idx - 1]['total_earned'] and item['attendance_pct'] == leaderboard[idx - 1]['attendance_pct']:
                    item['rank'] = leaderboard[idx - 1]['rank']
                else:
                    item['rank'] = idx + 1

            return jsonify({'leaderboard': leaderboard})
    finally:
        conn.close()

@app.route('/api/performance/my-report', methods=['GET'])
@token_required
def get_my_performance():
    user = request.current_user
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Total classes & attendance
            cursor.execute("SELECT COUNT(*) as cnt FROM classes")
            total_classes = cursor.fetchone()['cnt']

            cursor.execute("SELECT COUNT(*) as cnt FROM attendance WHERE student_id = %s", (user['id'],))
            attended_classes = cursor.fetchone()['cnt']
            attendance_pct = round((attended_classes / total_classes * 100) if total_classes > 0 else 100, 1)

            # 2. Detailed test history
            cursor.execute("""
            SELECT r.score, r.total_marks, r.submitted_at, t.title as test_title, t.results_published
            FROM test_results r
            JOIN mcq_tests t ON r.test_id = t.id
            WHERE r.student_id = %s
            ORDER BY r.submitted_at DESC
            """, (user['id'],))
            tests = cursor.fetchall()
            for t in tests:
                if t.get('submitted_at'):
                    t['submitted_at'] = t['submitted_at'].strftime('%Y-%m-%d')

            # 3. Detailed assignment history
            cursor.execute("""
            SELECT s.marks_awarded, s.feedback, s.submitted_at, s.status,
                   a.title as assignment_title, a.total_marks
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.student_id = %s
            ORDER BY s.submitted_at DESC
            """, (user['id'],))
            assignments = cursor.fetchall()
            for a in assignments:
                if a.get('submitted_at'):
                    a['submitted_at'] = a['submitted_at'].strftime('%Y-%m-%d')

            return jsonify({
                'attended_classes': attended_classes,
                'total_classes': total_classes,
                'attendance_pct': attendance_pct,
                'test_history': tests,
                'assignment_history': assignments
            })
    finally:
        conn.close()

# --- Announcements & Notifications Routes ---

@app.route('/api/announcements', methods=['GET'])
@token_required
def get_announcements():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20")
            announcements = cursor.fetchall()
            for a in announcements:
                if a.get('created_at'):
                    a['created_at'] = a['created_at'].strftime('%Y-%m-%d %H:%M')
            return jsonify({'announcements': announcements})
    finally:
        conn.close()

@app.route('/api/announcements', methods=['POST'])
@token_required
@admin_required
def create_announcement():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title or not content:
        return jsonify({'error': 'Title and message content are required.'}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            INSERT INTO announcements (title, content)
            VALUES (%s, %s)
            """, (title, content))
        return jsonify({'message': 'Announcement published to all students!'}), 201
    finally:
        conn.close()

@app.route('/api/announcements/<int:announcement_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_announcement(announcement_id):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM announcements WHERE id = %s", (announcement_id,))
        return jsonify({'message': 'Announcement deleted.'})
    finally:
        conn.close()

# --- Socket.IO Real-Time Interactive Whiteboard Handlers ---

@socketio.on('join_board')
def on_join_board(data):
    room = str(data.get('class_id'))
    join_room(room)
    board_history = whiteboard_rooms.get(room, [])
    emit('board_history', {'history': board_history})

@socketio.on('draw_stroke')
def on_draw_stroke(data):
    room = str(data.get('class_id'))
    stroke = data.get('stroke')
    if room not in whiteboard_rooms:
        whiteboard_rooms[room] = []
    whiteboard_rooms[room].append({'type': 'stroke', 'data': stroke})
    emit('new_stroke', stroke, to=room, include_self=False)

@socketio.on('add_text_note')
def on_add_text_note(data):
    room = str(data.get('class_id'))
    note = data.get('note')
    if room not in whiteboard_rooms:
        whiteboard_rooms[room] = []
    whiteboard_rooms[room].append({'type': 'text', 'data': note})
    emit('new_text_note', note, to=room, include_self=False)

@socketio.on('clear_board')
def on_clear_board(data):
    room = str(data.get('class_id'))
    whiteboard_rooms[room] = []
    emit('board_cleared', {}, to=room)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_DEBUG', 'false').lower() in ('true', '1')
    socketio.run(app, host='0.0.0.0', port=port, debug=debug_mode, allow_unsafe_werkzeug=True)
