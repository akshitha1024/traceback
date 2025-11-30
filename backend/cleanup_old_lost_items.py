"""
Cleanup script to delete lost items older than 30 days
Run this periodically (e.g., daily via cron job or Task Scheduler)
"""
import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')

def cleanup_old_lost_items():
    """Delete lost items that are older than 30 days"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Calculate the cutoff date (30 days ago)
        cutoff_date = datetime.now() - timedelta(days=30)
        cutoff_timestamp = int(cutoff_date.timestamp())
        
        # Get count of items to be deleted
        cursor.execute('''
            SELECT COUNT(*) FROM lost_items 
            WHERE created_at < ?
        ''', (cutoff_timestamp,))
        
        count = cursor.fetchone()[0]
        
        if count == 0:
            print(f"✅ No lost items older than 30 days to delete")
            conn.close()
            return
        
        # Delete old lost items
        cursor.execute('''
            DELETE FROM lost_items 
            WHERE created_at < ?
        ''', (cutoff_timestamp,))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Deleted {count} lost items older than 30 days")
        print(f"   Cutoff date: {cutoff_date.strftime('%Y-%m-%d %H:%M:%S')}")
        
        return count
        
    except Exception as e:
        print(f"❌ Error cleaning up old lost items: {e}")
        return 0

if __name__ == "__main__":
    print("🧹 Lost Items Cleanup - Deleting items older than 30 days")
    print("=" * 60)
    cleanup_old_lost_items()
