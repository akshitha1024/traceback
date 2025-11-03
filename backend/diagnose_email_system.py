"""
Quick test script to check TrackeBack email verification functionality
"""

import sys
import os
import requests
import json

def test_email_verification():
    print("🧪 Testing TrackeBack Email Verification System")
    print("=" * 60)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Check if server is running
    print("\n1️⃣ Testing server connectivity...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("✅ Server is running!")
            print(f"   Response: {response.json()['message']}")
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running on localhost:5000?")
        return False
    except Exception as e:
        print(f"❌ Error connecting to server: {str(e)}")
        return False
    
    # Test 2: Test sending verification code
    print("\n2️⃣ Testing send verification endpoint...")
    test_email = "test.student@kent.edu"
    
    try:
        payload = {
            "email": test_email,
            "item_title": "Test Lost iPhone",
            "item_type": "lost",
            "item_id": 99999
        }
        
        response = requests.post(
            f"{base_url}/api/send-verification",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Verification code sent successfully!")
            return True
        else:
            response_data = response.json() if response.headers.get('content-type') == 'application/json' else response.text
            print(f"❌ Failed to send verification code")
            print(f"   Error: {response_data}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing verification endpoint: {str(e)}")
        return False

def test_email_service_directly():
    print("\n3️⃣ Testing email service directly...")
    
    try:
        # Add current directory to path so we can import our modules
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, current_dir)
        
        from email_verification_service import EmailVerificationService
        
        # Initialize service
        service = EmailVerificationService()
        print("✅ Email service initialized successfully!")
        
        # Test configuration
        print(f"   Email provider: {service.smtp_config.get('provider', 'Unknown')}")
        print(f"   SMTP server: {service.smtp_config.get('smtp_server', 'Unknown')}")
        print(f"   From email: {service.smtp_config.get('email', 'Unknown')}")
        
        # Check if password is set
        password = service.smtp_config.get('password', '')
        if password and password != 'your-app-password' and len(password) > 10:
            print("✅ Email password is configured")
        else:
            print("❌ Email password not properly configured")
            print("   Please check email_config.py")
            return False
            
        return True
        
    except ImportError as e:
        print(f"❌ Cannot import email service: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error testing email service: {str(e)}")
        return False

def check_database_table():
    print("\n4️⃣ Checking email verification database table...")
    
    try:
        import sqlite3
        
        # Connect to database
        db_path = "trackeback_100k.db"
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if email_verifications table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='email_verifications'
        """)
        
        if cursor.fetchone():
            print("✅ Email verification table exists!")
            
            # Check table structure
            cursor.execute("PRAGMA table_info(email_verifications)")
            columns = cursor.fetchall()
            print("   Table columns:")
            for col in columns:
                print(f"     - {col[1]} ({col[2]})")
                
            # Check if there are any records
            cursor.execute("SELECT COUNT(*) FROM email_verifications")
            count = cursor.fetchone()[0]
            print(f"   Total verification records: {count}")
            
        else:
            print("❌ Email verification table does not exist!")
            print("   The table should be created automatically when the service starts")
            return False
            
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return False

def check_config_file():
    print("\n5️⃣ Checking email configuration...")
    
    try:
        # Check if email_config.py exists
        if not os.path.exists("email_config.py"):
            print("❌ email_config.py file not found!")
            print("   Please copy email_config_template.py to email_config.py")
            return False
        
        print("✅ email_config.py exists!")
        
        # Try to import and check config
        from email_config import EMAIL_CONFIG, VERIFICATION_SETTINGS
        
        print("✅ Configuration imported successfully!")
        print(f"   Provider: {EMAIL_CONFIG.get('provider')}")
        print(f"   Email: {EMAIL_CONFIG.get('email')}")
        print(f"   SMTP Server: {EMAIL_CONFIG.get('smtp_server')}")
        
        # Check password
        password = EMAIL_CONFIG.get('password', '')
        if password and len(password) > 10 and password != 'your-app-password':
            print("✅ Email password is configured")
        else:
            print("❌ Email password not configured properly")
            print("   Please set your Gmail App Password in email_config.py")
            return False
            
        return True
        
    except ImportError as e:
        print(f"❌ Error importing email config: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error checking config: {str(e)}")
        return False

def main():
    print("🔍 TrackeBack Email System Diagnostic")
    print("=" * 60)
    
    # Run all tests
    tests = [
        ("Config File", check_config_file),
        ("Database Table", check_database_table),
        ("Email Service", test_email_service_directly),
        ("Server API", test_email_verification)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        result = test_func()
        results.append((test_name, result))
    
    # Summary
    print("\n" + "="*60)
    print("📊 DIAGNOSTIC SUMMARY")
    print("="*60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("\n🎉 All systems working! Email verification should be functional.")
    else:
        print("\n🔧 Some issues found. Please fix the failing tests above.")
        
        # Provide troubleshooting tips
        print("\n💡 TROUBLESHOOTING TIPS:")
        if not results[0][1]:  # Config file failed
            print("   • Copy email_config_template.py to email_config.py")
            print("   • Set your Gmail App Password in email_config.py")
        if not results[1][1]:  # Database failed
            print("   • Make sure you're in the correct directory with trackeback_100k.db")
        if not results[2][1]:  # Email service failed
            print("   • Check Gmail App Password is correct")
            print("   • Verify 2-Factor Authentication is enabled on Gmail")
        if not results[3][1]:  # Server failed
            print("   • Make sure Flask server is running on localhost:5000")
            print("   • Check server logs for errors")

if __name__ == "__main__":
    main()