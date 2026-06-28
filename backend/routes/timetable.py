import uuid
import datetime
from flask import Blueprint, request, jsonify
from database import db
from utils.auth_helper import token_required

timetable_bp = Blueprint('timetable', __name__)

VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']


@timetable_bp.route('', methods=['GET'])
@token_required()
def get_timetable():
    """Get timetable entries, optionally filtered by department."""
    department = request.args.get('department', None)
    semester = request.args.get('semester', None)

    query = {}
    if department:
        query['department'] = department
    if semester:
        query['semester'] = semester

    entries = db.timetable.find(query)
    for e in entries:
        e.pop('_id', None)

    # Sort: by day index then start_time
    day_order = {d: i for i, d in enumerate(VALID_DAYS)}
    entries.sort(key=lambda x: (day_order.get(x.get('day', ''), 99), x.get('start_time', '')))

    return jsonify({'timetable': entries}), 200


@timetable_bp.route('/departments', methods=['GET'])
@token_required()
def get_departments():
    """Return distinct departments that have timetable entries."""
    entries = db.timetable.find({})
    depts = list({e.get('department') for e in entries if e.get('department')})
    return jsonify({'departments': sorted(depts)}), 200


@timetable_bp.route('', methods=['POST'])
@token_required(allowed_roles=['teacher', 'admin'])
def add_timetable_entry():
    """Add a new timetable slot. Teacher/Admin only."""
    data = request.get_json()
    required_fields = ['subject', 'day', 'start_time', 'end_time', 'department', 'room']
    for f in required_fields:
        if not data.get(f):
            return jsonify({'message': f'Field "{f}" is required'}), 400

    if data['day'] not in VALID_DAYS:
        return jsonify({'message': f'Day must be one of: {", ".join(VALID_DAYS)}'}), 400

    entry = {
        'entry_id': str(uuid.uuid4()),
        'subject': data['subject'].strip(),
        'day': data['day'],
        'start_time': data['start_time'],
        'end_time': data['end_time'],
        'department': data['department'].strip(),
        'semester': data.get('semester', 'All'),
        'room': data['room'].strip(),
        'teacher': data.get('teacher', 'Staff').strip(),
        'created_at': datetime.datetime.now().isoformat()
    }
    db.timetable.insert_one(entry)
    entry.pop('_id', None)
    return jsonify({'message': 'Schedule slot added', 'entry': entry}), 201


@timetable_bp.route('/<entry_id>', methods=['DELETE'])
@token_required(allowed_roles=['teacher', 'admin'])
def delete_timetable_entry(entry_id):
    """Delete a timetable entry by entry_id. Teacher/Admin only."""
    result = db.timetable.delete_one({'entry_id': entry_id})
    if result.deleted_count == 0:
        return jsonify({'message': 'Entry not found'}), 404
    return jsonify({'message': 'Schedule entry deleted'}), 200
