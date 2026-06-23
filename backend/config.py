import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'campussync_super_secret_key_12345')
    JWT_SECRET = os.environ.get('JWT_SECRET', 'campussync_jwt_secret_key_abcde')
    
    # MongoDB connection details. Fallback database.json is used if empty or cannot connect
    MONGO_URI = os.environ.get('MONGO_URI', '')
    
    # Face Recognition Threshold (lower is stricter, e.g. 0.6 is typical for dlib face_recognition)
    FACE_THRESHOLD = float(os.environ.get('FACE_THRESHOLD', '0.6'))
    
    # Check-in time threshold for late markers (Format: HH:MM, e.g. "09:15")
    LATE_THRESHOLD = os.environ.get('LATE_THRESHOLD', '09:15')
