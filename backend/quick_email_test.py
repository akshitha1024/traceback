"""
Simple PowerShell-compatible test for email verification API
"""

def test_verification_endpoints():
    print("🧪 Quick Email Verification Test")
    print("=" * 50)
    
    # Get email from user
    test_email = input("Enter your @kent.edu email: ").strip().lower()
    
    if not test_email.endswith('@kent.edu'):
        print("❌ Please use a @kent.edu email address")
        return
    
    print(f"\n📧 Testing with email: {test_email}")
    
    try:
        # Test direct service call
        from email_verification_service import EmailVerificationService
        service = EmailVerificationService()
        
        print("\n1️⃣ Testing direct service call...")
        success, message = service.send_verification_email(
            test_email,
            "Direct Test Item",
            "lost",
            77777
        )
        
        if success:
            print(f"✅ {message}")
            print("\n📱 Check your email (including spam folder)!")
            
            # Check database
            print("\n2️⃣ Checking database...")
            import sqlite3
            conn = sqlite3.connect(service.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT verification_code, created_at, expires_at
                FROM email_verifications
                WHERE email = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (test_email,))
            
            result = cursor.fetchone()
            if result:
                code, created, expires = result
                print(f"   📝 Generated code: {code}")
                print(f"   🕐 Created: {created}")
                print(f"   ⏰ Expires: {expires}")
                
                # Test verification
                print("\n3️⃣ Testing verification...")
                user_code = input(f"Enter the code from your email (or '{code}' for auto-test): ").strip()
                
                if user_code:
                    verify_success, verify_message = service.verify_code(test_email, user_code)
                    if verify_success:
                        print(f"✅ {verify_message}")
                        print("🎉 Email verification system is working perfectly!")
                    else:
                        print(f"❌ {verify_message}")
                        
            else:
                print("❌ No verification record found in database!")
                
            conn.close()
            
        else:
            print(f"❌ {message}")
            print("\n🔧 Possible issues:")
            print("   • Gmail App Password is incorrect")
            print("   • Internet connection problem")
            print("   • Gmail account settings issue")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def show_manual_test_instructions():
    print("\n" + "="*60)
    print("📱 Manual Testing Instructions")
    print("="*60)
    
    print("\n🌐 If the direct test worked but frontend doesn't:")
    print("1. Open your browser's Developer Tools (F12)")
    print("2. Go to Network tab")
    print("3. Try sending verification code from frontend")
    print("4. Look for API calls to /api/send-verification")
    print("5. Check if there are any error messages")
    
    print("\n📧 If emails aren't arriving:")
    print("1. ✅ Check spam/junk folder")
    print("2. ✅ Verify the email address is correct") 
    print("3. ✅ Try with a different @kent.edu email")
    print("4. ✅ Wait 2-3 minutes (SMTP can be slow)")
    
    print("\n🔧 Test with curl (if available):")
    print('curl -X POST http://localhost:5000/api/send-verification \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"email": "your.email@kent.edu", "item_title": "Test Item"}\'')

if __name__ == "__main__":
    test_verification_endpoints()
    show_manual_test_instructions()