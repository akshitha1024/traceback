"""
Add more test users to demonstrate the user registration system
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from user_management import create_user, verify_user_email, update_last_login, get_user_stats
from datetime import datetime, timedelta

def add_sample_users():
    """Add several sample users to demonstrate the system"""
    print("🧪 Adding Sample Users to TrackeBack Database")
    print("=" * 60)
    
    # Sample users with realistic Kent State data
    sample_users = [
        {
            "email": "sarah.johnson@kent.edu",
            "password": "password123",
            "first_name": "Sarah",
            "last_name": "Johnson"
        },
        {
            "email": "mike.wilson@kent.edu", 
            "password": "securepass456",
            "first_name": "Mike",
            "last_name": "Wilson"
        },
        {
            "email": "emma.davis@kent.edu",
            "password": "mypassword789",
            "first_name": "Emma", 
            "last_name": "Davis"
        },
        {
            "email": "james.brown@kent.edu",
            "password": "jamespass321",
            "first_name": "James",
            "last_name": "Brown"
        },
        {
            "email": "lisa.garcia@kent.edu",
            "password": "lisapass654",
            "first_name": "Lisa",
            "last_name": "Garcia"
        }
    ]
    
    created_count = 0
    
    for user_data in sample_users:
        print(f"\n📝 Creating user: {user_data['first_name']} {user_data['last_name']}")
        
        success, result = create_user(
            user_data["email"],
            user_data["password"], 
            user_data["first_name"],
            user_data["last_name"]
        )
        
        if success:
            print(f"  ✅ User created: {result['name']}")
            created_count += 1
            
            # Randomly verify some users
            import random
            if random.choice([True, False]):
                if verify_user_email(user_data["email"]):
                    print(f"  ✅ Email verified for {user_data['email']}")
                
            # Simulate some users logging in
            if random.choice([True, False, False]):  # 33% chance
                if update_last_login(user_data["email"]):
                    print(f"  🔑 Login recorded for {user_data['email']}")
                    
        else:
            print(f"  ❌ Failed to create user: {result}")
    
    print(f"\n📊 Summary: {created_count} new users added")
    
    # Show updated stats
    stats = get_user_stats()
    if stats:
        print(f"\n📈 Updated Database Statistics:")
        print(f"  Total Users: {stats['total_users']}")
        print(f"  Verified Users: {stats['verified_users']}")
        print(f"  Active Users: {stats['active_users']}")
        print(f"  Recent Registrations: {stats['recent_registrations']}")

if __name__ == "__main__":
    add_sample_users()
    print("\n✅ Sample users added successfully!")