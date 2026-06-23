import uuid
from flask import Blueprint, request, jsonify
from database import db
from utils.auth_helper import token_required
from utils.face_helper import get_face_embedding

student_bp = Blueprint('student', __name__)

@student_bp.route('', methods=['GET'])
@token_required(allowed_roles=['teacher', 'admin'])
def get_all_students():
    students = db.students.find()
    # Remove large face embeddings array for quick listing
    cleaned_students = []
    for s in students:
        s_copy = s.copy()
        s_copy['_id'] = str(s_copy['_id'])
        if 'face_embeddings' in s_copy:
            del s_copy['face_embeddings']
        cleaned_students.append(s_copy)
    return jsonify(cleaned_students), 200

@student_bp.route('/<student_id>', methods=['GET'])
@token_required(allowed_roles=['teacher', 'admin', 'student'])
def get_student_details(student_id):
    # If the current user is a student, they can only view their own profile
    if request.user.get('role') == 'student' and request.user.get('student_id') != student_id:
        return jsonify({'message': 'Access denied. You can only view your own profile.'}), 403

    student = db.students.find_one({'student_id': student_id})
    if not student:
        return jsonify({'message': 'Student not found.'}), 404
        
    student_copy = student.copy()
    student_copy['_id'] = str(student_copy['_id'])
    
    # Hide raw embeddings but keep registration status
    student_copy['face_registered'] = bool(student.get('face_embeddings'))
    if 'face_embeddings' in student_copy:
        del student_copy['face_embeddings']
        
    return jsonify(student_copy), 200

@student_bp.route('', methods=['POST'])
@token_required(allowed_roles=['teacher', 'admin'])
def add_student():
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip().upper()
    name = data.get('name', '').strip()
    roll_number = data.get('roll_number', '').strip()
    department = data.get('department', '').strip()
    semester = data.get('semester', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    
    if not student_id or not name or not roll_number or not department or not semester or not email:
        return jsonify({'message': 'Student ID, Name, Roll Number, Department, Semester, and Email are required.'}), 400

    # Check duplicates
    if db.students.find_one({'student_id': student_id}):
        return jsonify({'message': f'Student ID {student_id} already exists.'}), 409

    if db.students.find_one({'email': email}):
        return jsonify({'message': f'Email {email} is already assigned to a student.'}), 409

    # Setup default mock performance for Phase 4
    performance = data.get('performance', {
        'internal_marks': 75.0,
        'assignment_scores': 80.0,
        'exam_scores': 70.0,
        'gpa': 3.0
    })

    new_student = {
        'student_id': student_id,
        'name': name,
        'roll_number': roll_number,
        'department': department,
        'semester': semester,
        'email': email,
        'phone': phone,
        'face_embeddings': None,
        'qr_identity': f"QR_{student_id}_CS",
        'performance': performance
    }
    
    db.students.insert_one(new_student)
    return jsonify({'message': 'Student added successfully!', 'student': new_student}), 201

@student_bp.route('/<student_id>', methods=['PUT'])
@token_required(allowed_roles=['teacher', 'admin'])
def edit_student(student_id):
    student = db.students.find_one({'student_id': student_id})
    if not student:
        return jsonify({'message': 'Student not found.'}), 404

    data = request.get_json() or {}
    
    # Fields to update
    update_fields = {}
    for key in ['name', 'roll_number', 'department', 'semester', 'phone']:
        if key in data:
            update_fields[key] = data[key].strip()
            
    if 'email' in data:
        email = data['email'].strip().lower()
        # Verify email is not taken by another student
        existing_student = db.students.find_one({'email': email})
        if existing_student and existing_student['student_id'] != student_id:
            return jsonify({'message': 'Email address is already in use.'}), 409
        update_fields['email'] = email
        
    if 'performance' in data:
        update_fields['performance'] = data['performance']

    if not update_fields:
        return jsonify({'message': 'No fields provided for update.'}), 400

    db.students.update_one({'student_id': student_id}, {'$set': update_fields})
    return jsonify({'message': 'Student updated successfully!'}), 200

@student_bp.route('/<student_id>', methods=['DELETE'])
@token_required(allowed_roles=['teacher', 'admin'])
def delete_student(student_id):
    student = db.students.find_one({'student_id': student_id})
    if not student:
        return jsonify({'message': 'Student not found.'}), 404

    # Delete student record
    db.students.delete_one({'student_id': student_id})
    
    # Delete related attendance records
    attendance_records = db.attendance.find({'student_id': student_id})
    for r in attendance_records:
        db.attendance.delete_one({'_id': r['_id']})
        
    # Also delete associated user login if exists
    db.users.delete_one({'student_id': student_id})

    return jsonify({'message': f'Student {student_id} and their records have been deleted.'}), 200

@student_bp.route('/<student_id>/face', methods=['POST'])
@token_required(allowed_roles=['teacher', 'admin'])
def register_face(student_id):
    student = db.students.find_one({'student_id': student_id})
    if not student:
        return jsonify({'message': 'Student not found.'}), 404

    data = request.get_json() or {}
    image_base64 = data.get('image')
    if not image_base64:
        return jsonify({'message': 'Image base64 string is required.'}), 400

    # Extract features using face_helper
    features, err = get_face_embedding(image_base64)
    if err:
        return jsonify({'message': err}), 400

    # Update student face embeddings in the database
    db.students.update_one(
        {'student_id': student_id},
        {'$set': {'face_embeddings': features}}
    )

    return jsonify({
        'message': 'Face registered successfully!',
        'mode': features['mode'],
        'bbox': features['bbox']
    }), 200
