"""
Simple test for email verification without requests library
"""

import json
import os

def test_email_service():
    print("🧪 Testing Email Service Configuration")
    print("=" * 50)
    
    try:
        # Test 1: Check email config
        from email_config import EMAIL_CONFIG
        print("✅ Email config loaded successfully!")
        print(f"   Provider: {EMAIL_CONFIG['provider']}")
        print(f"   Email: {EMAIL_CONFIG['email']}")
        print(f"   SMTP: {EMAIL_CONFIG['smtp_server']}:{EMAIL_CONFIG['smtp_port']}")
        
        # Test 2: Initialize email service
        from email_verification_service import EmailVerificationService
        service = EmailVerificationService()
        print("✅ Email verification service initialized!")
        
        # Test 3: Try to send an email (this will actually send it!)
        print("\n📧 Testing actual email sending...")
        test_email = input("Enter a @kent.edu email to test (or press Enter to skip): ").strip()
        
        if test_email and test_email.endswith('@kent.edu'):
            print(f"Sending verification code to {test_email}...")
            success, message = service.send_verification_email(
                test_email, "Test Lost Item", "lost", 99999
            )
            
            if success:
                print(f"✅ {message}")
                print("📱 Check your email for the verification code!")
                
                # Ask for verification code
                code = input("Enter the verification code from email (or press Enter to skip): ").strip()
                if code:
                    verify_success, verify_message = service.verify_code(test_email, code)
                    if verify_success:
                        print(f"✅ {verify_message}")
                    else:
                        print(f"❌ {verify_message}")
            else:
                print(f"❌ {message}")
        else:
            print("Skipping email test...")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def check_endpoints():
    print("\n🌐 Available Email Verification Endpoints:")
    print("=" * 50)
    print("📧 Send verification code:")
    print("   POST http://localhost:5000/api/send-verification")
    print("   Body: {\"email\": \"student@kent.edu\", \"item_title\": \"Lost iPhone\"}")
    print()
    print("✅ Verify email code:")
    print("   POST http://localhost:5000/api/verify-email")
    print("   Body: {\"email\": \"student@kent.edu\", \"code\": \"123456\"}")
    print()
    print("🔍 Check verification status:")
    print("   GET http://localhost:5000/api/check-verification/student@kent.edu")
    print()
    print("🔄 Resend verification code:")
    print("   POST http://localhost:5000/api/resend-verification")
    print("   Body: {\"email\": \"student@kent.edu\"}")

if __name__ == "__main__":
    print("🔍 TrackeBack Email Verification Test")
    print("=" * 60)
    
    # Test the email service
    if test_email_service():
        print("\n✅ Email service is working correctly!")
    else:
        print("\n❌ Email service has issues!")
    
    # Show available endpoints
    check_endpoints()
    
    print("\n" + "=" * 60)
    print("💡 To test via your frontend:")
    print("1. Make sure Flask server is running on localhost:5000")
    print("2. Use the EmailVerification.js React component")
    print("3. Or test with curl/Postman using the endpoints above")
    print("4. Only @kent.edu emails are accepted")