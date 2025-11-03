#!/usr/bin/env python3
"""
Test what data is actually being returned by the API endpoints
"""

import requests
import json

def test_api_endpoints():
    base_url = "http://localhost:5000"
    
    print("🔍 Testing Found Items API...")
    try:
        response = requests.get(f"{base_url}/api/found-items?limit=2")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Found {len(data.get('items', []))} items")
            
            if data.get('items'):
                item = data['items'][0]
                print(f"📋 Sample item fields:")
                for key, value in item.items():
                    print(f"  {key}: {value}")
                    
                print(f"\n🔍 Key fields for type detection:")
                print(f"  finder_name: {item.get('finder_name')}")
                print(f"  finder_email: {item.get('finder_email')}")
                print(f"  user_name: {item.get('user_name')}")
                print(f"  user_email: {item.get('user_email')}")
                print(f"  is_private: {item.get('is_private')}")
                print(f"  privacy_expires_at: {item.get('privacy_expires_at')}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n🔍 Testing Lost Items API...")
    try:
        response = requests.get(f"{base_url}/api/lost-items?limit=2")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Found {len(data.get('items', []))} items")
            
            if data.get('items'):
                item = data['items'][0]
                print(f"📋 Sample item fields:")
                for key, value in item.items():
                    print(f"  {key}: {value}")
                    
                print(f"\n🔍 Key fields for type detection:")
                print(f"  finder_name: {item.get('finder_name')}")
                print(f"  finder_email: {item.get('finder_email')}")
                print(f"  user_name: {item.get('user_name')}")
                print(f"  user_email: {item.get('user_email')}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_api_endpoints()