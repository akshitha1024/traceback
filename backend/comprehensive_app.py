"""
TrackeBack Comprehensive Flask Backend
Handles 100,000 realistic items with full API functionality
Works with SQLite database (compatible with MySQL structure)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
import json
from email_verification_service import EmailVerificationService
from user_management import create_user, get_user_by_email, verify_password, update_last_login, verify_user_email, get_user_stats

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key-2025-comprehensive'
CORS(app)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trackeback_100k.db')

# Initialize email verification service
verification_service = EmailVerificationService(DB_PATH)

def get_db():
    """Get database connection with row factory"""
    if not os.path.exists(DB_PATH):
        return None
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    """Convert sqlite3.Row to dictionary"""
    if row is None:
        return None
    return dict(row)

@app.route('/')
def home():
    """API home endpoint"""
    return jsonify({
        'message': 'TrackeBack Comprehensive API - 100K Items',
        'version': '3.0.0',
        'database': 'SQLite (MySQL Compatible)',
        'status': 'Running',
        'features': [
            'Real Kent State campus locations',
            '100,000 realistic lost and found items',
            'Security question verification system',
            'Privacy protection for found items',
            'Smart search and filtering',
            'Statistical analytics'
        ]
    })

# Image functionality removed - no longer serving images

@app.route('/health')
def health():
    """Health check with database statistics"""
    conn = get_db()
    if not conn:
        return jsonify({
            'status': 'error',
            'message': 'Database not found. Run generate_100k_database.py first',
            'timestamp': datetime.now().isoformat()
        }), 500
    
    try:
        cursor = conn.cursor()
        
        # Get counts
        cursor.execute('SELECT COUNT(*) as count FROM lost_items')
        lost_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM found_items')
        found_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM categories')
        categories_count = cursor.fetchone()['count']
        
        cursor.execute('SELECT COUNT(*) as count FROM locations')
        locations_count = cursor.fetchone()['count']
        
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'statistics': {
                'total_items': lost_count + found_count,
                'lost_items': lost_count,
                'found_items': found_count,
                'categories': categories_count,
                'locations': locations_count
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/categories')
def get_categories():
    """Get all categories"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        categories = conn.execute('''
            SELECT c.*, 
                   (SELECT COUNT(*) FROM lost_items WHERE category_id = c.id) as lost_count,
                   (SELECT COUNT(*) FROM found_items WHERE category_id = c.id) as found_count
            FROM categories c 
            ORDER BY c.name
        ''').fetchall()
        
        conn.close()
        
        result = []
        for cat in categories:
            cat_dict = dict_from_row(cat)
            cat_dict['total_items'] = cat_dict['lost_count'] + cat_dict['found_count']
            result.append(cat_dict)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/locations')
def get_locations():
    """Get all Kent State locations"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        locations = conn.execute('''
            SELECT l.*, 
                   (SELECT COUNT(*) FROM lost_items WHERE location_id = l.id) as lost_count,
                   (SELECT COUNT(*) FROM found_items WHERE location_id = l.id) as found_count
            FROM locations l 
            ORDER BY l.name
        ''').fetchall()
        
        conn.close()
        
        result = []
        for loc in locations:
            loc_dict = dict_from_row(loc)
            loc_dict['total_items'] = loc_dict['lost_count'] + loc_dict['found_count']
            result.append(loc_dict)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lost-items')
def get_lost_items():
    """Get lost items with pagination and filtering"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 100)), 500)  # Default 100, Max 500 items per page
        category_id = request.args.get('category_id')
        location_id = request.args.get('location_id')
        color = request.args.get('color')
        search = request.args.get('search', '').strip()
        
        # Build query
        where_conditions = ['l.is_resolved = 0']  # Only unresolved items
        params = []
        
        if category_id:
            where_conditions.append('l.category_id = ?')
            params.append(category_id)
        
        if location_id:
            where_conditions.append('l.location_id = ?')
            params.append(location_id)
        
        if color:
            where_conditions.append('LOWER(l.color) = LOWER(?)')
            params.append(color)
        
        if search:
            where_conditions.append('(LOWER(l.title) LIKE LOWER(?) OR LOWER(l.description) LIKE LOWER(?))')
            search_term = f'%{search}%'
            params.extend([search_term, search_term])
        
        where_clause = ' AND '.join(where_conditions)
        offset = (page - 1) * limit
        
        # Get total count
        count_query = f'''
            SELECT COUNT(*) as total
            FROM lost_items l
            JOIN categories c ON l.category_id = c.id
            JOIN locations loc ON l.location_id = loc.id
            WHERE {where_clause}
        '''
        
        total = conn.execute(count_query, params).fetchone()['total']
        
        # Get items
        items_query = f'''
            SELECT l.*, c.name as category_name, loc.name as location_name,
                   loc.building_code, loc.description as location_description
            FROM lost_items l
            JOIN categories c ON l.category_id = c.id
            JOIN locations loc ON l.location_id = loc.id
            WHERE {where_clause}
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        '''
        
        params.extend([limit, offset])
        items = conn.execute(items_query, params).fetchall()
        
        conn.close()
        
        # Format response
        items_list = [dict_from_row(item) for item in items]
        
        return jsonify({
            'items': items_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit,
                'has_next': page * limit < total,
                'has_prev': page > 1
            },
            'filters': {
                'category_id': category_id,
                'location_id': location_id,
                'color': color,
                'search': search
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/found-items')
def get_found_items():
    """Get found items with privacy filtering"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 100)), 500)  # Default 100, Max 500 items per page
        category_id = request.args.get('category_id')
        location_id = request.args.get('location_id')
        color = request.args.get('color')
        search = request.args.get('search', '').strip()
        include_private = request.args.get('include_private', 'false').lower() == 'true'
        
        # Build query
        where_conditions = ['f.is_claimed = 0']  # Only unclaimed items
        params = []
        
        if category_id:
            where_conditions.append('f.category_id = ?')
            params.append(category_id)
        
        if location_id:
            where_conditions.append('f.location_id = ?')
            params.append(location_id)
        
        if color:
            where_conditions.append('LOWER(f.color) = LOWER(?)')
            params.append(color)
        
        if search:
            where_conditions.append('(LOWER(f.title) LIKE LOWER(?) OR LOWER(f.description) LIKE LOWER(?))')
            search_term = f'%{search}%'
            params.extend([search_term, search_term])
        
        where_clause = ' AND '.join(where_conditions)
        offset = (page - 1) * limit
        
        # Get total count
        count_query = f'''
            SELECT COUNT(*) as total
            FROM found_items f
            JOIN categories c ON f.category_id = c.id
            JOIN locations loc ON f.location_id = loc.id
            WHERE {where_clause}
        '''
        
        total = conn.execute(count_query, params).fetchone()['total']
        
        # Get items
        items_query = f'''
            SELECT f.*, c.name as category_name, loc.name as location_name,
                   loc.building_code, loc.description as location_description
            FROM found_items f
            JOIN categories c ON f.category_id = c.id
            JOIN locations loc ON f.location_id = loc.id
            WHERE {where_clause}
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        '''
        
        params.extend([limit, offset])
        items = conn.execute(items_query, params).fetchall()
        
        conn.close()
        
        # Apply privacy filtering
        items_list = []
        for item in items:
            item_dict = dict_from_row(item)
            
            # Check if item should be private
            if item_dict.get('is_private') and not include_private:
                # Check if privacy period has expired
                if item_dict.get('privacy_expires_at'):
                    expires_at = datetime.fromisoformat(item_dict['privacy_expires_at'].replace('Z', '+00:00'))
                    if datetime.now() < expires_at.replace(tzinfo=None):
                        # Still private - hide sensitive info but keep privacy flags
                        item_dict['description'] = 'Details hidden for privacy protection'
                        item_dict['finder_name'] = 'Anonymous'
                        item_dict['finder_email'] = None
                        item_dict['finder_phone'] = None
                        item_dict['current_location'] = 'Available after verification'
                        item_dict['finder_notes'] = 'Contact information available after ownership verification'
                        # Keep privacy information for frontend
                        item_dict['is_currently_private'] = True
                    else:
                        # Privacy period expired - item should be public
                        item_dict['is_currently_private'] = False
                else:
                    # No expiry date - assume expired
                    item_dict['is_currently_private'] = False
            else:
                # Not private or include_private=true
                item_dict['is_currently_private'] = False
            
            items_list.append(item_dict)
        
        return jsonify({
            'items': items_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit,
                'has_next': page * limit < total,
                'has_prev': page > 1
            },
            'filters': {
                'category_id': category_id,
                'location_id': location_id,
                'color': color,
                'search': search,
                'include_private': include_private
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security-questions/<int:found_item_id>')
def get_security_questions(found_item_id):
    """Get security questions for ownership verification"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Verify item exists
        item = conn.execute(
            'SELECT id, title FROM found_items WHERE id = ? AND is_claimed = 0',
            (found_item_id,)
        ).fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found or already claimed'}), 404
        
        # Get questions (without answers)
        questions = conn.execute('''
            SELECT id, question, question_type
            FROM security_questions 
            WHERE found_item_id = ?
            ORDER BY id
        ''', (found_item_id,)).fetchall()
        
        conn.close()
        
        if not questions:
            return jsonify({'error': 'No security questions found for this item'}), 404
        
        return jsonify({
            'item': dict_from_row(item),
            'questions': [dict_from_row(q) for q in questions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-ownership', methods=['POST'])
def verify_ownership():
    """Verify ownership through security questions"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        found_item_id = data.get('found_item_id')
        user_answers = data.get('answers', {})
        
        if not found_item_id:
            return jsonify({'error': 'Found item ID required'}), 400
        
        # Get all questions with answers
        questions = conn.execute('''
            SELECT id, question, answer, question_type
            FROM security_questions 
            WHERE found_item_id = ?
        ''', (found_item_id,)).fetchall()
        
        if not questions:
            conn.close()
            return jsonify({'error': 'No security questions found'}), 404
        
        # Verify answers
        correct_answers = 0
        total_questions = len(questions)
        
        for question in questions:
            question_id = str(question['id'])
            if question_id in user_answers:
                user_answer = str(user_answers[question_id]).strip().lower()
                correct_answer = str(question['answer']).strip().lower()
                
                if user_answer == correct_answer:
                    correct_answers += 1
        
        # Calculate success rate (need at least 67% correct)
        success_rate = correct_answers / total_questions
        verification_successful = success_rate >= 0.67
        
        if verification_successful:
            # Get complete item details with finder information
            item_details = conn.execute('''
                SELECT f.*, c.name as category_name, loc.name as location_name,
                       loc.building_code, loc.description as location_description
                FROM found_items f
                JOIN categories c ON f.category_id = c.id
                JOIN locations loc ON f.location_id = loc.id
                WHERE f.id = ?
            ''', (found_item_id,)).fetchone()
            
            conn.close()
            
            if not item_details:
                return jsonify({'error': 'Item not found'}), 404
            
            item_dict = dict_from_row(item_details)
            
            return jsonify({
                'verified': True,
                'message': f'Verification successful! You answered {correct_answers}/{total_questions} questions correctly.',
                'success_rate': round(success_rate * 100, 1),
                'finder_details': {
                    'name': item_dict['finder_name'],
                    'email': item_dict['finder_email'],
                    'phone': item_dict['finder_phone']
                },
                'item_details': {
                    'title': item_dict['title'],
                    'description': item_dict['description'],
                    'category': item_dict['category_name'],
                    'location_found': item_dict['location_name'],
                    'date_found': item_dict['date_found'],
                    'current_location': item_dict['current_location'],
                    'finder_notes': item_dict['finder_notes']
                }
            })
        else:
            conn.close()
            required_correct = max(1, int(total_questions * 0.67))
            
            return jsonify({
                'verified': False,
                'message': f'Verification failed. You answered {correct_answers}/{total_questions} questions correctly. You need at least {required_correct}/{total_questions} correct answers.',
                'success_rate': round(success_rate * 100, 1),
                'attempts_remaining': 2  # Could implement attempt tracking
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search')
def search_items():
    """Universal search across lost and found items"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        query = request.args.get('q', '').strip()
        item_type = request.args.get('type', 'all')  # 'lost', 'found', 'all'
        limit = min(int(request.args.get('limit', 100)), 500)  # Default 100, Max 500 items per page
        
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        results = {'lost_items': [], 'found_items': [], 'total': 0}
        search_term = f'%{query}%'
        
        if item_type in ['lost', 'all']:
            lost_items = conn.execute('''
                SELECT l.*, c.name as category_name, loc.name as location_name
                FROM lost_items l
                JOIN categories c ON l.category_id = c.id
                JOIN locations loc ON l.location_id = loc.id
                WHERE l.is_resolved = 0 
                AND (LOWER(l.title) LIKE LOWER(?) OR LOWER(l.description) LIKE LOWER(?) 
                     OR LOWER(c.name) LIKE LOWER(?) OR LOWER(loc.name) LIKE LOWER(?))
                ORDER BY l.created_at DESC
                LIMIT ?
            ''', (search_term, search_term, search_term, search_term, limit)).fetchall()
            
            results['lost_items'] = [dict_from_row(item) for item in lost_items]
        
        if item_type in ['found', 'all']:
            found_items = conn.execute('''
                SELECT f.*, c.name as category_name, loc.name as location_name
                FROM found_items f
                JOIN categories c ON f.category_id = c.id
                JOIN locations loc ON f.location_id = loc.id
                WHERE f.is_claimed = 0
                AND (LOWER(f.title) LIKE LOWER(?) OR LOWER(f.description) LIKE LOWER(?) 
                     OR LOWER(c.name) LIKE LOWER(?) OR LOWER(loc.name) LIKE LOWER(?))
                ORDER BY f.created_at DESC
                LIMIT ?
            ''', (search_term, search_term, search_term, search_term, limit)).fetchall()
            
            # Apply privacy filtering to found items
            filtered_found = []
            for item in found_items:
                item_dict = dict_from_row(item)
                
                if item_dict.get('is_private'):
                    if item_dict.get('privacy_expires_at'):
                        expires_at = datetime.fromisoformat(item_dict['privacy_expires_at'].replace('Z', '+00:00'))
                        if datetime.now() < expires_at.replace(tzinfo=None):
                            item_dict['description'] = 'Details hidden - verify ownership to view'
                            item_dict['finder_name'] = 'Anonymous'
                
                filtered_found.append(item_dict)
            
            results['found_items'] = filtered_found
        
        results['total'] = len(results['lost_items']) + len(results['found_items'])
        
        conn.close()
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """Get comprehensive system statistics"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        stats = {}
        
        # Basic counts
        stats['active_lost_items'] = conn.execute(
            'SELECT COUNT(*) as count FROM lost_items WHERE is_resolved = 0'
        ).fetchone()['count']
        
        stats['unclaimed_found_items'] = conn.execute(
            'SELECT COUNT(*) as count FROM found_items WHERE is_claimed = 0'
        ).fetchone()['count']
        
        stats['total_categories'] = conn.execute(
            'SELECT COUNT(*) as count FROM categories'
        ).fetchone()['count']
        
        stats['total_locations'] = conn.execute(
            'SELECT COUNT(*) as count FROM locations'
        ).fetchone()['count']
        
        # Recent activity (last 7 days)
        stats['recent_lost_items'] = conn.execute(
            "SELECT COUNT(*) as count FROM lost_items WHERE date(created_at) >= date('now', '-7 days')"
        ).fetchone()['count']
        
        stats['recent_found_items'] = conn.execute(
            "SELECT COUNT(*) as count FROM found_items WHERE date(created_at) >= date('now', '-7 days')"
        ).fetchone()['count']
        
        # Privacy statistics
        stats['private_found_items'] = conn.execute(
            "SELECT COUNT(*) as count FROM found_items WHERE is_private = 1 AND datetime(privacy_expires_at) > datetime('now')"
        ).fetchone()['count']
        
        # Category breakdown
        category_stats = conn.execute('''
            SELECT c.name, 
                   COUNT(CASE WHEN l.id IS NOT NULL THEN 1 END) as lost_count,
                   COUNT(CASE WHEN f.id IS NOT NULL THEN 1 END) as found_count
            FROM categories c
            LEFT JOIN lost_items l ON c.id = l.category_id AND l.is_resolved = 0
            LEFT JOIN found_items f ON c.id = f.category_id AND f.is_claimed = 0
            GROUP BY c.id, c.name
            ORDER BY (COUNT(CASE WHEN l.id IS NOT NULL THEN 1 END) + COUNT(CASE WHEN f.id IS NOT NULL THEN 1 END)) DESC
            LIMIT 5
        ''').fetchall()
        
        stats['top_categories'] = [dict_from_row(cat) for cat in category_stats]
        
        # Location breakdown
        location_stats = conn.execute('''
            SELECT loc.name, loc.building_code,
                   COUNT(CASE WHEN l.id IS NOT NULL THEN 1 END) as lost_count,
                   COUNT(CASE WHEN f.id IS NOT NULL THEN 1 END) as found_count
            FROM locations loc
            LEFT JOIN lost_items l ON loc.id = l.location_id AND l.is_resolved = 0
            LEFT JOIN found_items f ON loc.id = f.location_id AND f.is_claimed = 0
            GROUP BY loc.id, loc.name, loc.building_code
            ORDER BY (COUNT(CASE WHEN l.id IS NOT NULL THEN 1 END) + COUNT(CASE WHEN f.id IS NOT NULL THEN 1 END)) DESC
            LIMIT 5
        ''').fetchall()
        
        stats['top_locations'] = [dict_from_row(loc) for loc in location_stats]
        
        # Calculate totals
        stats['total_items'] = stats['active_lost_items'] + stats['unclaimed_found_items']
        stats['recent_total'] = stats['recent_lost_items'] + stats['recent_found_items']
        
        conn.close()
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login with database verification"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    print(f"🔍 Login attempt: email='{email}'")
    print(f"📝 Raw data received: {data}")
    print(f"🔑 Password received: '{password}' (length: {len(password)})")
    
    if not email or not password:
        print("❌ Login failed: Email and password required")
        return jsonify({'error': 'Email and password are required'}), 400
    
    if not email.endswith('@kent.edu'):
        print("❌ Login failed: Not @kent.edu email")
        return jsonify({'error': 'Only Kent State (@kent.edu) email addresses are allowed'}), 400
    
    # Get user from database
    user = get_user_by_email(email)
    
    if not user:
        print("❌ Login failed: User not found")
        return jsonify({'error': 'Email not found. Please sign up first.'}), 401
    
    print(f"👤 User found: {user['full_name']}")
    print(f"🔑 Expected hash: {user['password_hash']}")
    
    # Test password verification with detailed logging
    password_valid = verify_password(password, user['password_hash'])
    print(f"🔓 Password verification result: {password_valid}")
    
    if not password_valid:
        print("❌ Login failed: Invalid password")
        # Additional debug info
        import hashlib
        test_hash = hashlib.sha256(password.encode()).hexdigest()
        print(f"🔨 Generated hash for received password: {test_hash}")
        print(f"🔧 Hashes match: {test_hash == user['password_hash']}")
        return jsonify({'error': 'Invalid credentials. Please check your password.'}), 401
    
    # Check if user is active
    if not user.get('is_active', True):
        print("❌ Login failed: Account deactivated")
        return jsonify({'error': 'Account is deactivated'}), 401
    
    # Update last login
    update_last_login(email)
    
    print(f"✅ Login successful: {user['full_name']}")
    
    return jsonify({
        'message': 'Login successful',
        'token': f'demo-token-{user["id"]}-2025',  # In real app, use JWT
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['full_name'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'verified': user['is_verified'],
            'created_at': user['created_at']
        }
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user with database storage"""
    data = request.get_json()
    
    # Debug: Print received data
    print(f"🔍 Register endpoint received data: {data}")
    
    email = data.get('email', '').strip().lower() if data.get('email') else ''
    password = data.get('password', '').strip() if data.get('password') else ''
    
    # Handle both name formats: single 'name' field or separate 'first_name'/'last_name'
    first_name = ''
    last_name = ''
    
    if data.get('name'):
        # Split single name into first and last
        name_parts = data.get('name', '').strip().split(' ', 1)
        first_name = name_parts[0] if len(name_parts) > 0 else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''
    elif data.get('first_name') or data.get('last_name'):
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
    
    full_name = f"{first_name} {last_name}".strip()
    
    print(f"📧 Email: '{email}'")
    print(f"🔑 Password: {'*' * len(password) if password else 'EMPTY'}")
    print(f"👤 Name: '{full_name}' (first: '{first_name}', last: '{last_name}')")
    
    # Validation
    if not email:
        print("❌ Validation failed: Email is required")
        return jsonify({'error': 'Email is required'}), 400
    
    if not email.endswith('@kent.edu'):
        print("❌ Validation failed: Not @kent.edu email")
        return jsonify({'error': 'Only Kent State (@kent.edu) email addresses are allowed'}), 400
    
    if not password:
        print("❌ Validation failed: Password is required")
        return jsonify({'error': 'Password is required'}), 400
    
    if not first_name:
        print(f"❌ Validation failed: First name is required")
        return jsonify({'error': 'First name is required'}), 400
    
    if not last_name:
        print(f"❌ Validation failed: Last name is required")
        return jsonify({'error': 'Last name is required'}), 400
    
    print("✅ All validations passed!")
    
    # Create user in database
    success, result = create_user(email, password, first_name, last_name)
    
    if success:
        print(f"✅ User created in database: {result}")
        
        # Send verification email
        verification_success, verification_message = verification_service.send_verification_email(
            email, "Account Registration", "registration", result['id']
        )
        
        if verification_success:
            print(f"✅ Verification email sent: {verification_message}")
        else:
            print(f"⚠️ User created but email failed: {verification_message}")
        
        return jsonify({
            'message': 'Registration successful! Please check your email for verification code.',
            'user': {
                'id': result['id'],
                'email': result['email'],
                'name': result['name'],
                'first_name': result['first_name'],
                'last_name': result['last_name'],
                'verified': result['is_verified']
            },
            'requires_verification': True
        }), 201
    else:
        print(f"❌ User creation failed: {result}")
        return jsonify({'error': result}), 400

@app.route('/api/auth/resend', methods=['POST'])
def auth_resend():
    """Resend verification code (auth context)"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if not email.endswith('@kent.edu'):
        return jsonify({'error': 'Only Kent State (@kent.edu) email addresses are allowed'}), 400
    
    # Clear old codes for this email
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM email_verifications WHERE email = ? AND is_verified = FALSE", (email,))
    conn.commit()
    conn.close()
    
    success, message = verification_service.send_verification_email(
        email, "Account Verification", "registration", None
    )
    
    if success:
        return jsonify({'message': f'New verification code sent to {email}'}), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/api/auth/verify', methods=['POST'])
def auth_verify():
    """Verify email code (auth context)"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    
    print(f"🔍 Auth verify endpoint received: email='{email}', code='{code}'")
    
    if not email or not code:
        print("❌ Validation failed: Email and code are required")
        return jsonify({'error': 'Email and code are required'}), 400
    
    if not email.endswith('@kent.edu'):
        print("❌ Validation failed: Not @kent.edu email")
        return jsonify({'error': 'Only Kent State (@kent.edu) email addresses are allowed'}), 400
    
    success, message = verification_service.verify_code(email, code)
    
    if success:
        # Mark user as verified in database
        verify_user_email(email)
        print("✅ Email verification successful!")
        return jsonify({
            'message': message, 
            'verified': True,
            'user': {'email': email, 'verified': True}
        }), 200
    else:
        print(f"❌ Email verification failed: {message}")
        return jsonify({'error': message, 'verified': False}), 400

# Email Verification Routes
@app.route('/api/send-verification', methods=['POST'])
def send_verification():
    """Send verification code to Kent State email"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    item_title = data.get('item_title', 'TrackeBack Item')
    item_type = data.get('item_type', 'item')
    item_id = data.get('item_id')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    success, message = verification_service.send_verification_email(
        email, item_title, item_type, item_id
    )
    
    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/api/verify-email', methods=['POST'])
def verify_email():
    """Verify email with code"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    
    if not email or not code:
        return jsonify({'error': 'Email and code are required'}), 400
    
    success, message = verification_service.verify_code(email, code)
    
    if success:
        return jsonify({'message': message, 'verified': True}), 200
    else:
        return jsonify({'error': message, 'verified': False}), 400

@app.route('/api/check-verification/<email>')
def check_verification(email):
    """Check if email is already verified"""
    is_verified = verification_service.is_email_verified(email)
    return jsonify({'verified': is_verified})

@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification code"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Clear old codes for this email
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM email_verifications WHERE email = ? AND is_verified = FALSE", (email,))
    conn.commit()
    conn.close()
    
    success, message = verification_service.send_verification_email(email)
    
    if success:
        return jsonify({'message': f'New verification code sent to {email}'}), 200
    else:
        return jsonify({'error': message}), 400

@app.route('/api/report-lost', methods=['POST'])
def report_lost_item():
    """Submit a new lost item report"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'category_id', 'location_id', 'date_lost', 'user_name', 'user_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
        
        # Handle custom category/location
        category_id = data.get('category_id')
        location_id = data.get('location_id')
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        # If category is "other", create new category
        if str(category_id).lower() == 'other':
            custom_category = data.get('custom_category', '').strip()
            if not custom_category:
                return jsonify({'error': 'Custom category is required when "Other" is selected'}), 400
            
            # Check if category already exists
            existing = conn.execute('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', (custom_category,)).fetchone()
            if existing:
                category_id = existing[0]
            else:
                # Create new category
                cursor = conn.execute(
                    'INSERT INTO categories (name, description, created_at) VALUES (?, ?, datetime("now"))',
                    (custom_category, f'Custom category: {custom_category}')
                )
                category_id = cursor.lastrowid
        
        # If location is "other", create new location
        if str(location_id).lower() == 'other':
            custom_location = data.get('custom_location', '').strip()
            if not custom_location:
                return jsonify({'error': 'Custom location is required when "Other" is selected'}), 400
            
            # Check if location already exists
            existing = conn.execute('SELECT id FROM locations WHERE LOWER(name) = LOWER(?)', (custom_location,)).fetchone()
            if existing:
                location_id = existing[0]
            else:
                # Create new location
                cursor = conn.execute(
                    'INSERT INTO locations (name, code, description, created_at) VALUES (?, ?, ?, datetime("now"))',
                    (custom_location, custom_location[:4].upper(), f'Custom location: {custom_location}')
                )
                location_id = cursor.lastrowid
        
        # Insert lost item
        cursor = conn.execute('''
            INSERT INTO lost_items (
                title, description, category_id, location_id, color, size,
                date_lost, time_lost, user_name, user_email, user_phone,
                additional_details, is_resolved, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime("now"))
        ''', (
            data.get('title'),
            data.get('description'),
            category_id,
            location_id,
            data.get('color', ''),
            data.get('size', ''),
            data.get('date_lost'),
            data.get('time_lost', ''),
            data.get('user_name'),
            data.get('user_email'),
            data.get('user_phone', ''),
            data.get('additional_details', ''),
        ))
        
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Lost item reported successfully',
            'item_id': item_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report-found', methods=['POST'])
def report_found_item():
    """Submit a new found item report"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'category_id', 'location_id', 'date_found', 'user_name', 'user_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
        
        # Handle custom category/location
        category_id = data.get('category_id')
        location_id = data.get('location_id')
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        # If category is "other", create new category
        if str(category_id).lower() == 'other':
            custom_category = data.get('custom_category', '').strip()
            if not custom_category:
                return jsonify({'error': 'Custom category is required when "Other" is selected'}), 400
            
            # Check if category already exists
            existing = conn.execute('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', (custom_category,)).fetchone()
            if existing:
                category_id = existing[0]
            else:
                # Create new category
                cursor = conn.execute(
                    'INSERT INTO categories (name, description, created_at) VALUES (?, ?, datetime("now"))',
                    (custom_category, f'Custom category: {custom_category}')
                )
                category_id = cursor.lastrowid
        
        # If location is "other", create new location
        if str(location_id).lower() == 'other':
            custom_location = data.get('custom_location', '').strip()
            if not custom_location:
                return jsonify({'error': 'Custom location is required when "Other" is selected'}), 400
            
            # Check if location already exists
            existing = conn.execute('SELECT id FROM locations WHERE LOWER(name) = LOWER(?)', (custom_location,)).fetchone()
            if existing:
                location_id = existing[0]
            else:
                # Create new location
                cursor = conn.execute(
                    'INSERT INTO locations (name, code, description, created_at) VALUES (?, ?, ?, datetime("now"))',
                    (custom_location, custom_location[:4].upper(), f'Custom location: {custom_location}')
                )
                location_id = cursor.lastrowid
        
        # Insert found item
        cursor = conn.execute('''
            INSERT INTO found_items (
                title, description, category_id, location_id, color, size,
                date_found, time_found, user_name, user_email, user_phone,
                additional_details, is_claimed, has_privacy_expiry,
                privacy_expiry_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime("now"))
        ''', (
            data.get('title'),
            data.get('description'),
            category_id,
            location_id,
            data.get('color', ''),
            data.get('size', ''),
            data.get('date_found'),
            data.get('time_found', ''),
            data.get('user_name'),
            data.get('user_email'),
            data.get('user_phone', ''),
            data.get('additional_details', ''),
            data.get('has_privacy_expiry', 0),
            data.get('privacy_expiry_date', None)
        ))
        
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Found item reported successfully',
            'item_id': item_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        print("📋 Please run: python generate_100k_database.py")
        print("   This will create the database with 100,000 realistic items")
        exit(1)
    
    print("🚀 Starting TrackeBack Comprehensive Backend")
    print(f"📂 Database: {DB_PATH}")
    print("📊 Features: 100K items, Kent State locations, Security verification")
    print("🌐 Server running on http://localhost:5000")
    print("🏠 API Info: http://localhost:5000/")
    print("💚 Health Check: http://localhost:5000/health")
    print("📱 Categories: http://localhost:5000/api/categories")
    print("📍 Locations: http://localhost:5000/api/locations")
    print("❌ Lost Items: http://localhost:5000/api/lost-items")
    print("✅ Found Items: http://localhost:5000/api/found-items")
    
    app.run(debug=True, host='0.0.0.0', port=5000)