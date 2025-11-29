"""
Keep only vkoniden@kent.edu user and delete all other users and their data.
Preserves: categories, locations, and the specified user.
"""

import sqlite3
import os

DB_PATH = 'traceback_100k.db'
KEEP_EMAIL = 'vkoniden@kent.edu'

def cleanup_keep_one_user():
    """Delete all users except vkoniden@kent.edu and all user-generated content"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get current user count
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        # Check if vkoniden exists
        cursor.execute('SELECT id, email, full_name FROM users WHERE email = ?', (KEEP_EMAIL,))
        keep_user = cursor.fetchone()
        
        if not keep_user:
            print(f"❌ User {KEEP_EMAIL} not found in database!")
            print("\nAvailable users:")
            cursor.execute('SELECT email, full_name FROM users')
            for user in cursor.fetchall():
                print(f"  - {user[0]} ({user[1]})")
            return
        
        keep_user_id, keep_email, keep_name = keep_user
        
        print("\n📊 Current Status:")
        print("-" * 50)
        print(f"Total users: {total_users}")
        print(f"User to keep: {keep_name} ({keep_email})")
        print(f"Users to delete: {total_users - 1}")
        
        # Get counts of data to delete
        tables_to_clean = [
            'found_items',
            'lost_items',
            'claim_attempts',
            'successful_returns',
            'messages',
            'reviews',
            'abuse_reports'
        ]
        
        print("\n📦 Data to be deleted:")
        print("-" * 50)
        total_records = 0
        for table in tables_to_clean:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM {table}')
                count = cursor.fetchone()[0]
                total_records += count
                print(f"  {table}: {count:,} records")
            except sqlite3.OperationalError:
                print(f"  {table}: Table doesn't exist (skipping)")
        
        print(f"\n  Total records to delete: {total_records:,}")
        
        # Confirm deletion
        print("\n" + "=" * 50)
        response = input(f"\n⚠️  DELETE ALL USERS EXCEPT {keep_email}? (type 'YES' to confirm): ")
        
        if response != 'YES':
            print("❌ Operation cancelled")
            return
        
        print("\n🗑️  Deleting data...")
        print("-" * 50)
        
        # Delete all user-generated content first
        for table in tables_to_clean:
            try:
                cursor.execute(f'DELETE FROM {table}')
                deleted = cursor.rowcount
                print(f"  ✓ {table}: {deleted:,} records deleted")
            except sqlite3.OperationalError as e:
                print(f"  ⚠️  {table}: {e}")
        
        # Delete all users except vkoniden
        cursor.execute('DELETE FROM users WHERE email != ?', (KEEP_EMAIL,))
        deleted_users = cursor.rowcount
        print(f"  ✓ users: {deleted_users} users deleted")
        
        # Commit all deletions
        conn.commit()
        
        # Verify
        print("\n✅ Verification:")
        print("-" * 50)
        
        cursor.execute('SELECT COUNT(*) FROM users')
        remaining_users = cursor.fetchone()[0]
        print(f"  Remaining users: {remaining_users}")
        
        cursor.execute('SELECT email, full_name FROM users')
        for user in cursor.fetchall():
            print(f"    → {user[0]} ({user[1]})")
        
        for table in tables_to_clean:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM {table}')
                count = cursor.fetchone()[0]
                print(f"  {table}: {count} records")
            except sqlite3.OperationalError:
                pass
        
        # Preserve system data
        cursor.execute('SELECT COUNT(*) FROM categories')
        categories_count = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM locations')
        locations_count = cursor.fetchone()[0]
        
        print(f"\n📋 System data preserved:")
        print(f"  Categories: {categories_count}")
        print(f"  Locations: {locations_count}")
        
        # Vacuum to reclaim space
        print("\n🧹 Vacuuming database to reclaim space...")
        cursor.execute('VACUUM')
        
        print("\n✅ Database cleanup complete!")
        print(f"Only {keep_email} remains with clean slate")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    cleanup_keep_one_user()
