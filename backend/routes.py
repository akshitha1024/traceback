# API Routes for Traceback Backend

from flask import request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
import json
import re

# Import app and db from current module
from __main__ import app, db
from models import User, LostItem, FoundItem, Report, Match

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'student_id', 'department']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        if User.query.filter_by(student_id=data['student_id']).first():
            return jsonify({'error': 'Student ID already registered'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            student_id=data['student_id'],
            department=data['department'],
            year=data.get('year'),
            phone=data.get('phone'),
            photo_url=data.get('photo_url')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        allowed_fields = ['name', 'department', 'year', 'phone', 'photo_url']
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Lost Items Routes
@app.route('/api/lost-items', methods=['GET'])
def get_lost_items():
    """Get all lost items"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        location = request.args.get('location')
        search = request.args.get('search')
        
        query = LostItem.query.filter_by(status='active')
        
        # Apply filters
        if category:
            query = query.filter(LostItem.category == category)
        if location:
            query = query.filter(LostItem.location.contains(location))
        if search:
            query = query.filter(
                db.or_(
                    LostItem.title.contains(search),
                    LostItem.description.contains(search)
                )
            )
        
        # Pagination
        items = query.order_by(LostItem.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'total': items.total,
            'pages': items.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lost-items', methods=['POST'])
@jwt_required()
def create_lost_item():
    """Create a new lost item"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'category', 'location', 'date_lost']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse date
        try:
            date_lost = datetime.strptime(data['date_lost'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Create lost item
        lost_item = LostItem(
            title=data['title'],
            description=data.get('description'),
            category=data['category'],
            location=data['location'],
            date_lost=date_lost,
            color=data.get('color'),
            brand=data.get('brand'),
            model=data.get('model'),
            serial_number=data.get('serial_number'),
            reward_offered=data.get('reward_offered', 0.0),
            contact_info=data.get('contact_info'),
            images=data.get('images', []),
            user_id=user_id
        )
        
        db.session.add(lost_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Lost item reported successfully',
            'item': lost_item.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Found Items Routes
@app.route('/api/found-items', methods=['GET'])
def get_found_items():
    """Get all found items"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        location = request.args.get('location')
        search = request.args.get('search')
        
        query = FoundItem.query.filter_by(status='available')
        
        # Apply filters
        if category:
            query = query.filter(FoundItem.category == category)
        if location:
            query = query.filter(FoundItem.location.contains(location))
        if search:
            query = query.filter(
                db.or_(
                    FoundItem.title.contains(search),
                    FoundItem.description.contains(search)
                )
            )
        
        # Pagination
        items = query.order_by(FoundItem.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'total': items.total,
            'pages': items.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/found-items', methods=['POST'])
@jwt_required()
def create_found_item():
    """Create a new found item"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'category', 'location', 'date_found']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Parse date
        try:
            date_found = datetime.strptime(data['date_found'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Create found item
        found_item = FoundItem(
            title=data['title'],
            description=data.get('description'),
            category=data['category'],
            location=data['location'],
            date_found=date_found,
            color=data.get('color'),
            brand=data.get('brand'),
            model=data.get('model'),
            condition=data.get('condition'),
            contact_info=data.get('contact_info'),
            images=data.get('images', []),
            user_id=user_id
        )
        
        db.session.add(found_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Found item reported successfully',
            'item': found_item.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Search and Match Routes
@app.route('/api/search', methods=['GET'])
def search_items():
    """Search across all items"""
    try:
        query = request.args.get('q', '')
        item_type = request.args.get('type', 'all')  # all, lost, found
        category = request.args.get('category')
        location = request.args.get('location')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        results = []
        
        # Search lost items
        if item_type in ['all', 'lost']:
            lost_query = LostItem.query.filter_by(status='active')
            if query:
                lost_query = lost_query.filter(
                    db.or_(
                        LostItem.title.contains(query),
                        LostItem.description.contains(query),
                        LostItem.location.contains(query)
                    )
                )
            if category:
                lost_query = lost_query.filter(LostItem.category == category)
            if location:
                lost_query = lost_query.filter(LostItem.location.contains(location))
            
            lost_items = lost_query.all()
            results.extend([item.to_dict() for item in lost_items])
        
        # Search found items
        if item_type in ['all', 'found']:
            found_query = FoundItem.query.filter_by(status='available')
            if query:
                found_query = found_query.filter(
                    db.or_(
                        FoundItem.title.contains(query),
                        FoundItem.description.contains(query),
                        FoundItem.location.contains(query)
                    )
                )
            if category:
                found_query = found_query.filter(FoundItem.category == category)
            if location:
                found_query = found_query.filter(FoundItem.location.contains(location))
            
            found_items = found_query.all()
            results.extend([item.to_dict() for item in found_items])
        
        # Sort by created_at desc
        results.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Simple pagination
        start = (page - 1) * per_page
        end = start + per_page
        paginated_results = results[start:end]
        
        return jsonify({
            'items': paginated_results,
            'total': len(results),
            'query': query,
            'page': page,
            'per_page': per_page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Report Routes
@app.route('/api/reports', methods=['POST'])
@jwt_required()
def create_report():
    """Create a new abuse report"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['target_id', 'target_type', 'category', 'reason']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create report
        report = Report(
            report_type=data.get('report_type', 'item'),
            target_id=data['target_id'],
            target_type=data['target_type'],
            category=data['category'],
            reason=data['reason'],
            description=data.get('description'),
            evidence_urls=data.get('evidence_urls', []),
            user_id=user_id
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Report submitted successfully',
            'report': report.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Admin Routes
@app.route('/api/admin/reports', methods=['GET'])
@jwt_required()
def get_reports():
    """Get all reports (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        reports = Report.query.order_by(Report.created_at.desc()).all()
        
        return jsonify({
            'reports': [report.to_dict() for report in reports]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health Check Route
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500