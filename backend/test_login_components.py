#!/usr/bin/env python3
"""
Test get_user_by_email and verify_password functions directly
"""

from user_management import get_user_by_email, verify_password

def test_login_components():
    email = "achapala@kent.edu"
    password = "password123"
    
    print(f"🔍 Testing login components for: {email}")
    
    # Test get_user_by_email
    user = get_user_by_email(email)
    
    if not user:
        print("❌ get_user_by_email returned None")
        return
    
    print(f"✅ User found: {user}")
    print(f"📧 Email: {user.get('email')}")
    print(f"👤 Name: {user.get('full_name')}")
    print(f"🔑 Password hash: {user.get('password_hash')}")
    print(f"✅ Active: {user.get('is_active')}")
    print(f"✅ Verified: {user.get('is_verified')}")
    
    # Test password verification
    password_result = verify_password(password, user['password_hash'])
    print(f"🔓 Password verification result: {password_result}")
    
    if password_result:
        print("✅ All components working correctly!")
    else:
        print("❌ Password verification failed!")

if __name__ == "__main__":
    test_login_components()