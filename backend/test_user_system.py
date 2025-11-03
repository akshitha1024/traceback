"""
Test script for TrackeBack user registration and login system
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_user_registration():
    """Test user registration with database storage"""
    print("🧪 Testing User Registration")
    print("=" * 50)
    
    # Test data
    user_data = {
        "email": "jane.smith@kent.edu",
        "password": "testpassword123",
        "firstName": "Jane",
        "lastName": "Smith"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            return user_data
        else:
            print("❌ Registration failed!")
            return None
            
    except Exception as e:
        print(f"❌ Error during registration: {e}")
        return None

def test_user_login(user_data):
    """Test user login with database verification"""
    print("\n🧪 Testing User Login")
    print("=" * 50)
    
    if not user_data:
        print("❌ No user data to test login")
        return
    
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
        else:
            print("❌ Login failed!")
            
    except Exception as e:
        print(f"❌ Error during login: {e}")

def test_email_verification():
    """Test email verification sending"""
    print("\n🧪 Testing Email Verification")
    print("=" * 50)
    
    email_data = {
        "email": "jane.smith@kent.edu"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/resend",
            json=email_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Email verification sent!")
        else:
            print("❌ Email verification failed!")
            
    except Exception as e:
        print(f"❌ Error during email verification: {e}")

def test_server_health():
    """Test if server is responding"""
    print("🧪 Testing Server Health")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Server is healthy!")
            return True
        else:
            print("❌ Server health check failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")
        return False

if __name__ == "__main__":
    print("🚀 TrackeBack User System Test Suite")
    print("=" * 60)
    
    # Test server health first
    if not test_server_health():
        print("❌ Server is not responding. Make sure it's running on localhost:5000")
        exit(1)
    
    # Test user registration
    user_data = test_user_registration()
    
    # Test user login
    test_user_login(user_data)
    
    # Test email verification
    test_email_verification()
    
    print("\n🎉 Test suite completed!")