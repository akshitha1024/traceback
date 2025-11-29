#!/usr/bin/env python3
"""
Test password verification for achapala@kent.edu
"""

import sqlite3
import hashlib
from user_management import verify_password

def test_password_verification():
    # Test the password we should be using
    test_password = "password123"
    
    # Get the stored hash from database
    conn = sqlite3.connect('traceback_100k.db')
    c = conn.cursor()
    
    c.execute('SELECT email, password_hash FROM users WHERE email = ?', ('achapala@kent.edu',))
    user = c.fetchone()
    
    if not user:
        print("❌ User not found!")
        return
    
    email, stored_hash = user
    print(f"✅ User found: {email}")
    print(f"📄 Stored hash: {stored_hash}")
    
    # Test manual hash generation
    manual_hash = hashlib.sha256(test_password.encode()).hexdigest()
    print(f"🔨 Manual hash of '{test_password}': {manual_hash}")
    
    # Test with verify_password function
    verification_result = verify_password(test_password, stored_hash)
    print(f"🔍 verify_password result: {verification_result}")
    
    # Check if hashes match
    print(f"🔧 Hashes match manually: {manual_hash == stored_hash}")
    
    # Try some other common passwords just in case
    other_passwords = ["password", "123456", "Password123", "PASSWORD123"]
    for pwd in other_passwords:
        test_hash = hashlib.sha256(pwd.encode()).hexdigest()
        if test_hash == stored_hash:
            print(f"🎯 FOUND MATCHING PASSWORD: '{pwd}'")
            break
    else:
        print("❌ No common passwords match")
    
    conn.close()

if __name__ == "__main__":
    test_password_verification()