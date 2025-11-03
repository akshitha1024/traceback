"""
Demo script to test TrackeBack email verification system
Run this to test email sending without the full Flask app
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from email_verification_service import EmailVerificationService

def main():
    print("🚀 TrackeBack Email Verification Demo")
    print("=" * 50)
    
    # Initialize service
    verification_service = EmailVerificationService()
    
    # Test email (you can change this to any @kent.edu email)
    test_email = input("Enter a @kent.edu email to test: ").strip()
    
    if not test_email.endswith('@kent.edu'):
        print("❌ Error: Only @kent.edu emails are allowed")
        return
    
    print(f"\n📧 Sending verification code to {test_email}...")
    
    # Send verification code
    success, message = verification_service.send_verification_email(
        email=test_email,
        item_title="Demo Lost iPhone 15",
        item_type="lost",
        item_id=99999
    )
    
    if success:
        print(f"✅ {message}")
        print("\n📱 Check your email for the verification code!")
        print("   (Check spam folder if you don't see it)")
        
        # Ask for verification code
        print("\n" + "="*50)
        code = input("Enter the verification code from email: ").strip()
        
        if code:
            print(f"\n🔍 Verifying code '{code}'...")
            verify_success, verify_message = verification_service.verify_code(test_email, code)
            
            if verify_success:
                print(f"✅ {verify_message}")
                print("🎉 Email verification successful!")
            else:
                print(f"❌ {verify_message}")
        else:
            print("No code entered. Demo complete.")
    else:
        print(f"❌ {message}")
        print("\n💡 Common issues:")
        print("   1. Make sure email_config.py exists with correct Gmail settings")
        print("   2. Check Gmail App Password is correct")
        print("   3. Verify 2-Factor Authentication is enabled on Gmail")
        print("   4. Check internet connection")
    
    print("\n" + "="*50)
    print("📊 Verification Statistics:")
    
    # Show verification stats
    import sqlite3
    conn = sqlite3.connect(verification_service.db_path)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total_codes,
            SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_codes,
            AVG(attempts) as avg_attempts
        FROM email_verifications
        WHERE email = ?
    ''', (test_email,))
    
    stats = cursor.fetchone()
    if stats and stats[0] > 0:
        total, verified, avg_attempts = stats
        print(f"   📧 Total codes sent to {test_email}: {total}")
        print(f"   ✅ Successfully verified: {verified}")
        print(f"   🔄 Average attempts: {avg_attempts:.1f}")
    else:
        print("   📧 No verification codes found for this email")
    
    conn.close()

if __name__ == "__main__":
    main()