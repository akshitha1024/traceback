"""
Clean up all data from database except users.
Deletes: items, claims, messages, reviews, reports, notifications, etc.
Preserves: users table only
"""

import sqlite3
import os

DB_PATH = 'traceback_100k.db'

def cleanup_all_data():
    """Delete all data except users"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Get counts before deletion
        print("\n📊 Current Data Counts:")
        print("-" * 50)
        
        tables_to_clean = [
            'found_items',
            'lost_items',
            'messages',
            'claim_attempts',
            'successful_returns',
            'reviews',
            'abuse_reports'
        ]
        
        counts_before = {}
        for table in tables_to_clean:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM {table}')
                count = cursor.fetchone()[0]
                counts_before[table] = count
                print(f"  {table}: {count:,} records")
            except sqlite3.OperationalError:
                print(f"  {table}: Table doesn't exist (skipping)")
        
        # Get user count (will be preserved)
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        print(f"\n👥 Users (will be preserved): {user_count:,}")
        
        # Confirm deletion
        print("\n" + "=" * 50)
        response = input("\n⚠️  DELETE ALL DATA EXCEPT USERS? (type 'YES' to confirm): ")
        
        if response != 'YES':
            print("❌ Cleanup cancelled")
            return
        
        print("\n🗑️  Deleting data...")
        print("-" * 50)
        
        # Delete all data from each table
        for table in tables_to_clean:
            try:
                cursor.execute(f'DELETE FROM {table}')
                deleted = cursor.rowcount
                print(f"  ✓ {table}: {deleted:,} records deleted")
            except sqlite3.OperationalError as e:
                print(f"  ⚠️  {table}: {e}")
        
        # Commit all deletions
        conn.commit()
        
        # Verify deletions
        print("\n✅ Verification:")
        print("-" * 50)
        for table in tables_to_clean:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM {table}')
                count = cursor.fetchone()[0]
                print(f"  {table}: {count} records remaining")
            except sqlite3.OperationalError:
                pass
        
        # Verify users preserved
        cursor.execute('SELECT COUNT(*) FROM users')
        users_remaining = cursor.fetchone()[0]
        print(f"\n👥 Users preserved: {users_remaining:,}")
        
        # Vacuum to reclaim space
        print("\n🧹 Vacuuming database to reclaim space...")
        cursor.execute('VACUUM')
        
        print("\n✅ Database cleanup complete!")
        print(f"All data deleted except {users_remaining} users")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    cleanup_all_data()
