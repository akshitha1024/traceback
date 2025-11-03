"""
Database Inspector for TrackeBack User System
Shows user registration data stored in SQLite database
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'trackeback_100k.db')

def inspect_users_table():
    """Inspect the users table structure and data"""
    print("🔍 TrackeBack User Database Inspector")
    print("=" * 60)
    
    if not os.path.exists(DB_PATH):
        print("❌ Database file not found!")
        return
    
    print(f"📂 Database Location: {DB_PATH}")
    print(f"📊 Database Size: {os.path.getsize(DB_PATH) / 1024 / 1024:.2f} MB")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='users'
        """)
        
        if not cursor.fetchone():
            print("❌ Users table doesn't exist yet!")
            conn.close()
            return
        
        # Get table schema
        print("\n🏗️ Users Table Schema:")
        print("-" * 40)
        cursor.execute("PRAGMA table_info(users)")
        schema = cursor.fetchall()
        
        for column in schema:
            print(f"  {column['name']:15} | {column['type']:10} | {'NOT NULL' if column['notnull'] else 'NULL'}")
        
        # Get user count
        cursor.execute("SELECT COUNT(*) as count FROM users")
        user_count = cursor.fetchone()['count']
        print(f"\n👥 Total Registered Users: {user_count}")
        
        if user_count > 0:
            # Get all users
            print("\n📋 Registered Users:")
            print("-" * 80)
            cursor.execute("""
                SELECT id, email, first_name, last_name, full_name, 
                       is_verified, created_at, last_login, is_active
                FROM users 
                ORDER BY created_at DESC
            """)
            
            users = cursor.fetchall()
            
            print(f"{'ID':<3} | {'Email':<25} | {'Name':<20} | {'Verified':<8} | {'Created':<19} | {'Last Login':<19}")
            print("-" * 110)
            
            for user in users:
                verified_status = "✅ Yes" if user['is_verified'] else "❌ No"
                created_at = user['created_at'][:19] if user['created_at'] else "N/A"
                last_login = user['last_login'][:19] if user['last_login'] else "Never"
                
                print(f"{user['id']:<3} | {user['email']:<25} | {user['full_name']:<20} | {verified_status:<8} | {created_at:<19} | {last_login:<19}")
            
            # Get verification stats
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_verified = 1")
            verified_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE last_login IS NOT NULL")
            logged_in_count = cursor.fetchone()['count']
            
            print(f"\n📊 User Statistics:")
            print(f"  Total Users: {user_count}")
            print(f"  Verified Users: {verified_count}")
            print(f"  Users who logged in: {logged_in_count}")
            print(f"  Verification Rate: {(verified_count/user_count*100):.1f}%")
            
            # Show recent activity
            print(f"\n🕒 Recent Activity:")
            cursor.execute("""
                SELECT email, created_at, is_verified, last_login
                FROM users 
                WHERE created_at > datetime('now', '-7 days')
                ORDER BY created_at DESC
                LIMIT 5
            """)
            
            recent_users = cursor.fetchall()
            if recent_users:
                print("  Recent registrations (last 7 days):")
                for user in recent_users:
                    status = "✅ Verified" if user['is_verified'] else "⏳ Pending"
                    print(f"    {user['email']} - {user['created_at'][:19]} - {status}")
            else:
                print("  No recent registrations in the last 7 days")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error accessing database: {e}")

def show_sample_user_data():
    """Show detailed data for a sample user"""
    print(f"\n🔬 Sample User Data (Raw):")
    print("-" * 50)
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users LIMIT 1")
        user = cursor.fetchone()
        
        if user:
            print("Sample user record:")
            for key in user.keys():
                value = user[key]
                if key == 'password_hash':
                    value = f"{value[:20]}..." if value else "None"
                print(f"  {key}: {value}")
        else:
            print("No users found in database")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    inspect_users_table()
    show_sample_user_data()
    print(f"\n✅ Database inspection completed!")