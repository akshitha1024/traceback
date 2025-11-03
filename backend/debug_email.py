"""
Debug script to test email sending step by step
"""

def test_gmail_connection():
    print("🔧 Testing Gmail SMTP Connection")
    print("=" * 50)
    
    try:
        # Import required modules
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Load email config
        from email_config import EMAIL_CONFIG
        
        print(f"📧 Email: {EMAIL_CONFIG['email']}")
        print(f"🌐 SMTP Server: {EMAIL_CONFIG['smtp_server']}:{EMAIL_CONFIG['smtp_port']}")
        print(f"🔑 Password: {'*' * len(EMAIL_CONFIG['password'])}")
        
        # Test SMTP connection
        print("\n1️⃣ Testing SMTP connection...")
        server = smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port'])
        print("✅ Connected to SMTP server")
        
        # Start TLS
        print("\n2️⃣ Starting TLS encryption...")
        server.starttls()
        print("✅ TLS encryption started")
        
        # Login
        print("\n3️⃣ Attempting login...")
        server.login(EMAIL_CONFIG['email'], EMAIL_CONFIG['password'])
        print("✅ Login successful!")
        
        # Test email
        test_email = input("\nEnter a @kent.edu email to test: ").strip()
        
        if test_email and '@kent.edu' in test_email.lower():
            print(f"\n4️⃣ Sending test email to {test_email}...")
            
            # Create simple test email
            msg = MIMEMultipart()
            msg['Subject'] = "TrackeBack Test Email"
            msg['From'] = f"TrackeBack <{EMAIL_CONFIG['email']}>"
            msg['To'] = test_email
            
            # Add body
            body = """
            🏫 TrackeBack Email Test
            
            This is a test email from the TrackeBack system.
            
            If you received this email, the email system is working correctly!
            
            Test Code: 123456
            
            Best regards,
            TrackeBack Team
            Kent State University
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            text = msg.as_string()
            server.sendmail(EMAIL_CONFIG['email'], test_email, text)
            print("✅ Test email sent successfully!")
            print(f"📱 Check {test_email} for the test email")
            
        else:
            print("❌ Invalid email or not @kent.edu domain")
        
        # Close connection
        server.quit()
        print("\n✅ SMTP connection closed")
        
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Authentication failed: {str(e)}")
        print("💡 Check your Gmail App Password!")
        print("   1. Make sure 2-Factor Authentication is enabled")
        print("   2. Generate a new App Password")
        print("   3. Update email_config.py with the new password")
        return False
        
    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌ Recipient refused: {str(e)}")
        print("💡 Check the email address is valid")
        return False
        
    except smtplib.SMTPServerDisconnected as e:
        print(f"❌ Server disconnected: {str(e)}")
        print("💡 Check internet connection and SMTP settings")
        return False
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return False

def test_verification_service():
    print("\n🧪 Testing Email Verification Service")
    print("=" * 50)
    
    try:
        from email_verification_service import EmailVerificationService
        
        # Initialize service
        service = EmailVerificationService()
        print("✅ Service initialized")
        
        # Test email
        test_email = input("Enter a @kent.edu email to test verification: ").strip()
        
        if test_email and '@kent.edu' in test_email.lower():
            print(f"\n📧 Sending verification code to {test_email}...")
            
            success, message = service.send_verification_email(
                test_email, 
                "Debug Test Item", 
                "lost", 
                99999
            )
            
            if success:
                print(f"✅ {message}")
                print("📱 Check your email!")
                
                # Check database
                print("\n📊 Checking database...")
                import sqlite3
                conn = sqlite3.connect(service.db_path)
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT verification_code, created_at, expires_at, attempts
                    FROM email_verifications 
                    WHERE email = ? 
                    ORDER BY created_at DESC 
                    LIMIT 1
                """, (test_email,))
                
                result = cursor.fetchone()
                if result:
                    code, created, expires, attempts = result
                    print(f"   📝 Code: {code}")
                    print(f"   🕐 Created: {created}")
                    print(f"   ⏰ Expires: {expires}")
                    print(f"   🔄 Attempts: {attempts}")
                    
                    # Offer to verify
                    user_code = input(f"\nEnter the code you received (or '{code}' for auto-verify): ").strip()
                    if user_code:
                        verify_success, verify_message = service.verify_code(test_email, user_code)
                        if verify_success:
                            print(f"✅ {verify_message}")
                        else:
                            print(f"❌ {verify_message}")
                else:
                    print("❌ No verification record found in database!")
                
                conn.close()
                
            else:
                print(f"❌ {message}")
                return False
                
        else:
            print("❌ Invalid email or not @kent.edu domain")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing verification service: {str(e)}")
        return False

def main():
    print("🔍 TrackeBack Email Debug Tool")
    print("=" * 60)
    
    # Test 1: Basic SMTP connection
    print("Test 1: Basic Gmail SMTP Connection")
    smtp_success = test_gmail_connection()
    
    if smtp_success:
        print("\n" + "="*60)
        # Test 2: Full verification service
        print("Test 2: Full Email Verification Service")
        service_success = test_verification_service()
        
        if service_success:
            print("\n🎉 Email system is working correctly!")
        else:
            print("\n❌ Issues with verification service")
    else:
        print("\n❌ Basic SMTP connection failed - fix this first")
    
    print("\n" + "="*60)
    print("💡 Common Issues:")
    print("1. Gmail App Password incorrect or expired")
    print("2. 2-Factor Authentication not enabled on Gmail")
    print("3. Email going to spam folder")
    print("4. Firewall blocking SMTP connections")
    print("5. Internet connection issues")

if __name__ == "__main__":
    main()