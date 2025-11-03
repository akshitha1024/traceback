"""
Quick server connectivity test
"""

def test_server():
    print("🔌 Testing Server Connection")
    print("=" * 40)
    
    try:
        import urllib.request
        import urllib.error
        
        # Test basic connectivity
        print("1️⃣ Testing basic connectivity...")
        try:
            with urllib.request.urlopen('http://localhost:5000/', timeout=5) as response:
                data = response.read().decode()
                print("✅ Server is responding!")
                return True
        except urllib.error.URLError as e:
            print(f"❌ Cannot connect to server: {e}")
            print("\n🔧 Possible solutions:")
            print("1. Make sure Flask server is running")
            print("2. Check if port 5000 is blocked")
            print("3. Try using 127.0.0.1:5000 instead of localhost:5000")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
            
    except ImportError:
        print("❌ Cannot test - urllib not available")
        return False

def show_server_info():
    print("\n📊 Server Information")
    print("=" * 40)
    print("🌐 Main URL: http://localhost:5000")
    print("🌐 Alternative: http://127.0.0.1:5000")
    print("🌐 Health Check: http://localhost:5000/health")
    
    print("\n📡 Available Endpoints:")
    print("✅ POST /api/auth/register")
    print("✅ POST /api/auth/login") 
    print("✅ POST /api/auth/logout")
    print("✅ POST /api/auth/resend")
    print("✅ POST /api/send-verification")
    print("✅ POST /api/verify-email")
    print("✅ GET /api/check-verification/{email}")
    print("✅ POST /api/resend-verification")

def check_frontend_config():
    print("\n🔧 Frontend Configuration Check")
    print("=" * 40)
    print("Make sure your frontend is using:")
    print("• Base URL: http://localhost:5000")
    print("• Content-Type: application/json")
    print("• CORS should be handled automatically")
    
    print("\n🐛 Common Issues:")
    print("1. Frontend using wrong port (should be 5000)")
    print("2. Using https instead of http")
    print("3. Firewall blocking connections")
    print("4. Antivirus blocking local servers")
    
    print("\n💡 Try in browser:")
    print("Open: http://localhost:5000")
    print("Should show server info JSON")

if __name__ == "__main__":
    print("🔍 TrackeBack Server Connectivity Test")
    print("=" * 50)
    
    if test_server():
        print("\n🎉 Server is accessible!")
    else:
        print("\n❌ Server connection failed")
    
    show_server_info()
    check_frontend_config()