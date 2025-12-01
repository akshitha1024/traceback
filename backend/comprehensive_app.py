"""
TrackeBack Comprehensive Flask Backend
Handles 100,000 realistic items with full API functionality
Works with SQLite database (compatible with MySQL structure)
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
import json
from email_verification_service import EmailVerificationService
from user_management import create_user, get_user_by_email, verify_password, update_last_login, verify_user_email, get_user_stats
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import uuid
from profile_manager import create_profile_endpoints
from ml_matching_service import MLMatchingService

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key-2025-comprehensive'
CORS(app)

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traceback_100k.db')

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """Save uploaded file and return the filename"""
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        try:
            file.save(filepath)
            return unique_filename
        except Exception as e:
            print(f"Error saving file: {e}")
            return None
    return None

# Initialize email verification service
verification_service = EmailVerificationService(DB_PATH)

# Initialize ML matching service (lazy loading)
ml_service = None
notification_service = None

def get_ml_service():
    """Get or initialize ML matching service"""
    global ml_service
    if ml_service is None:
        try:
            print("🤖 Initializing ML Matching Service...")
            ml_service = MLMatchingService(DB_PATH, upload_folder=UPLOAD_FOLDER)
            print("✅ ML Matching Service initialized!")
        except Exception as e:
            print(f"❌ Error initializing ML service: {e}")
            return None
    return ml_service

def get_notification_service():
    """Get or initialize ML notification service"""
    global notification_service
    if notification_service is None:
        try:
            from ml_notification_service import MLNotificationService
            ml = get_ml_service()
            if ml:
                print("📧 Initializing ML Notification Service...")
                notification_service = MLNotificationService(DB_PATH, ml)
                print("✅ ML Notification Service initialized!")
        except Exception as e:
            print(f"❌ Error initializing notification service: {e}")
            return None
    return notification_service

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
        'message': 'TrackeBack Comprehensive API - Found Items Only',
        'version': '3.0.0',
        'database': 'SQLite (MySQL Compatible)',
        'status': 'Running',
        'features': [
            'Real Kent State campus locations',
            'Found items only (lost items disabled)',
            '3-day ML-only privacy period',
            'Public view: name, category, location, and date/time only',
            'Smart search and filtering',
            'Security question verification for claims'
        ],
        'privacy_policy': {
            'days_1_to_3': 'Items hidden from public (ML matching only)',
            'day_3_plus': 'Public view shows only item name, category, location, and date/time',
            'finder_privacy': 'Finder details never shown publicly'
        }
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
    """
    Get lost items - PRIVATE to owners only
    Lost items are NEVER shown in public browse
    Only visible in owner's dashboard
    """
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Parse query parameters
        user_email = request.args.get('user_email', '').strip()
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 100)), 500)
        include_matches = request.args.get('include_matches', 'false').lower() == 'true'
        
        # PRIVACY: Lost items are ONLY visible to the owner
        if not user_email:
            # No user email = no access to lost items (they are private)
            return jsonify({
                'items': [],
                'pagination': {'page': page, 'limit': limit, 'total': 0}
            }), 200
        
        offset = (page - 1) * limit
        
        # Get total count - only for this user's lost items
        total = conn.execute('SELECT COUNT(*) as total FROM lost_items WHERE is_resolved = 0 AND user_email = ?', (user_email,)).fetchone()['total']
        
        # Get lost items - only for this user
        items = conn.execute("""
            SELECT l.rowid as id, l.*, c.name as category_name, loc.name as location_name
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
            WHERE l.is_resolved = 0 AND l.user_email = ?
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        """, (user_email, limit, offset)).fetchall()
        
        conn.close()
        
        items_list = []
        for item in items:
            item_dict = dict(item)
            
            # Format dates
            if item_dict.get('date_lost'):
                try:
                    date_obj = datetime.strptime(item_dict['date_lost'], '%Y-%m-%d')
                    item_dict['date_lost'] = date_obj.strftime('%m/%d/%Y')
                except:
                    pass
            
            if item_dict.get('time_lost'):
                try:
                    time_obj = datetime.strptime(item_dict['time_lost'], '%H:%M:%S')
                    item_dict['time_lost'] = time_obj.strftime('%I:%M %p')
                except:
                    pass
            
            items_list.append(item_dict)
        
        # Add ML matching if requested (from pre-computed ml_matches table)
        if include_matches:
            conn2 = get_db()
            if conn2:
                for item in items_list:
                    try:
                        match_rows = conn2.execute("""
                            SELECT m.match_score, m.score_breakdown,
                                   f.rowid as id, f.title, f.description, f.color, f.size,
                                   f.date_found, f.time_found, f.image_filename,
                                   f.finder_name, f.finder_email, f.finder_phone,
                                   f.current_location, f.is_claimed, f.status,
                                   c.name as category_name,
                                   loc.name as location_name
                            FROM ml_matches m
                            JOIN found_items f ON m.found_item_id = f.rowid
                            LEFT JOIN categories c ON f.category_id = c.id
                            LEFT JOIN locations loc ON f.location_id = loc.id
                            WHERE m.lost_item_id = ? AND m.match_score >= 0.7
                            ORDER BY m.match_score DESC
                            LIMIT 5
                        """, (item['id'],)).fetchall()
                        
                        matches = [dict(row) for row in match_rows]
                        item['ml_matches'] = matches
                        item['match_count'] = len(matches)
                    except Exception as e:
                        print(f"Error reading matches for lost item {item['id']}: {e}")
                        item['ml_matches'] = []
                        item['match_count'] = 0
                conn2.close()
        
        return jsonify({
            'items': items_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit,
                'has_next': page * limit < total,
                'has_prev': page > 1
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/found-items')
def get_found_items():
    """
    Get found items with 3-day privacy period:
    - First 3 days: Only visible to users with >70% matching lost items
    - After 3 days: Public to everyone (name, category, location, date only)
    """
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
        include_private = request.args.get('include_private', 'false').lower() == 'true'  # For ML matching
        user_email = request.args.get('user_email', '').strip()  # Current user's email for matching
        
        # Build query - exclude claimed items
        where_conditions = ["(f.status IS NULL OR f.status != 'CLAIMED')"]  # Only unclaimed items
        
        params = []
        
        # PRIVACY LOGIC: Only show items older than 3 days in public browse
        # Items within 3 days are private and ONLY shown through:
        # 1. ML matching (70%+ score) on user's dashboard
        # 2. Moderators viewing abuse reports
        # This check is ONLY for public browse, not for dashboard or admin views
        if not include_private:  # Public browse view
            where_conditions.append("datetime(f.created_at) <= datetime('now', '-3 days')")
        
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
            SELECT f.rowid as id, f.category_id, f.location_id,
                   f.title, f.description, f.color, f.size,
                   f.image_filename as image_url, f.date_found, f.time_found,
                   f.current_location, f.finder_notes, f.is_private, f.privacy_expires_at,
                   f.is_claimed, f.created_at, f.privacy_expires,
                   f.finder_name, f.finder_email, f.finder_phone,
                   c.name as category_name, loc.name as location_name,
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
        
        # Format and filter items
        items_list = []
        for item in items:
            item_dict = dict_from_row(item)
            
            # Add location_found field
            if 'location_name' in item_dict:
                item_dict['location_found'] = item_dict['location_name']
            
            item_dict['is_currently_private'] = False
            
            # Format date_found to mm/dd/yyyy if it exists
            if item_dict.get('date_found'):
                try:
                    date_obj = datetime.strptime(item_dict['date_found'], '%Y-%m-%d')
                    item_dict['date_found'] = date_obj.strftime('%m/%d/%Y')
                except:
                    pass  # Keep original format if parsing fails
            
            # Format time_found to 12-hour format without seconds
            if item_dict.get('time_found'):
                try:
                    time_obj = datetime.strptime(item_dict['time_found'], '%H:%M:%S')
                    item_dict['time_found'] = time_obj.strftime('%I:%M %p')
                except:
                    pass  # Keep original format if parsing fails
            
            # For public view: show name, category, location, date/time, and contact email only
            # For ML matching (include_private=true): show everything
            if not include_private:
                # Public view - hide sensitive details
                item_dict['description'] = None
                item_dict['color'] = None
                item_dict['size'] = None
                # Keep image_filename but rename to image_filename for frontend to conditionally show
                if item_dict.get('image_url'):
                    item_dict['image_filename'] = item_dict['image_url']
                item_dict['image_url'] = None
                item_dict['finder_name'] = None
                # Keep finder_email for contact and ownership check
                item_dict['finder_phone'] = None
                item_dict['current_location'] = None
                item_dict['finder_notes'] = None
            else:
                # ML matching view - include image URL if exists
                if item_dict.get('image_url'):
                    item_dict['image_filename'] = item_dict['image_url']
                    item_dict['image_url'] = f"http://localhost:5000/api/uploads/{item_dict['image_url']}"
            
            items_list.append(item_dict)
        
        # Add ML matching for each found item (from pre-computed ml_matches table)
        if include_private:  # Only include matches for dashboard/ML view
            conn2 = get_db()
            if conn2:
                for item in items_list:
                    try:
                        match_rows = conn2.execute("""
                            SELECT m.match_score, m.score_breakdown,
                                   l.rowid as id, l.title, l.description, l.color, l.size,
                                   l.date_lost, l.time_lost, l.image_filename,
                                   l.owner_name, l.user_email, l.owner_phone,
                                   l.last_seen_location, l.owner_notes,
                                   c.name as category_name,
                                   loc.name as location_name
                            FROM ml_matches m
                            JOIN lost_items l ON m.lost_item_id = l.rowid
                            LEFT JOIN categories c ON l.category_id = c.id
                            LEFT JOIN locations loc ON l.location_id = loc.id
                            WHERE m.found_item_id = ? AND m.match_score >= 0.7
                            ORDER BY m.match_score DESC
                            LIMIT 5
                        """, (item['id'],)).fetchall()
                        
                        matches = [dict(row) for row in match_rows]
                        item['ml_matches'] = matches
                        item['match_count'] = len(matches)
                    except Exception as e:
                        print(f"Error reading matches for found item {item['id']}: {e}")
                        item['ml_matches'] = []
                        item['match_count'] = 0
                conn2.close()
        
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

@app.route('/api/lost-items/<int:item_id>')
def get_lost_item(item_id):
    """Get a single lost item with ML matches"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Get the lost item
        item = conn.execute("""
            SELECT l.rowid as id, l.*, c.name as category_name, loc.name as location_name,
                   loc.building_code, loc.description as location_description
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
            WHERE l.rowid = ?
        """, (item_id,)).fetchone()
        
        conn.close()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        item_dict = dict(item)
        
        # Format dates
        if item_dict.get('date_lost'):
            try:
                date_obj = datetime.strptime(item_dict['date_lost'], '%Y-%m-%d')
                item_dict['date_lost'] = date_obj.strftime('%m/%d/%Y')
            except:
                pass
        
        if item_dict.get('time_lost'):
            try:
                time_obj = datetime.strptime(item_dict['time_lost'], '%H:%M:%S')
                item_dict['time_lost'] = time_obj.strftime('%I:%M %p')
            except:
                pass
        
        if item_dict.get('image_url'):
            item_dict['image_url'] = f"http://localhost:5000/api/uploads/{item_dict['image_url']}"
        
        # Get ML matches (>60% similarity)
        ml_service = get_ml_service()
        matches = []
        if ml_service:
            try:
                matches = ml_service.find_matches_for_lost_item(
                    lost_item_id=item_id,
                    min_score=0.6,  # 60% threshold
                    top_k=10
                )
            except Exception as e:
                print(f"Error finding matches: {e}")
        
        return jsonify({
            'item': item_dict,
            'matches': matches,
            'match_count': len(matches)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/lost-items/<int:item_id>', methods=['DELETE'])
def delete_lost_item(item_id):
    """Delete a lost item (user found it themselves or wants to remove it)"""
    try:
        user_email = request.args.get('user_email')
        
        if not user_email:
            return jsonify({'error': 'User email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute('SELECT user_email FROM lost_items WHERE rowid = ?', (item_id,))
        item = cursor.fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        if item['user_email'] != user_email:
            conn.close()
            return jsonify({'error': 'Unauthorized: You can only delete your own items'}), 403
        
        # Delete the item
        cursor.execute('DELETE FROM lost_items WHERE rowid = ?', (item_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Lost item deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error deleting lost item: {e}")
        return jsonify({'error': 'Failed to delete item'}), 500

@app.route('/api/found-items/<int:item_id>')
def get_found_item(item_id):
    """Get a single found item with ML matches"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Get the found item
        item = conn.execute("""
            SELECT f.rowid as id, f.*, c.name as category_name, loc.name as location_name,
                   loc.building_code, loc.description as location_description
            FROM found_items f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE f.rowid = ?
        """, (item_id,)).fetchone()
        
        conn.close()
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        item_dict = dict(item)
        
        # Format dates
        if item_dict.get('date_found'):
            try:
                date_obj = datetime.strptime(item_dict['date_found'], '%Y-%m-%d')
                item_dict['date_found'] = date_obj.strftime('%m/%d/%Y')
            except:
                pass
        
        if item_dict.get('time_found'):
            try:
                time_obj = datetime.strptime(item_dict['time_found'], '%H:%M:%S')
                item_dict['time_found'] = time_obj.strftime('%I:%M %p')
            except:
                pass
        
        if item_dict.get('image_url'):
            item_dict['image_url'] = f"http://localhost:5000/api/uploads/{item_dict['image_url']}"
        
        # Get ML matches from pre-computed ml_matches table (>70% threshold)
        conn2 = get_db()
        matches = []
        if conn2:
            try:
                match_rows = conn2.execute("""
                    SELECT m.match_score, m.score_breakdown,
                           l.rowid as id, l.title, l.description, l.color, l.size,
                           l.date_lost, l.time_lost, l.image_filename,
                           l.owner_name, l.user_email, l.owner_phone,
                           l.last_seen_location, l.owner_notes,
                           c.name as category_name,
                           loc.name as location_name
                    FROM ml_matches m
                    JOIN lost_items l ON m.lost_item_id = l.rowid
                    LEFT JOIN categories c ON l.category_id = c.id
                    LEFT JOIN locations loc ON l.location_id = loc.id
                    WHERE m.found_item_id = ? AND m.match_score >= 0.7
                    ORDER BY m.match_score DESC
                    LIMIT 10
                """, (item_id,)).fetchall()
                
                matches = [dict(row) for row in match_rows]
                conn2.close()
            except Exception as e:
                print(f"Error reading matches: {e}")
        
        return jsonify({
            'item': item_dict,
            'matches': matches,
            'match_count': len(matches)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security-questions/<int:found_item_id>')
def get_security_questions(found_item_id):
    """Get security questions for ownership verification with 3-day privacy check"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Get user email from request args
        user_email = request.args.get('user_email')
        
        # Verify item exists and get details including created_at
        item = conn.execute(
            'SELECT rowid as id, title, finder_email, created_at FROM found_items WHERE rowid = ? AND is_claimed = 0',
            (found_item_id,)
        ).fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found or already claimed'}), 404
        
        # Check if item is within 3-day privacy period
        item_created = datetime.strptime(item['created_at'], '%Y-%m-%d %H:%M:%S')
        days_since_posted = (datetime.now() - item_created).days
        
        if days_since_posted < 3 and user_email:
            # Item is private - check if user has a matching lost item (>70% match)
            has_match = conn.execute("""
                SELECT COUNT(*) as count
                FROM ml_matches m
                JOIN lost_items l ON m.lost_item_id = l.rowid
                WHERE m.found_item_id = ? 
                AND l.user_email = ?
                AND m.match_score >= 0.7
            """, (found_item_id, user_email)).fetchone()
            
            if not has_match or has_match['count'] == 0:
                conn.close()
                return jsonify({
                    'error': 'This item is in the 3-day private period. Only users with matching lost items can access it.',
                    'privacy_restricted': True
                }), 403
        
        # Get questions with multiple choice options (without correct_choice)
        questions = conn.execute('''
            SELECT id, question, question_type, choice_a, choice_b, choice_c, choice_d
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
    """Verify ownership through security questions - ONE ATTEMPT PER USER"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        found_item_id = data.get('found_item_id')
        user_answers = data.get('answers', {})
        claimer_user_id = data.get('claimer_user_id')
        claimer_email = data.get('claimer_email', '')
        
        if not found_item_id:
            return jsonify({'error': 'Found item ID required'}), 400
        
        if not claimer_email:
            return jsonify({'error': 'User email required'}), 400
        
        # CHECK IF USER HAS ALREADY ATTEMPTED TO CLAIM THIS ITEM (ONE ANSWER PER USER)
        existing_attempt = conn.execute('''
            SELECT attempt_id, attempted_at, success
            FROM claim_attempts 
            WHERE found_item_id = ? AND user_email = ?
        ''', (found_item_id, claimer_email)).fetchone()
        
        if existing_attempt:
            conn.close()
            attempt_date = existing_attempt['attempted_at']
            was_successful = existing_attempt['success']
            
            if was_successful:
                return jsonify({
                    'error': 'You have already successfully claimed this item',
                    'attempted_at': attempt_date,
                    'already_attempted': True
                }), 403
            else:
                return jsonify({
                    'error': 'You have already attempted to claim this item. Each user can only answer verification questions once per item.',
                    'attempted_at': attempt_date,
                    'already_attempted': True
                }), 403
        
        # Get all questions with correct answers
        questions = conn.execute('''
            SELECT id, question, correct_choice, question_type
            FROM security_questions 
            WHERE found_item_id = ?
        ''', (found_item_id,)).fetchall()
        
        if not questions:
            conn.close()
            return jsonify({'error': 'No security questions found'}), 404
        
        # Verify answers
        correct_answers = 0
        total_questions = len(questions)
        
        print(f"\n🔍 Verification Debug for item {found_item_id}:")
        print(f"Total questions: {total_questions}")
        print(f"User answers received: {user_answers}")
        
        for question in questions:
            question_id = str(question['id'])
            correct_choice = str(question['correct_choice']).strip().upper()
            
            if question_id in user_answers:
                user_answer = str(user_answers[question_id]).strip().upper()
                is_correct = user_answer == correct_choice
                
                print(f"Question {question_id}: '{question['question']}'")
                print(f"  User answered: '{user_answer}' | Correct: '{correct_choice}' | Match: {is_correct}")
                
                if is_correct:
                    correct_answers += 1
            else:
                print(f"Question {question_id}: No answer provided")
        
        print(f"Result: {correct_answers}/{total_questions} correct ({correct_answers/total_questions*100:.1f}%)")
        print("=" * 70 + "\n")
        
        # Calculate success rate (need at least 67% correct)
        success_rate = correct_answers / total_questions
        verification_successful = success_rate >= 0.67
        
        if verification_successful:
            # Get complete item details with finder information (use rowid, not id)
            # Join with users table to get finder's user_id
            item_details = conn.execute('''
                SELECT f.rowid as id, f.*, c.name as category_name, loc.name as location_name,
                       loc.building_code, loc.description as location_description,
                       u.id as finder_user_id
                FROM found_items f
                JOIN categories c ON f.category_id = c.id
                JOIN locations loc ON f.location_id = loc.id
                LEFT JOIN users u ON f.finder_email = u.email
                WHERE f.rowid = ?
            ''', (found_item_id,)).fetchone()
            
            if not item_details:
                conn.close()
                return jsonify({'error': 'Item not found'}), 404
            
            item_dict = dict_from_row(item_details)
            
            # Get claimer info from request (current user)
            claimer_user_id = data.get('claimer_user_id')
            claimer_name = data.get('claimer_name', 'Unknown')
            claimer_email = data.get('claimer_email', '')
            claimer_phone = data.get('claimer_phone', '')
            
            # Log this successful attempt (prevents future attempts)
            import json
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO claim_attempts (
                    found_item_id, user_id, user_email, success, answers_json
                ) VALUES (?, ?, ?, 1, ?)
            ''', (found_item_id, claimer_user_id, claimer_email, json.dumps(user_answers)))
            
            # Create ownership claim record
            cursor.execute('''
                INSERT INTO ownership_claims (
                    item_id, item_type, item_title,
                    claimer_user_id, claimer_name, claimer_email, claimer_phone,
                    finder_name, finder_email, finder_phone,
                    claimed_status
                ) VALUES (?, 'FOUND', ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
            ''', (
                found_item_id, 
                item_dict['title'],
                claimer_user_id,
                claimer_name,
                claimer_email,
                claimer_phone,
                item_dict['finder_name'],
                item_dict['finder_email'],
                item_dict['finder_phone']
            ))
            
            claim_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            print(f"✅ Claim attempt logged (SUCCESS) for user {claimer_email}")
            print(f"✅ Claim record created: ID {claim_id} for item {found_item_id}")
            
            return jsonify({
                'verified': True,
                'claim_id': claim_id,
                'message': f'Verification successful! You answered {correct_answers}/{total_questions} questions correctly.',
                'success_rate': round(success_rate * 100, 1),
                'finder_details': {
                    'user_id': item_dict.get('finder_user_id'),
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
            # Log this failed attempt (prevents future attempts)
            import json
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO claim_attempts (
                    found_item_id, user_id, user_email, success, answers_json
                ) VALUES (?, ?, ?, 0, ?)
            ''', (found_item_id, claimer_user_id, claimer_email, json.dumps(user_answers)))
            
            conn.commit()
            conn.close()
            
            required_correct = max(1, int(total_questions * 0.67))
            
            print(f"❌ Claim attempt logged (FAILED) for user {claimer_email}")
            print(f"   Score: {correct_answers}/{total_questions} ({success_rate*100:.1f}%)")
            
            return jsonify({
                'verified': False,
                'message': f'Verification failed. You answered {correct_answers}/{total_questions} questions correctly. You need at least {required_correct}/{total_questions} correct answers. You cannot attempt again for this item.',
                'success_rate': round(success_rate * 100, 1),
                'attempts_remaining': 0  # ONE ATTEMPT ONLY
            })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/security-questions/bulk', methods=['POST'])
def create_security_questions_bulk():
    """Create multiple security questions for a found item"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        found_item_id = data.get('found_item_id')
        questions = data.get('questions', [])
        
        if not found_item_id:
            return jsonify({'error': 'Found item ID required'}), 400
        
        if not questions or len(questions) < 2:
            return jsonify({'error': 'At least 2 security questions required'}), 400
        
        if len(questions) > 5:
            return jsonify({'error': 'Maximum 5 security questions allowed'}), 400
        
        # Verify the found item exists and hasn't been claimed (use rowid, not id)
        item = conn.execute(
            'SELECT rowid as id FROM found_items WHERE rowid = ? AND is_claimed = 0',
            (found_item_id,)
        ).fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Found item not found or already claimed'}), 404
        
        # Delete any existing questions for this item (in case of re-submission)
        conn.execute('DELETE FROM security_questions WHERE found_item_id = ?', (found_item_id,))
        
        # Insert all questions
        created_questions = []
        for q in questions:
            question_type = q.get('question_type', 'multiple_choice')
            
            # Validate question text is present
            if not q.get('question'):
                conn.close()
                return jsonify({'error': 'Each question must have a question text'}), 400
            
            # For multiple choice questions, validate choices
            if question_type == 'multiple_choice':
                if not q.get('choice_a') or not q.get('choice_b'):
                    conn.close()
                    return jsonify({'error': 'Multiple choice questions must have at least 2 choices (A and B)'}), 400
                
                if q.get('correct_choice') not in ['A', 'B', 'C', 'D']:
                    conn.close()
                    return jsonify({'error': 'Correct choice must be A, B, C, or D'}), 400
            
            # For text questions, validate answer is present
            elif question_type == 'text':
                if not q.get('text_answer'):
                    conn.close()
                    return jsonify({'error': 'Text questions must have an answer'}), 400
            
            # Get the answer value based on question type
            if question_type == 'text':
                answer_value = q.get('text_answer')
                correct_choice = None
                choice_a = None
                choice_b = None
                choice_c = None
                choice_d = None
            else:
                # Multiple choice question
                choice_map = {
                    'A': q.get('choice_a'),
                    'B': q.get('choice_b'),
                    'C': q.get('choice_c'),
                    'D': q.get('choice_d')
                }
                answer_value = choice_map.get(q['correct_choice'])
                correct_choice = q['correct_choice']
                choice_a = q['choice_a']
                choice_b = q['choice_b']
                choice_c = q.get('choice_c')
                choice_d = q.get('choice_d')
            
            cursor = conn.execute('''
                INSERT INTO security_questions 
                (found_item_id, question, answer, choice_a, choice_b, choice_c, choice_d, correct_choice, question_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ''', (
                found_item_id,
                q['question'],
                answer_value,  # For text: direct answer, for multiple choice: the selected choice value
                choice_a,
                choice_b,
                choice_c,
                choice_d,
                correct_choice,
                question_type
            ))
            
            created_questions.append({
                'id': cursor.lastrowid,
                'question': q['question']
            })
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{len(created_questions)} security questions created successfully',
            'questions': created_questions,
            'found_item_id': found_item_id
        }), 201
        
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
        
        # Calculate date 7 days ago in ET
        from datetime import datetime, timedelta
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
        
        # Total found items (including historical ones from successful_returns)
        active_found = conn.execute('SELECT COUNT(*) as count FROM found_items').fetchone()['count']
        finalized_found = conn.execute('SELECT COUNT(*) as count FROM successful_returns').fetchone()['count']
        stats['total_found_items'] = active_found + finalized_found
        
        # Items successfully claimed (from successful_returns table)
        stats['items_claimed'] = conn.execute(
            'SELECT COUNT(*) as count FROM successful_returns'
        ).fetchone()['count']
        
        # Active found items (not yet claimed/finalized)
        stats['active_found_items'] = conn.execute(
            'SELECT COUNT(*) as count FROM found_items WHERE is_claimed = 0'
        ).fetchone()['count']
        
        # Found items posted this week (last 7 days) - from both active and finalized
        recent_active = conn.execute(
            "SELECT COUNT(*) as count FROM found_items WHERE created_at >= ?",
            (seven_days_ago,)
        ).fetchone()['count']
        
        recent_finalized = conn.execute(
            "SELECT COUNT(*) as count FROM successful_returns WHERE finalized_at >= ?",
            (seven_days_ago,)
        ).fetchone()['count']
        
        stats['found_this_week'] = recent_active + recent_finalized
        
        # Legacy stats for compatibility
        stats['active_lost_items'] = conn.execute(
            'SELECT COUNT(*) as count FROM lost_items WHERE is_resolved = 0'
        ).fetchone()['count']
        
        stats['unclaimed_found_items'] = stats['active_found_items']
        stats['recent_found_items'] = stats['found_this_week']
        
        stats['total_categories'] = conn.execute(
            'SELECT COUNT(*) as count FROM categories'
        ).fetchone()['count']
        
        stats['total_locations'] = conn.execute(
            'SELECT COUNT(*) as count FROM locations'
        ).fetchone()['count']
        
        # Recent activity (last 7 days)
        stats['recent_lost_items'] = conn.execute(
            "SELECT COUNT(*) as count FROM lost_items WHERE created_at >= ?",
            (seven_days_ago,)
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
    password_valid = verify_password(password, user['password_hash'], user.get('email'))
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
    
    # Check if user is suspended
    if user.get('is_suspended', 0):
        suspension_until = user.get('suspension_until')
        if suspension_until:
            from datetime import datetime
            suspension_date = datetime.fromisoformat(suspension_until)
            current_date = datetime.now()
            
            # Check if suspension has expired
            if current_date < suspension_date:
                days_remaining = (suspension_date - current_date).days + 1
                print(f"❌ Login failed: Account suspended until {suspension_until}")
                return jsonify({
                    'error': f'Your account has been suspended until {suspension_date.strftime("%B %d, %Y")}. ({days_remaining} days remaining)'
                }), 403
            else:
                # Suspension expired, remove suspension
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute('UPDATE users SET is_suspended = 0, suspension_until = NULL WHERE email = ?', (email,))
                conn.commit()
                conn.close()
                print(f"✅ Suspension expired for {email}, removing suspension")
        else:
            print("❌ Login failed: Account suspended indefinitely")
            return jsonify({'error': 'Your account has been suspended. Please contact support.'}), 403
    
    # Update last login
    update_last_login(email)
    
    print(f"✅ Login successful: {user['full_name']}")
    
    return jsonify({
        'message': 'Login successful',
        'session_token': f'demo-token-{user["id"]}-2025',  # In real app, use JWT
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['full_name'],
            'first_name': user['first_name'],
            'last_name': user['last_name'],
            'verified': user['is_verified'],
            'profile_completed': user.get('profile_completed', 0),
            'created_at': user['created_at']
        }
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    return jsonify({'message': 'Logged out successfully'})


# Complete account deletion endpoint (hard delete with cascading)
@app.route('/api/user/<int:user_id>', methods=['DELETE'])
def delete_user_account(user_id):
    """Completely delete a user account and all associated data (lost items, found items, claims, messages, etc.).
    This is a hard delete that removes all traces of the user from the system.
    """
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500

        cursor = conn.cursor()

        # Get user and profile_image before deletion
        cursor.execute('SELECT id, email, profile_image FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'User not found'}), 404

        user = dict(row)

        # Delete all user-related data in the correct order (respecting foreign keys)
        
        # 1. Delete notifications (using user_email)
        cursor.execute('DELETE FROM notifications WHERE user_email = ?', (user['email'],))
        
        # 2. Anonymize messages instead of deleting (preserve for legal/proof purposes)
        # Replace user reference with a deleted user marker
        cursor.execute('''
            UPDATE messages 
            SET sender_id = -1 
            WHERE sender_id = ?
        ''', (user_id,))
        cursor.execute('''
            UPDATE messages 
            SET receiver_id = -1 
            WHERE receiver_id = ?
        ''', (user_id,))
        
        # 3. Delete claim attempts (has user_id column)
        cursor.execute('DELETE FROM claim_attempts WHERE user_id = ?', (user_id,))
        
        # 4. Delete ownership claims (using claimer_user_id, no finder_id exists)
        cursor.execute('DELETE FROM ownership_claims WHERE claimer_user_id = ?', (user_id,))
        
        # 5. Delete reviews (no reviewer_id or reviewed_user_id columns - reviews is for platform feedback)
        cursor.execute('DELETE FROM reviews WHERE user_email = ?', (user['email'],))
        
        # 6. Delete user_reviews (has reviewer_id and reviewed_user_id)
        cursor.execute('DELETE FROM user_reviews WHERE reviewer_id = ? OR reviewed_user_id = ?', (user_id, user_id))
        
        # 7. Delete abuse reports (using reported_by_id, no reported_user_id exists)
        cursor.execute('DELETE FROM abuse_reports WHERE reported_by_id = ?', (user_id,))
        
        # 8. Delete email verifications (using email, no user_id column)
        cursor.execute('DELETE FROM email_verifications WHERE email = ?', (user['email'],))
        
        # 9. Delete found items posted by this user (using email since found_items doesn't have user_id)
        cursor.execute('SELECT image_filename FROM found_items WHERE finder_email = ?', (user['email'],))
        found_images = cursor.fetchall()
        cursor.execute('DELETE FROM found_items WHERE finder_email = ?', (user['email'],))
        
        # 10. Delete lost items posted by this user (using email since lost_items doesn't have user_id)
        cursor.execute('SELECT image_filename FROM lost_items WHERE user_email = ?', (user['email'],))
        lost_images = cursor.fetchall()
        cursor.execute('DELETE FROM lost_items WHERE user_email = ?', (user['email'],))
        
        # 11. Finally, delete the user
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))

        # Delete image files from disk
        upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
        
        # Delete profile image
        try:
            if user.get('profile_image'):
                profile_img = user['profile_image']
                profile_path = os.path.join(upload_folder, 'profiles', profile_img)
                if os.path.exists(profile_path):
                    os.remove(profile_path)
                    print(f"  Deleted profile image: {profile_path}")
        except Exception as e:
            print(f"Warning: failed to remove profile image for user {user_id}: {e}")
        
        # Delete found item images
        for img_row in found_images:
            try:
                if img_row[0]:  # image_filename
                    img_path = os.path.join(upload_folder, 'found', img_row[0])
                    if os.path.exists(img_path):
                        os.remove(img_path)
                        print(f"  Deleted found item image: {img_path}")
            except Exception as e:
                print(f"Warning: failed to remove found item image: {e}")
        
        # Delete lost item images
        for img_row in lost_images:
            try:
                if img_row[0]:  # image_filename
                    img_path = os.path.join(upload_folder, 'lost', img_row[0])
                    if os.path.exists(img_path):
                        os.remove(img_path)
                        print(f"  Deleted lost item image: {img_path}")
            except Exception as e:
                print(f"Warning: failed to remove lost item image: {e}")

        conn.commit()
        conn.close()

        print(f"✅ User account {user_id} and all associated data completely deleted")
        return jsonify({'success': True, 'message': 'Account and all associated data deleted successfully'}), 200

    except Exception as e:
        print(f"❌ Error deleting account {user_id}: {e}")
        return jsonify({'error': str(e)}), 500

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
        
        # Get full user data
        user = get_user_by_email(email)
        if user:
            return jsonify({
                'message': message, 
                'verified': True,
                'session_token': f'demo-token-{user["id"]}-2025',
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['full_name'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'verified': True,
                    'profile_completed': user.get('profile_completed', 0),
                    'created_at': user['created_at']
                }
            }), 200
        else:
            return jsonify({
                'message': message, 
                'verified': True,
                'user': {'email': email, 'verified': True, 'profile_completed': 0}
            }), 200
    else:
        print(f"❌ Email verification failed: {message}")
        return jsonify({'error': message, 'verified': False}), 400


# Password reset: request a code to be sent if the email exists
@app.route('/api/auth/request-password-reset', methods=['POST'])
def request_password_reset():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Check user exists and is active
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500

    user = conn.execute('SELECT id, email, is_active FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'Email not found'}), 404

    if user['is_active'] == 0:
        conn.close()
        return jsonify({'error': 'Account is deactivated'}), 400

    # Use the existing verification service to send a code for password reset
    success, message = verification_service.send_verification_email(email, "Password Reset", "password_reset", user['id'])
    conn.close()

    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'error': message}), 400


# Password reset: verify code and set new password
@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()
    new_password = data.get('new_password', '')

    if not email or not code or not new_password:
        return jsonify({'error': 'Email, code, and new password are required'}), 400

    # Verify code
    success, message = verification_service.verify_code(email, code)
    if not success:
        return jsonify({'error': message}), 400

    # Update user's password
    try:
        # Hash using user_management.hash_password
        from user_management import hash_password
        new_hash = hash_password(new_password)

        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500

        cursor = conn.cursor()
        cursor.execute('UPDATE users SET password_hash = ? WHERE LOWER(email) = ?', (new_hash, email))
        conn.commit()
        conn.close()

        return jsonify({'message': 'Password has been reset successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
    """Submit a new lost item report with optional image upload"""
    try:
        # Handle both JSON and FormData
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            image_file = None
        else:
            # FormData (with potential file upload)
            data = request.form.to_dict()
            image_file = request.files.get('image')
        
        print(f"📝 Lost item report received: {data.get('title', 'Unknown')}")
        
        # Validate required fields
        required_fields = ['title', 'description', 'category_id', 'location_id', 'date_lost', 'user_name', 'user_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
        
        # Handle file upload
        image_filename = None
        if image_file:
            print(f"📸 Processing image upload: {image_file.filename}")
            image_filename = save_uploaded_file(image_file)
            if image_filename:
                print(f"✅ Image saved: {image_filename}")
            else:
                print(f"❌ Failed to save image: {image_file.filename}")
                return jsonify({'error': 'Failed to save uploaded image'}), 400
        
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
                print(f"🆕 Created new category: {custom_category} (ID: {category_id})")
        
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
                print(f"🆕 Created new location: {custom_location} (ID: {location_id})")
        
        # Lost items are always private (only visible to the person who reported)
        # No privacy expiry needed for lost items
        
        # Insert lost item with local ET time
        current_time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor = conn.execute('''
            INSERT INTO lost_items (
                title, description, category_id, location_id, color, size,
                date_lost, time_lost, user_name, user_email, user_phone,
                additional_details, image_filename, is_resolved, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
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
            data.get('additional_notes', ''),
            image_filename,
            current_time_str  # Local ET time
        ))
        
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Lost item created: ID {item_id} - {data.get('title')}")
        
        return jsonify({
            'message': 'Lost item reported successfully',
            'item_id': item_id,
            'title': data.get('title')
        }), 201
        
    except Exception as e:
        print(f"❌ Error reporting lost item: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to report lost item: {str(e)}'}), 500

@app.route('/api/report-found', methods=['POST'])
def report_found_item():
    """Submit a new found item report with optional image upload"""
    try:
        # Handle both JSON and FormData
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            image_file = None
        else:
            # FormData (with potential file upload)
            data = request.form.to_dict()
            image_file = request.files.get('image')
        
        print(f"📝 Found item report received: {data.get('title', 'Unknown')}")
        
        # Validate required fields
        required_fields = ['title', 'description', 'category_id', 'location_id', 'date_found', 'user_name', 'user_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.replace("_", " ").title()} is required'}), 400
        
        # Handle file upload
        image_filename = None
        if image_file:
            print(f"📸 Processing image upload: {image_file.filename}")
            image_filename = save_uploaded_file(image_file)
            if image_filename:
                print(f"✅ Image saved: {image_filename}")
            else:
                print(f"❌ Failed to save image: {image_file.filename}")
                return jsonify({'error': 'Failed to save uploaded image'}), 400
        
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
                print(f"🆕 Created new category: {custom_category} (ID: {category_id})")
        
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
                print(f"🆕 Created new location: {custom_location} (ID: {location_id})")
        
        # Calculate privacy expiry (3 days from now)
        privacy_expiry = datetime.now() + timedelta(days=3)
        privacy_expiry_str = privacy_expiry.strftime('%Y-%m-%d %H:%M:%S')
        
        # Insert found item with local ET time
        current_time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor = conn.execute('''
            INSERT INTO found_items (
                title, description, category_id, location_id, color, size,
                date_found, time_found, finder_name, finder_email, finder_phone,
                finder_notes, current_location, is_private, privacy_expires_at,
                image_filename, is_claimed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, ?)
        ''', (
            data.get('title'),
            data.get('description'),
            category_id,
            location_id,
            data.get('color', ''),
            data.get('size', ''),
            data.get('date_found'),
            data.get('time_found', ''),
            data.get('user_name'),  # Using user_name as finder_name
            data.get('user_email'),  # Using user_email as finder_email
            data.get('user_phone', ''),  # Using user_phone as finder_phone
            data.get('additional_details', ''),  # Using additional_details as finder_notes
            'Front Desk',  # Default current_location
            privacy_expiry_str,
            image_filename,
            current_time_str  # Local ET time
        ))
        
        item_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Found item created with ID: {item_id}")
        
        # AUTOMATIC ML NOTIFICATION: Notify matching lost item owners
        try:
            notif_service = get_notification_service()
            if notif_service:
                print(f"📨 Checking for matching lost items to notify...")
                notifications_sent = notif_service.notify_matching_lost_item_owners(item_id)
                if notifications_sent > 0:
                    print(f"✅ Sent {notifications_sent} match notifications!")
                else:
                    print("ℹ️ No matching lost items found for notification")
        except Exception as e:
            print(f"⚠️ Error sending notifications (non-critical): {e}")
            # Don't fail the request if notifications fail
        
        return jsonify({
            'message': 'Found item reported successfully',
            'item_id': item_id,
            'image_uploaded': image_filename is not None,
            'privacy_expires': privacy_expiry_str
        }), 201
        
    except Exception as e:
        print(f"❌ Error reporting found item: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images"""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({'error': 'Image not found'}), 404

# ============================================
# REVIEWS ENDPOINTS
# ============================================

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    """Get all approved reviews"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=20)
        conn.execute('PRAGMA journal_mode=WAL')
        conn.row_factory = sqlite3.Row
        
        # Get only approved reviews, ordered by most recent first
        # Exclude email to protect user privacy
        cursor = conn.execute('''
            SELECT id, user_name, rating, review_text, 
                   item_found, image_filename, created_at
            FROM reviews
            WHERE is_approved = 1
            ORDER BY created_at DESC
        ''')
        
        reviews = []
        for row in cursor.fetchall():
            review = dict(row)
            # Format image URL if exists
            if review.get('image_filename'):
                review['image_url'] = f"http://localhost:5000/api/uploads/{review['image_filename']}"
            else:
                review['image_url'] = None
            reviews.append(review)
        
        conn.close()
        
        return jsonify({
            'reviews': reviews,
            'total': len(reviews)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching reviews: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews', methods=['POST'])
def create_review():
    """Submit a new review"""
    try:
        # Check if multipart/form-data (with potential image)
        if 'multipart/form-data' in request.content_type:
            user_name = request.form.get('user_name')
            user_email = request.form.get('user_email')
            rating = request.form.get('rating')
            review_text = request.form.get('review_text')
            item_found = request.form.get('item_found')
            image = request.files.get('image')
        else:
            # JSON request
            data = request.get_json()
            user_name = data.get('user_name')
            user_email = data.get('user_email')
            rating = data.get('rating')
            review_text = data.get('review_text')
            item_found = data.get('item_found')
            image = None
        
        # Validation
        if not all([user_name, user_email, rating, review_text]):
            return jsonify({'error': 'Missing required fields: user_name, user_email, rating, review_text'}), 400
        
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        except ValueError:
            return jsonify({'error': 'Rating must be a number'}), 400
        
        # Handle image upload
        image_filename = None
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            unique_filename = f"{uuid.uuid4().hex}_review_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            image.save(filepath)
            image_filename = unique_filename
            print(f"✅ Review image uploaded: {image_filename}")
        
        # Insert review into database
        conn = sqlite3.connect(DB_PATH, timeout=20)
        conn.execute('PRAGMA journal_mode=WAL')
        
        cursor = conn.execute('''
            INSERT INTO reviews (user_name, user_email, rating, review_text, item_found, image_filename, is_approved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_name, user_email, rating, review_text, item_found, image_filename, 1))
        
        review_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Review created with ID: {review_id}")
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review_id': review_id,
            'image_uploaded': image_filename is not None
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating review: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews/<int:review_id>', methods=['GET'])
def get_review(review_id):
    """Get a specific review by ID"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=20)
        conn.execute('PRAGMA journal_mode=WAL')
        conn.row_factory = sqlite3.Row
        
        cursor = conn.execute('''
            SELECT id, user_name, user_email, rating, review_text, 
                   item_found, image_filename, created_at, is_approved
            FROM reviews
            WHERE id = ?
        ''', (review_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'error': 'Review not found'}), 404
        
        review = dict(row)
        # Format image URL if exists
        if review.get('image_filename'):
            review['image_url'] = f"http://localhost:5000/api/uploads/{review['image_filename']}"
        else:
            review['image_url'] = None
        
        return jsonify(review), 200
        
    except Exception as e:
        print(f"❌ Error fetching review: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================
# ABUSE REPORTS API ENDPOINTS
# ============================================

def is_admin(user_email):
    """Check if user is an admin"""
    if not user_email:
        return False
    email_lower = user_email.lower()
    return email_lower in ['aksh@kent.edu', 'achapala@kent.edu', 'vkoniden@kent.edu', 'ldommara@kent.edu', 'bdharav1@kent.edu', 'psamala@kent.edu']


@app.route('/api/report-abuse', methods=['POST'])
def report_abuse():
    """Submit an abuse report for an item"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['type', 'target_id', 'category', 'reason']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO abuse_reports (
                type, target_id, target_title, 
                reported_by_id, reported_by_name, reported_by_email,
                category, reason, description, status, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'MEDIUM')
        ''', (
            data['type'],  # 'found_item' or 'lost_item'
            data['target_id'],
            data.get('target_title', ''),
            data.get('reported_by_id'),
            data.get('reported_by_name', ''),
            data.get('reported_by_email', ''),
            data['category'],  # e.g., 'Spam', 'Inappropriate', 'Fake', 'Other'
            data['reason'],
            data.get('description', '')
        ))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Abuse report created: {report_id} for {data['type']} ID {data['target_id']}")
        return jsonify({
            'success': True,
            'report_id': report_id,
            'message': 'Thank you for reporting. We will review this post for any abusive content and take necessary action.'
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating abuse report: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/moderation/action', methods=['POST'])
def moderation_action():
    """Take moderation action on a report"""
    try:
        data = request.get_json()
        
        required = ['report_id', 'action_type', 'reason', 'moderator_email']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        action_type = data['action_type']
        reason = data['reason']
        target_user_email = data.get('target_user_email')
        target_id = data.get('target_id')
        item_type = data.get('item_type')
        
        # Update report status
        cursor.execute('''
            UPDATE abuse_reports 
            SET status = 'REVIEWED', 
                moderator_action = ?, 
                moderator_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE report_id = ?
        ''', (action_type, reason, data['report_id']))
        
        # Execute the action
        action_message = ""
        
        if action_type == 'delete_post':
            # Delete the item based on type
            if item_type == 'FOUND':
                cursor.execute('DELETE FROM found_items WHERE id = ?', (target_id,))
            elif item_type == 'LOST':
                cursor.execute('DELETE FROM lost_items WHERE id = ?', (target_id,))
            action_message = "Your post has been removed due to violation of community guidelines."
            
        elif action_type == 'warn_user':
            action_message = "This is a warning regarding your post. Please review our community guidelines."
            
        elif action_type == 'suspend_user':
            # Suspend user for 30 days
            cursor.execute('''
                UPDATE users 
                SET is_suspended = 1, 
                    suspension_until = datetime('now', '+30 days')
                WHERE email = ?
            ''', (target_user_email,))
            action_message = "Your account has been suspended for 30 days due to violation of community guidelines."
            
        elif action_type == 'delete_account':
            # Delete user account and all related data
            cursor.execute('DELETE FROM users WHERE email = ?', (target_user_email,))
            cursor.execute('DELETE FROM found_items WHERE finder_email = ?', (target_user_email,))
            cursor.execute('DELETE FROM lost_items WHERE user_email = ?', (target_user_email,))
            cursor.execute('DELETE FROM claim_attempts WHERE claimer_email = ?', (target_user_email,))
            cursor.execute('DELETE FROM successful_returns WHERE owner_email = ? OR claimer_email = ?', (target_user_email, target_user_email))
            cursor.execute('DELETE FROM messages WHERE sender_id IN (SELECT id FROM users WHERE email = ?) OR receiver_id IN (SELECT id FROM users WHERE email = ?)', (target_user_email, target_user_email))
            cursor.execute('DELETE FROM abuse_reports WHERE reported_by_email = ?', (target_user_email,))
            action_message = "Your account has been permanently deleted due to severe violation of community guidelines."
            
        elif action_type == 'dismiss':
            action_message = None  # No email sent for dismissal
        
        conn.commit()
        conn.close()
        
        # Send email notification to the user (if action requires it)
        if action_message and target_user_email:
            try:
                # Import email service
                from email_verification_service import send_email
                
                subject = "TraceBack - Moderation Action"
                body = f"""
Hello,

This email is to inform you that a moderation action has been taken on your account or post.

Action Type: {action_type.replace('_', ' ').title()}

Reason: {reason}

{action_message}

If you believe this action was taken in error, please contact our TraceBack team:

• Vamsi Krishna Konidena - vkoniden@kent.edu
• Akshitha Chapalamadugu - achapala@kent.edu
• Lahari Dommaraju - ldommara@kent.edu
• Poojitha Samala - psamala@kent.edu
• Roopa Nimmanapalli - rnimmana@kent.edu
• Bhanu Prasad Dharavathu - bdharav1@kent.edu
• Bharath Kumar Nadipineni - bnadipin@kent.edu

Thank you,
TraceBack Moderation Team
                """
                
                send_email(target_user_email, subject, body)
                print(f"✅ Email sent to {target_user_email} for action {action_type}")
            except Exception as e:
                print(f"⚠️ Failed to send email: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Action completed successfully{" and user notified" if action_message else ""}'
        }), 200
        
    except Exception as e:
        print(f"❌ Error processing moderation action: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================
# OWNERSHIP CLAIMS API ENDPOINTS
# ============================================

@app.route('/api/claims', methods=['GET'])
def get_claims():
    """Get ownership claims for a user"""
    try:
        user_email = request.args.get('user_email')
        user_type = request.args.get('type', 'claimer')  # 'claimer' or 'finder'
        
        if not user_email:
            return jsonify({'error': 'User email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if user_type == 'claimer':
            # Get claims where this user verified ownership
            # Join with users table to get finder_id
            cursor.execute("""
                SELECT oc.*, u.id as finder_id
                FROM ownership_claims oc
                LEFT JOIN users u ON oc.finder_email = u.email
                WHERE oc.claimer_email = ?
                ORDER BY oc.verification_date DESC
            """, (user_email,))
        else:
            # Get claims where this user is the finder
            # claimer_user_id is already in the table, but rename it to claimer_id for consistency
            cursor.execute("""
                SELECT *, claimer_user_id as claimer_id
                FROM ownership_claims 
                WHERE finder_email = ?
                ORDER BY verification_date DESC
            """, (user_email,))
        
        rows = cursor.fetchall()
        conn.close()
        
        claims = [dict(row) for row in rows]
        
        print(f"✅ Retrieved {len(claims)} claims for {user_email} (type: {user_type})")
        return jsonify({'claims': claims}), 200
        
    except Exception as e:
        print(f"❌ Error fetching claims: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get notifications for a user"""
    try:
        user_email = request.args.get('user_email')
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        if not user_email:
            return jsonify({'error': 'User email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        if unread_only:
            query = """
                SELECT * FROM notifications 
                WHERE user_email = ? AND is_read = 0
                ORDER BY created_at DESC
            """
        else:
            query = """
                SELECT * FROM notifications 
                WHERE user_email = ?
                ORDER BY created_at DESC
                LIMIT 50
            """
        
        rows = conn.execute(query, (user_email,)).fetchall()
        conn.close()
        
        notifications = [dict(row) for row in rows]
        unread_count = sum(1 for n in notifications if not n['is_read'])
        
        return jsonify({
            'notifications': notifications,
            'unread_count': unread_count,
            'total': len(notifications)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching notifications: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            "UPDATE notifications SET is_read = 1 WHERE notification_id = ?",
            (notification_id,)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/check-claim-attempt/<int:found_item_id>', methods=['GET'])
def check_claim_attempt(found_item_id):
    """Check if user has already attempted to claim this item"""
    try:
        user_email = request.args.get('user_email')
        
        if not user_email:
            return jsonify({'error': 'User email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check for existing attempt
        cursor.execute('''
            SELECT attempt_id, attempted_at, success, answers_json
            FROM claim_attempts 
            WHERE found_item_id = ? AND user_email = ?
        ''', (found_item_id, user_email))
        
        attempt = cursor.fetchone()
        conn.close()
        
        if attempt:
            return jsonify({
                'has_attempted': True,
                'attempt': dict(attempt),
                'message': 'You have already attempted to claim this item. Each user can only answer verification questions once per item.'
            }), 200
        else:
            return jsonify({
                'has_attempted': False,
                'message': 'You can attempt to claim this item.'
            }), 200
            
    except Exception as e:
        print(f"❌ Error checking claim attempt: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/claim-attempts/<int:found_item_id>', methods=['GET'])
def get_claim_attempts_for_item(found_item_id):
    """Get all claim attempts for a found item (only accessible by the finder)"""
    try:
        finder_email = request.args.get('finder_email')
        
        if not finder_email:
            return jsonify({'error': 'Finder email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # First, verify that the requester is the finder of this item
        cursor.execute('''
            SELECT finder_email FROM found_items WHERE rowid = ?
        ''', (found_item_id,))
        
        item = cursor.fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        if item['finder_email'] != finder_email:
            conn.close()
            return jsonify({'error': 'Unauthorized: You can only view attempts for your own items'}), 403
        
        # Get finder's user_id
        cursor.execute('SELECT id FROM users WHERE email = ?', (finder_email,))
        finder_user = cursor.fetchone()
        finder_user_id = finder_user['id'] if finder_user else None
        
        # Get all claim attempts for this item
        cursor.execute('''
            SELECT 
                ca.attempt_id,
                ca.user_email,
                ca.attempted_at,
                ca.marked_as_potential_at,
                ca.success,
                ca.answers_json,
                u.id as user_id,
                u.full_name as user_name,
                u.phone_number
            FROM claim_attempts ca
            LEFT JOIN users u ON ca.user_email = u.email
            WHERE ca.found_item_id = ?
            ORDER BY ca.attempted_at DESC
        ''', (found_item_id,))
        
        attempts = cursor.fetchall()
        
        # Get the security questions to match with answers
        cursor.execute('''
            SELECT id, question, answer, correct_choice, choice_a, choice_b, choice_c, choice_d, question_type
            FROM security_questions
            WHERE found_item_id = ?
            ORDER BY id
        ''', (found_item_id,))
        
        questions = cursor.fetchall()
        conn.close()
        
        # Format the response
        attempts_list = []
        for attempt in attempts:
            attempt_dict = dict(attempt)
            
            # Parse the answers JSON
            import json
            if attempt_dict['answers_json']:
                try:
                    answers = json.loads(attempt_dict['answers_json'])
                    
                    # Match answers with questions
                    attempt_dict['answers_with_questions'] = []
                    for q in questions:
                        q_id = str(q['id'])
                        user_answer = answers.get(q_id, 'No answer')
                        
                        # Convert Row to dict for easier access
                        q_type = q['question_type'] if q['question_type'] else 'multiple_choice'
                        
                        # For text questions, use 'answer' field; for multiple choice, use 'correct_choice'
                        correct_ans = q['answer'] if q_type == 'text' else q['correct_choice']
                        
                        attempt_dict['answers_with_questions'].append({
                            'question': q['question'],
                            'question_type': q_type,
                            'user_answer': user_answer,
                            'correct_answer': correct_ans,
                            'is_correct': str(user_answer).upper() == str(q['correct_choice']).upper() if q_type != 'text' else False,
                            'choices': {
                                'A': q['choice_a'],
                                'B': q['choice_b'],
                                'C': q['choice_c'],
                                'D': q['choice_d']
                            }
                        })
                except json.JSONDecodeError:
                    attempt_dict['answers_with_questions'] = []
            
            # Generate conversation ID for this claimer-finder pair
            if attempt_dict['user_id'] and finder_user_id:
                # Check if conversation already exists
                temp_conn = sqlite3.connect(DB_PATH)
                temp_conn.row_factory = sqlite3.Row
                temp_cursor = temp_conn.cursor()
                
                temp_cursor.execute('''
                    SELECT secure_id FROM conversations 
                    WHERE ((user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?))
                    AND item_id = ?
                ''', (finder_user_id, attempt_dict['user_id'], attempt_dict['user_id'], finder_user_id, found_item_id))
                existing = temp_cursor.fetchone()
                
                if existing:
                    attempt_dict['conversation_id'] = existing[0]
                else:
                    # Generate new encrypted conversation ID and store it
                    import hashlib
                    import secrets
                    import time
                    
                    salt = secrets.token_hex(16)
                    timestamp = str(int(time.time() * 1000))
                    conversation_key = f"{min(finder_user_id, attempt_dict['user_id'])}_{max(finder_user_id, attempt_dict['user_id'])}_{found_item_id}"
                    combined = f"{conversation_key}_{salt}_{timestamp}"
                    
                    # Apply PBKDF2 with 100,000 iterations
                    secure_bytes = hashlib.pbkdf2_hmac('sha256', combined.encode(), salt.encode(), 100000)
                    secure_id = secure_bytes.hex()[:32]
                    
                    # Store in database
                    temp_cursor.execute('''
                        CREATE TABLE IF NOT EXISTS conversations (
                            secure_id TEXT PRIMARY KEY,
                            user_id_1 INTEGER NOT NULL,
                            user_id_2 INTEGER NOT NULL,
                            item_id INTEGER NOT NULL,
                            created_at TEXT NOT NULL
                        )
                    ''')
                    
                    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    temp_cursor.execute('''
                        INSERT INTO conversations (secure_id, user_id_1, user_id_2, item_id, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (secure_id, finder_user_id, attempt_dict['user_id'], found_item_id, current_time))
                    
                    temp_conn.commit()
                    attempt_dict['conversation_id'] = secure_id
                
                temp_conn.close()
            else:
                attempt_dict['conversation_id'] = None
            
            attempts_list.append(attempt_dict)
        
        return jsonify({
            'attempts': attempts_list,
            'total': len(attempts_list)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching claim attempts: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/my-claim-attempts', methods=['GET'])
def get_my_claim_attempts():
    """Get all claim attempts made by the current user"""
    try:
        user_email = request.args.get('user_email')
        
        if not user_email:
            return jsonify({'error': 'User email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all claim attempts by this user (LEFT JOIN to handle deleted items and successful returns)
        cursor.execute('''
            SELECT 
                ca.attempt_id,
                ca.found_item_id,
                ca.attempted_at,
                ca.success,
                ca.answers_json,
                fi.title as item_title,
                COALESCE(fi.title, sr.item_title, sr_any.item_title) as item_title_display,
                COALESCE(c.name, sr.item_category, sr_any.item_category) as category,
                COALESCE(loc.name, sr.item_location, sr_any.item_location) as location,
                COALESCE(fi.date_found, sr.date_found, sr_any.date_found) as date_found,
                fi.time_found,
                fi.status as item_status,
                fi.finder_email,
                u.id as finder_id,
                u.full_name as finder_name,
                u.phone_number as finder_phone,
                u.email as owner_email,
                sr.finalized_at,
                sr.owner_email as sr_owner_email,
                sr.owner_name,
                u_owner.phone_number as sr_owner_phone
            FROM claim_attempts ca
            LEFT JOIN found_items fi ON ca.found_item_id = fi.rowid
            LEFT JOIN categories c ON fi.category_id = c.id
            LEFT JOIN locations loc ON fi.location_id = loc.id
            LEFT JOIN users u ON fi.finder_email = u.email
            LEFT JOIN successful_returns sr ON sr.item_id = ca.found_item_id AND sr.claimer_email = ca.user_email
            LEFT JOIN users u_owner ON sr.owner_email = u_owner.email
            LEFT JOIN successful_returns sr_any ON sr_any.item_id = ca.found_item_id
            WHERE ca.user_email = ?
            ORDER BY ca.attempted_at DESC
        ''', (user_email,))
        
        attempts = cursor.fetchall()
        conn.close()
        
        # Format the response
        attempts_list = []
        for attempt in attempts:
            attempt_dict = dict(attempt)
            
            # Check if this was a successful claim (in successful_returns table)
            if attempt_dict.get('finalized_at'):
                # Calculate if contact info should still be visible (5 days from finalization)
                try:
                    finalized_dt = datetime.strptime(attempt_dict['finalized_at'], '%Y-%m-%d %H:%M:%S')
                    days_since_finalized = (datetime.now() - finalized_dt).days
                    show_contact_info = days_since_finalized < 5
                    
                    attempt_dict['claim_status'] = 'CLAIMED'
                    attempt_dict['claim_status_label'] = 'Successfully Claimed ✓'
                    attempt_dict['claim_status_color'] = 'green'
                    attempt_dict['show_contact_info'] = show_contact_info
                    attempt_dict['days_since_finalized'] = days_since_finalized
                    attempt_dict['contact_visible_days_remaining'] = max(0, 5 - days_since_finalized)
                    
                    # Use data from successful_returns if available
                    if attempt_dict['sr_owner_email']:
                        attempt_dict['finder_email'] = attempt_dict['sr_owner_email']
                        attempt_dict['finder_name'] = attempt_dict['owner_name']
                        attempt_dict['finder_phone'] = attempt_dict.get('sr_owner_phone')
                except Exception as e:
                    print(f"Error parsing finalized_at: {e}")
                    attempt_dict['show_contact_info'] = False
            # Check if item was deleted (found_items doesn't exist but successful_returns has data)
            elif attempt_dict['item_title'] is None:
                # Item was deleted and not successfully claimed by this user - means it was given to someone else
                attempt_dict['claim_status'] = 'NOT_SELECTED'
                attempt_dict['claim_status_label'] = 'Item Given to Someone Else'
                attempt_dict['claim_status_color'] = 'gray'
                # Use display title with fallback data from successful_returns
                attempt_dict['item_title'] = attempt_dict.get('item_title_display') or '[Item Finalized]'
                attempt_dict['show_contact_info'] = False
                # Fallback: Set date_found to attempted_at if still null
                if not attempt_dict.get('date_found'):
                    attempt_dict['date_found'] = attempt_dict['attempted_at'].split()[0] if attempt_dict.get('attempted_at') else datetime.now().strftime('%Y-%m-%d')
                # Fallback: Set default values if still null
                if not attempt_dict.get('category'):
                    attempt_dict['category'] = 'Unknown'
                if not attempt_dict.get('location'):
                    attempt_dict['location'] = 'Unknown'
            # Determine status for existing items
            elif attempt_dict['success'] == 1:
                # Marked as potential claimer - owner is deciding
                attempt_dict['claim_status'] = 'VERIFIED'
                attempt_dict['claim_status_label'] = 'Potential Claimer - Owner Deciding'
                attempt_dict['claim_status_color'] = 'green'
                attempt_dict['show_contact_info'] = False
            elif attempt_dict['item_status'] == 'CLAIMED':
                # Not sure about status yet
                attempt_dict['claim_status'] = 'PENDING'
                attempt_dict['claim_status_label'] = 'Answers Being Reviewed'
                attempt_dict['claim_status_color'] = 'yellow'
                attempt_dict['show_contact_info'] = False
            else:
                # Default pending status
                attempt_dict['claim_status'] = 'PENDING'
                attempt_dict['claim_status_label'] = 'Answers Being Reviewed'
                attempt_dict['claim_status_color'] = 'yellow'
                attempt_dict['show_contact_info'] = False
            
            attempts_list.append(attempt_dict)
        
        return jsonify({
            'attempts': attempts_list,
            'total': len(attempts_list)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching user claim attempts: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/submit-claim-answers', methods=['POST'])
def submit_claim_answers():
    """Submit claim answers WITHOUT validation - answers sent to finder for review"""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        found_item_id = data.get('found_item_id')
        user_answers = data.get('answers', {})
        claimer_user_id = data.get('claimer_user_id')
        claimer_name = data.get('claimer_name', 'Unknown')
        claimer_email = data.get('claimer_email', '')
        claimer_phone = data.get('claimer_phone', '')
        
        if not found_item_id:
            return jsonify({'error': 'Found item ID required'}), 400
        
        # If email is "anonymous" or empty, generate encrypted anonymous identifier
        if not claimer_email or claimer_email.lower() == 'anonymous':
            import hashlib
            import secrets
            import time
            
            # Generate unique encrypted ID for anonymous claimer
            salt = secrets.token_hex(16)
            timestamp = str(int(time.time() * 1000))
            random_data = secrets.token_hex(8)
            combined = f"anonymous_claim_{found_item_id}_{timestamp}_{random_data}_{salt}"
            
            # Create encrypted email-like identifier
            encrypted_bytes = hashlib.pbkdf2_hmac('sha256', combined.encode(), salt.encode(), 100000)
            encrypted_id = f"anon_{encrypted_bytes.hex()[:24]}@encrypted.local"
            claimer_email = encrypted_id
        
        # Get item details first to check ownership
        item_check = conn.execute('''
            SELECT finder_email FROM found_items WHERE rowid = ?
        ''', (found_item_id,)).fetchone()
        
        if not item_check:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        # PREVENT USERS FROM CLAIMING THEIR OWN ITEMS
        if item_check['finder_email'] and item_check['finder_email'].lower() == claimer_email.lower():
            conn.close()
            return jsonify({
                'error': 'You cannot claim your own found item.',
                'self_claim_attempt': True
            }), 403
        
        # CHECK IF USER HAS ALREADY ATTEMPTED
        existing_attempt = conn.execute('''
            SELECT attempt_id, attempted_at
            FROM claim_attempts 
            WHERE found_item_id = ? AND user_email = ?
        ''', (found_item_id, claimer_email)).fetchone()
        
        if existing_attempt:
            conn.close()
            return jsonify({
                'error': 'You have already submitted answers for this item. Each user can only answer once per item.',
                'attempted_at': existing_attempt['attempted_at'],
                'already_attempted': True
            }), 403
        
        # Get item details and finder info
        item_details = conn.execute('''
            SELECT f.rowid as id, f.*, u.id as finder_user_id, u.email as finder_email, u.full_name as finder_name
            FROM found_items f
            LEFT JOIN users u ON f.finder_email = u.email
            WHERE f.rowid = ?
        ''', (found_item_id,)).fetchone()
        
        if not item_details:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        # Check if item is still accepting claims (3 days from claimed_date)
        if item_details['claimed_date']:
            try:
                claimed_date = datetime.strptime(item_details['claimed_date'], '%Y-%m-%d %H:%M:%S')
                days_since_claimed = (datetime.now() - claimed_date).days
                if days_since_claimed >= 3:
                    conn.close()
                    return jsonify({
                        'error': 'This item is no longer accepting claim attempts. The 3-day claim period has expired.',
                        'claim_period_expired': True
                    }), 403
            except:
                pass  # If date parsing fails, allow the claim
        
        # Store answers WITHOUT validation
        import json
        answers_json = json.dumps(user_answers)
        
        # Get user_id from email
        user_record = conn.execute('SELECT id FROM users WHERE email = ?', (claimer_email,)).fetchone()
        claimer_user_id = user_record['id'] if user_record else None
        
        # Use local ET time for attempted_at
        attempted_at_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        conn.execute('''
            INSERT INTO claim_attempts 
            (found_item_id, user_id, user_email, answers_json, attempted_at, success)
            VALUES (?, ?, ?, ?, ?, 0)
        ''', (found_item_id, claimer_user_id, claimer_email, answers_json, attempted_at_str))
        
        attempt_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        
        # Create notification for finder (keep claimer anonymous)
        notification_message = f"An anonymous user has submitted answers to claim your found item: {item_details['title']}. Review their answers in your dashboard."
        
        # Use local ET time for notification created_at
        notification_time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        conn.execute('''
            INSERT OR REPLACE INTO notifications 
            (user_email, notification_type, item_id, item_type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        ''', (
            item_details['finder_email'],
            'CLAIM_SUBMITTED',
            found_item_id,
            'found',
            f"Claim submitted for {item_details['title']}",
            notification_message,
            notification_time_str
        ))
        
        conn.commit()
        
        # Send email notification to finder
        try:
            from email_verification_service import send_email
            
            finder_name = item_details['finder_name'] or 'Finder'
            finder_email = item_details['finder_email']
            item_title = item_details['title']
            
            if finder_email:
                subject = f"Someone Answered Your Verification Questions - TraceBack"
                body = f"""Hello {finder_name},

Good news! Someone has answered the verification questions for your found item.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOUND ITEM: {item_title}

An anonymous claimer has submitted answers to your verification questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:

1. Log in to TraceBack and go to your Dashboard
2. Navigate to "Found Items" section
3. Review the claimer's answers to your verification questions
4. Accept if the answers are correct, or reject if they don't match

Note: Claimer identity remains anonymous until you accept their claim.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
"""
                
                send_email(finder_email, subject, body)
                print(f"   [EMAIL] Notification sent to finder: {finder_email}")
        
        except Exception as email_error:
            print(f"   [WARNING] Could not send email notification: {email_error}")
        
        conn.close()
        
        print(f"Claim answers submitted: Attempt ID {attempt_id}")
        print(f"   Claimer: {claimer_name} ({claimer_email})")
        print(f"   Item: {item_details['title']} (ID: {found_item_id})")
        print(f"   Finder notified: {item_details['finder_email']}")
        
        return jsonify({
            'success': True,
            'message': 'Your answers have been submitted successfully and sent to the finder for review.',
            'attempt_id': attempt_id,
            'finder_email': item_details['finder_email']
        }), 200
        
    except Exception as e:
        print(f"❌ Error submitting claim answers: {e}")
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/update-claim-attempt', methods=['POST'])
def update_claim_attempt():
    """Update claim attempt status (mark as successful/verified by finder)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        found_item_id = data.get('found_item_id')
        user_email = data.get('user_email')
        success = data.get('success', False)
        
        if not found_item_id or not user_email:
            return jsonify({'error': 'Found item ID and user email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Update the claim attempt
        # If marking as successful, store the timestamp in ET
        if success:
            marked_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute('''
                UPDATE claim_attempts 
                SET success = ?, marked_as_potential_at = ?
                WHERE found_item_id = ? AND user_email = ?
            ''', (1, marked_time, found_item_id, user_email))
        else:
            cursor.execute('''
                UPDATE claim_attempts 
                SET success = ?, marked_as_potential_at = NULL
                WHERE found_item_id = ? AND user_email = ?
            ''', (0, found_item_id, user_email))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Claim attempt not found'}), 404
        
        # If marking as successful (potential claimer), DO NOT mark item as CLAIMED yet
        # Just create notification for potential claimer
        if success:
            # Create notification for potential claimer
            cursor.execute('''
                SELECT f.title, f.finder_email, u.full_name as finder_name
                FROM found_items f
                LEFT JOIN users u ON f.finder_email = u.email
                WHERE f.rowid = ?
            ''', (found_item_id,))
            
            item = cursor.fetchone()
            if item:
                notification_msg = f"Good news! You have been identified as a potential claimer for '{item['title']}'. The item will remain open for 3 days. The owner will contact you if they need more information or when the item is ready for pickup."
                notification_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                cursor.execute('''
                    INSERT OR REPLACE INTO notifications 
                    (user_email, notification_type, item_id, item_type, title, message, is_read, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
                ''', (user_email, 'POTENTIAL_CLAIMER', found_item_id, 'found', f"Potential claimer for {item['title']}", notification_msg, notification_time))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Claim attempt updated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating claim attempt: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/finalize-claim', methods=['POST'])
def finalize_claim():
    """
    Finalize a claim and mark item as CLAIMED (after 3-day waiting period)
    This will:
    1. Store the successful return information permanently in successful_returns table
    2. Delete the found post
    3. Record successful return for owner and successful claim for claimer
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
        
        found_item_id = data.get('found_item_id')
        user_email = data.get('user_email')
        claim_reason = data.get('claim_reason')  # Why giving item to this person
        owner_email = data.get('owner_email')  # Email of the owner who is finalizing
        
        if not found_item_id or not user_email or not claim_reason or not owner_email:
            return jsonify({'error': 'Found item ID, user email, owner email, and claim reason required'}), 400
        
        if len(claim_reason.strip()) < 10:
            return jsonify({'error': 'Please provide a detailed reason (at least 10 characters)'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get full item details and claim attempt details
        cursor.execute('''
            SELECT 
                fi.*,
                cat.name as category_name,
                loc.name as location_name,
                ca.answers_json,
                ca.attempted_at,
                ca.marked_as_potential_at,
                u_owner.full_name as owner_name,
                u_claimer.full_name as claimer_name
            FROM found_items fi
            JOIN claim_attempts ca ON ca.found_item_id = fi.rowid
            LEFT JOIN categories cat ON cat.id = fi.category_id
            LEFT JOIN locations loc ON loc.id = fi.location_id
            LEFT JOIN users u_owner ON u_owner.email = ?
            LEFT JOIN users u_claimer ON u_claimer.email = ca.user_email
            WHERE fi.rowid = ? AND ca.user_email = ?
        ''', (owner_email, found_item_id, user_email))
        
        item_data = cursor.fetchone()
        
        if not item_data:
            conn.close()
            return jsonify({'error': 'Item or claim attempt not found'}), 404
        
        # Verify ownership
        if item_data['finder_email'] != owner_email:
            conn.close()
            return jsonify({'error': 'Only the owner can finalize claims'}), 403
        
        if item_data['status'] == 'CLAIMED':
            conn.close()
            return jsonify({'error': 'Item is already claimed'}), 400
        
        # Check if user is marked as potential claimer
        cursor.execute('''
            SELECT success FROM claim_attempts 
            WHERE found_item_id = ? AND user_email = ?
        ''', (found_item_id, user_email))
        
        attempt = cursor.fetchone()
        if not attempt or attempt['success'] != 1:
            conn.close()
            return jsonify({'error': 'User must be marked as potential claimer first'}), 400
        
        # Check if 3 days have passed since they were marked as potential claimer
        from datetime import datetime, timedelta
        
        # Get the marked_as_potential_at timestamp (stored in local ET time)
        try:
            # Database stores local ET time, use local time for comparison
            if item_data['marked_as_potential_at']:
                marked_at = datetime.strptime(item_data['marked_as_potential_at'], '%Y-%m-%d %H:%M:%S')
            else:
                # Fallback to attempted_at if marked_as_potential_at is not set (for old records)
                marked_at = datetime.strptime(item_data['attempted_at'], '%Y-%m-%d %H:%M:%S')
            
            current_time = datetime.now()
            seconds_since_marked = (current_time - marked_at).total_seconds()
            days_since_marked = seconds_since_marked / 86400
        except Exception as e:
            # Fallback to created_at if parsing fails
            try:
                marked_at = datetime.strptime(item_data['created_at'], '%Y-%m-%d %H:%M:%S')
                current_time = datetime.now()
                seconds_since_marked = (current_time - marked_at).total_seconds()
                days_since_marked = seconds_since_marked / 86400
            except:
                seconds_since_marked = 0
                days_since_marked = 0
        
        # Require 3 days to have passed before finalizing
        if days_since_marked < 3:
            conn.close()
            days_remaining = 3 - days_since_marked
            return jsonify({
                'error': f'You must wait 3 days before finalizing. {days_remaining:.1f} days remaining.',
                'days_remaining': days_remaining
            }), 400
        
        # For reference, log how long it's been since marking as potential claimer
        days_waited = days_since_marked
        
        # For storing in the database, calculate days for historical accuracy
        date_found = datetime.strptime(item_data['date_found'], '%Y-%m-%d')
        days_since_found = (datetime.now() - date_found).days
        
        # Generate unique 6-digit verification code
        import random
        verification_code = str(random.randint(100000, 999999))
        
        # Store successful return information permanently
        cursor.execute('''
            INSERT INTO successful_returns (
                item_id,
                item_title,
                item_description,
                item_category,
                item_location,
                date_found,
                owner_email,
                owner_name,
                claimer_email,
                claimer_name,
                claim_reason,
                finalized_date,
                answers_provided,
                days_to_finalize,
                verification_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), ?, ?, ?)
        ''', (
            found_item_id,
            item_data['title'],
            item_data['description'],
            item_data['category_name'] or 'Unknown',
            item_data['location_name'] or 'Unknown',
            item_data['date_found'],
            owner_email,
            item_data['owner_name'] or 'Unknown',
            user_email,
            item_data['claimer_name'] or 'Unknown',
            claim_reason.strip(),
            item_data['answers_json'],
            days_since_found,
            verification_code
        ))
        
        return_id = cursor.lastrowid
        
        # Delete the found item post
        cursor.execute('DELETE FROM found_items WHERE rowid = ?', (found_item_id,))
        
        # Create notification for final claimer - successful claim
        notification_msg = f"🎉 Congratulations! Your claim for '{item_data['title']}' has been finalized. The owner has chosen to give you this item. You can view this in your successful claims history."
        notification_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO notifications 
            (user_email, notification_type, item_id, item_type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        ''', (user_email, 'CLAIM_FINALIZED', found_item_id, 'found', f"Successful Claim: {item_data['title']}", notification_msg, notification_time))
        
        # Create notification for owner - successful return
        owner_notification = f"✅ You have successfully returned '{item_data['title']}' to {item_data['claimer_name'] or user_email}. This information has been recorded permanently. Thank you for using TrackeBack!"
        
        cursor.execute('''
            INSERT INTO notifications 
            (user_email, notification_type, item_id, item_type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        ''', (owner_email, 'RETURN_COMPLETED', found_item_id, 'found', f"Successful Return: {item_data['title']}", owner_notification, notification_time))
        
        # Get conversation ID for this finder-claimer pair
        cursor.execute('''
            SELECT u1.id as finder_id, u2.id as claimer_id, u1.phone_number as finder_phone, u2.phone_number as claimer_phone
            FROM users u1, users u2
            WHERE u1.email = ? AND u2.email = ?
        ''', (owner_email, user_email))
        
        user_ids = cursor.fetchone()
        conversation_id = None
        
        if user_ids:
            # Check if conversation exists
            cursor.execute('''
                SELECT secure_id FROM conversations 
                WHERE ((user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?))
                AND item_id = ?
            ''', (user_ids['finder_id'], user_ids['claimer_id'], user_ids['claimer_id'], user_ids['finder_id'], found_item_id))
            
            conv = cursor.fetchone()
            if conv:
                conversation_id = conv['secure_id']
        
        conn.commit()
        conn.close()
        
        # Send email notifications to both finder and claimer
        try:
            from email_verification_service import send_email
            
            # Email to Finder (Owner)
            finder_subject = f"✅ Item Successfully Returned - {item_data['title']}"
            finder_body = f"""Hello {item_data['owner_name'] or 'Finder'},

Congratulations! You have successfully returned the item to its rightful owner.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEM DETAILS:
Title: {item_data['title']}
Category: {item_data['category_name'] or 'Unknown'}
Location Found: {item_data['location_name'] or 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAIMER CONTACT INFORMATION:
Name: {item_data['claimer_name'] or 'Unknown'}
Email: {user_email}
Phone: {user_ids['claimer_phone'] if user_ids and user_ids['claimer_phone'] else 'Not provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECURE VERIFICATION:
Conversation ID: {conversation_id or 'N/A'}
6-Digit Security Code: {verification_code}

Share this security code with the claimer to verify the exchange.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This successful return has been permanently recorded in our system.
Thank you for being a responsible member of the TraceBack community!

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
"""
            
            # Email to Claimer (Successful claimer)
            claimer_subject = f"🎉 Your Claim Was Successful - {item_data['title']}"
            claimer_body = f"""Hello {item_data['claimer_name'] or 'Claimer'},

Great news! Your claim has been finalized and the finder has chosen to give you this item.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEM DETAILS:
Title: {item_data['title']}
Category: {item_data['category_name'] or 'Unknown'}
Location Found: {item_data['location_name'] or 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FINDER CONTACT INFORMATION:
Name: {item_data['owner_name'] or 'Unknown'}
Email: {owner_email}
Phone: {user_ids['finder_phone'] if user_ids and user_ids['finder_phone'] else 'Not provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECURE VERIFICATION:
Conversation ID: {conversation_id or 'N/A'}
6-Digit Security Code: {verification_code}

Please verify this security code with the finder when picking up your item.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please coordinate with the finder to arrange item pickup.
This successful claim has been permanently recorded in our system.

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
"""
            
            # Send emails
            if owner_email:
                send_email(owner_email, finder_subject, finder_body)
                print(f"   [EMAIL] Finalization notification sent to finder: {owner_email}")
            
            if user_email:
                send_email(user_email, claimer_subject, claimer_body)
                print(f"   [EMAIL] Finalization notification sent to claimer: {user_email}")
            
            # Send emails to all unsuccessful claimers
            cursor = sqlite3.connect(DB_PATH).cursor()
            cursor.execute('''
                SELECT DISTINCT ca.user_email, u.full_name
                FROM claim_attempts ca
                LEFT JOIN users u ON u.email = ca.user_email
                WHERE ca.found_item_id = ? AND ca.user_email != ?
            ''', (found_item_id, user_email))
            
            unsuccessful_claimers = cursor.fetchall()
            cursor.close()
            
            for claimer in unsuccessful_claimers:
                unsuccessful_email = claimer[0]
                unsuccessful_name = claimer[1] or 'Claimer'
                
                # Skip encrypted anonymous emails
                if unsuccessful_email and not unsuccessful_email.startswith('anon_'):
                    unsuccessful_subject = f"Update: Item Claimed by Another User - {item_data['title']}"
                    unsuccessful_body = f"""Hello {unsuccessful_name},

Thank you for your interest in claiming the item posted on TraceBack.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEM DETAILS:
Title: {item_data['title']}
Category: {item_data['category_name'] or 'Unknown'}
Location Found: {item_data['location_name'] or 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLAIM STATUS: Item Given to Another Claimer

Unfortunately, the finder has chosen to give this item to another claimer who successfully verified ownership. The item has been returned and the post has been removed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We appreciate your participation and encourage you to continue checking TraceBack for other lost items.

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
"""
                    
                    try:
                        send_email(unsuccessful_email, unsuccessful_subject, unsuccessful_body)
                        print(f"   [EMAIL] Unsuccessful claim notification sent to: {unsuccessful_email}")
                    except Exception as e:
                        print(f"   [WARNING] Could not send email to {unsuccessful_email}: {e}")
        
        except Exception as email_error:
            print(f"   [WARNING] Could not send finalization email notifications: {email_error}")
        
        return jsonify({
            'success': True,
            'message': 'Claim finalized successfully. Item returned and post deleted.',
            'return_id': return_id,
            'verification_code': verification_code,
            'conversation_id': conversation_id
        }), 200
        
    except Exception as e:
        print(f"❌ Error finalizing claim: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/claimed-items', methods=['GET'])
def get_claimed_items():
    """
    Get items with potential claimers (3-day response period)
    Shows items that have at least one verified claim attempt (success=1)
    After 3 days: No more responses accepted, item stays until owner finalizes claim
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get items that have potential claimers (success=1)
        # Shows all items with potential claimers regardless of time
        # Time check is used only for accepting new responses (done in claim attempt endpoint)
        cursor.execute("""
            SELECT 
                f.id as claim_id,
                f.id as item_id,
                'found' as item_type,
                f.title as item_title,
                MIN(ca.marked_as_potential_at) as claimed_date,
                COUNT(DISTINCT ca.user_email) as claimer_count,
                f.category_id,
                c.name as category_name,
                f.date_found,
                f.time_found,
                f.location_id,
                loc.name as location_name,
                f.description,
                f.color,
                f.size,
                f.finder_email,
                f.status,
                f.created_at
            FROM found_items f
            INNER JOIN claim_attempts ca ON f.id = ca.found_item_id AND ca.success = 1
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE COALESCE(f.status, '') != 'CLAIMED'
            GROUP BY f.id
            ORDER BY MIN(ca.marked_as_potential_at) DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        claimed_items = []
        for row in rows:
            item = dict(row)
            # Format date and calculate time remaining for 3-day response period
            if item.get('claimed_date'):
                try:
                    claimed_dt = datetime.strptime(item['claimed_date'], '%Y-%m-%d %H:%M:%S')
                    item['claimed_date_formatted'] = claimed_dt.strftime('%m/%d/%Y at %I:%M %p')
                    
                    # Calculate time remaining (3 days from first potential claimer marked)
                    attempted_at = datetime.strptime(item['claimed_date'], '%Y-%m-%d %H:%M:%S')
                    deadline = attempted_at + timedelta(days=3)
                    time_remaining = deadline - datetime.now()
                    
                    if time_remaining.total_seconds() > 0:
                        # Calculate days, hours, minutes, seconds
                        total_seconds = int(time_remaining.total_seconds())
                        days = total_seconds // 86400
                        hours = (total_seconds % 86400) // 3600
                        minutes = (total_seconds % 3600) // 60
                        seconds = total_seconds % 60
                        
                        # Format time remaining
                        time_parts = []
                        if days > 0:
                            time_parts.append(f"{days}d")
                        if hours > 0 or days > 0:
                            time_parts.append(f"{hours}h")
                        if minutes > 0 or hours > 0 or days > 0:
                            time_parts.append(f"{minutes}m")
                        time_parts.append(f"{seconds}s")
                        
                        item['time_remaining'] = " ".join(time_parts)
                        item['time_remaining_seconds'] = total_seconds
                        item['is_accepting_responses'] = True
                    else:
                        item['time_remaining'] = "Response period closed"
                        item['time_remaining_seconds'] = 0
                        item['is_accepting_responses'] = False
                except Exception as e:
                    print(f"Error parsing dates: {e}")
                    pass
            
            claimed_items.append(item)
        
        print(f"✅ Retrieved {len(claimed_items)} items with potential claimers")
        return jsonify({
            'claimed_items': claimed_items,
            'total': len(claimed_items)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching claimed items: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/claims/<int:claim_id>', methods=['PUT'])
def update_claim(claim_id):
    """Update a claim status"""
    try:
        data = request.get_json()
        new_status = data.get('claimed_status', 'PENDING')
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get the item_id for this claim
        cursor.execute("SELECT item_id, item_type FROM ownership_claims WHERE claim_id = ?", (claim_id,))
        claim_info = cursor.fetchone()
        
        if not claim_info:
            conn.close()
            return jsonify({'error': 'Claim not found'}), 404
        
        item_id, item_type = claim_info
        
        # Update claim status
        cursor.execute("""
            UPDATE ownership_claims 
            SET claimed_status = ?,
                claimed_date = CASE WHEN ? = 'CLAIMED' THEN CURRENT_TIMESTAMP ELSE claimed_date END,
                notes = ?
            WHERE claim_id = ?
        """, (
            new_status,
            new_status,
            data.get('notes', ''),
            claim_id
        ))
        
        # If marking as CLAIMED, update the item's is_claimed field
        if new_status == 'CLAIMED' and item_type == 'FOUND':
            cursor.execute("""
                UPDATE found_items 
                SET is_claimed = 1
                WHERE rowid = ?
            """, (item_id,))
            print(f"✅ Marked found_item {item_id} as claimed")
        
        conn.commit()
        conn.close()
        
        print(f"✅ Claim {claim_id} updated to {new_status}")
        return jsonify({
            'success': True,
            'message': 'Claim updated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating claim: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports', methods=['POST'])
def create_abuse_report():
    """Create a new abuse report"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'target_id', 'category', 'reason']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get current user info (should come from session/auth in production)
        reported_by_id = data.get('reported_by_id')
        reported_by_name = data.get('reported_by_name', 'Anonymous')
        reported_by_email = data.get('reported_by_email')
        
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Fetch target item details to store owner info
        target_type = data['type'].upper()
        target_id = data['target_id']
        
        # Check if user has already reported this item
        if reported_by_email:
            cursor.execute("""
                SELECT report_id FROM abuse_reports 
                WHERE target_id = ? 
                AND type = ? 
                AND reported_by_email = ?
            """, (target_id, target_type, reported_by_email))
            
            existing_report = cursor.fetchone()
            if existing_report:
                conn.close()
                return jsonify({
                    'error': 'You have already reported this item. Our moderation team will review your previous report.'
                }), 400
        target_user_name = None
        target_user_email = None
        target_user_phone = None
        target_item_type = None
        target_item_title = None
        target_item_description = None
        target_item_category = None
        target_item_location = None
        target_item_date = None
        
        if target_type in ['ITEM', 'FOUND']:
            cursor.execute("""
                SELECT 
                    fi.finder_name, fi.finder_email, u.phone_number, 'FOUND' as item_type,
                    fi.title, fi.description, c.name as category, l.name as location, fi.date_found
                FROM found_items fi
                LEFT JOIN users u ON fi.finder_email = u.email
                LEFT JOIN categories c ON fi.category_id = c.id
                LEFT JOIN locations l ON fi.location_id = l.id
                WHERE fi.id = ?
            """, (target_id,))
            result = cursor.fetchone()
            if result:
                target_user_name = result['finder_name']
                target_user_email = result['finder_email']
                target_user_phone = result['phone_number']
                target_item_type = 'FOUND'
                target_item_title = result['title']
                target_item_description = result['description']
                target_item_category = result['category']
                target_item_location = result['location']
                target_item_date = result['date_found']
        
        if not target_user_email and target_type in ['ITEM', 'LOST']:
            cursor.execute("""
                SELECT 
                    li.user_name, li.user_email, u.phone_number, 'LOST' as item_type,
                    li.title, li.description, c.name as category, l.name as location, li.date_lost
                FROM lost_items li
                LEFT JOIN users u ON li.user_email = u.email
                LEFT JOIN categories c ON li.category_id = c.id
                LEFT JOIN locations l ON li.location_id = l.id
                WHERE li.id = ?
            """, (target_id,))
            result = cursor.fetchone()
            if result:
                target_user_name = result['user_name']
                target_user_email = result['user_email']
                target_user_phone = result['phone_number']
                target_item_type = 'LOST'
                target_item_title = result['title']
                target_item_description = result['description']
                target_item_category = result['category']
                target_item_location = result['location']
                target_item_date = result['date_lost']
        
        # Insert report with target user info and item details
        cursor.execute("""
            INSERT INTO abuse_reports (
                type, target_id, target_title, 
                reported_by_id, reported_by_name, reported_by_email,
                category, reason, description, status, priority,
                target_user_name, target_user_email, target_user_phone, target_item_type,
                target_item_title, target_item_description, target_item_category, 
                target_item_location, target_item_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'MEDIUM', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            target_type,
            target_id,
            data.get('target_title', 'Unknown'),
            reported_by_id,
            reported_by_name,
            reported_by_email,
            data['category'],
            data['reason'],
            data.get('description', ''),
            target_user_name,
            target_user_email,
            target_user_phone,
            target_item_type,
            target_item_title,
            target_item_description,
            target_item_category,
            target_item_location,
            target_item_date
        ))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Report {report_id} created successfully")
        return jsonify({
            'success': True,
            'report_id': report_id,
            'message': 'Report submitted successfully'
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating report: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports', methods=['GET'])
def get_abuse_reports():
    """Get all abuse reports with full details (admin only)"""
    try:
        # Get query parameters
        status = request.args.get('status')
        admin_email = request.args.get('admin_email')
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build query with joins to get full details
        # Use stored target user info as fallback when item is deleted
        query = """
            SELECT 
                ar.*,
                COALESCE(
                    ar.target_item_type,
                    CASE 
                        WHEN fi.id IS NOT NULL THEN 'FOUND'
                        WHEN li.id IS NOT NULL THEN 'LOST'
                        ELSE ar.type
                    END
                ) as item_type,
                u_reporter.full_name as reporter_full_name,
                u_reporter.email as reporter_email,
                u_reporter.phone_number as reporter_phone,
                COALESCE(fi.title, ar.target_item_title) as found_item_title,
                COALESCE(fi.description, ar.target_item_description) as found_item_description,
                COALESCE(fc.name, ar.target_item_category) as found_category,
                COALESCE(fl.name, ar.target_item_location) as found_location,
                COALESCE(fi.date_found, ar.target_item_date) as found_date,
                COALESCE(u_found_owner.full_name, fi.finder_name, ar.target_user_name) as found_owner_name,
                COALESCE(u_found_owner.email, fi.finder_email, ar.target_user_email) as found_owner_email,
                COALESCE(u_found_owner.phone_number, ar.target_user_phone) as found_owner_phone,
                COALESCE(li.title, ar.target_item_title) as lost_item_title,
                COALESCE(li.description, ar.target_item_description) as lost_item_description,
                COALESCE(lc.name, ar.target_item_category) as lost_category,
                COALESCE(ll.name, ar.target_item_location) as lost_location,
                COALESCE(li.date_lost, ar.target_item_date) as lost_date,
                COALESCE(u_lost_owner.full_name, li.user_name, ar.target_user_name) as lost_owner_name,
                COALESCE(u_lost_owner.email, li.user_email, ar.target_user_email) as lost_owner_email,
                COALESCE(u_lost_owner.phone_number, ar.target_user_phone) as lost_owner_phone
            FROM abuse_reports ar
            LEFT JOIN users u_reporter ON ar.reported_by_id = u_reporter.id
            LEFT JOIN found_items fi ON ar.target_id = fi.id AND ar.type IN ('ITEM', 'FOUND')
            LEFT JOIN categories fc ON fi.category_id = fc.id
            LEFT JOIN locations fl ON fi.location_id = fl.id
            LEFT JOIN users u_found_owner ON fi.finder_email = u_found_owner.email
            LEFT JOIN lost_items li ON ar.target_id = li.id AND ar.type IN ('ITEM', 'LOST')
            LEFT JOIN categories lc ON li.category_id = lc.id
            LEFT JOIN locations ll ON li.location_id = ll.id
            LEFT JOIN users u_lost_owner ON li.user_email = u_lost_owner.email
        """
        
        params = []
        if status:
            query += " WHERE ar.status = ?"
            params.append(status.upper())
        
        query += " ORDER BY ar.created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        reports = []
        for row in rows:
            report = dict(row)
            reports.append(report)
        
        print(f"✅ Retrieved {len(reports)} abuse reports with full details")
        return jsonify({'reports': reports}), 200
        
    except Exception as e:
        print(f"❌ Error fetching reports: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports/<int:report_id>', methods=['PUT'])
def update_abuse_report(report_id):
    """Update an abuse report (admin only)"""
    try:
        data = request.get_json()
        admin_email = data.get('admin_email')
        
        # Check admin access
        if not is_admin(admin_email):
            return jsonify({'error': 'Unauthorized. Admin access required.'}), 403
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Update report
        cursor.execute("""
            UPDATE abuse_reports 
            SET status = ?, 
                moderator_notes = ?,
                moderator_action = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE report_id = ?
        """, (
            data.get('status', 'REVIEWED'),
            data.get('moderator_notes', ''),
            data.get('moderator_action', ''),
            report_id
        ))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Report {report_id} updated successfully")
        return jsonify({
            'success': True,
            'message': 'Report updated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating report: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports/<int:report_id>/delete-content', methods=['DELETE'])
def delete_reported_content(report_id):
    """Delete the content that was reported (admin only)"""
    try:
        data = request.get_json()
        admin_email = data.get('admin_email')
        
        # Check admin access
        if not is_admin(admin_email):
            return jsonify({'error': 'Unauthorized. Admin access required.'}), 403
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get report details
        cursor.execute("SELECT * FROM abuse_reports WHERE report_id = ?", (report_id,))
        report = cursor.fetchone()
        
        if not report:
            conn.close()
            return jsonify({'error': 'Report not found'}), 404
        
        report_dict = dict(report)
        target_type = report_dict['type']
        target_id = report_dict['target_id']
        
        # Delete the reported content
        if target_type == 'ITEM':
            # Try to delete from both tables (lost and found)
            cursor.execute("DELETE FROM lost_items WHERE rowid = ?", (target_id,))
            deleted_lost = cursor.rowcount
            
            cursor.execute("DELETE FROM found_items WHERE rowid = ?", (target_id,))
            deleted_found = cursor.rowcount
            
            if deleted_lost == 0 and deleted_found == 0:
                conn.close()
                return jsonify({'error': 'Item not found'}), 404
            
            print(f"✅ Deleted item {target_id} (lost: {deleted_lost}, found: {deleted_found})")
            
        elif target_type == 'USER':
            cursor.execute("DELETE FROM users WHERE rowid = ?", (target_id,))
            if cursor.rowcount == 0:
                conn.close()
                return jsonify({'error': 'User not found'}), 404
            print(f"✅ Deleted user {target_id}")
        
        # Update report status
        cursor.execute("""
            UPDATE abuse_reports 
            SET status = 'RESOLVED',
                moderator_action = 'remove_content',
                moderator_notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE report_id = ?
        """, (
            data.get('moderator_notes', 'Content removed by admin'),
            report_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{target_type} deleted successfully',
            'deleted_type': target_type,
            'deleted_id': target_id
        }), 200
        
    except Exception as e:
        print(f"❌ Error deleting content: {e}")
        return jsonify({'error': str(e)}), 500


# MESSAGING ENDPOINTS
@app.route('/api/messages/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get unique conversations with last message
        cursor.execute('''
            SELECT 
                m1.conversation_id,
                m1.item_id,
                m1.item_type,
                m1.item_title,
                CASE 
                    WHEN m1.sender_id = ? THEN m1.receiver_id
                    ELSE m1.sender_id
                END as other_user_id,
                CASE 
                    WHEN m1.sender_id = ? THEN 
                        CASE WHEN m1.receiver_id = -1 THEN '[Deleted User]' ELSE m1.receiver_name END
                    ELSE 
                        CASE WHEN m1.sender_id = -1 THEN '[Deleted User]' ELSE m1.sender_name END
                END as other_user_name,
                CASE 
                    WHEN m1.sender_id = ? THEN 
                        CASE WHEN m1.receiver_id = -1 THEN 'deleted@traceback.local' ELSE m1.receiver_email END
                    ELSE 
                        CASE WHEN m1.sender_id = -1 THEN 'deleted@traceback.local' ELSE m1.sender_email END
                END as other_user_email,
                m1.message_text as last_message,
                m1.created_at as last_message_time,
                SUM(CASE WHEN m1.receiver_id = ? AND m1.is_read = 0 THEN 1 ELSE 0 END) as unread_count
            FROM messages m1
            INNER JOIN (
                SELECT conversation_id, MAX(created_at) as max_time
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY conversation_id
            ) m2 ON m1.conversation_id = m2.conversation_id AND m1.created_at = m2.max_time
            WHERE m1.sender_id = ? OR m1.receiver_id = ?
            GROUP BY m1.conversation_id
            ORDER BY m1.created_at DESC
        ''', (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
        
        conversations = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'conversations': conversations}), 200
        
    except Exception as e:
        print(f"❌ Error fetching conversations: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get messages for a conversation"""
    try:
        conversation_id = request.args.get('conversation_id')
        requesting_user_id = request.args.get('user_id')  # Add user ID for validation
        
        if not conversation_id:
            return jsonify({'error': 'Conversation ID required'}), 400
        
        if not requesting_user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Create database connection first
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Validate user is part of this conversation using secure ID
        cursor.execute('''
            SELECT user_id_1, user_id_2 FROM conversations WHERE secure_id = ?
        ''', (conversation_id,))
        conv = cursor.fetchone()
        
        if not conv:
            conn.close()
            return jsonify({'error': 'Conversation not found'}), 404
        
        allowed_user_ids = [conv['user_id_1'], conv['user_id_2']]
        if int(requesting_user_id) not in allowed_user_ids:
            conn.close()
            return jsonify({'error': 'Unauthorized: You are not part of this conversation'}), 403
        
        cursor.execute('''
            SELECT 
                message_id,
                conversation_id,
                sender_id,
                receiver_id,
                CASE WHEN sender_id = -1 THEN '[Deleted User]' ELSE sender_name END as sender_name,
                CASE WHEN receiver_id = -1 THEN '[Deleted User]' ELSE receiver_name END as receiver_name,
                CASE WHEN sender_id = -1 THEN 'deleted@traceback.local' ELSE sender_email END as sender_email,
                CASE WHEN receiver_id = -1 THEN 'deleted@traceback.local' ELSE receiver_email END as receiver_email,
                message_text,
                is_read,
                created_at,
                item_id,
                item_type,
                item_title
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
        ''', (conversation_id,))
        
        messages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({'messages': messages}), 200
        
    except Exception as e:
        print(f"❌ Error fetching messages: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/create-conversation', methods=['POST'])
def create_conversation():
    """Create a secure conversation ID"""
    try:
        data = request.get_json()
        user_id_1 = data.get('user_id_1')
        user_id_2 = data.get('user_id_2')
        item_id = data.get('item_id')
        requester_id = data.get('requester_id')
        
        # Validate requester is one of the participants
        if requester_id not in [user_id_1, user_id_2]:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Create a much stronger secure ID using multiple hash layers with salt
        import hashlib
        import secrets
        import time
        
        # Use timestamp and random salt for additional entropy
        conversation_key = f"{user_id_1}_{user_id_2}_{item_id}"
        
        # Check if conversation already exists
        conn_check = sqlite3.connect(DB_PATH)
        cursor_check = conn_check.cursor()
        cursor_check.execute('''
            SELECT secure_id FROM conversations 
            WHERE user_id_1 = ? AND user_id_2 = ? AND item_id = ?
        ''', (user_id_1, user_id_2, item_id))
        existing = cursor_check.fetchone()
        conn_check.close()
        
        if existing:
            # Return existing secure ID
            secure_id = existing[0]
        else:
            # Generate new strong secure ID
            # Use PBKDF2 with random salt for cryptographic strength
            salt = secrets.token_hex(16)
            timestamp = str(int(time.time() * 1000))
            combined = f"{conversation_key}_{salt}_{timestamp}"
            
            # Apply PBKDF2 with 100,000 iterations
            import hashlib
            secure_bytes = hashlib.pbkdf2_hmac('sha256', combined.encode(), salt.encode(), 100000)
            secure_id = secure_bytes.hex()[:32]  # 32 character secure ID
        
        # Store the mapping in database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create conversations table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                secure_id TEXT PRIMARY KEY,
                user_id_1 INTEGER NOT NULL,
                user_id_2 INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Insert new conversation
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO conversations (secure_id, user_id_1, user_id_2, item_id, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (secure_id, user_id_1, user_id_2, item_id, current_time))
        
        conn.commit()
        conn.close()
        
        return jsonify({'conversation_id': secure_id}), 200
        
    except Exception as e:
        print(f"Error creating conversation: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/get-conversation-details', methods=['GET'])
def get_conversation_details():
    """Get conversation details from secure ID"""
    try:
        secure_id = request.args.get('conversation_id')
        requester_id = request.args.get('user_id')
        
        if not secure_id or not requester_id:
            return jsonify({'error': 'Missing parameters'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id_1, user_id_2, item_id
            FROM conversations
            WHERE secure_id = ?
        ''', (secure_id,))
        
        conv = cursor.fetchone()
        conn.close()
        
        if not conv:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Validate requester is part of conversation
        if int(requester_id) not in [conv['user_id_1'], conv['user_id_2']]:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Determine other user
        other_user_id = conv['user_id_2'] if int(requester_id) == conv['user_id_1'] else conv['user_id_1']
        
        return jsonify({
            'user_id_1': conv['user_id_1'],
            'user_id_2': conv['user_id_2'],
            'item_id': conv['item_id'],
            'other_user_id': other_user_id
        }), 200
        
    except Exception as e:
        print(f"Error getting conversation details: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/messages', methods=['POST'])
def send_message():
    """Send a new message"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['sender_id', 'sender_name', 'sender_email', 
                   'receiver_id', 'receiver_name', 'receiver_email', 'message_text']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Generate conversation ID if not provided
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            # Create conversation ID from sorted user IDs
            user_ids = sorted([str(data['sender_id']), str(data['receiver_id'])])
            item_ref = f"_{data.get('item_id', 'general')}" if data.get('item_id') else ''
            conversation_id = f"conv_{user_ids[0]}_{user_ids[1]}{item_ref}"
        
        # Validate sender is part of this conversation using secure ID
        conn_check = sqlite3.connect(DB_PATH)
        cursor_check = conn_check.cursor()
        cursor_check.execute('''
            SELECT user_id_1, user_id_2 FROM conversations WHERE secure_id = ?
        ''', (conversation_id,))
        conv_check = cursor_check.fetchone()
        conn_check.close()
        
        if not conv_check:
            return jsonify({'error': 'Conversation not found'}), 404
        
        allowed_user_ids = [conv_check[0], conv_check[1]]
        if int(data['sender_id']) not in allowed_user_ids:
            return jsonify({'error': 'Unauthorized: You cannot send messages in this conversation'}), 403
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Use ET local time for message timestamp
        current_time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute('''
            INSERT INTO messages (
                conversation_id, sender_id, sender_name, sender_email,
                receiver_id, receiver_name, receiver_email, message_text,
                item_id, item_type, item_title, is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        ''', (
            conversation_id,
            data['sender_id'], data['sender_name'], data['sender_email'],
            data['receiver_id'], data['receiver_name'], data['receiver_email'],
            data['message_text'],
            data.get('item_id'), data.get('item_type'), data.get('item_title'),
            current_time_str
        ))
        
        message_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Message sent: {message_id} in conversation {conversation_id}")
        return jsonify({
            'success': True,
            'message_id': message_id,
            'conversation_id': conversation_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error sending message: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/messages/<int:message_id>/read', methods=['PUT'])
def mark_message_read(message_id):
    """Mark a message as read"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('UPDATE messages SET is_read = 1 WHERE message_id = ?', (message_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"❌ Error marking message read: {e}")
        return jsonify({'error': str(e)}), 500

# Helper function for internal use
def get_user_by_email(email):
    """Get user details by email (internal helper)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, email, full_name, first_name, last_name, password_hash, 
               is_verified, is_active, profile_completed, created_at,
               is_suspended, suspension_until
        FROM users
        WHERE email = ?
    ''', (email,))
    
    user = cursor.fetchone()
    conn.close()
    
    return dict(user) if user else None

@app.route('/api/user-by-email', methods=['GET'])
def api_get_user_by_email():
    """Get user ID and details by email (API endpoint)"""
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        user = get_user_by_email(email)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return only public fields for API
        return jsonify({
            'user': {
                'id': user['id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'first_name': user['first_name'],
                'last_name': user['last_name']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching user by email: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/<int:user_id>', methods=['GET'])
def api_get_user_by_id(user_id):
    """Get user details by ID (API endpoint)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return only public fields for API
        return jsonify({
            'user': {
                'id': user['id'],
                'email': user['email'],
                'full_name': user['full_name'],
                'first_name': user['first_name'],
                'last_name': user['last_name']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching user by ID: {e}")
        return jsonify({'error': str(e)}), 500


# USER REVIEWS ENDPOINTS
@app.route('/api/user-reviews', methods=['POST'])
def create_user_review():
    """Create a review for another user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['reviewer_id', 'reviewer_name', 'reviewer_email',
                   'reviewed_user_id', 'reviewed_user_name', 'rating', 'review_type']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Validate rating
        if not (1 <= data['rating'] <= 5):
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Validate review type
        if data['review_type'] not in ['FINDER', 'CLAIMER', 'APP']:
            return jsonify({'error': 'Invalid review type'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_reviews (
                reviewer_id, reviewer_name, reviewer_email,
                reviewed_user_id, reviewed_user_name,
                claim_id, item_id, item_title,
                rating, review_text, review_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['reviewer_id'], data['reviewer_name'], data['reviewer_email'],
            data['reviewed_user_id'], data['reviewed_user_name'],
            data.get('claim_id'), data.get('item_id'), data.get('item_title'),
            data['rating'], data.get('review_text', ''), data['review_type']
        ))
        
        review_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ User review created: {review_id}")
        return jsonify({
            'success': True,
            'review_id': review_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating user review: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user-reviews/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    """Get reviews for a specific user"""
    try:
        review_type = request.args.get('type')  # FINDER, CLAIMER, APP, or None for all
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Exclude email addresses to protect user privacy
        if review_type:
            cursor.execute('''
                SELECT id, reviewer_id, reviewer_name,
                       reviewed_user_id, reviewed_user_name,
                       claim_id, item_id, item_title,
                       rating, review_text, review_type, created_at
                FROM user_reviews
                WHERE reviewed_user_id = ? AND review_type = ?
                ORDER BY created_at DESC
            ''', (user_id, review_type))
        else:
            cursor.execute('''
                SELECT id, reviewer_id, reviewer_name,
                       reviewed_user_id, reviewed_user_name,
                       claim_id, item_id, item_title,
                       rating, review_text, review_type, created_at
                FROM user_reviews
                WHERE reviewed_user_id = ?
                ORDER BY created_at DESC
            ''', (user_id,))
        
        reviews = [dict(row) for row in cursor.fetchall()]
        
        # Calculate average rating
        if reviews:
            avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
        else:
            avg_rating = 0
        
        conn.close()
        
        return jsonify({
            'reviews': reviews,
            'total': len(reviews),
            'average_rating': round(avg_rating, 2)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching user reviews: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user-reviews/stats/<int:user_id>', methods=['GET'])
def get_user_review_stats(user_id):
    """Get review statistics for a user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get overall stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN review_type = 'FINDER' THEN 1 ELSE 0 END) as finder_reviews,
                SUM(CASE WHEN review_type = 'CLAIMER' THEN 1 ELSE 0 END) as claimer_reviews,
                SUM(CASE WHEN review_type = 'APP' THEN 1 ELSE 0 END) as app_reviews
            FROM user_reviews
            WHERE reviewed_user_id = ?
        ''', (user_id,))
        
        stats = dict(cursor.fetchone())
        
        # Get rating distribution
        cursor.execute('''
            SELECT rating, COUNT(*) as count
            FROM user_reviews
            WHERE reviewed_user_id = ?
            GROUP BY rating
            ORDER BY rating DESC
        ''', (user_id,))
        
        rating_distribution = {row['rating']: row['count'] for row in cursor.fetchall()}
        
        conn.close()
        
        return jsonify({
            'stats': stats,
            'rating_distribution': rating_distribution
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching review stats: {e}")
        return jsonify({'error': str(e)}), 500


# ==============================================
# USER REPORTS WITH MATCHES
# ==============================================

@app.route('/api/user/<int:user_id>/reports-with-matches', methods=['GET'])
def get_user_reports_with_matches(user_id):
    """
    Get all lost and found reports for a specific user with ML matches (>30% similarity)
    Returns user's own reports and their potential matches
    """
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # First get the user's email
        user = conn.execute("SELECT email FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_email = user['email']
        
        # Get user's lost items
        lost_items = conn.execute("""
            SELECT l.rowid as id, l.*, c.name as category_name, loc.name as location_name
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
            WHERE l.user_email = ?
            ORDER BY l.created_at DESC
        """, (user_email,)).fetchall()
        
        # Get user's found items (including claimed ones for dashboard)
        found_items = conn.execute("""
            SELECT f.rowid as id, f.category_id, f.location_id, f.title, f.description, 
                   f.color, f.size, f.image_filename, f.date_found, f.time_found,
                   f.current_location, f.finder_notes, f.is_private, f.privacy_expires_at,
                   f.is_claimed, f.status, f.created_at, f.privacy_expires,
                   f.finder_name, f.finder_email, f.finder_phone,
                   c.name as category_name, c.name as category,
                   loc.name as location_name, loc.name as location,
                   loc.building_code, loc.description as location_description
            FROM found_items f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE f.finder_email = ?
            ORDER BY f.created_at DESC
        """, (user_email,)).fetchall()
        
        conn.close()
        
        # Process lost items
        lost_reports = []
        for item in lost_items:
            item_dict = dict(item)
            
            # Format dates
            if item_dict.get('date_lost'):
                try:
                    date_obj = datetime.strptime(item_dict['date_lost'], '%Y-%m-%d')
                    item_dict['date_lost'] = date_obj.strftime('%m/%d/%Y')
                except:
                    pass
            
            if item_dict.get('time_lost'):
                try:
                    time_obj = datetime.strptime(item_dict['time_lost'], '%H:%M:%S')
                    item_dict['time_lost'] = time_obj.strftime('%I:%M %p')
                except:
                    pass
            
            # Get pre-computed matches from ml_matches table (>70% threshold)
            conn2 = get_db()
            matches = []
            if conn2:
                try:
                    match_rows = conn2.execute("""
                        SELECT m.match_score, m.score_breakdown,
                               f.rowid as id, f.title, f.description, f.color, f.size,
                               f.date_found, f.time_found, f.image_filename,
                               f.finder_name, f.finder_email, f.finder_phone,
                               f.current_location, f.is_claimed, f.status,
                               c.name as category_name,
                               loc.name as location_name
                        FROM ml_matches m
                        JOIN found_items f ON m.found_item_id = f.rowid
                        LEFT JOIN categories c ON f.category_id = c.id
                        LEFT JOIN locations loc ON f.location_id = loc.id
                        WHERE m.lost_item_id = ? AND m.match_score >= 0.7
                        ORDER BY m.match_score DESC
                        LIMIT 10
                    """, (item_dict['id'],)).fetchall()
                    
                    for row in match_rows:
                        match_dict = dict(row)
                        # Format match dates
                        if match_dict.get('date_found'):
                            try:
                                date_obj = datetime.strptime(match_dict['date_found'], '%Y-%m-%d')
                                match_dict['date_found'] = date_obj.strftime('%m/%d/%Y')
                            except:
                                pass
                        if match_dict.get('time_found'):
                            try:
                                time_obj = datetime.strptime(match_dict['time_found'], '%H:%M:%S')
                                match_dict['time_found'] = time_obj.strftime('%I:%M %p')
                            except:
                                pass
                        matches.append(match_dict)
                    
                    conn2.close()
                except Exception as e:
                    print(f"Error reading matches for lost item {item_dict['id']}: {e}")
            
            item_dict['matches'] = matches
            item_dict['match_count'] = len(matches)
            item_dict['report_type'] = 'LOST'
            lost_reports.append(item_dict)
        
        # Process found items
        found_reports = []
        for item in found_items:
            item_dict = dict(item)
            
            # Format dates
            if item_dict.get('date_found'):
                try:
                    date_obj = datetime.strptime(item_dict['date_found'], '%Y-%m-%d')
                    item_dict['date_found'] = date_obj.strftime('%m/%d/%Y')
                except:
                    pass
            
            if item_dict.get('time_found'):
                try:
                    time_obj = datetime.strptime(item_dict['time_found'], '%H:%M:%S')
                    item_dict['time_found'] = time_obj.strftime('%I:%M %p')
                except:
                    pass
            
            # Get pre-computed matches from ml_matches table (>70% threshold)
            conn2 = get_db()
            matches = []
            if conn2:
                try:
                    match_rows = conn2.execute("""
                        SELECT m.match_score, m.score_breakdown,
                               l.rowid as id, l.title, l.description, l.color, l.size,
                               l.date_lost, l.time_lost, l.image_filename,
                               l.owner_name, l.user_email, l.owner_phone,
                               l.last_seen_location, l.owner_notes,
                               c.name as category_name,
                               loc.name as location_name
                        FROM ml_matches m
                        JOIN lost_items l ON m.lost_item_id = l.rowid
                        LEFT JOIN categories c ON l.category_id = c.id
                        LEFT JOIN locations loc ON l.location_id = loc.id
                        WHERE m.found_item_id = ? AND m.match_score >= 0.7
                        ORDER BY m.match_score DESC
                        LIMIT 10
                    """, (item_dict['id'],)).fetchall()
                    
                    for row in match_rows:
                        match_dict = dict(row)
                        # Format match dates
                        if match_dict.get('date_lost'):
                            try:
                                date_obj = datetime.strptime(match_dict['date_lost'], '%Y-%m-%d')
                                match_dict['date_lost'] = date_obj.strftime('%m/%d/%Y')
                            except:
                                pass
                        if match_dict.get('time_lost'):
                            try:
                                time_obj = datetime.strptime(match_dict['time_lost'], '%H:%M:%S')
                                match_dict['time_lost'] = time_obj.strftime('%I:%M %p')
                            except:
                                pass
                        matches.append(match_dict)
                    
                    conn2.close()
                except Exception as e:
                    print(f"Error reading matches for found item {item_dict['id']}: {e}")
            
            item_dict['matches'] = matches
            item_dict['match_count'] = len(matches)
            item_dict['report_type'] = 'FOUND'
            found_reports.append(item_dict)
        
        return jsonify({
            'user_id': user_id,
            'lost_reports': lost_reports,
            'found_reports': found_reports,
            'total_lost': len(lost_reports),
            'total_found': len(found_reports),
            'total_reports': len(lost_reports) + len(found_reports),
            'total_matches': sum(r['match_count'] for r in lost_reports + found_reports)
        })
        
    except Exception as e:
        print(f"Error fetching user reports with matches: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/<int:user_id>/matches-summary', methods=['GET'])
def get_user_matches_summary(user_id):
    """
    Get a summary of all matches for a user's reports
    Simplified view showing just match counts and top matches
    """
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # First get the user's email
        user = conn.execute("SELECT email FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_email = user['email']
        
        # Get user's lost items count
        lost_count = conn.execute(
            "SELECT COUNT(*) as count FROM lost_items WHERE user_email = ?", 
            (user_email,)
        ).fetchone()['count']
        
        # Get user's found items count
        found_count = conn.execute(
            "SELECT COUNT(*) as count FROM found_items WHERE finder_email = ?", 
            (user_email,)
        ).fetchone()['count']
        
        # Get item IDs
        lost_item_ids = [row['id'] for row in conn.execute(
            "SELECT rowid as id FROM lost_items WHERE user_email = ?", 
            (user_email,)
        ).fetchall()]
        
        found_item_ids = [row['id'] for row in conn.execute(
            "SELECT rowid as id FROM found_items WHERE finder_email = ?", 
            (user_email,)
        ).fetchall()]
        
        conn.close()
        
        # Count matches from pre-computed ml_matches table
        total_matches = 0
        high_confidence_matches = 0  # >=70%
        
        # Count matches for lost items
        for item_id in lost_item_ids:
            try:
                match_count = conn.execute("""
                    SELECT COUNT(*) as count 
                    FROM ml_matches 
                    WHERE lost_item_id = ? AND match_score >= 0.7
                """, (item_id,)).fetchone()['count']
                total_matches += match_count
                
                high_conf_count = conn.execute("""
                    SELECT COUNT(*) as count 
                    FROM ml_matches 
                    WHERE lost_item_id = ? AND match_score >= 0.7
                """, (item_id,)).fetchone()['count']
                high_confidence_matches += high_conf_count
            except:
                pass
        
        # Count matches for found items
        for item_id in found_item_ids:
            try:
                match_count = conn.execute("""
                    SELECT COUNT(*) as count 
                    FROM ml_matches 
                    WHERE found_item_id = ? AND match_score >= 0.7
                """, (item_id,)).fetchone()['count']
                total_matches += match_count
                
                high_conf_count = conn.execute("""
                    SELECT COUNT(*) as count 
                    FROM ml_matches 
                    WHERE found_item_id = ? AND match_score >= 0.7
                """, (item_id,)).fetchone()['count']
                high_confidence_matches += high_conf_count
            except:
                pass
        
        return jsonify({
            'user_id': user_id,
            'lost_reports': lost_count,
            'found_reports': found_count,
            'total_reports': lost_count + found_count,
            'total_matches': total_matches,
            'high_confidence_matches': high_confidence_matches,
            'has_matches': total_matches > 0
        })
        
    except Exception as e:
        print(f"Error fetching user matches summary: {e}")
        return jsonify({'error': str(e)}), 500


# ==============================================
# ML MATCHING ENDPOINTS
# ==============================================

@app.route('/api/ml/matches/lost/<int:lost_item_id>', methods=['GET'])
def get_matches_for_lost_item(lost_item_id):
    """
    Find matching found items for a lost item using ML
    
    Query params:
    - min_score: Minimum match score (default 0.6 = 60%)
    - top_k: Number of results (default 10)
    """
    try:
        service = get_ml_service()
        if service is None:
            return jsonify({'error': 'ML service not available'}), 503
        
        min_score = float(request.args.get('min_score', 0.6))
        top_k = int(request.args.get('top_k', 10))
        
        matches = service.find_matches_for_lost_item(lost_item_id, min_score, top_k)
        
        return jsonify({
            'lost_item_id': lost_item_id,
            'matches': matches,
            'count': len(matches)
        }), 200
        
    except Exception as e:
        print(f"❌ Error finding matches for lost item: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/matches/found/<int:found_item_id>', methods=['GET'])
def get_matches_for_found_item(found_item_id):
    """
    Find matching lost items for a found item using ML
    
    Query params:
    - min_score: Minimum match score (default 0.6 = 60%)
    - top_k: Number of results (default 10)
    """
    try:
        service = get_ml_service()
        if service is None:
            return jsonify({'error': 'ML service not available'}), 503
        
        min_score = float(request.args.get('min_score', 0.6))
        top_k = int(request.args.get('top_k', 10))
        
        matches = service.find_matches_for_found_item(found_item_id, min_score, top_k)
        
        return jsonify({
            'found_item_id': found_item_id,
            'matches': matches,
            'count': len(matches)
        }), 200
        
    except Exception as e:
        print(f"❌ Error finding matches for found item: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/matches/calculate', methods=['POST'])
def calculate_match_score():
    """
    Calculate match score between a lost item and found item
    
    Request body:
    {
        "lost_item_id": 123,
        "found_item_id": 456
    }
    """
    try:
        service = get_ml_service()
        if service is None:
            return jsonify({'error': 'ML service not available'}), 503
        
        data = request.get_json()
        lost_item_id = data.get('lost_item_id')
        found_item_id = data.get('found_item_id')
        
        if not lost_item_id or not found_item_id:
            return jsonify({'error': 'Both lost_item_id and found_item_id required'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Get lost item
        lost_item = cursor.execute("""
            SELECT l.rowid as id, l.*, c.name as category, loc.name as location
            FROM lost_items l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN locations loc ON l.location_id = loc.id
            WHERE l.rowid = ?
        """, (lost_item_id,)).fetchone()
        
        # Get found item
        found_item = cursor.execute("""
            SELECT f.rowid as id, f.*, c.name as category, loc.name as location
            FROM found_items f
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN locations loc ON f.location_id = loc.id
            WHERE f.rowid = ?
        """, (found_item_id,)).fetchone()
        
        conn.close()
        
        if not lost_item or not found_item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Calculate score
        score_data = service.calculate_match_score(dict(lost_item), dict(found_item))
        
        return jsonify({
            'lost_item_id': lost_item_id,
            'found_item_id': found_item_id,
            **score_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error calculating match score: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/matches/batch', methods=['GET'])
def batch_match_all():
    """
    Find all potential matches between lost and found items
    
    Query params:
    - min_score: Minimum match score (default 0.3)
    - limit: Maximum number of results (default 100)
    """
    try:
        service = get_ml_service()
        if service is None:
            return jsonify({'error': 'ML service not available'}), 503
        
        min_score = float(request.args.get('min_score', 0.3))
        limit = int(request.args.get('limit', 100))
        
        matches = service.batch_match_all_items(min_score)
        
        # Limit results
        matches = matches[:limit]
        
        return jsonify({
            'matches': matches,
            'count': len(matches),
            'min_score': min_score
        }), 200
        
    except Exception as e:
        print(f"❌ Error batch matching items: {e}")
        return jsonify({'error': str(e)}), 500


def cleanup_old_claimed_items():
    """
    Delete claimed items that are older than 3 days.
    These items have been successfully claimed and given to the rightful owner.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get items to be deleted for logging
        cursor.execute('''
            SELECT rowid, title, claimed_date 
            FROM found_items 
            WHERE status = 'CLAIMED' 
            AND claimed_date IS NOT NULL
            AND datetime(claimed_date) <= datetime('now', '-3 days')
        ''')
        items_to_delete = cursor.fetchall()
        
        if items_to_delete:
            print(f"🗑️  Cleaning up {len(items_to_delete)} claimed items older than 3 days:")
            for item in items_to_delete:
                print(f"   - {item[1]} (claimed on {item[2]})")
        
        # Delete the items
        cursor.execute('''
            DELETE FROM found_items 
            WHERE status = 'CLAIMED' 
            AND claimed_date IS NOT NULL
            AND datetime(claimed_date) <= datetime('now', '-3 days')
        ''')
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            print(f"✅ Successfully deleted {deleted_count} old claimed items")
        
        return deleted_count
        
    except Exception as e:
        print(f"❌ Error cleaning up claimed items: {e}")
        return 0


@app.route('/api/cleanup-claimed-items', methods=['POST'])
def api_cleanup_claimed_items():
    """
    Manual endpoint to trigger cleanup of old claimed items.
    Admin or system can call this to remove items older than 3 days.
    """
    try:
        deleted_count = cleanup_old_claimed_items()
        return jsonify({
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Cleaned up {deleted_count} claimed items older than 3 days'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in cleanup API: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/verify/<int:user_id>', methods=['GET'])
def verify_user_exists(user_id):
    """Verify if a user account still exists (for checking deleted accounts)"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, is_active 
            FROM users 
            WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'exists': False, 'message': 'User not found'}), 404
        
        if user['is_active'] == 0:
            return jsonify({'exists': False, 'message': 'User account deactivated'}), 404
        
        return jsonify({'exists': True, 'user_id': user_id}), 200
        
    except Exception as e:
        print(f"❌ Error verifying user: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/connect', methods=['GET'])
def get_users_for_connection():
    """Get all users for the Connect with People section - excludes sensitive information"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Select only public profile information, exclude sensitive data
        cursor.execute('''
            SELECT 
                id,
                full_name,
                first_name,
                last_name,
                profile_image,
                bio,
                interests,
                year_of_study,
                major,
                building_preference,
                profile_completed
            FROM users
            WHERE is_active = 1 
            AND profile_completed = 1
            ORDER BY full_name ASC
        ''')
        
        users = []
        for row in cursor.fetchall():
            user_dict = dict(row)
            # Ensure no email or student_id is included
            users.append(user_dict)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Unable to fetch users',
            'message': str(e)
        }), 500


@app.route('/api/contact-request', methods=['POST'])
def create_contact_request():
    """Create a connection request between users"""
    conn = None
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        requester_id = data.get('requester_id')
        target_user_id = data.get('target_user_id')
        requester_name = data.get('requester_name')
        target_user_name = data.get('target_user_name')
        
        if not all([requester_id, target_user_id, requester_name, target_user_name]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Ensure user1_id < user2_id for consistency
        user1_id = min(requester_id, target_user_id)
        user2_id = max(requester_id, target_user_id)
        
        # Check if connection already exists
        cursor.execute('''
            SELECT id, status FROM connections 
            WHERE user1_id = ? AND user2_id = ?
        ''', (user1_id, user2_id))
        
        existing = cursor.fetchone()
        if existing:
            status = existing['status']
            if status == 'pending':
                return jsonify({
                    'success': False,
                    'message': 'Connection request already pending'
                }), 400
            elif status == 'connected':
                return jsonify({
                    'success': False,
                    'message': 'You are already connected with this user'
                }), 400
        
        # Create connection request
        try:
            cursor.execute('''
                INSERT INTO connections 
                (user1_id, user2_id, requester_id, status, created_at)
                VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
            ''', (user1_id, user2_id, requester_id))
            
            request_id = cursor.lastrowid
            
            # Get target user's email for notification
            cursor.execute('SELECT email FROM users WHERE id = ?', (target_user_id,))
            target_user = cursor.fetchone()
            target_email = target_user['email'] if target_user else None
            
            conn.commit()
        except sqlite3.IntegrityError:
            # Connection already exists
            return jsonify({
                'success': False,
                'message': 'Connection request already exists'
            }), 400
        
        # Send email notification (if email system is configured)
        if target_email:
            try:
                from email_verification_service import send_email
                
                subject = f"🤝 New Connection Request from {requester_name} - TraceBack"
                body = f"""Hello {target_user_name},

You have a new connection request on TraceBack!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 FROM: {requester_name}

{requester_name} wants to connect with you on TraceBack. Connecting allows you to:
  • Share contact information with each other
  • Network with people who have similar interests
  • Build your campus community connections

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 RESPOND TO THIS REQUEST:

Log in to TraceBack and navigate to:
Dashboard → Connections → Pending Requests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Note: This connection request will remain pending until you respond.

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
                """
                
                send_email(target_email, subject, body)
                print(f"✅ Connection request email sent to {target_email}")
            except Exception as e:
                print(f"⚠️ Could not send email notification: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Connection request sent successfully',
            'request_id': request_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating connection request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Unable to create connection request',
            'message': str(e)
        }), 500
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.route('/api/connections/<int:user_id>', methods=['GET'])
def get_connections(user_id):
    """Get all connections for a user (pending requests and connected friends)"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Get pending requests (where user is NOT the requester)
        cursor.execute('''
            SELECT 
                c.id,
                c.user1_id,
                c.user2_id,
                c.requester_id,
                c.status,
                c.created_at,
                c.responded_at,
                CASE 
                    WHEN c.user1_id = ? THEN u2.full_name
                    ELSE u1.full_name
                END as other_user_name,
                CASE 
                    WHEN c.user1_id = ? THEN u2.profile_image
                    ELSE u1.profile_image
                END as profile_image,
                CASE 
                    WHEN c.user1_id = ? THEN u2.major
                    ELSE u1.major
                END as major,
                CASE 
                    WHEN c.user1_id = ? THEN u2.year_of_study
                    ELSE u1.year_of_study
                END as year_of_study,
                CASE 
                    WHEN c.user1_id = ? THEN u2.bio
                    ELSE u1.bio
                END as bio,
                CASE 
                    WHEN c.user1_id = ? THEN u2.interests
                    ELSE u1.interests
                END as interests,
                CASE 
                    WHEN c.user1_id = ? THEN u2.building_preference
                    ELSE u1.building_preference
                END as building_preference
            FROM connections c
            LEFT JOIN users u1 ON c.user1_id = u1.id
            LEFT JOIN users u2 ON c.user2_id = u2.id
            WHERE (c.user1_id = ? OR c.user2_id = ?)
            AND c.status = 'pending'
            AND c.requester_id != ?
            ORDER BY c.created_at DESC
        ''', (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
        
        pending = [dict(row) for row in cursor.fetchall()]
        
        # Get connected friends (status = 'connected')
        cursor.execute('''
            SELECT 
                c.id,
                c.user1_id,
                c.user2_id,
                c.status,
                c.created_at,
                c.responded_at,
                CASE 
                    WHEN c.user1_id = ? THEN u2.id
                    ELSE u1.id
                END as other_user_id,
                CASE 
                    WHEN c.user1_id = ? THEN u2.full_name
                    ELSE u1.full_name
                END as other_user_name,
                CASE 
                    WHEN c.user1_id = ? THEN u2.email
                    ELSE u1.email
                END as email,
                CASE 
                    WHEN c.user1_id = ? THEN u2.profile_image
                    ELSE u1.profile_image
                END as profile_image,
                CASE 
                    WHEN c.user1_id = ? THEN u2.major
                    ELSE u1.major
                END as major,
                CASE 
                    WHEN c.user1_id = ? THEN u2.year_of_study
                    ELSE u1.year_of_study
                END as year_of_study,
                CASE 
                    WHEN c.user1_id = ? THEN u2.bio
                    ELSE u1.bio
                END as bio,
                CASE 
                    WHEN c.user1_id = ? THEN u2.interests
                    ELSE u1.interests
                END as interests,
                CASE 
                    WHEN c.user1_id = ? THEN u2.building_preference
                    ELSE u1.building_preference
                END as building_preference
            FROM connections c
            LEFT JOIN users u1 ON c.user1_id = u1.id
            LEFT JOIN users u2 ON c.user2_id = u2.id
            WHERE (c.user1_id = ? OR c.user2_id = ?)
            AND c.status = 'connected'
            ORDER BY c.responded_at DESC
        ''', (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
        
        friends = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'pending': pending,
            'friends': friends
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching connections: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Unable to fetch connections',
            'message': str(e)
        }), 500


@app.route('/api/connections/<int:connection_id>/accept', methods=['PUT'])
def accept_connection(connection_id):
    """Accept a connection request"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID required'
            }), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Verify the user is part of this connection and not the requester
        cursor.execute('''
            SELECT user1_id, user2_id, requester_id
            FROM connections 
            WHERE id = ? AND status = 'pending'
        ''', (connection_id,))
        
        connection_data = cursor.fetchone()
        if not connection_data:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Connection not found or already processed'
            }), 404
        
        # Check if user is part of connection and NOT the requester
        if user_id not in [connection_data['user1_id'], connection_data['user2_id']]:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
            
        if user_id == connection_data['requester_id']:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Cannot accept your own connection request'
            }), 403
        
        # Update connection status to connected
        cursor.execute('''
            UPDATE connections 
            SET status = 'connected', responded_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (connection_id,))
        
        # Get requester info for notification
        cursor.execute('SELECT email, full_name FROM users WHERE id = ?', (connection_data['requester_id'],))
        requester = cursor.fetchone()
        
        cursor.execute('SELECT full_name FROM users WHERE id = ?', (user_id,))
        accepter = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        # Send email notification to requester
        if requester and requester['email']:
            try:
                from email_verification_service import send_email
                
                subject = f"✅ {accepter['full_name'] if accepter else 'Someone'} Accepted Your Connection Request - TraceBack"
                body = f"""Hello {requester['full_name']},

Great news! Your connection request has been accepted!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 {accepter['full_name'] if accepter else 'Someone'} has accepted your connection request!

You are now connected and can:
  • View each other's contact information
  • See shared interests and programs
  • Reach out to each other using the shared contact details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 VIEW YOUR CONNECTION:

Log in to TraceBack and navigate to:
Dashboard → Connections → My Connections

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
                """
                
                send_email(requester['email'], subject, body)
            except Exception as e:
                print(f"⚠️ Could not send email notification: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Connection accepted'
        }), 200
        
    except Exception as e:
        print(f"❌ Error accepting connection: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Unable to accept connection',
            'message': str(e)
        }), 500


@app.route('/api/connections/<int:connection_id>/reject', methods=['PUT'])
def reject_connection(connection_id):
    """Reject a connection request"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID required'
            }), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Verify the user is part of this connection
        cursor.execute('''
            SELECT user1_id, user2_id, requester_id
            FROM connections 
            WHERE id = ? AND status = 'pending'
        ''', (connection_id,))
        
        connection_data = cursor.fetchone()
        if not connection_data:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Connection not found or already processed'
            }), 404
        
        if user_id not in [connection_data['user1_id'], connection_data['user2_id']]:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
        
        # Delete the connection request
        cursor.execute('DELETE FROM connections WHERE id = ?', (connection_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Connection request declined'
        }), 200
        
    except Exception as e:
        print(f"❌ Error declining connection: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Unable to decline connection',
            'message': str(e)
        }), 500


@app.route('/api/connections/<int:connection_id>/remove', methods=['DELETE'])
def remove_connection(connection_id):
    """Remove a connection (unfriend)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID required'
            }), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database not available'}), 500
        
        cursor = conn.cursor()
        
        # Verify the user is part of this connection
        cursor.execute('''
            SELECT user1_id, user2_id
            FROM connections 
            WHERE id = ? AND status = 'connected'
        ''', (connection_id,))
        
        connection_data = cursor.fetchone()
        if not connection_data:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Connection not found'
            }), 404
        
        if user_id not in [connection_data['user1_id'], connection_data['user2_id']]:
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Unauthorized'
            }), 403
        
        # Delete the connection
        cursor.execute('DELETE FROM connections WHERE id = ?', (connection_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Connection removed successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error removing connection: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Unable to remove connection',
            'message': str(e)
        }), 500


@app.route('/api/successful-returns', methods=['GET'])
def get_successful_returns():
    """Get successful returns/claims history for a user"""
    try:
        email = request.args.get('email')
        user_type = request.args.get('type', 'both')  # 'owner', 'claimer', or 'both'
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        results = []
        
        # Get successful returns (where user was the owner/finder)
        if user_type in ['owner', 'both']:
            cursor.execute('''
                SELECT 
                    sr.return_id,
                    sr.item_title,
                    sr.item_description,
                    sr.item_category,
                    sr.item_location,
                    sr.date_found,
                    sr.claimer_email,
                    sr.claimer_name,
                    sr.claim_reason,
                    sr.finalized_date,
                    sr.finalized_at,
                    sr.days_to_finalize,
                    sr.verification_code,
                    u.phone_number as claimer_phone,
                    'owner' as role
                FROM successful_returns sr
                LEFT JOIN users u ON u.email = sr.claimer_email
                WHERE sr.owner_email = ?
                ORDER BY sr.finalized_date DESC
            ''', (email,))
            
            returns = cursor.fetchall()
            for ret in returns:
                ret_dict = dict(ret)
                # Calculate if contact info should still be visible (7 days from finalization for owners)
                try:
                    finalized_dt = datetime.strptime(ret_dict['finalized_at'], '%Y-%m-%d %H:%M:%S')
                    days_since_finalized = (datetime.now() - finalized_dt).days
                    ret_dict['show_contact_info'] = days_since_finalized < 7
                    ret_dict['contact_visible_days_remaining'] = max(0, 7 - days_since_finalized)
                except Exception as e:
                    print(f"Error parsing finalized_at: {e}")
                    ret_dict['show_contact_info'] = False
                results.append(ret_dict)
        
        # Get successful claims (where user was the claimer)
        if user_type in ['claimer', 'both']:
            cursor.execute('''
                SELECT 
                    sr.return_id,
                    sr.item_title,
                    sr.item_description,
                    sr.item_category,
                    sr.item_location,
                    sr.date_found,
                    sr.owner_email,
                    sr.owner_name,
                    sr.claim_reason,
                    sr.finalized_date,
                    sr.finalized_at,
                    sr.days_to_finalize,
                    sr.verification_code,
                    u.phone_number as owner_phone,
                    'claimer' as role
                FROM successful_returns sr
                LEFT JOIN users u ON u.email = sr.owner_email
                WHERE sr.claimer_email = ?
                ORDER BY sr.finalized_date DESC
            ''', (email,))
            
            claims = cursor.fetchall()
            for claim in claims:
                claim_dict = dict(claim)
                # Calculate if contact info should still be visible (7 days from finalization)
                try:
                    finalized_dt = datetime.strptime(claim_dict['finalized_at'], '%Y-%m-%d %H:%M:%S')
                    days_since_finalized = (datetime.now() - finalized_dt).days
                    claim_dict['show_contact_info'] = days_since_finalized < 7
                    claim_dict['contact_visible_days_remaining'] = max(0, 7 - days_since_finalized)
                except Exception as e:
                    print(f"Error parsing finalized_at: {e}")
                    claim_dict['show_contact_info'] = False
                results.append(claim_dict)
        
        # Sort all results by finalized_date
        results.sort(key=lambda x: x['finalized_date'], reverse=True)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'returns': results
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching successful returns: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/successful-returns/stats', methods=['GET'])
def get_successful_returns_stats():
    """Get statistics about successful returns/claims"""
    try:
        email = request.args.get('email')
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Count successful returns (as owner)
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM successful_returns
            WHERE owner_email = ?
        ''', (email,))
        
        returns_count = cursor.fetchone()['count']
        
        # Count successful claims (as claimer)
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM successful_returns
            WHERE claimer_email = ?
        ''', (email,))
        
        claims_count = cursor.fetchone()['count']
        
        # Get most recent return
        cursor.execute('''
            SELECT item_title, finalized_date
            FROM successful_returns
            WHERE owner_email = ?
            ORDER BY finalized_date DESC
            LIMIT 1
        ''', (email,))
        
        recent_return = cursor.fetchone()
        
        # Get most recent claim
        cursor.execute('''
            SELECT item_title, finalized_date
            FROM successful_returns
            WHERE claimer_email = ?
            ORDER BY finalized_date DESC
            LIMIT 1
        ''', (email,))
        
        recent_claim = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'successful_returns': returns_count,
                'successful_claims': claims_count,
                'total': returns_count + claims_count,
                'recent_return': dict(recent_return) if recent_return else None,
                'recent_claim': dict(recent_claim) if recent_claim else None
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/public-profile/<int:user_id>', methods=['GET'])
def get_public_profile(user_id):
    """
    Get public profile information for a user
    Shows successful returns count but NOT personal contact information
    This is read-only and cannot be edited
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get basic user info (excluding email and phone)
        cursor.execute('''
            SELECT id, first_name, last_name, full_name, created_at
            FROM users
            WHERE id = ? AND is_active = 1
        ''', (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        user_dict = dict(user)
        
        # Get email for querying returns (but don't expose it in response)
        cursor.execute('SELECT email FROM users WHERE id = ?', (user_id,))
        email_row = cursor.fetchone()
        email = email_row['email'] if email_row else None
        
        if email:
            # Count successful returns (as finder/owner)
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM successful_returns
                WHERE owner_email = ?
            ''', (email,))
            returns_count = cursor.fetchone()['count']
            
            # Count successful claims (as claimer)
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM successful_returns
                WHERE claimer_email = ?
            ''', (email,))
            claims_count = cursor.fetchone()['count']
            
            # Get public successful returns info (excluding personal contact details)
            cursor.execute('''
                SELECT 
                    item_title,
                    item_category,
                    item_location,
                    finalized_date,
                    'return' as type
                FROM successful_returns
                WHERE owner_email = ?
                UNION ALL
                SELECT 
                    item_title,
                    item_category,
                    item_location,
                    finalized_date,
                    'claim' as type
                FROM successful_returns
                WHERE claimer_email = ?
                ORDER BY finalized_date DESC
            ''', (email, email))
            
            successful_transactions = [dict(row) for row in cursor.fetchall()]
        else:
            returns_count = 0
            claims_count = 0
            successful_transactions = []
        
        conn.close()
        
        return jsonify({
            'success': True,
            'profile': {
                'id': user_dict['id'],
                'full_name': user_dict['full_name'],
                'first_name': user_dict['first_name'],
                'last_name': user_dict['last_name'],
                'member_since': user_dict['created_at'],
                'successful_returns': returns_count,
                'successful_claims': claims_count,
                'total_successful_transactions': returns_count + claims_count,
                'transactions': successful_transactions
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching public profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/moderation/successful-returns', methods=['GET'])
def get_all_successful_returns_moderation():
    """Get all successful returns for moderation purposes"""
    try:
        email = request.args.get('email')
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all successful returns with contact info
        cursor.execute('''
            SELECT 
                sr.*,
                u_owner.phone_number as owner_phone,
                u_claimer.phone_number as claimer_phone
            FROM successful_returns sr
            LEFT JOIN users u_owner ON sr.owner_email = u_owner.email
            LEFT JOIN users u_claimer ON sr.claimer_email = u_claimer.email
            ORDER BY sr.finalized_date DESC
        ''')
        
        returns = cursor.fetchall()
        results = [dict(ret) for ret in returns]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'returns': results,
            'total': len(results)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching moderation data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/bug-reports', methods=['POST'])
def submit_bug_report():
    """Submit a new bug report"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'email', 'issueType', 'title', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO bug_reports (
                name, email, issue_type, title, description,
                priority, browser, device_type, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)
        ''', (
            data['name'],
            data['email'],
            data['issueType'],
            data['title'],
            data['description'],
            data.get('priority', 'MEDIUM'),
            data.get('browser', ''),
            data.get('deviceType', '')
        ))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Bug report #{report_id} submitted by {data['name']}")
        
        return jsonify({
            'success': True,
            'message': 'Bug report submitted successfully',
            'report_id': report_id
        }), 201
        
    except Exception as e:
        print(f"❌ Error submitting bug report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/moderation/bug-reports', methods=['GET'])
def get_bug_reports():
    """Get all bug reports for moderation"""
    try:
        email = request.args.get('email')
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM bug_reports
            ORDER BY 
                CASE status
                    WHEN 'OPEN' THEN 1
                    WHEN 'IN_PROGRESS' THEN 2
                    WHEN 'RESOLVED' THEN 3
                    ELSE 4
                END,
                CASE priority
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    WHEN 'LOW' THEN 4
                    ELSE 5
                END,
                created_at DESC
        ''')
        
        reports = cursor.fetchall()
        results = [dict(report) for report in reports]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'reports': results,
            'total': len(results)
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching bug reports: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/moderation/bug-reports/<int:report_id>', methods=['PUT'])
def update_bug_report(report_id):
    """Update bug report status"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        update_fields = []
        params = []
        
        if 'status' in data:
            update_fields.append('status = ?')
            params.append(data['status'])
        
        if 'moderator_notes' in data:
            update_fields.append('moderator_notes = ?')
            params.append(data['moderator_notes'])
        
        if 'moderator_email' in data:
            update_fields.append('moderator_email = ?')
            params.append(data['moderator_email'])
        
        update_fields.append('updated_at = CURRENT_TIMESTAMP')
        
        if data.get('status') == 'RESOLVED':
            update_fields.append('resolved_at = CURRENT_TIMESTAMP')
        
        params.append(report_id)
        
        query = f"UPDATE bug_reports SET {', '.join(update_fields)} WHERE report_id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        print(f"✅ Bug report #{report_id} updated")
        
        return jsonify({
            'success': True,
            'message': 'Bug report updated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating bug report: {e}")
        import traceback
        traceback.print_exc()
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
    
    # Register profile management endpoints
    create_profile_endpoints(app)
    
    # Run initial cleanup of old claimed items
    print("🧹 Running initial cleanup of old claimed items...")
    cleanup_old_claimed_items()
    
    print("🌐 Server running on http://localhost:5000")
    print("🏠 API Info: http://localhost:5000/")
    print("💚 Health Check: http://localhost:5000/health")
    print("📱 Categories: http://localhost:5000/api/categories")
    print("📍 Locations: http://localhost:5000/api/locations")
    print("❌ Lost Items: http://localhost:5000/api/lost-items")
    print("✅ Found Items: http://localhost:5000/api/found-items")
    print("⭐ Reviews: http://localhost:5000/api/reviews")
    print("👤 Profile Management: http://localhost:5000/api/profile/{user_id}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)