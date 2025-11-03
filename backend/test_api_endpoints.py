"""
Test API endpoints for email verification
"""

import json
import subprocess
import sys

def test_api_with_curl():
    print("🌐 Testing TrackeBack API Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Check if server is running
    print("1️⃣ Testing server connectivity...")
    try:
        result = subprocess.run([
            'curl', '-s', f'{base_url}/'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("✅ Server is running!")
            try:
                response = json.loads(result.stdout)
                print(f"   Message: {response.get('message', 'N/A')}")
            except:
                print(f"   Response: {result.stdout[:100]}...")
        else:
            print("❌ Server not responding")
            print("   Make sure Flask server is running on localhost:5000")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Request timed out")
        return False
    except FileNotFoundError:
        print("❌ curl command not found")
        print("   Using Python alternative...")
        return test_with_python()
    
    # Test 2: Send verification code
    print("\n2️⃣ Testing send verification endpoint...")
    test_email = input("Enter a @kent.edu email to test: ").strip()
    
    if not test_email.endswith('@kent.edu'):
        print("❌ Must be a @kent.edu email")
        return False
    
    payload = {
        "email": test_email,
        "item_title": "API Test Item",
        "item_type": "lost",
        "item_id": 88888
    }
    
    try:
        # Create curl command for sending verification
        curl_cmd = [
            'curl', '-X', 'POST',
            f'{base_url}/api/send-verification',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps(payload),
            '-s'
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=15)
        
        if result.returncode == 0:
            try:
                response = json.loads(result.stdout)
                if 'message' in response:
                    print(f"✅ {response['message']}")
                    print("📱 Check your email for the verification code!")
                    
                    # Test verification
                    code = input("\nEnter the verification code you received: ").strip()
                    if code:
                        return test_verification(base_url, test_email, code)
                    else:
                        print("No code entered, skipping verification test")
                        return True
                else:
                    print(f"❌ Error: {response.get('error', 'Unknown error')}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid response: {result.stdout}")
                return False
        else:
            print(f"❌ Request failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_verification(base_url, email, code):
    print(f"\n3️⃣ Testing verification with code: {code}")
    
    payload = {
        "email": email,
        "code": code
    }
    
    try:
        curl_cmd = [
            'curl', '-X', 'POST',
            f'{base_url}/api/verify-email',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps(payload),
            '-s'
        ]
        
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                response = json.loads(result.stdout)
                if response.get('verified'):
                    print(f"✅ {response['message']}")
                    return True
                else:
                    print(f"❌ {response.get('error', 'Verification failed')}")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Invalid response: {result.stdout}")
                return False
        else:
            print(f"❌ Request failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_with_python():
    print("\n🐍 Testing with Python (alternative to curl)")
    
    try:
        import urllib.request
        import urllib.parse
        
        # Test server
        url = "http://localhost:5000/"
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                data = response.read().decode()
                print("✅ Server is running!")
                return True
        except Exception as e:
            print(f"❌ Cannot reach server: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Python test failed: {str(e)}")
        return False

def check_database_for_codes():
    print("\n📊 Checking database for recent verification codes...")
    
    try:
        import sqlite3
        
        conn = sqlite3.connect('trackeback_100k.db')
        cursor = conn.cursor()
        
        # Get recent verification codes
        cursor.execute("""
            SELECT email, verification_code, created_at, is_verified, attempts
            FROM email_verifications 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        
        results = cursor.fetchall()
        
        if results:
            print("Recent verification codes:")
            for email, code, created, verified, attempts in results:
                status = "✅ Verified" if verified else "⏳ Pending"
                print(f"   {email}: {code} ({created}) - {status} ({attempts} attempts)")
        else:
            print("No verification codes found in database")
            print("This might indicate emails aren't being processed through the API")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")

def main():
    print("🧪 TrackeBack API Test Suite")
    print("=" * 60)
    
    # Check if server is running first
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 5000))
        sock.close()
        
        if result != 0:
            print("❌ Flask server is not running on localhost:5000")
            print("   Please start the server first: python comprehensive_app.py")
            return
    except Exception as e:
        print(f"❌ Cannot check server status: {str(e)}")
        return
    
    # Run API tests
    success = test_api_with_curl()
    
    if success:
        print("\n🎉 API endpoints are working correctly!")
    else:
        print("\n❌ API endpoints have issues")
    
    # Check database regardless
    check_database_for_codes()
    
    print("\n" + "="*60)
    print("💡 Troubleshooting Tips:")
    print("1. Make sure Flask server is running")
    print("2. Check spam folder for verification emails")
    print("3. Verify @kent.edu email address is correct")
    print("4. Check server logs for error messages")
    print("5. Try the React frontend EmailVerification component")

if __name__ == "__main__":
    main()