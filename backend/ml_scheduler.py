"""
ML Matching Scheduler
Runs ML matching between lost and found items every hour
"""

import sqlite3
import os
import time
from datetime import datetime
import schedule
from ml_matching_service import MLMatchingService

DB_PATH = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')

def run_ml_matching():
    """
    Run ML matching for all unclaimed found items against all lost items
    Stores matches with scores >= 60% in ml_matches table for fast dashboard loading
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
            WHERE (status IS NULL OR status != 'CLAIMED')
        """).fetchall()
        
        lost_items = cursor.execute("""
            SELECT rowid as id FROM lost_items
            WHERE is_resolved = 0
        """).fetchall()
        
        found_count = len(found_items)
        lost_count = len(lost_items)
        
        print(f"[{timestamp}] 📊 Processing {found_count} found items against {lost_count} lost items...")
        
        # Clear old matches to refresh with new computations
        cursor.execute("DELETE FROM ml_matches")
        print(f"[{timestamp}] 🗑️  Cleared old matches from database")
        
        # Process matches
        total_matches = 0
        high_confidence = 0  # >= 80%
        stored_matches = 0
        
        import json
        
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
                    
                    # Store matches in database
                    for match in matches:
                        try:
                            score_breakdown = json.dumps({
                                'category': match.get('category_score', 0),
                                'location': match.get('location_score', 0),
                                'color': match.get('color_score', 0),
                                'text': match.get('text_similarity', 0),
                                'date': match.get('date_score', 0)
                            })
                            
                            cursor.execute('''
                                INSERT OR REPLACE INTO ml_matches 
                                (found_item_id, lost_item_id, match_score, score_breakdown, computed_at)
                                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                            ''', (found_id, match['lost_item_id'], match['match_score'], score_breakdown))
                            
                            stored_matches += 1
                            
                            # Log all matches above 60%
                            score_pct = match['match_score'] * 100
                            if match['match_score'] >= 0.8:
                                print(f"   🎯 High confidence match: Found #{found_id} ↔ Lost #{match['lost_item_id']} ({score_pct:.1f}%)")
                            else:
                                print(f"   ✓ Match found: Found #{found_id} ↔ Lost #{match['lost_item_id']} ({score_pct:.1f}%)")
                        
                        except Exception as e:
                            print(f"   ⚠️  Error storing match: {e}")
                
            except Exception as e:
                print(f"   ⚠️  Error matching found item #{found_id}: {e}")
        
        conn.commit()
        conn.close()
        
        print(f"[{timestamp}] ✅ ML Matching Complete!")
        print(f"   📈 Total matches found (≥60%): {total_matches}")
        print(f"   💾 Matches stored in database: {stored_matches}")
        print(f"   ⭐ High confidence matches (≥80%): {high_confidence}")
        print(f"   📊 Average matches per found item: {total_matches/found_count if found_count > 0 else 0:.2f}")
        
        return total_matches
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Error in ML matching: {e}")
        import traceback
        traceback.print_exc()
        return 0


def run_scheduler():
    """Run the ML matching scheduler"""
    print("🕐 Starting ML Matching Scheduler for TrackeBack")
    print("⏰ ML matching will run every 1 hour")
    print("🤖 Matches with ≥60% confidence will be stored in database")
    print("Press Ctrl+C to stop the scheduler\n")
    
    # Schedule ML matching every hour (production mode)
    schedule.every().hour.do(run_ml_matching)
    
    # Run matching immediately on start
    print("Running initial ML matching...")
    run_ml_matching()
    
    # Keep the scheduler running
    print("\n⏳ Waiting for next scheduled run (in 1 hour)...\n")
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
        print("\n\n🛑 ML Matching Scheduler stopped by user")
        exit(0)
