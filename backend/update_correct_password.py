#!/usr/bin/env python3
"""
Update password for achapala@kent.edu with the correct password: Aksh@1024
"""

import sqlite3
import hashlib
from user_management import hash_password

def update_password():
    email = "achapala@kent.edu"
    correct_password = "Aksh@1024"
    
    print(f"🔄 Updating password for {email}")
    print(f"🔑 New password: {correct_password}")
    
    # Generate hash for the correct password
    password_hash = hash_password(correct_password)
    print(f"🔨 Generated hash: {password_hash}")
    
    # Update in database
    conn = sqlite3.connect('trackeback_100k.db')
    c = conn.cursor()
    
    # Update the password
    c.execute('''
        UPDATE users 
        SET password_hash = ? 
        WHERE email = ?
    ''', (password_hash, email))
    
    rows_updated = c.rowcount
    conn.commit()
    
    print(f"✅ Updated {rows_updated} user(s)")
    
    # Verify the update
    c.execute('SELECT email, password_hash FROM users WHERE email = ?', (email,))
    user = c.fetchone()
    
    if user:
        print(f"✅ Verification - User: {user[0]}")
        print(f"✅ Verification - Hash: {user[1]}")
        
        # Test password verification
        from user_management import verify_password
        verification_result = verify_password(correct_password, user[1])
        print(f"🔓 Password verification test: {verification_result}")
        
        if verification_result:
            print("🎉 Password update successful!")
        else:
            print("❌ Password verification failed!")
    else:
        print("❌ User not found after update!")
    
    conn.close()

if __name__ == "__main__":
    update_password()