"""
Test API to verify more items are being returned after increasing the limit
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_increased_limits():
    """Test if API now returns more items per page"""
    print("🔍 Testing Increased Item Limits")
    print("=" * 50)
    
    try:
        # Test Lost Items with default limit (should now be 100)
        print("📱 Testing Lost Items (Default Limit)...")
        response = requests.get(f"{BASE_URL}/api/lost-items")
        
        if response.status_code == 200:
            data = response.json()
            items_count = len(data.get('items', []))
            total_items = data.get('pagination', {}).get('total', 0)
            
            print(f"✅ Lost Items Response:")
            print(f"   Items Returned: {items_count}")
            print(f"   Total Available: {total_items:,}")
            print(f"   Pagination: {data.get('pagination', {})}")
            
            if items_count >= 100:
                print("   ✅ More items are now being returned!")
            else:
                print("   ⚠️ Still limited items")
        
        # Test Found Items with default limit
        print(f"\n📦 Testing Found Items (Default Limit)...")
        response = requests.get(f"{BASE_URL}/api/found-items")
        
        if response.status_code == 200:
            data = response.json()
            items_count = len(data.get('items', []))
            total_items = data.get('pagination', {}).get('total', 0)
            
            print(f"✅ Found Items Response:")
            print(f"   Items Returned: {items_count}")
            print(f"   Total Available: {total_items:,}")
            print(f"   Pagination: {data.get('pagination', {})}")
            
            if items_count >= 100:
                print("   ✅ More items are now being returned!")
            else:
                print("   ⚠️ Still limited items")
        
        # Test with explicit high limit
        print(f"\n🔄 Testing with Explicit High Limit (500)...")
        response = requests.get(f"{BASE_URL}/api/lost-items?limit=500")
        
        if response.status_code == 200:
            data = response.json()
            items_count = len(data.get('items', []))
            
            print(f"✅ Lost Items with Limit 500:")
            print(f"   Items Returned: {items_count}")
            print(f"   Maximum Allowed: 500")
            
            if items_count == 500:
                print("   ✅ Maximum items being returned!")
            elif items_count > 100:
                print("   ✅ Increased limit working!")
            else:
                print("   ⚠️ Limit not increased")
                
    except Exception as e:
        print(f"❌ Error: {e}")

def test_api_endpoints():
    """Test the main API endpoints"""
    endpoints = [
        "/api/lost-items",
        "/api/found-items", 
        "/api/stats"
    ]
    
    print(f"\n🔗 Testing API Endpoints:")
    print("-" * 30)
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            status = "✅ Working" if response.status_code == 200 else f"❌ Error {response.status_code}"
            print(f"   {endpoint}: {status}")
        except Exception as e:
            print(f"   {endpoint}: ❌ Failed - {e}")

if __name__ == "__main__":
    print("🚀 TrackeBack API Limit Test")
    print("=" * 60)
    
    test_api_endpoints()
    test_increased_limits()
    
    print(f"\n💡 Frontend Should Now Show More Items!")
    print("   - Default limit increased from 20 to 100 items")
    print("   - Maximum limit increased from 100 to 500 items")
    print("   - Refresh your lost/found items pages to see more items")
    
    print("\n🎉 Test completed!")