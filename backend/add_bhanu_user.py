#!/usr/bin/env python3
"""
Add Bhanu Prasad user to the database
"""

import sqlite3
import bcrypt
from datetime import datetime

DB_PATH = 'traceback_100k.db'

def add_bhanu_user():
    """Add Bhanu Prasad user"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # User details
        first_name = "Bhanu"
        last_name = "Prasad"
        full_name = "Bhanu Prasad, Dharavathu"
        email = "bdharav1@kent.edu"
        password = "Bhanup"
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"⚠️  User {email} already exists with ID: {existing[0]}")
            conn.close()
            return
        
        # Hash the password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert user
        cursor.execute('''
            INSERT INTO users (
                first_name, 
                last_name, 
                full_name,
                email, 
                password_hash,
                is_verified,
                is_active,
                profile_completed,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            first_name,
            last_name,
            full_name,
            email,
            password_hash,
            1,  # is_verified
            1,  # is_active
            0,  # profile_completed
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        print("\n✅ User created successfully!")
        print("=" * 50)
        print(f"User ID: {user_id}")
        print(f"Name: {full_name}")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"First Name: {first_name}")
        print(f"Last Name: {last_name}")
        print("=" * 50)
        
        # Show database status
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        print(f"\n📊 Total Users in Database: {total_users}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    add_bhanu_user()
