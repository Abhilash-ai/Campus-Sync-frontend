from flask import Blueprint, request, jsonify
from database import db
from utils.auth_helper import hash_password, verify_password, generate_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student') # admin, teacher, student
    student_id = data.get('student_id') # Required only if role is student
    
    if not username or not email or not password:
        return jsonify({'message': 'Username, email and password are required.'}), 400
        
    if role == 'student' and not student_id:
        return jsonify({'message': 'Student ID is required for student registration.'}), 400

    # Clean strings
    username = username.strip()
    email = email.strip().lower()
    if student_id:
        student_id = student_id.strip().upper()

    # Check if user already exists
    if db.users.find_one({'email': email}):
        return jsonify({'message': 'Email already registered.'}), 409
        
    if db.users.find_one({'username': username}):
        return jsonify({'message': 'Username already taken.'}), 409

    # If student, verify that the student_id is registered in the student directory first (Phase 1 rule)
    if role == 'student':
        student_record = db.students.find_one({'student_id': student_id})
        if not student_record:
            return jsonify({'message': f'Student ID {student_id} is not registered in the system yet. Please ask a teacher to register your details first.'}), 404
        
        # Check if a student user is already mapped to this student_id
        if db.users.find_one({'student_id': student_id}):
            return jsonify({'message': 'An account has already been created for this Student ID.'}), 409
        
        # Link email from student record if they differ
        if student_record.get('email') and student_record.get('email').strip().lower() != email:
            # Update student record email or use student record email
            email = student_record.get('email').strip().lower()

    # Hash password & create user
    hashed = hash_password(password)
    new_user = {
        'username': username,
        'email': email,
        'password_hash': hashed,
        'role': role,
        'student_id': student_id if role == 'student' else None
    }
    
    db.users.insert_one(new_user)
    
    return jsonify({'message': 'User registered successfully!'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email_or_username = data.get('identity', '').strip()
    password = data.get('password', '')

    if not email_or_username or not password:
        return jsonify({'message': 'Identity (email/username) and password are required.'}), 400

    # Try searching by email or username
    user = db.users.find_one({'email': email_or_username.lower()})
    if not user:
        user = db.users.find_one({'username': email_or_username})

    if not user or not verify_password(user['password_hash'], password):
        return jsonify({'message': 'Invalid credentials.'}), 401

    # Generate JWT
    token = generate_token(user['_id'], user['role'], user.get('student_id'))
    
    # Return user details
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'student_id': user.get('student_id')
        }
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'message': 'Email address is required.'}), 400

    user = db.users.find_one({'email': email})
    if not user:
        # Avoid user enumeration in production, but for testing return direct confirmation
        return jsonify({'message': 'If the email exists, a reset code was generated.'}), 200

    # Create a mock verification code
    mock_code = "CS-RESET-9921"
    # Save the mock code to user document temporary
    db.users.update_one({'_id': user['_id']}, {'$set': {'reset_code': mock_code}})

    return jsonify({
        'message': 'Password reset verification code generated.',
        'reset_code': mock_code # Return in response for simple testing demonstration
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    code = data.get('reset_code', '').strip()
    new_password = data.get('new_password', '')

    if not email or not code or not new_password:
        return jsonify({'message': 'Email, reset code, and new password are required.'}), 400

    user = db.users.find_one({'email': email})
    if not user or user.get('reset_code') != code:
        return jsonify({'message': 'Invalid email or reset code.'}), 400

    # Update password and clear reset code
    hashed = hash_password(new_password)
    db.users.update_one(
        {'_id': user['_id']},
        {
            '$set': {'password_hash': hashed},
            '$set': {'reset_code': None}
        }
    )

    return jsonify({'message': 'Password has been reset successfully.'}), 200

@auth_bp.route('/me', methods=['GET'])
@token_required()
def get_current_user():
    # Return info for logged in user based on JWT
    user_id = request.user.get('sub')
    user = db.users.find_one({'_id': user_id})
    if not user:
        return jsonify({'message': 'User not found.'}), 404
        
    return jsonify({
        'id': str(user['_id']),
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'student_id': user.get('student_id')
    }), 200
