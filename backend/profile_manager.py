#!/usr/bin/env python3
"""
Profile Management API for TrackeBack
Handles user profile creation, updates, and image uploads
"""

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import sqlite3
import os
import uuid
from datetime import datetime
import hashlib
from PIL import Image
import json

# Database configuration
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traceback_100k.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
PROFILE_UPLOAD_FOLDER = os.path.join(UPLOAD_FOLDER, 'profiles')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Ensure upload directories exist
os.makedirs(PROFILE_UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_profile_image(file):
    """Save uploaded profile image with security checks"""
    if not file or file.filename == '':
        return None, "No file selected"
    
    if not allowed_file(file.filename):
        return None, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    if file_length > MAX_FILE_SIZE:
        return None, f"File size exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit"
    file.seek(0)
    
    try:
        # Generate unique filename
        file_extension = secure_filename(file.filename).rsplit('.', 1)[1].lower()
        unique_filename = f"profile_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(PROFILE_UPLOAD_FOLDER, unique_filename)
        
        # Save and validate image
        file.save(file_path)
        
        # Validate it's actually an image and resize if needed
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Resize if too large (max 800x800 for profiles)
            max_size = (800, 800)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            img.save(file_path, optimize=True, quality=85)
        
        return unique_filename, None
        
    except Exception as e:
        # Clean up file if it was created
        if os.path.exists(file_path):
            os.remove(file_path)
        return None, f"Error processing image: {str(e)}"

def get_user_profile(user_id):
    """Get complete user profile by ID"""
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH, timeout=20.0)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, email, first_name, last_name, full_name, student_id,
                   profile_image, bio, interests, phone_number, year_of_study, 
                   major, building_preference, notification_preferences, 
                   privacy_settings, profile_completed, profile_updated_at,
                   created_at, last_login, is_verified
            FROM users 
            WHERE id = ? AND is_active = 1
        """, (user_id,))
        
        user = cursor.fetchone()
        
        if user:
            user_dict = dict(user)
            # Add profile image URL if image exists
            if user_dict['profile_image']:
                user_dict['profile_image_url'] = f"/api/uploads/profiles/{user_dict['profile_image']}"
            return user_dict
        return None
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return None
    finally:
        if conn:
            conn.close()

def update_user_profile(user_id, profile_data):
    """Update user profile with new data"""
    conn = None
    try:
        # Use timeout and isolation level to prevent locking
        conn = sqlite3.connect(DB_PATH, timeout=20.0, isolation_level='DEFERRED')
        conn.execute('PRAGMA journal_mode=WAL')  # Write-Ahead Logging for better concurrency
        cursor = conn.cursor()
        
        # Build dynamic update query
        update_fields = []
        update_values = []
        
        allowed_fields = {
            'first_name', 'last_name', 'student_id', 'bio', 'interests', 'phone_number', 
            'year_of_study', 'major', 'building_preference', 
            'notification_preferences', 'privacy_settings', 'profile_image'
        }
        
        for field, value in profile_data.items():
            if field in allowed_fields and value is not None:
                update_fields.append(f"{field} = ?")
                update_values.append(value)
        
        if not update_fields:
            return False, "No valid fields to update"
        
        # Add profile completion check
        if len([f for f in ['first_name', 'last_name', 'bio'] if f in profile_data]) > 0:
            update_fields.append("profile_completed = ?")
            update_values.append(True)
        
        # Add timestamp
        update_fields.append("profile_updated_at = ?")
        update_values.append(datetime.now().isoformat())
        
        # Update full_name if first_name or last_name changed
        if 'first_name' in profile_data or 'last_name' in profile_data:
            # Get current names
            cursor.execute("SELECT first_name, last_name FROM users WHERE id = ?", (user_id,))
            current = cursor.fetchone()
            if current:
                new_first = profile_data.get('first_name', current[0])
                new_last = profile_data.get('last_name', current[1])
                update_fields.append("full_name = ?")
                update_values.append(f"{new_first} {new_last}")
        
        update_values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ? AND is_active = 1"
        cursor.execute(query, update_values)
        
        success = cursor.rowcount > 0
        conn.commit()
        
        return success, "Profile updated successfully" if success else "User not found"
        
    except sqlite3.OperationalError as e:
        print(f"Database operational error: {e}")
        return False, f"Database error: {str(e)}"
    except Exception as e:
        print(f"Error updating profile: {e}")
        return False, f"Error updating profile: {str(e)}"
    finally:
        if conn:
            conn.close()

def create_profile_endpoints(app):
    """Add profile management endpoints to Flask app"""
    
    @app.route('/api/profile/<int:user_id>', methods=['GET'])
    def get_profile(user_id):
        """Get user profile"""
        try:
            profile = get_user_profile(user_id)
            if profile:
                return jsonify({
                    'success': True,
                    'profile': profile
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Profile not found'
                }), 404
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error retrieving profile: {str(e)}'
            }), 500
    
    @app.route('/api/profile/<int:user_id>', methods=['PUT'])
    def update_profile(user_id):
        """Update user profile - validates that student ID matches first and last name"""
        conn = None
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400
            
            # Get current user data to verify identity
            try:
                conn = sqlite3.connect(DB_PATH, timeout=20.0)
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT first_name, last_name, student_id 
                    FROM users 
                    WHERE id = ? AND is_active = 1
                ''', (user_id,))
                user = cursor.fetchone()
            except sqlite3.Error as db_error:
                if conn:
                    conn.close()
                print(f"Database error during validation: {db_error}")
                return jsonify({
                    'success': False,
                    'message': 'Unable to update profile. Please try again.'
                }), 500
            finally:
                if conn:
                    conn.close()
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 404
            
            current_first_name, current_last_name, current_student_id = user
            
            # If student_id is being provided/updated, verify it matches the name
            student_id_to_check = data.get('student_id', current_student_id)
            
            if student_id_to_check and current_student_id:
                # For existing users updating profile, verify student ID matches their registered name
                if student_id_to_check != current_student_id:
                    return jsonify({
                        'success': False,
                        'message': 'Unable to update profile. Please verify your information.'
                    }), 403
            
            # If first_name or last_name are being changed, verify with student_id
            new_first_name = data.get('first_name', current_first_name)
            new_last_name = data.get('last_name', current_last_name)
            
            if (new_first_name != current_first_name or new_last_name != current_last_name):
                # Name change detected - require student ID validation
                if not student_id_to_check:
                    return jsonify({
                        'success': False,
                        'message': 'Unable to update profile. Please verify your information.'
                    }), 400
                
                # Verify the student ID matches the current user's ID
                if current_student_id and student_id_to_check != current_student_id:
                    return jsonify({
                        'success': False,
                        'message': 'Unable to update profile. Please verify your information.'
                    }), 403
            
            try:
                success, message = update_user_profile(user_id, data)
            except sqlite3.Error as db_error:
                print(f"Database error during update: {db_error}")
                return jsonify({
                    'success': False,
                    'message': 'Unable to update profile. Please try again.'
                }), 500
            
            if success:
                # Return updated profile
                try:
                    updated_profile = get_user_profile(user_id)
                    return jsonify({
                        'success': True,
                        'message': message,
                        'profile': updated_profile
                    })
                except sqlite3.Error as db_error:
                    print(f"Database error fetching updated profile: {db_error}")
                    return jsonify({
                        'success': False,
                        'message': 'Profile updated but unable to retrieve updated data.'
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 400
                
        except Exception as e:
            print(f"Unexpected error in update_profile: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Unable to update profile. Please try again.'
            }), 500
    
    @app.route('/api/profile/<int:user_id>/image', methods=['POST'])
    def upload_profile_image(user_id):
        """Upload profile image"""
        try:
            if 'image' not in request.files:
                return jsonify({
                    'success': False,
                    'message': 'No image file provided'
                }), 400
            
            file = request.files['image']
            filename, error = save_profile_image(file)
            
            if error:
                return jsonify({
                    'success': False,
                    'message': error
                }), 400
            
            # Update user's profile image in database
            success, message = update_user_profile(user_id, {'profile_image': filename})
            
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Profile image uploaded successfully',
                    'filename': filename,
                    'image_url': f'/api/uploads/profiles/{filename}'
                })
            else:
                # Clean up uploaded file if database update failed
                file_path = os.path.join(PROFILE_UPLOAD_FOLDER, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                return jsonify({
                    'success': False,
                    'message': 'Failed to update profile image in database'
                }), 500
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error uploading image: {str(e)}'
            }), 500
    
    @app.route('/api/profile/<int:user_id>/image', methods=['DELETE'])
    def delete_profile_image(user_id):
        """Delete profile image"""
        try:
            # Get current profile image
            profile = get_user_profile(user_id)
            if not profile or not profile.get('profile_image'):
                return jsonify({
                    'success': False,
                    'message': 'No profile image to delete'
                }), 404
            
            current_image = profile['profile_image']
            
            # Remove from database
            success, message = update_user_profile(user_id, {'profile_image': None})
            
            if success:
                # Delete physical file
                file_path = os.path.join(PROFILE_UPLOAD_FOLDER, current_image)
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                return jsonify({
                    'success': True,
                    'message': 'Profile image deleted successfully'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': message
                }), 500
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error deleting image: {str(e)}'
            }), 500
    
    @app.route('/api/uploads/profiles/<filename>')
    def serve_profile_image(filename):
        """Serve profile images"""
        try:
            return send_from_directory(PROFILE_UPLOAD_FOLDER, filename)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Image not found'
            }), 404
    
    @app.route('/api/profiles/stats', methods=['GET'])
    def get_profile_stats():
        """Get profile completion statistics"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Get profile completion stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN profile_completed = 1 THEN 1 ELSE 0 END) as completed_profiles,
                    SUM(CASE WHEN profile_image IS NOT NULL THEN 1 ELSE 0 END) as users_with_images
                FROM users 
                WHERE is_active = 1
            """)
            
            stats = cursor.fetchone()
            conn.close()
            
            total_users, completed_profiles, users_with_images = stats
            
            return jsonify({
                'success': True,
                'stats': {
                    'total_users': total_users,
                    'completed_profiles': completed_profiles,
                    'users_with_images': users_with_images,
                    'completion_rate': round((completed_profiles / total_users * 100), 2) if total_users > 0 else 0,
                    'image_rate': round((users_with_images / total_users * 100), 2) if total_users > 0 else 0
                }
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error getting stats: {str(e)}'
            }), 500

if __name__ == "__main__":
    # Test the functions
    print("Profile management module loaded successfully!")
    print(f"Upload folder: {PROFILE_UPLOAD_FOLDER}")
    print(f"Database: {DB_PATH}")