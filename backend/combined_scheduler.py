"""
Combined Scheduler for TrackeBack
Runs cleanup, ML matching, and finder decision notification tasks
"""

import sqlite3
import os
import time
from datetime import datetime
import schedule
from ml_matching_service import MLMatchingService
from finder_decision_notification_scheduler import check_and_notify_finders, load_already_notified_finders

DB_PATH = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')


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


def run_ml_matching():
    """
    Run ML matching for all unclaimed found items against all lost items
    Stores matches with scores >= 60% for display in dashboard
    """
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n[{timestamp}] 🤖 Starting ML Matching Process...")
        
        # Initialize ML service
        ml_service = MLMatchingService(
            db_path=DB_PATH,
            upload_folder=UPLOAD_FOLDER
        )
        
        # Get all unclaimed found items
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        found_items = cursor.execute("""
            SELECT rowid as id FROM found_items 
            WHERE status != 'CLAIMED'
        """).fetchall()
        
        lost_items = cursor.execute("""
            SELECT rowid as id FROM lost_items
        """).fetchall()
        
        conn.close()
        
        found_count = len(found_items)
        lost_count = len(lost_items)
        
        print(f"[{timestamp}] 📊 Processing {found_count} found items against {lost_count} lost items...")
        
        # Process matches
        total_matches = 0
        high_confidence = 0  # >= 80%
        
        for found_item in found_items:
            found_id = found_item[0]
            try:
                matches = ml_service.find_matches_for_found_item(
                    found_item_id=found_id,
                    min_score=0.6,  # 60% threshold
                    top_k=10
                )
                
                if matches:
                    total_matches += len(matches)
                    high_confidence += len([m for m in matches if m['match_score'] >= 0.8])
                    
                    # Log all matches above 60%
                    for match in matches:
                        score_pct = match['match_score'] * 100
                        if match['match_score'] >= 0.8:
                            print(f"   🎯 High confidence match: Found #{found_id} ↔ Lost #{match['lost_item_id']} ({score_pct:.1f}%)")
                        else:
                            print(f"   ✓ Match found: Found #{found_id} ↔ Lost #{match['lost_item_id']} ({score_pct:.1f}%)")
                
            except Exception as e:
                print(f"   ⚠️  Error matching found item #{found_id}: {e}")
        
        print(f"[{timestamp}] ✅ ML Matching Complete!")
        print(f"   📈 Total matches found (≥60%): {total_matches}")
        print(f"   ⭐ High confidence matches (≥80%): {high_confidence}")
        print(f"   📊 Average matches per found item: {total_matches/found_count if found_count > 0 else 0:.2f}")
        
        return total_matches
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Error in ML matching: {e}")
        import traceback
        traceback.print_exc()
        return 0


def run_combined_scheduler():
    """Run both cleanup and ML matching schedulers"""
    print("=" * 60)
    print("🕐 Starting Combined Scheduler for TrackeBack")
    print("=" * 60)
    print("🚀 Combined Scheduler Starting...")
    print("   🤖 ML Matching: Every 1 hour")
    print("   🗑️  Cleanup: Every day at 2:00 AM")
    print("   ⏰ Finder Decisions: Every 1 hour")
    print("\nPress Ctrl+C to stop the scheduler\n")
    print("=" * 60)
    
    # Load already notified finders to avoid duplicate notifications
    load_already_notified_finders()
    
    # Schedule ML matching every hour
    schedule.every().hour.do(run_ml_matching)
    
    # Schedule cleanup every day at 2:00 AM
    schedule.every().day.at("02:00").do(cleanup_old_claimed_items)
    
    # Schedule finder decision notifications every hour
    schedule.every().hour.do(check_and_notify_finders)
    
    # Run all tasks immediately on start
    print("\n🚀 Running initial tasks...")
    run_ml_matching()
    cleanup_old_claimed_items()
    check_and_notify_finders()
    
    print("\n⏳ All scheduled tasks active. Waiting for next run...\n")
    
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
        run_combined_scheduler()
    except KeyboardInterrupt:
        print("\n\n🛑 Scheduler stopped by user")
        exit(0)
