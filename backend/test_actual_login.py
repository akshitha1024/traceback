#!/usr/bin/env python3
"""
Test actual login request to debug the issue
"""

import requests
import json

def test_login():
    url = "http://localhost:5000/api/auth/login"
    
    # Test data
    login_data = {
        "email": "achapala@kent.edu",
        "password": "password123"
    }
    
    print(f"🌐 Testing login to: {url}")
    print(f"📧 Email: {login_data['email']}")
    print(f"🔑 Password: {login_data['password']}")
    
    try:
        response = requests.post(url, json=login_data, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"💬 Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📝 Response Text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_login()