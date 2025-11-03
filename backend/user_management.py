"""
Create users table and user management functions for TrackeBack
"""

import sqlite3
import hashlib
import os
from datetime import datetime

DB_PATH = "trackeback_100k.db"

def create_users_table():
    """Create users table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            full_name TEXT NOT NULL,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        )
    ''')
    
    # Create index for faster lookups
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified)')
    
    conn.commit()
    conn.close()
    print("✅ Users table created successfully!")

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == password_hash

def create_user(email, password, first_name, last_name):
    """Create a new user in the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return False, "User with this email already exists"
        
        # Hash password
        password_hash = hash_password(password)
        full_name = f"{first_name} {last_name}".strip()
        
        # Insert new user
        cursor.execute('''
            INSERT INTO users (email, password_hash, first_name, last_name, full_name)
            VALUES (?, ?, ?, ?, ?)
        ''', (email, password_hash, first_name, last_name, full_name))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return True, {
            'id': user_id,
            'email': email,
            'name': full_name,
            'first_name': first_name,
            'last_name': last_name,
            'is_verified': False
        }
        
    except Exception as e:
        return False, f"Database error: {str(e)}"

def get_user_by_email(email):
    """Get user by email"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, email, password_hash, first_name, last_name, full_name, 
                   is_verified, created_at, last_login, is_active
            FROM users WHERE email = ?
        ''', (email,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return dict(user)
        return None
        
    except Exception as e:
        print(f"Error getting user: {e}")
        return None

def verify_user_email(email):
    """Mark user as email verified"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users SET is_verified = TRUE WHERE email = ?
        ''', (email,))
        
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return rows_affected > 0
        
    except Exception as e:
        print(f"Error verifying user email: {e}")
        return False

def update_last_login(email):
    """Update user's last login timestamp"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?
        ''', (email,))
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error updating last login: {e}")
        return False

def get_user_stats():
    """Get user statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Total users
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        # Verified users
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = TRUE')
        verified_users = cursor.fetchone()[0]
        
        # Active users (logged in recently)
        cursor.execute('''
            SELECT COUNT(*) FROM users 
            WHERE last_login > datetime('now', '-30 days')
        ''')
        active_users = cursor.fetchone()[0]
        
        # Recent registrations (last 7 days)
        cursor.execute('''
            SELECT COUNT(*) FROM users 
            WHERE created_at > datetime('now', '-7 days')
        ''')
        recent_registrations = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'total_users': total_users,
            'verified_users': verified_users,
            'active_users': active_users,
            'recent_registrations': recent_registrations
        }
        
    except Exception as e:
        print(f"Error getting user stats: {e}")
        return None

def list_users(limit=50, verified_only=False):
    """List users with optional filters"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = '''
            SELECT id, email, first_name, last_name, full_name, 
                   is_verified, created_at, last_login
            FROM users
        '''
        
        if verified_only:
            query += ' WHERE is_verified = TRUE'
        
        query += ' ORDER BY created_at DESC LIMIT ?'
        
        cursor.execute(query, (limit,))
        users = cursor.fetchall()
        conn.close()
        
        return [dict(user) for user in users]
        
    except Exception as e:
        print(f"Error listing users: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Setting up TrackeBack User Management System")
    print("=" * 60)
    
    # Create users table
    create_users_table()
    
    # Test user creation
    print("\n🧪 Testing user creation...")
    success, result = create_user(
        "test.student@kent.edu",
        "testpassword123",
        "Test",
        "Student"
    )
    
    if success:
        print(f"✅ Test user created: {result}")
        
        # Test user retrieval
        user = get_user_by_email("test.student@kent.edu")
        if user:
            print(f"✅ User retrieved: {user['full_name']}")
        
        # Test email verification
        if verify_user_email("test.student@kent.edu"):
            print("✅ Email verification status updated")
            
    else:
        print(f"❌ User creation failed: {result}")
    
    # Show user stats
    stats = get_user_stats()
    if stats:
        print(f"\n📊 User Statistics:")
        print(f"   Total Users: {stats['total_users']}")
        print(f"   Verified Users: {stats['verified_users']}")
        print(f"   Active Users: {stats['active_users']}")
        print(f"   Recent Registrations: {stats['recent_registrations']}")
    
    print("\n✅ User management system ready!")