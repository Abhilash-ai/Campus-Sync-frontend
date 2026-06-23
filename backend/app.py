import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import db
from routes.auth import auth_bp
from routes.student import student_bp
from routes.attendance import attendance_bp
from routes.analytics import analytics_bp
from utils.auth_helper import hash_password

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for frontend Vite development server
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(student_bp, url_prefix='/api/students')
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'database': 'MongoDB (Atlas)' if not hasattr(db, 'db_path') else 'Local JSON Fallback'
    }), 200

def seed_database():
    """
    Seeds default administrative, teacher, student accounts,
    along with student records and attendance logs if empty.
    """
    try:
        # Check if users are empty
        if db.users.count_documents() == 0:
            print("Seeding database with default users and students...")
            
            # 1. Create Default logins
            db.users.insert_one({
                'username': 'admin',
                'email': 'admin@campussync.edu',
                'password_hash': hash_password('password123'),
                'role': 'admin',
                'student_id': None
            })
            
            db.users.insert_one({
                'username': 'teacher',
                'email': 'teacher@campussync.edu',
                'password_hash': hash_password('password123'),
                'role': 'teacher',
                'student_id': None
            })
            
            db.users.insert_one({
                'username': 'student',
                'email': 'student@campussync.edu',
                'password_hash': hash_password('password123'),
                'role': 'student',
                'student_id': 'STU1001'
            })
            
            # 2. Add 10 mock students (various departments and semesters)
            mock_students = [
                {
                    'student_id': 'STU1001',
                    'name': 'Alex Mercer',
                    'roll_number': 'CS-2023-001',
                    'department': 'Computer Science',
                    'semester': 'Semester 4',
                    'email': 'student@campussync.edu',
                    'phone': '+1 (555) 019-2831',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1001_CS',
                    'performance': {'internal_marks': 88.0, 'assignment_scores': 90.0, 'exam_scores': 85.0, 'gpa': 3.6}
                },
                {
                    'student_id': 'STU1002',
                    'name': 'Sarah Connor',
                    'roll_number': 'CS-2023-002',
                    'department': 'Computer Science',
                    'semester': 'Semester 4',
                    'email': 'sarah@campussync.edu',
                    'phone': '+1 (555) 019-4822',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1002_CS',
                    'performance': {'internal_marks': 92.0, 'assignment_scores': 95.0, 'exam_scores': 91.0, 'gpa': 3.9}
                },
                {
                    'student_id': 'STU1003',
                    'name': 'John Doe',
                    'roll_number': 'EE-2023-010',
                    'department': 'Electrical Engineering',
                    'semester': 'Semester 6',
                    'email': 'john@campussync.edu',
                    'phone': '+1 (555) 012-3456',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1003_CS',
                    'performance': {'internal_marks': 72.0, 'assignment_scores': 75.0, 'exam_scores': 68.0, 'gpa': 2.8}
                },
                {
                    'student_id': 'STU1004',
                    'name': 'Bruce Wayne',
                    'roll_number': 'CS-2023-004',
                    'department': 'Computer Science',
                    'semester': 'Semester 4',
                    'email': 'bruce@campussync.edu',
                    'phone': '+1 (555) 999-8888',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1004_CS',
                    'performance': {'internal_marks': 98.0, 'assignment_scores': 100.0, 'exam_scores': 99.0, 'gpa': 4.0}
                },
                {
                    'student_id': 'STU1005',
                    'name': 'Peter Parker',
                    'roll_number': 'CS-2023-005',
                    'department': 'Computer Science',
                    'semester': 'Semester 4',
                    'email': 'peter@campussync.edu',
                    'phone': '+1 (555) 123-7890',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1005_CS',
                    'performance': {'internal_marks': 74.0, 'assignment_scores': 85.0, 'exam_scores': 70.0, 'gpa': 3.2}
                },
                {
                    'student_id': 'STU1006',
                    'name': 'Clark Kent',
                    'roll_number': 'ME-2023-021',
                    'department': 'Mechanical Engineering',
                    'semester': 'Semester 2',
                    'email': 'clark@campussync.edu',
                    'phone': '+1 (555) 456-1122',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1006_CS',
                    'performance': {'internal_marks': 85.0, 'assignment_scores': 80.0, 'exam_scores': 87.0, 'gpa': 3.5}
                },
                {
                    'student_id': 'STU1007',
                    'name': 'Diana Prince',
                    'roll_number': 'EE-2023-007',
                    'department': 'Electrical Engineering',
                    'semester': 'Semester 6',
                    'email': 'diana@campussync.edu',
                    'phone': '+1 (555) 789-3344',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1007_CS',
                    'performance': {'internal_marks': 94.0, 'assignment_scores': 96.0, 'exam_scores': 95.0, 'gpa': 3.9}
                },
                {
                    'student_id': 'STU1008',
                    'name': 'Barry Allen',
                    'roll_number': 'CS-2023-008',
                    'department': 'Computer Science',
                    'semester': 'Semester 4',
                    'email': 'barry@campussync.edu',
                    'phone': '+1 (555) 222-3333',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1008_CS',
                    'performance': {'internal_marks': 62.0, 'assignment_scores': 68.0, 'exam_scores': 60.0, 'gpa': 2.3} # Academic Risk, High Attendance
                },
                {
                    'student_id': 'STU1009',
                    'name': 'Arthur Curry',
                    'roll_number': 'ME-2023-009',
                    'department': 'Mechanical Engineering',
                    'semester': 'Semester 2',
                    'email': 'arthur@campussync.edu',
                    'phone': '+1 (555) 777-8888',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1009_CS',
                    'performance': {'internal_marks': 55.0, 'assignment_scores': 50.0, 'exam_scores': 58.0, 'gpa': 1.9} # Academic Risk, Low Attendance
                },
                {
                    'student_id': 'STU1010',
                    'name': 'Tony Stark',
                    'roll_number': 'EE-2023-010',
                    'department': 'Electrical Engineering',
                    'semester': 'Semester 6',
                    'email': 'tony@campussync.edu',
                    'phone': '+1 (555) 300-3000',
                    'face_embeddings': None,
                    'qr_identity': 'QR_STU1010_CS',
                    'performance': {'internal_marks': 99.0, 'assignment_scores': 98.0, 'exam_scores': 100.0, 'gpa': 4.0} # Low Attendance, High performance
                }
            ]
            
            for s in mock_students:
                db.students.insert_one(s)

            # 3. Add 5 days of historical attendance logs for these students
            import random
            today = datetime.date.today()
            
            for i in range(5, 0, -1):
                log_date = today - datetime.timedelta(days=i)
                # Skip weekends
                if log_date.weekday() >= 5:
                    continue
                    
                log_date_str = log_date.strftime("%Y-%m-%d")
                
                for s in mock_students:
                    s_id = s['student_id']
                    
                    # Generate realistic attendance based on gpa/student behavior
                    # Tony Stark (STU1010) has low attendance
                    if s_id == 'STU1010':
                        prob = 0.4 # 40% chance of present
                    # Arthur Curry (STU1009) has low attendance
                    elif s_id == 'STU1009':
                        prob = 0.5
                    # Barry Allen (STU1008) has high attendance but low gpa
                    elif s_id == 'STU1008':
                        prob = 0.95
                    else:
                        prob = 0.85 # default high attendance
                        
                    is_present = random.random() < prob
                    
                    if is_present:
                        # Present or Late
                        is_late_log = random.random() < 0.2
                        status = 'Late' if is_late_log else 'Present'
                        
                        in_hour = 9 if is_late_log else 8
                        in_minute = random.randint(16, 45) if is_late_log else random.randint(30, 59)
                        in_time = f"{in_hour:02d}:{in_minute:02d}:00"
                        
                        out_hour = 17
                        out_minute = random.randint(0, 30)
                        out_time = f"{out_hour:02d}:{out_minute:02d}:00"
                        
                        t1 = datetime.datetime.strptime(f"{log_date_str} {in_time}", "%Y-%m-%d %H:%M:%S")
                        t2 = datetime.datetime.strptime(f"{log_date_str} {out_time}", "%Y-%m-%d %H:%M:%S")
                        duration = int((t2 - t1).total_seconds() / 60)
                        
                        db.attendance.insert_one({
                            'student_id': s_id,
                            'date': log_date_str,
                            'status': status,
                            'in_time': in_time,
                            'out_time': out_time,
                            'total_duration_minutes': duration,
                            'late_entry': is_late_log,
                            'check_in_by': random.choice(['Face', 'QR']),
                            'remarks': f"Auto checked-in via {random.choice(['Face', 'QR'])}"
                        })
                    else:
                        # Absent
                        db.attendance.insert_one({
                            'student_id': s_id,
                            'date': log_date_str,
                            'status': 'Absent',
                            'in_time': None,
                            'out_time': None,
                            'total_duration_minutes': None,
                            'late_entry': False,
                            'check_in_by': 'Manual',
                            'remarks': 'Marked absent'
                        })
            print("Database successfully seeded!")
    except Exception as e:
        print(f"Error seeding database: {e}")

# Run seeding
seed_database()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
