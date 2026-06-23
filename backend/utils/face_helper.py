import base64
import io
import re
import numpy as np
import cv2
from PIL import Image

HAS_FACE_RECOGNITION = False
try:
    import face_recognition
    HAS_FACE_RECOGNITION = True
    print("[CampusSync Face Engine] face_recognition library successfully loaded (Production Mode).")
except ImportError:
    print("[CampusSync Face Engine] face_recognition library not found. Falling back to OpenCV Color Histogram & Image Hashing (Simulation Mode).")

def decode_base64_image(base64_str):
    """
    Decodes a base64 encoded image string into a NumPy array suitable for OpenCV.
    """
    try:
        # Strip metadata header if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_data = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        # Convert to OpenCV BGR representation
        open_cv_image = np.array(img)
        open_cv_image = open_cv_image[:, :, ::-1].copy() # Convert RGB to BGR
        return open_cv_image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def detect_face_bbox(cv_img):
    """
    Detects a face in the image and returns bounding box coordinates (top, right, bottom, left).
    """
    if cv_img is None:
        return None
    
    # Try using face_recognition face_locations first
    if HAS_FACE_RECOGNITION:
        try:
            rgb_img = cv_img[:, :, ::-1] # BGR to RGB
            face_locations = face_recognition.face_locations(rgb_img)
            if face_locations:
                return face_locations[0] # Return the first face: (top, right, bottom, left)
        except Exception as e:
            print(f"Error using face_recognition for face detection: {e}")
            
    # Fallback to OpenCV Haar Cascade classifier
    try:
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        # Load OpenCV's built-in Haar Cascade face detector
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        if len(faces) > 0:
            x, y, w, h = faces[0]
            # Convert OpenCV (x, y, w, h) to (top, right, bottom, left)
            return (int(y), int(x + w), int(y + h), int(x))
    except Exception as e:
        print(f"Error in OpenCV face detection: {e}")
        
    return None

def get_face_embedding(base64_str):
    """
    Extracts a face embedding (128-D vector) if face_recognition is available,
    otherwise returns a simulated visual feature signature.
    """
    cv_img = decode_base64_image(base64_str)
    if cv_img is None:
        return None, "Invalid image data."

    bbox = detect_face_bbox(cv_img)
    if not bbox:
        return None, "No face detected in the image."

    if HAS_FACE_RECOGNITION:
        try:
            rgb_img = cv_img[:, :, ::-1] # BGR to RGB
            encodings = face_recognition.face_encodings(rgb_img, known_face_locations=[bbox])
            if encodings:
                embedding = encodings[0].tolist()
                return {
                    'mode': 'production',
                    'embedding': embedding,
                    'bbox': bbox
                }, None
        except Exception as e:
            print(f"Failed to extract face recognition embeddings: {e}")
    
    # Simulation mode: Extract color histogram and resized thumbnail vector
    try:
        top, right, bottom, left = bbox
        # Crop the face region
        face_crop = cv_img[max(0, top):min(cv_img.shape[0], bottom), max(0, left):min(cv_img.shape[1], right)]
        if face_crop.size == 0:
            face_crop = cv_img
            
        # 1. Color Histogram (HSV)
        hsv_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv_face], [0, 1], None, [8, 8], [0, 180, 0, 256])
        cv2.normalize(hist, hist)
        hist_vector = hist.flatten().tolist()
        
        # 2. Resized grayscale thumbnail to catch general structure (8x8)
        gray_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        resized_crop = cv2.resize(gray_crop, (8, 8), interpolation=cv2.INTER_AREA)
        structural_vector = (resized_crop.flatten() / 255.0).tolist()
        
        # Combine vectors to form a stable 128-D simulated embedding
        simulated_vector = hist_vector + structural_vector
        # Pad to exactly 128 dims if necessary
        if len(simulated_vector) < 128:
            simulated_vector += [0.0] * (128 - len(simulated_vector))
        simulated_vector = simulated_vector[:128]

        return {
            'mode': 'simulation',
            'embedding': simulated_vector,
            'bbox': bbox
        }, None
    except Exception as e:
        return None, f"Simulation features extraction failed: {str(e)}"

def compare_embeddings(saved_features, current_features, threshold=0.6):
    """
    Compares two face feature dictionaries and returns (is_match, confidence).
    """
    if not saved_features or not current_features:
        return False, 0.0

    # Ensure modes match, if not, do best effort
    saved_emb = saved_features.get('embedding')
    curr_emb = current_features.get('embedding')
    mode = saved_features.get('mode', 'simulation')
    
    if not saved_emb or not curr_emb:
        return False, 0.0

    try:
        saved_arr = np.array(saved_emb)
        curr_arr = np.array(curr_emb)
        
        # Euclidean distance
        distance = np.linalg.norm(saved_arr - curr_arr)
        
        if mode == 'production':
            # Low distance means high confidence. Threshold is normally 0.6.
            # Convert distance to confidence percentage: 0 distance -> 100%, 0.6 -> 75%, >=1.2 -> 0%
            confidence = max(0.0, 1.0 - (distance / 1.2))
            is_match = bool(distance <= threshold)
            return is_match, float(confidence)
        else:
            # Simulation Mode distance check. Color histogram + structure match.
            # Histogram cosine similarity or simple distance.
            # Threshold for simulated embeddings: let's verify if distance is small
            # For normalized vectors, max distance is around 1.414.
            # Let's say threshold is 0.7 for simulation
            sim_threshold = 0.75
            confidence = max(0.0, 1.0 - (distance / 1.5))
            is_match = bool(distance <= sim_threshold)
            return is_match, float(confidence)
            
    except Exception as e:
        print(f"Error comparing face features: {e}")
        return False, 0.0
