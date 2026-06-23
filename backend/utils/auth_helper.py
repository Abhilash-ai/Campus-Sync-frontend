import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config
from database import db

def hash_password(password):
    return generate_password_hash(password)

def verify_password(stored_password, provided_password):
    return check_password_hash(stored_password, provided_password)

def generate_token(user_id, role, student_id=None):
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow(),
        'sub': str(user_id),
        'role': role,
        'student_id': student_id
    }
    return jwt.encode(
        payload,
        Config.JWT_SECRET,
        algorithm='HS256'
    )

def decode_token(token):
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return 'Signature expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'

def token_required(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(" ")[1]
            
            if not token:
                return jsonify({'message': 'Token is missing!'}), 401
            
            decoded = decode_token(token)
            if isinstance(decoded, str):
                return jsonify({'message': decoded}), 401
            
            # Check user role if roles are specified
            if allowed_roles and decoded.get('role') not in allowed_roles:
                return jsonify({'message': 'Access denied. Unauthorized role.'}), 403
            
            # Add user context to request
            request.user = decoded
            return f(*args, **kwargs)
        return decorated
    return decorator
