#!/usr/bin/env python3
"""
Test script to verify categories and locations API endpoints
"""

import requests
import json

def test_api_endpoints():
    """Test the categories and locations API endpoints"""
    base_url = "http://localhost:5000"
    
    print("🔍 Testing API endpoints...")
    
    # Test categories endpoint
    try:
        print("\n📱 Testing categories endpoint...")
        response = requests.get(f"{base_url}/api/categories")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Categories loaded: {len(categories)} items")
            for cat in categories[:3]:  # Show first 3
                print(f"  - {cat.get('name', 'Unknown')}")
        else:
            print(f"❌ Categories failed: {response.text}")
    except Exception as e:
        print(f"❌ Categories error: {e}")
    
    # Test locations endpoint
    try:
        print("\n📍 Testing locations endpoint...")
        response = requests.get(f"{base_url}/api/locations")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            locations = response.json()
            print(f"✅ Locations loaded: {len(locations)} items")
            for loc in locations[:3]:  # Show first 3
                print(f"  - {loc.get('name', 'Unknown')}")
        else:
            print(f"❌ Locations failed: {response.text}")
    except Exception as e:
        print(f"❌ Locations error: {e}")

if __name__ == "__main__":
    test_api_endpoints()