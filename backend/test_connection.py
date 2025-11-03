"""
Quick server connection test
"""

import socket
import time

def test_server_connection():
    print("🔌 Testing Server Connection")
    print("=" * 40)
    
    # Test if port 5000 is open
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('localhost', 5000))
        sock.close()
        
        if result == 0:
            print("✅ Port 5000 is open and listening")
        else:
            print("❌ Port 5000 is not responding")
            print("   Make sure Flask server is running")
            return False
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return False
    
    # Test HTTP response
    try:
        import urllib.request
        import urllib.error
        
        print("\n🌐 Testing HTTP response...")
        
        try:
            with urllib.request.urlopen('http://localhost:5000/', timeout=10) as response:
                data = response.read().decode()
                print("✅ Server is responding to HTTP requests")
                
                # Check if it's JSON
                try:
                    import json
                    json_data = json.loads(data)
                    print(f"   Message: {json_data.get('message', 'N/A')}")
                except:
                    print(f"   Response: {data[:100]}...")
                
                return True
                
        except urllib.error.URLError as e:
            print(f"❌ HTTP request failed: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return False
            
    except ImportError:
        print("⚠️ Cannot test HTTP (urllib not available)")
        return True  # Assume it's working if port is open

def test_api_endpoints():
    print("\n📡 Testing API Endpoints")
    print("=" * 40)
    
    endpoints_to_test = [
        ('GET', '/'),
        ('GET', '/health'),
        ('GET', '/api/categories'),
        ('POST', '/api/auth/login'),
        ('POST', '/api/auth/register'),
        ('POST', '/api/send-verification')
    ]
    
    for method, endpoint in endpoints_to_test:
        url = f"http://localhost:5000{endpoint}"
        print(f"Testing {method} {endpoint}...")
        
        try:
            import urllib.request
            import urllib.error
            import json
            
            if method == 'GET':
                with urllib.request.urlopen(url, timeout=5) as response:
                    status = response.getcode()
                    print(f"   ✅ Status: {status}")
            else:
                # For POST requests, send empty JSON
                data = json.dumps({}).encode()
                req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
                req.get_method = lambda: method
                
                try:
                    with urllib.request.urlopen(req, timeout=5) as response:
                        status = response.getcode()
                        print(f"   ✅ Status: {status}")
                except urllib.error.HTTPError as e:
                    # 400/401 errors are expected for empty POST requests
                    if e.code in [400, 401, 404]:
                        print(f"   ✅ Endpoint exists (Status: {e.code})")
                    else:
                        print(f"   ❌ Status: {e.code}")
                        
        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")

def show_troubleshooting():
    print("\n" + "="*50)
    print("🔧 TROUBLESHOOTING GUIDE")
    print("="*50)
    
    print("\n❌ If connection still fails:")
    print("1. Check if Flask server is actually running")
    print("2. Look for error messages in the server terminal")
    print("3. Try restarting the server")
    print("4. Check Windows Firewall settings")
    print("5. Try using 127.0.0.1:5000 instead of localhost:5000")
    
    print("\n🌐 Frontend connection issues:")
    print("1. Make sure your frontend is connecting to http://localhost:5000")
    print("2. Check browser console for CORS errors")
    print("3. Verify API endpoint URLs in your frontend code")
    
    print("\n📱 Test URLs you can try in browser:")
    print("• http://localhost:5000/ (Server info)")
    print("• http://localhost:5000/health (Health check)")
    print("• http://localhost:5000/api/categories (Categories)")

if __name__ == "__main__":
    print("🔍 TrackeBack Server Connection Diagnostic")
    print("=" * 50)
    
    if test_server_connection():
        print("\n🎉 Basic connection is working!")
        test_api_endpoints()
    else:
        print("\n❌ Basic connection failed")
        
    show_troubleshooting()