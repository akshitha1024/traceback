#!/usr/bin/env python3
"""
Quick script to check user existence and fix login issues
"""

import sqlite3
import sys
import os

# Database path
DB_PATH = "traceback_100k.db"

def check_user_exists():
    """Check if the user exists in database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ Users table does not exist!")
            conn.close()
            return
            
        print("✅ Users table exists")
        
        # Check for the specific user
        email = 'achapala@kent.edu'
        cursor.execute("SELECT email, first_name, last_name, is_verified FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if user:
            print(f"✅ User found: {user}")
        else:
            print(f"❌ User '{email}' not found")
            
        # List all users
        cursor.execute("SELECT email, first_name, last_name, is_verified FROM users")
        all_users = cursor.fetchall()
        print(f"\n📋 Total users in database: {len(all_users)}")
        
        for i, user in enumerate(all_users[:5]):  # Show first 5 users
            print(f"  {i+1}. {user[0]} - {user[1]} {user[2]} (verified: {user[3]})")
            
        if len(all_users) > 5:
            print(f"  ... and {len(all_users) - 5} more users")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def create_test_user():
    """Create a test user if needed"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Hash password
        import hashlib
        password_hash = hashlib.sha256("password123".encode()).hexdigest()
        
        # Create user
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (email, password_hash, first_name, last_name, full_name, is_verified, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ('achapala@kent.edu', password_hash, 'Akshitha', 'Chapalamadugu', 'Akshitha Chapalamadugu', True, True))
        
        conn.commit()
        conn.close()
        print("✅ Test user created/updated successfully!")
        print("📧 Email: achapala@kent.edu")
        print("🔑 Password: password123")
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")

if __name__ == "__main__":
    print("🔍 Checking user database...")
    check_user_exists()
    
    print("\n" + "="*50)
    print("🛠️ Creating/updating test user...")
    create_test_user()
    
    print("\n" + "="*50)
    print("🔍 Checking again after creation...")
    check_user_exists()