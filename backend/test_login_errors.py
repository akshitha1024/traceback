"""
Test Login Error Messages for TrackeBack
Demonstrates different error responses for login scenarios
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_login_scenarios():
    """Test different login scenarios to show error messages"""
    print("🧪 Testing TrackeBack Login Error Messages")
    print("=" * 60)
    
    # Test scenarios
    scenarios = [
        {
            "name": "Unregistered Email",
            "email": "notregistered@kent.edu",
            "password": "anypassword123",
            "expected": "Email not found. Please sign up first."
        },
        {
            "name": "Registered Email + Wrong Password", 
            "email": "test.student@kent.edu",  # This user exists in database
            "password": "wrongpassword123",
            "expected": "Invalid credentials. Please check your password."
        },
        {
            "name": "Registered Email + Correct Password",
            "email": "test.student@kent.edu",
            "password": "testpassword123",  # Correct password for test user
            "expected": "Login successful"
        },
        {
            "name": "Non-Kent Email",
            "email": "user@gmail.com",
            "password": "anypassword",
            "expected": "Only Kent State (@kent.edu) email addresses are allowed"
        },
        {
            "name": "Empty Fields",
            "email": "",
            "password": "",
            "expected": "Email and password are required"
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n🔍 Test {i}: {scenario['name']}")
        print("-" * 40)
        print(f"Email: {scenario['email']}")
        print(f"Password: {'*' * len(scenario['password'])}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={
                    "email": scenario["email"],
                    "password": scenario["password"]
                },
                headers={"Content-Type": "application/json"}
            )
            
            result = response.json()
            status_code = response.status_code
            
            print(f"Status Code: {status_code}")
            
            if status_code == 200:
                print(f"✅ Response: {result.get('message', 'Login successful')}")
                if 'user' in result:
                    print(f"   User: {result['user'].get('name', 'Unknown')}")
            else:
                error_message = result.get('error', 'Unknown error')
                print(f"❌ Error: {error_message}")
                
                # Check if error matches expected
                if scenario['expected'].lower() in error_message.lower():
                    print(f"✅ Correct error message!")
                else:
                    print(f"⚠️ Expected: {scenario['expected']}")
                    
        except Exception as e:
            print(f"❌ Connection Error: {e}")
    
    print(f"\n📋 Summary of Error Messages:")
    print("1. Unregistered user: 'Email not found. Please sign up first.'")
    print("2. Wrong password: 'Invalid credentials. Please check your password.'")
    print("3. Non-Kent email: 'Only Kent State (@kent.edu) email addresses are allowed'")
    print("4. Empty fields: 'Email and password are required'")
    print("5. Successful login: 'Login successful' + user data")

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
        print("Make sure the Flask backend is running!")
        return False

if __name__ == "__main__":
    print("🚀 TrackeBack Login Error Message Test")
    print("=" * 70)
    
    # Check server connection first
    if test_server_connection():
        test_login_scenarios()
    else:
        print("\n⚠️ Please start the backend server first:")
        print("   python comprehensive_app.py")
    
    print("\n🎉 Test completed!")