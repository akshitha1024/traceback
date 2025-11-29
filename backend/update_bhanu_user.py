#!/usr/bin/env python3
"""
Update Bhanu Prasad user with correct name format
"""

import sqlite3

DB_PATH = 'traceback_100k.db'

def update_bhanu_user():
    """Update Bhanu Prasad user names"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        email = "bdharav1@kent.edu"
        first_name = "Bhanu Prasad"
        last_name = "Dharavathu"
        full_name = f"{first_name} {last_name}"
        
        # Update user
        cursor.execute('''
            UPDATE users 
            SET first_name = ?,
                last_name = ?,
                full_name = ?
            WHERE email = ?
        ''', (first_name, last_name, full_name, email))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            print("\n✅ User updated successfully!")
            print("=" * 50)
            print(f"Email: {email}")
            print(f"First Name: {first_name}")
            print(f"Last Name: {last_name}")
            print(f"Full Name: {full_name}")
            print(f"Password: Bhanup")
            print("=" * 50)
        else:
            print(f"⚠️  No user found with email: {email}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    update_bhanu_user()
