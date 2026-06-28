import uuid
import datetime
from flask import Blueprint, request, jsonify
from database import db
from utils.auth_helper import token_required

assignments_bp = Blueprint('assignments', __name__)


@assignments_bp.route('', methods=['GET'])
@token_required()
def get_assignments():
    """Get all assignments, optionally filtered by department or semester."""
    department = request.args.get('department', None)
    semester = request.args.get('semester', None)

    query = {}
    if department:
        query['department'] = department
    if semester:
        query['semester'] = semester

    items = db.assignments.find(query)
    result = []
    for a in items:
        a.pop('_id', None)
        result.append(a)
    # Sort ascending by due_date (upcoming first)
    result.sort(key=lambda x: x.get('due_date', ''))
    return jsonify({'assignments': result}), 200


@assignments_bp.route('', methods=['POST'])
@token_required(allowed_roles=['teacher', 'admin'])
def create_assignment():
    """Create a new assignment. Teacher/Admin only."""
    data = request.get_json()
    required = ['title', 'subject', 'due_date', 'department']
    for f in required:
        if not data.get(f):
            return jsonify({'message': f'Field "{f}" is required'}), 400

    assignment = {
        'assignment_id': str(uuid.uuid4()),
        'title': data['title'].strip(),
        'subject': data['subject'].strip(),
        'description': data.get('description', '').strip(),
        'due_date': data['due_date'],
        'department': data['department'].strip(),
        'semester': data.get('semester', 'All'),
        'max_marks': int(data.get('max_marks', 100)),
        'teacher': request.user.get('role', 'teacher').title(),
        'status': 'Active',
        'created_at': datetime.datetime.now().isoformat()
    }
    db.assignments.insert_one(assignment)
    assignment.pop('_id', None)
    return jsonify({'message': 'Assignment created successfully', 'assignment': assignment}), 201


@assignments_bp.route('/<assignment_id>', methods=['PUT'])
@token_required(allowed_roles=['teacher', 'admin'])
def update_assignment(assignment_id):
    """Update assignment status or details. Teacher/Admin only."""
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    # Remove protected fields from update payload
    for protected in ['assignment_id', 'created_at', '_id']:
        data.pop(protected, None)
    db.assignments.update_one({'assignment_id': assignment_id}, {'$set': data})
    return jsonify({'message': 'Assignment updated successfully'}), 200


@assignments_bp.route('/<assignment_id>', methods=['DELETE'])
@token_required(allowed_roles=['teacher', 'admin'])
def delete_assignment(assignment_id):
    """Delete an assignment. Teacher/Admin only."""
    result = db.assignments.delete_one({'assignment_id': assignment_id})
    if result.deleted_count == 0:
        return jsonify({'message': 'Assignment not found'}), 404
    return jsonify({'message': 'Assignment deleted successfully'}), 200


@assignments_bp.route('/leaderboard', methods=['GET'])
@token_required()
def get_leaderboard():
    """
    Compute a ranked leaderboard of all students.
    Composite score = 60% attendance + 40% GPA (normalized to 100).
    """
    students = db.students.find({})
    leaderboard = []

    for s in students:
        s.pop('_id', None)
        s_id = s.get('student_id')

        # Fetch all attendance logs for this student
        all_logs = db.attendance.find({'student_id': s_id})
        total = len(all_logs)
        present = sum(1 for log in all_logs if log.get('status') in ['Present', 'Late'])
        att_pct = round((present / total * 100), 1) if total > 0 else 0.0

        perf = s.get('performance', {})
        gpa = float(perf.get('gpa', 0.0))

        # Composite score: 60% attendance weight + 40% GPA weight
        score = (att_pct * 0.6) + ((gpa / 4.0) * 100.0 * 0.4)

        leaderboard.append({
            'student_id': s_id,
            'name': s.get('name', 'Unknown'),
            'department': s.get('department', ''),
            'roll_number': s.get('roll_number', ''),
            'semester': s.get('semester', ''),
            'attendance_percentage': att_pct,
            'gpa': gpa,
            'internal_marks': perf.get('internal_marks', 0),
            'exam_scores': perf.get('exam_scores', 0),
            'composite_score': round(score, 1)
        })

    leaderboard.sort(key=lambda x: x['composite_score'], reverse=True)
    for i, item in enumerate(leaderboard):
        item['rank'] = i + 1

    return jsonify({'leaderboard': leaderboard}), 200
