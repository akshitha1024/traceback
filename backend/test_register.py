"""
Test the register endpoint to see what's happening
"""

def test_register_endpoint():
    print("🧪 Testing Register Endpoint")
    print("=" * 40)
    
    import json
    
    # Test data that should work
    test_cases = [
        {
            "name": "Complete Data",
            "data": {
                "email": "test.student@kent.edu",
                "password": "testpass123",
                "name": "Test Student"
            }
        },
        {
            "name": "Missing Name",
            "data": {
                "email": "test.student@kent.edu", 
                "password": "testpass123"
            }
        },
        {
            "name": "Empty Name",
            "data": {
                "email": "test.student@kent.edu",
                "password": "testpass123", 
                "name": ""
            }
        },
        {
            "name": "Name with Spaces Only",
            "data": {
                "email": "test.student@kent.edu",
                "password": "testpass123",
                "name": "   "
            }
        }
    ]
    
    try:
        import urllib.request
        import urllib.error
        
        for test_case in test_cases:
            print(f"\n🔍 Testing: {test_case['name']}")
            print(f"   Data: {test_case['data']}")
            
            # Prepare request
            url = "http://localhost:5000/api/auth/register"
            data = json.dumps(test_case['data']).encode('utf-8')
            
            req = urllib.request.Request(
                url, 
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    result = response.read().decode()
                    print(f"   ✅ Success: {result}")
                    
            except urllib.error.HTTPError as e:
                error_body = e.read().decode()
                print(f"   ❌ Error ({e.code}): {error_body}")
                
    except ImportError:
        print("❌ urllib not available for testing")
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

def show_frontend_tips():
    print("\n" + "="*50)
    print("💡 FRONTEND DEBUGGING TIPS")
    print("="*50)
    
    print("\n🔧 Check your frontend form:")
    print("1. Make sure the name field has name='name' or similar")
    print("2. Verify all fields are being captured correctly")
    print("3. Check the network tab in browser dev tools")
    print("4. Look at the actual JSON being sent")
    
    print("\n📝 Expected JSON format:")
    print("""
    {
        "email": "student@kent.edu",
        "password": "yourpassword", 
        "name": "Your Name"
    }
    """)
    
    print("\n🐛 Common issues:")
    print("• Form field names don't match expected keys")
    print("• Name field is empty or contains only spaces")
    print("• Frontend is sending different field names")
    print("• JavaScript form handling not capturing all fields")
    
    print("\n🔍 Debug in browser:")
    print("1. Open Developer Tools (F12)")
    print("2. Go to Network tab")
    print("3. Try to register")
    print("4. Click on the register request")
    print("5. Check the Request payload/body")

if __name__ == "__main__":
    print("🔍 TrackeBack Register Endpoint Test")
    print("=" * 50)
    
    test_register_endpoint()
    show_frontend_tips()