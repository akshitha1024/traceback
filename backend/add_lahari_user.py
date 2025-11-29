"""
Add Lahari Dommaraju to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from user_management import create_user, verify_user_email

def add_lahari():
    """Add Lahari Dommaraju to the database"""
    print("🧪 Adding Lahari Dommaraju to TrackeBack Database")
    print("=" * 60)
    
    # User details
    email = "idommara@kent.edu"
    password = "Lahari"
    first_name = "Lahari"
    last_name = "Dommaraju"
    
    print(f"\n📝 Creating user: {first_name} {last_name}")
    print(f"   Email: {email}")
    
    success, result = create_user(
        email,
        password,
        first_name,
        last_name
    )
    
    if success:
        print(f"\n✅ User created successfully!")
        print(f"   User ID: {result['id']}")
        print(f"   Name: {result['name']}")
        print(f"   Email: {result['email']}")
        print(f"   Verified: {result['is_verified']}")
        
        # Optionally verify the email
        print(f"\n📧 Verifying email...")
        if verify_user_email(email):
            print(f"✅ Email verified for {email}")
        
    else:
        print(f"\n❌ Failed to create user: {result}")

if __name__ == "__main__":
    add_lahari()
    print("\n✅ Process completed!")
