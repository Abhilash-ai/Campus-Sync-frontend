import uuid
import datetime
from flask import Blueprint, request, jsonify
from database import db
from utils.auth_helper import token_required

notices_bp = Blueprint('notices', __name__)


@notices_bp.route('', methods=['GET'])
@token_required()
def get_notices():
    """Get all notices (newest first). Visible to all authenticated users."""
    try:
        all_notices = db.notices.find({})
        sorted_notices = sorted(all_notices, key=lambda x: x.get('created_at', ''), reverse=True)
        for n in sorted_notices:
            n.pop('_id', None)
        return jsonify({'notices': sorted_notices}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching notices: {str(e)}'}), 500


@notices_bp.route('', methods=['POST'])
@token_required(allowed_roles=['teacher', 'admin'])
def create_notice():
    """Create a new notice. Teacher/Admin only."""
    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'message': 'Title and content are required'}), 400

    notice = {
        'notice_id': str(uuid.uuid4()),
        'title': data['title'].strip(),
        'content': data['content'].strip(),
        'category': data.get('category', 'General'),
        'priority': data.get('priority', 'Normal'),  # Normal, Important, Urgent
        'author': request.user.get('role', 'teacher').title(),
        'target_role': data.get('target_role', 'all'),
        'created_at': datetime.datetime.now().isoformat(),
        'expires_at': data.get('expires_at', None)
    }
    db.notices.insert_one(notice)
    notice.pop('_id', None)
    return jsonify({'message': 'Notice posted successfully', 'notice': notice}), 201


@notices_bp.route('/<notice_id>', methods=['DELETE'])
@token_required(allowed_roles=['teacher', 'admin'])
def delete_notice(notice_id):
    """Delete a notice by notice_id. Teacher/Admin only."""
    result = db.notices.delete_one({'notice_id': notice_id})
    if result.deleted_count == 0:
        return jsonify({'message': 'Notice not found'}), 404
    return jsonify({'message': 'Notice deleted successfully'}), 200
