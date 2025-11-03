"""
Quick Test: Check if Lost and Found Items are Loading from Database
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_items_loading():
    """Test if lost and found items are loading from the database"""
    print("🔍 Testing TrackeBack Items Loading")
    print("=" * 50)
    
    try:
        # Test Lost Items
        print("📱 Testing Lost Items...")
        lost_response = requests.get(f"{BASE_URL}/api/lost-items?limit=5")
        
        if lost_response.status_code == 200:
            lost_data = lost_response.json()
            lost_count = len(lost_data.get('items', []))
            total_lost = lost_data.get('total', 0)
            
            print(f"✅ Lost Items API Working:")
            print(f"   Items Retrieved: {lost_count}")
            print(f"   Total Lost Items: {total_lost:,}")
            
            if lost_count > 0:
                sample_item = lost_data['items'][0]
                print(f"   Sample Item: {sample_item.get('title', 'N/A')}")
                print(f"   Location: {sample_item.get('location', 'N/A')}")
                print(f"   Email: {sample_item.get('email', 'N/A')}")
        else:
            print(f"❌ Lost Items API Error: {lost_response.status_code}")
        
        # Test Found Items
        print(f"\n📦 Testing Found Items...")
        found_response = requests.get(f"{BASE_URL}/api/found-items?limit=5")
        
        if found_response.status_code == 200:
            found_data = found_response.json()
            found_count = len(found_data.get('items', []))
            total_found = found_data.get('total', 0)
            
            print(f"✅ Found Items API Working:")
            print(f"   Items Retrieved: {found_count}")
            print(f"   Total Found Items: {total_found:,}")
            
            if found_count > 0:
                sample_item = found_data['items'][0]
                print(f"   Sample Item: {sample_item.get('title', 'N/A')}")
                print(f"   Location: {sample_item.get('location', 'N/A')}")
                print(f"   Email: {sample_item.get('email', 'N/A')}")
        else:
            print(f"❌ Found Items API Error: {found_response.status_code}")
        
        # Test Stats
        print(f"\n📊 Testing Database Stats...")
        stats_response = requests.get(f"{BASE_URL}/api/stats")
        
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"✅ Database Statistics:")
            print(f"   Total Lost Items: {stats.get('total_lost_items', 0):,}")
            print(f"   Total Found Items: {stats.get('total_found_items', 0):,}")
            print(f"   Total Items: {stats.get('total_items', 0):,}")
            print(f"   Recent Lost Items: {stats.get('recent_lost_items', 0)}")
            print(f"   Recent Found Items: {stats.get('recent_found_items', 0)}")
        else:
            print(f"❌ Stats API Error: {stats_response.status_code}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("Make sure the Flask backend is running!")

def test_server_connection():
    """Check if server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running on http://localhost:5000")
            return True
        else:
            print("❌ Server health check failed")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

if __name__ == "__main__":
    print("🚀 TrackeBack Items Loading Test")
    print("=" * 60)
    
    if test_server_connection():
        test_items_loading()
    else:
        print("\n⚠️ Server is not running!")
    
    print("\n🎉 Test completed!")