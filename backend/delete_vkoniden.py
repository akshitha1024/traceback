#!/usr/bin/env python3
"""
Delete user vkoniden@kent.edu from the database
"""

import sqlite3

DB_PATH = 'traceback_100k.db'

def delete_user():
    """Delete the specific user and all their data"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        email = 'vkoniden@kent.edu'
        
        print(f"\n🗑️  Deleting user: {email}")
        print("=" * 50)
        
        # Delete user's found items
        cursor.execute('SELECT COUNT(*) FROM found_items WHERE finder_email = ?', (email,))
        found_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM found_items WHERE finder_email = ?', (email,))
        print(f"✅ Deleted {found_count} found items")
        
        # Delete user's lost items
        cursor.execute('SELECT COUNT(*) FROM lost_items WHERE user_email = ?', (email,))
        lost_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM lost_items WHERE user_email = ?', (email,))
        print(f"✅ Deleted {lost_count} lost items")
        
        # Delete user's claim attempts
        cursor.execute('SELECT COUNT(*) FROM claim_attempts WHERE user_email = ?', (email,))
        attempts_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM claim_attempts WHERE user_email = ?', (email,))
        print(f"✅ Deleted {attempts_count} claim attempts")
        
        # Delete user's messages (both sent and received)
        cursor.execute('SELECT COUNT(*) FROM messages WHERE sender_email = ? OR receiver_email = ?', (email, email))
        messages_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM messages WHERE sender_email = ? OR receiver_email = ?', (email, email))
        print(f"✅ Deleted {messages_count} messages")
        
        # Delete user's reviews
        cursor.execute('SELECT COUNT(*) FROM reviews WHERE user_email = ?', (email,))
        reviews_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM reviews WHERE user_email = ?', (email,))
        print(f"✅ Deleted {reviews_count} reviews")
        
        # Delete user's notifications
        cursor.execute('SELECT COUNT(*) FROM notifications WHERE user_email = ?', (email,))
        notif_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM notifications WHERE user_email = ?', (email,))
        print(f"✅ Deleted {notif_count} notifications")
        
        # Delete from successful_returns (both as owner and claimer)
        cursor.execute('SELECT COUNT(*) FROM successful_returns WHERE owner_email = ? OR claimer_email = ?', (email, email))
        returns_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM successful_returns WHERE owner_email = ? OR claimer_email = ?', (email, email))
        print(f"✅ Deleted {returns_count} successful returns records")
        
        # Delete user profile
        cursor.execute('SELECT COUNT(*) FROM users WHERE email = ?', (email,))
        user_count = cursor.fetchone()[0]
        cursor.execute('DELETE FROM users WHERE email = ?', (email,))
        print(f"✅ Deleted {user_count} user record")
        
        conn.commit()
        
        # Verify deletion
        cursor.execute('SELECT COUNT(*) FROM users WHERE email = ?', (email,))
        remaining = cursor.fetchone()[0]
        
        print("\n" + "=" * 50)
        if remaining == 0:
            print(f"✅ User {email} successfully deleted!")
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
        
        print(f"\n📊 Database Status:")
        print(f"   Users: {total_users}")
        print(f"   Found Items: {total_found}")
        print(f"   Lost Items: {total_lost}")
        print(f"   Successful Returns: {total_returns}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    delete_user()
