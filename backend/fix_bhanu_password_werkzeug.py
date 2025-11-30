#!/usr/bin/env python3
"""
Fix Bhanu Prasad user password using Werkzeug
"""

import sqlite3
from werkzeug.security import generate_password_hash

DB_PATH = 'traceback_100k.db'

def fix_bhanu_password_werkzeug():
    """Fix Bhanu Prasad user password using Werkzeug"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        email = "bdharav1@kent.edu"
        password = "Bhanup"
        
        # Generate Werkzeug password hash (pbkdf2:sha256)
        password_hash = generate_password_hash(password)
        
        # Update password
        cursor.execute('''
            UPDATE users 
            SET password_hash = ?
            WHERE email = ?
        ''', (password_hash, email))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            print("\n✅ Password updated successfully with Werkzeug hash!")
            print("=" * 50)
            print(f"Email: {email}")
            print(f"Password: {password}")
            print(f"New Hash: {password_hash}")
            print("=" * 50)
            
            # Verify the password works
            from werkzeug.security import check_password_hash
            cursor.execute('SELECT password_hash FROM users WHERE email = ?', (email,))
            stored_hash = cursor.fetchone()[0]
            
            if check_password_hash(stored_hash, password):
                print("\n✅ Password verification successful!")
            else:
                print("\n❌ Password verification failed!")
        else:
            print(f"⚠️  No user found with email: {email}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    fix_bhanu_password_werkzeug()
