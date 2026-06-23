import datetime
from flask import Blueprint, request, jsonify
from database import db
from utils.auth_helper import token_required
from utils.face_helper import get_face_embedding, compare_embeddings
from config import Config

attendance_bp = Blueprint('attendance', __name__)

def get_current_date_and_time():
    now = datetime.datetime.now()
    return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")

def is_late(in_time_str):
    try:
        in_time = datetime.datetime.strptime(in_time_str, "%H:%M:%S").time()
        threshold_time = datetime.datetime.strptime(Config.LATE_THRESHOLD, "%H:%M").time()
        return in_time > threshold_time
    except Exception:
        return False

def record_attendance_db(student_id, method, remarks=""):
    date_str, time_str = get_current_date_and_time()
    
    # Check if a log already exists for this student and date
    record = db.attendance.find_one({'student_id': student_id, 'date': date_str})
    
    if not record:
        # Check-in flow
        late = is_late(time_str)
        status = 'Late' if late else 'Present'
        
        new_record = {
            'student_id': student_id,
            'date': date_str,
            'status': status,
            'in_time': time_str,
            'out_time': None,
            'total_duration_minutes': None,
            'late_entry': late,
            'check_in_by': method,
            'remarks': remarks or ("Auto checked-in via Face" if method == 'Face' else "Auto checked-in via QR")
        }
        db.attendance.insert_one(new_record)
        return "Check-In", new_record
    else:
        # Check-out flow: if already checked in and out_time is not set, set out_time and duration
        if record.get('out_time') is None:
            in_time_str = record.get('in_time')
            try:
                t1 = datetime.datetime.strptime(f"{date_str} {in_time_str}", "%Y-%m-%d %H:%M:%S")
                t2 = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
                duration = int((t2 - t1).total_seconds() / 60)
            except Exception:
                duration = 0
                
            db.attendance.update_one(
                {'_id': record['_id']},
                {
                    '$set': {
                        'out_time': time_str,
                        'total_duration_minutes': duration,
                        'remarks': record.get('remarks') + f" | Checked-out at {time_str}"
                    }
                }
            )
            updated_record = record.copy()
            updated_record['out_time'] = time_str
            updated_record['total_duration_minutes'] = duration
            return "Check-Out", updated_record
        else:
            # Already checked out, return the record as is
            return "Already Checked-Out", record

@attendance_bp.route('/face-checkin', methods=['POST'])
def face_checkin():
    data = request.get_json() or {}
    image_base64 = data.get('image')
    if not image_base64:
        return jsonify({'message': 'Webcam image base64 is required.'}), 400

    # Extract embedding from current camera snapshot
    current_features, err = get_face_embedding(image_base64)
    if err:
        return jsonify({'message': err}), 400

    # Retrieve all students who have registered face embeddings
    students = db.students.find()
    matched_student = None
    best_confidence = 0.0

    for s in students:
        saved_features = s.get('face_embeddings')
        if not saved_features:
            continue
            
        is_match, confidence = compare_embeddings(saved_features, current_features, threshold=Config.FACE_THRESHOLD)
        if is_match and confidence > best_confidence:
            best_confidence = confidence
            matched_student = s

    if not matched_student:
        return jsonify({
            'success': False,
            'message': 'No matching face found in the database. Please align properly or use QR Backup.'
        }), 404

    # Record attendance in database
    action, log = record_attendance_db(matched_student['student_id'], 'Face')
    
    return jsonify({
        'success': True,
        'student_id': matched_student['student_id'],
        'name': matched_student['name'],
        'action': action,
        'confidence': f"{best_confidence * 100:.1f}%",
        'log': {
            'date': log['date'],
            'status': log['status'],
            'in_time': log['in_time'],
            'out_time': log.get('out_time'),
            'total_duration': log.get('total_duration_minutes'),
            'late_entry': log['late_entry']
        }
    }), 200

@attendance_bp.route('/qr-checkin', methods=['POST'])
def qr_checkin():
    data = request.get_json() or {}
    qr_identity = data.get('qr_identity', '').strip()
    if not qr_identity:
        return jsonify({'message': 'QR code identity is required.'}), 400

    # Find student matching the QR identity
    student = db.students.find_one({'qr_identity': qr_identity})
    if not student:
        return jsonify({
            'success': False,
            'message': 'Invalid QR code. Student identity could not be verified.'
        }), 404

    # Record attendance
    action, log = record_attendance_db(student['student_id'], 'QR')

    return jsonify({
        'success': True,
        'student_id': student['student_id'],
        'name': student['name'],
        'action': action,
        'log': {
            'date': log['date'],
            'status': log['status'],
            'in_time': log['in_time'],
            'out_time': log.get('out_time'),
            'total_duration': log.get('total_duration_minutes'),
            'late_entry': log['late_entry']
        }
    }), 200

