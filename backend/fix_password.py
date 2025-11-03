#!/usr/bin/env python3
"""
Quick password fix for achapala@kent.edu
"""

import sqlite3
import hashlib

# Database path
DB_PATH = "trackeback_100k.db"

def main():
    print("🔧 Fixing password for achapala@kent.edu...")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Set password
    password = "password123"
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    print(f"🔑 Password: {password}")
    print(f"🔐 Hash: {password_hash}")
    
    # Update user
    cursor.execute('''
        UPDATE users 
        SET password_hash = ?
        WHERE email = ?
    ''', (password_hash, 'achapala@kent.edu'))
    
    print(f"✅ Updated {cursor.rowcount} user(s)")
    
    conn.commit()
    
    # Verify
    cursor.execute('SELECT email, password_hash FROM users WHERE email = ?', ('achapala@kent.edu',))
    user = cursor.fetchone()
    
    if user:
        print(f"✅ Verification: User {user[0]} has hash {user[1]}")
        
        # Test password verification
        test_hash = hashlib.sha256(password.encode()).hexdigest()
        matches = test_hash == user[1]
        print(f"🔍 Password verification test: {matches}")
        
    conn.close()
    print("🎉 Password fix complete!")

if __name__ == "__main__":
    main()