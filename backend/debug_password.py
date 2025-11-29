#!/usr/bin/env python3
"""
Debug password hashing issue
"""

import sqlite3
import hashlib

# Database path
DB_PATH = "traceback_100k.db"

def debug_password():
    """Debug the password hashing issue"""
    print("🔍 Debugging password hashing...")
    
    # Test password
    test_password = "password123"
    
    # Hash it the same way as in user_management.py
    expected_hash = hashlib.sha256(test_password.encode()).hexdigest()
    print(f"📝 Test password: '{test_password}'")
    print(f"🔐 Expected hash: {expected_hash}")
    
    # Check what's stored in database
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT email, password_hash FROM users WHERE email = ?", ('achapala@kent.edu',))
        user = cursor.fetchone()
        
        if user:
            stored_email, stored_hash = user
            print(f"📧 Stored email: {stored_email}")
            print(f"🔐 Stored hash: {stored_hash}")
            print(f"✅ Hashes match: {expected_hash == stored_hash}")
            
            # Test verification function
            from user_management import verify_password
            verification_result = verify_password(test_password, stored_hash)
            print(f"🔑 Verification result: {verification_result}")
            
        else:
            print("❌ User not found")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def fix_password():
    """Fix the password by updating it properly"""
    print("\n🛠️ Fixing password...")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Hash password correctly
        password = "password123"
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Update the user
        cursor.execute('''
            UPDATE users 
            SET password_hash = ?
            WHERE email = ?
        ''', (password_hash, 'achapala@kent.edu'))
        
        if cursor.rowcount > 0:
            conn.commit()
            print(f"✅ Password updated for achapala@kent.edu")
            print(f"🔑 New password: {password}")
            print(f"🔐 New hash: {password_hash}")
        else:
            print("❌ No user updated")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error fixing password: {e}")

if __name__ == "__main__":
    debug_password()
    fix_password()
    print("\n" + "="*50)
    print("🔍 Checking again after fix...")
    debug_password()