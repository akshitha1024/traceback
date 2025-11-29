"""
Automatic Cleanup Scheduler for Claimed Items
Runs every 24 hours to delete claimed items older than 3 days
"""

import sqlite3
import os
import time
from datetime import datetime
import schedule

DB_PATH = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')

def cleanup_old_claimed_items():
    """
    Delete claimed items that are older than 3 days.
    These items have been successfully claimed and given to the rightful owner.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get items to be deleted for logging
        cursor.execute('''
            SELECT rowid, title, claimed_date 
            FROM found_items 
            WHERE status = 'CLAIMED' 
            AND claimed_date IS NOT NULL
            AND datetime(claimed_date) <= datetime('now', '-3 days')
        ''')
        items_to_delete = cursor.fetchall()
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if items_to_delete:
            print(f"\n[{timestamp}] 🗑️  Cleaning up {len(items_to_delete)} claimed items older than 3 days:")
            for item in items_to_delete:
                print(f"   - {item[1]} (claimed on {item[2]})")
        else:
            print(f"\n[{timestamp}] ✨ No claimed items to clean up")
        
        # Delete the items
        cursor.execute('''
            DELETE FROM found_items 
            WHERE status = 'CLAIMED' 
            AND claimed_date IS NOT NULL
            AND datetime(claimed_date) <= datetime('now', '-3 days')
        ''')
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            print(f"[{timestamp}] ✅ Successfully deleted {deleted_count} old claimed items")
        
        return deleted_count
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Error cleaning up claimed items: {e}")
        return 0


def run_scheduler():
    """Run the cleanup scheduler"""
    print("🕐 Starting Cleanup Scheduler for TrackeBack")
    print("⏰ Cleanup will run every 24 hours at 2:00 AM")
    print("🗑️  Items claimed more than 3 days ago will be automatically deleted")
    print("Press Ctrl+C to stop the scheduler\n")
    
    # Schedule cleanup every day at 2:00 AM
    schedule.every().day.at("02:00").do(cleanup_old_claimed_items)
    
    # Run cleanup immediately on start
    print("Running initial cleanup...")
    cleanup_old_claimed_items()
    
    # Keep the scheduler running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        print(f"Expected: {DB_PATH}")
        exit(1)
    
    try:
        run_scheduler()
    except KeyboardInterrupt:
        print("\n\n🛑 Scheduler stopped by user")
        exit(0)
