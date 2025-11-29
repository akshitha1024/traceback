#!/usr/bin/env python3
"""
Delete all users from the database
"""

import sqlite3

DB_PATH = 'traceback_100k.db'

def delete_all_users():
    """Delete all users and their associated data"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("\n🗑️  Deleting all users and associated data...")
        print("=" * 50)
        
        # Delete user's found items
        cursor.execute('SELECT COUNT(*) FROM found_items')
        found_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM found_items')
        print(f"✅ Deleted {found_count} found items")
        
        # Delete user's lost items
        cursor.execute('SELECT COUNT(*) FROM lost_items')
        lost_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM lost_items')
        print(f"✅ Deleted {lost_count} lost items")
        
        # Delete user's claim attempts
        cursor.execute('SELECT COUNT(*) FROM claim_attempts')
        attempts_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM claim_attempts')
        print(f"✅ Deleted {attempts_count} claim attempts")
        
        # Delete user's messages
        cursor.execute('SELECT COUNT(*) FROM messages')
        messages_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM messages')
        print(f"✅ Deleted {messages_count} messages")
        
        # Delete user's reviews
        cursor.execute('SELECT COUNT(*) FROM reviews')
        reviews_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM reviews')
        print(f"✅ Deleted {reviews_count} reviews")
        
        # Delete user's notifications
        cursor.execute('SELECT COUNT(*) FROM notifications')
        notif_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM notifications')
        print(f"✅ Deleted {notif_count} notifications")
        
        # Delete successful_returns
        cursor.execute('SELECT COUNT(*) FROM successful_returns')
        returns_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM successful_returns')
        print(f"✅ Deleted {returns_count} successful returns records")
        
        # Delete all users
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM users')
        print(f"✅ Deleted {user_count} users")
        
        conn.commit()
        
        # Verify deletion
        cursor.execute('SELECT COUNT(*) FROM users')
        remaining = cursor.fetchone()[0]
        
        print("\n" + "=" * 50)
        if remaining == 0:
            print(f"✅ All users successfully deleted!")
        else:
            print(f"⚠️  Warning: {remaining} user records still exist")
        
        # Show remaining data
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM found_items')
        total_found = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM lost_items')
        total_lost = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM successful_returns')
        total_returns = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM categories')
        total_categories = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM locations')
        total_locations = cursor.fetchone()[0]
        
        print(f"\n📊 Database Status:")
        print(f"   Users: {total_users}")
        print(f"   Found Items: {total_found}")
        print(f"   Lost Items: {total_lost}")
        print(f"   Successful Returns: {total_returns}")
        print(f"   Categories: {total_categories}")
        print(f"   Locations: {total_locations}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("\n⚠️  WARNING: This will delete ALL users and their data!")
    confirm = input("Type 'YES' to confirm: ")
    
    if confirm == 'YES':
        delete_all_users()
    else:
        print("❌ Operation cancelled")
