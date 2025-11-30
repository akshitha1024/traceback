"""
Limit database to 50 lost items and 50 found items
"""
import sqlite3
from pathlib import Path

def limit_items():
    # Connect to database
    db_path = Path(__file__).parent / 'traceback_100k.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("🗄️  Limiting database items...")
    print("=" * 60)
    
    # Get current counts
    cursor.execute("SELECT COUNT(*) as count FROM found_items")
    found_count = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM lost_items")
    lost_count = cursor.fetchone()['count']
    
    print(f"\n📊 Current counts:")
    print(f"   Found items: {found_count}")
    print(f"   Lost items: {lost_count}")
    
    # Keep only 50 most recent found items
    print(f"\n🔍 Processing found items...")
    cursor.execute("""
        SELECT rowid FROM found_items 
        ORDER BY created_at DESC 
        LIMIT 50
    """)
    keep_found_ids = [row['rowid'] for row in cursor.fetchall()]
    
    if keep_found_ids:
        placeholders = ','.join('?' * len(keep_found_ids))
        cursor.execute(f"""
            DELETE FROM found_items 
            WHERE rowid NOT IN ({placeholders})
        """, keep_found_ids)
        deleted_found = cursor.rowcount
        print(f"   ✅ Kept 50 found items, deleted {deleted_found}")
    else:
        print(f"   ⚠️  No found items to keep")
    
    # Keep only 50 most recent lost items
    print(f"\n🔍 Processing lost items...")
    cursor.execute("""
        SELECT rowid FROM lost_items 
        ORDER BY created_at DESC 
        LIMIT 50
    """)
    keep_lost_ids = [row['rowid'] for row in cursor.fetchall()]
    
    if keep_lost_ids:
        placeholders = ','.join('?' * len(keep_lost_ids))
        cursor.execute(f"""
            DELETE FROM lost_items 
            WHERE rowid NOT IN ({placeholders})
        """, keep_lost_ids)
        deleted_lost = cursor.rowcount
        print(f"   ✅ Kept 50 lost items, deleted {deleted_lost}")
    else:
        print(f"   ⚠️  No lost items to keep")
    
    conn.commit()
    
    # Get final counts
    cursor.execute("SELECT COUNT(*) as count FROM found_items")
    final_found = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM lost_items")
    final_lost = cursor.fetchone()['count']
    
    print(f"\n📊 Final counts:")
    print(f"   Found items: {final_found}")
    print(f"   Lost items: {final_lost}")
    
    # Vacuum database to reclaim space
    print(f"\n🧹 Vacuuming database to reclaim space...")
    conn.execute("VACUUM")
    
    conn.close()
    print(f"\n✅ Database cleanup complete!")
    print("=" * 60)

if __name__ == '__main__':
    limit_items()
