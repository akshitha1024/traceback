#!/usr/bin/env python3
"""
Test login functionality
"""

import requests
import json

def test_login():
    """Test the login endpoint"""
    url = "http://localhost:5000/api/auth/login"
    
    data = {
        "email": "achapala@kent.edu",
        "password": "password123"
    }
    
    print("🔑 Testing login...")
    print(f"📧 Email: {data['email']}")
    print(f"🔐 Password: {data['password']}")
    
    try:
        response = requests.post(url, json=data)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            result = response.json()
            print(f"📝 Response: {result}")
        else:
            print("❌ Login failed!")
            try:
                error = response.json()
                print(f"💥 Error: {error}")
            except:
                print(f"💥 Raw response: {response.text}")
                
    except Exception as e:
        print(f"🚨 Connection error: {e}")

if __name__ == "__main__":
    test_login()