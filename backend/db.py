import os
import pymysql
from pymysql.cursors import DictCursor
import bcrypt
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'tuition_db')

def get_connection(with_db=True):
    """Establishes and returns a MySQL database connection."""
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME if with_db else None,
        cursorclass=DictCursor,
        autocommit=True
    )

def init_database():
    """Initializes the database and all required tables."""
    # 1. Connect without specifying database to create tuition_db if not exists
    conn = get_connection(with_db=False)
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.close()

    # 2. Connect to tuition_db and create tables
    conn = get_connection(with_db=True)
    with conn.cursor() as cursor:
        # Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
            status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Classes Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            scheduled_at DATETIME NOT NULL,
            meeting_code VARCHAR(100),
            status ENUM('upcoming', 'live', 'completed', 'cancelled') DEFAULT 'upcoming',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Attendance Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            student_id INT NOT NULL,
            status ENUM('present', 'absent', 'late') DEFAULT 'present',
            marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # Assignments Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            instructions TEXT NOT NULL,
            total_marks INT NOT NULL DEFAULT 100,
            due_date DATETIME NOT NULL,
            attachment_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Submissions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            assignment_id INT NOT NULL,
            student_id INT NOT NULL,
            file_url VARCHAR(500) NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            marks_awarded FLOAT DEFAULT NULL,
            feedback TEXT,
            status ENUM('submitted', 'graded') DEFAULT 'submitted',
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # MCQ Tests Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mcq_tests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            duration_minutes INT NOT NULL DEFAULT 30,
            is_published BOOLEAN DEFAULT FALSE,
            results_published BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # MCQ Questions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mcq_questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_id INT NOT NULL,
            question_text TEXT NOT NULL,
            option_a VARCHAR(255) NOT NULL,
            option_b VARCHAR(255) NOT NULL,
            option_c VARCHAR(255) NOT NULL,
            option_d VARCHAR(255) NOT NULL,
            correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
            marks INT DEFAULT 1,
            FOREIGN KEY (test_id) REFERENCES mcq_tests(id) ON DELETE CASCADE
        );
        """)

        # Test Results Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            test_id INT NOT NULL,
            student_id INT NOT NULL,
            score FLOAT NOT NULL,
            total_marks FLOAT NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_id) REFERENCES mcq_tests(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # English Reading Library Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS library_books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(150) NOT NULL,
            category VARCHAR(100) NOT NULL,
            difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
            summary TEXT,
            content LONGTEXT NOT NULL,
            vocabulary_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Announcements Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Create Default Admin / Teacher Account if not exists
        cursor.execute("SELECT * FROM users WHERE role = 'admin' LIMIT 1")
        admin = cursor.fetchone()
        if not admin:
            default_admin_email = "admin@tuition.com"
            default_admin_pass = "Admin@123"
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(default_admin_pass.encode('utf-8'), salt).decode('utf-8')
            cursor.execute("""
            INSERT INTO users (name, email, password_hash, role, status)
            VALUES (%s, %s, %s, 'admin', 'approved')
            """, ("Teacher Admin", default_admin_email, hashed))
            print(f"Created default admin account: {default_admin_email} (Password: {default_admin_pass})")

    conn.close()
    print("Database and all tables initialized successfully!")

if __name__ == '__main__':
    init_database()