@attendance_bp.route('/override', methods=['POST'])
@token_required(allowed_roles=['teacher', 'admin'])
def teacher_override():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip().upper()
    date_str = data.get('date', '').strip() # Format: YYYY-MM-DD
    status = data.get('status', 'Present') # Present, Absent, Late
    in_time = data.get('in_time')
    out_time = data.get('out_time')
    remarks = data.get('remarks', '').strip()

    if not student_id or not date_str:
        return jsonify({'message': 'Student ID and date are required.'}), 400

    student = db.students.find_one({'student_id': student_id})
    if not student:
        return jsonify({'message': 'Student ID does not exist.'}), 404

    # Calculate duration if in_time and out_time are set
    duration = None
    if in_time and out_time:
        try:
            t1 = datetime.datetime.strptime(f"{date_str} {in_time}", "%Y-%m-%d %H:%M:%S")
            t2 = datetime.datetime.strptime(f"{date_str} {out_time}", "%Y-%m-%d %H:%M:%S")
            duration = int((t2 - t1).total_seconds() / 60)
        except Exception:
            try:
                # Handle HH:MM format as well
                t1 = datetime.datetime.strptime(f"{date_str} {in_time}", "%Y-%m-%d %H:%M")
                t2 = datetime.datetime.strptime(f"{date_str} {out_time}", "%Y-%m-%d %H:%M")
                duration = int((t2 - t1).total_seconds() / 60)
            except Exception:
                duration = None

    late = is_late(in_time) if in_time else (status == 'Late')

    record = db.attendance.find_one({'student_id': student_id, 'date': date_str})
    
    update_data = {
        'status': status,
        'in_time': in_time,
        'out_time': out_time,
        'total_duration_minutes': duration,
        'late_entry': late,
        'check_in_by': 'Manual',
        'remarks': remarks or "Manually override by teacher"
    }

    if record:
        db.attendance.update_one({'_id': record['_id']}, {'$set': update_data})
        message = "Attendance record updated successfully!"
    else:
        new_record = {
            'student_id': student_id,
            'date': date_str,
            **update_data
        }
        db.attendance.insert_one(new_record)
        message = "Attendance record created successfully!"

    return jsonify({'message': message}), 200

@attendance_bp.route('/logs', methods=['GET'])
@token_required(allowed_roles=['teacher', 'admin', 'student'])
def get_logs():
    # If student, force filter by their own ID
    student_id = request.args.get('student_id')
    date_filter = request.args.get('date') # YYYY-MM-DD or empty
    
    if request.user.get('role') == 'student':
        student_id = request.user.get('student_id')
        
    query = {}
    if student_id:
        query['student_id'] = student_id
    if date_filter:
        query['date'] = date_filter
        
    logs = db.attendance.find(query)
    
    # Enrich logs with student name
    enriched_logs = []
    student_cache = {}
    
    # Sort logs by date descending, then in_time descending
    logs = sorted(logs, key=lambda x: (x.get('date', ''), x.get('in_time', '') or ''), reverse=True)
    
    for l in logs:
        l_copy = l.copy()
        l_copy['_id'] = str(l_copy['_id'])
        
        s_id = l.get('student_id')
        if s_id not in student_cache:
            student = db.students.find_one({'student_id': s_id})
            student_cache[s_id] = student.get('name') if student else 'Unknown Student'
            
        l_copy['student_name'] = student_cache[s_id]
        enriched_logs.append(l_copy)
        
    return jsonify(enriched_logs), 200

@attendance_bp.route('/stats', methods=['GET'])
@token_required(allowed_roles=['teacher', 'admin', 'student'])
def get_stats():
    student_id = request.args.get('student_id')
    if request.user.get('role') == 'student':
        student_id = request.user.get('student_id')

    date_str, _ = get_current_date_and_time()
    
    if student_id:
        # Calculate stats for a single student
        all_student_logs = db.attendance.find({'student_id': student_id})
        total = len(all_student_logs)
        present = sum(1 for l in all_student_logs if l.get('status') in ['Present', 'Late'])
        absent = sum(1 for l in all_student_logs if l.get('status') == 'Absent')
        late = sum(1 for l in all_student_logs if l.get('status') == 'Late')
        
        percentage = (present / total * 100) if total > 0 else 100.0
        
        return jsonify({
            'total_days': total,
            'present_count': present,
            'absent_count': absent,
            'late_count': late,
            'attendance_percentage': round(percentage, 1)
        }), 200
    else:
        # Teacher dashboard: calculate metrics for today
        all_students = db.students.find()
        total_students = len(all_students)
        
        today_logs = db.attendance.find({'date': date_str})
        present = sum(1 for l in today_logs if l.get('status') in ['Present', 'Late'])
        late = sum(1 for l in today_logs if l.get('status') == 'Late')
        
        # Absent = Total Students - Present today
        absent = max(0, total_students - present)
        
        percentage = (present / total_students * 100) if total_students > 0 else 0.0
        
        return jsonify({
            'total_students': total_students,
            'present_today': present,
            'absent_today': absent,
            'late_today': late,
            'attendance_percentage': round(percentage, 1),
            'date': date_str
        }), 200
