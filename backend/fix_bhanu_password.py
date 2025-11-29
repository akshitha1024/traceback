#!/usr/bin/env python3
"""
Fix Bhanu Prasad user password
"""

import sqlite3
import bcrypt

DB_PATH = 'traceback_100k.db'

def fix_bhanu_password():
    """Fix Bhanu Prasad user password"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        email = "bdharav1@kent.edu"
        password = "Bhanup"
        
        # Generate new password hash
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update password
        cursor.execute('''
            UPDATE users 
            SET password_hash = ?
            WHERE email = ?
        ''', (password_hash, email))
        
        conn.commit()
        
        if cursor.rowcount > 0:
            print("\n✅ Password updated successfully!")
            print("=" * 50)
            print(f"Email: {email}")
            print(f"Password: {password}")
            print(f"New Hash: {password_hash}")
            print("=" * 50)
            
            # Verify the password works
            cursor.execute('SELECT password_hash FROM users WHERE email = ?', (email,))
            stored_hash = cursor.fetchone()[0]
            
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
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
    fix_bhanu_password()
