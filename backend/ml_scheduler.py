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
    Stores matches with scores >= 70% in ml_matches table for fast dashboard loading
    """
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n[{timestamp}] Starting ML Matching Process...")
        
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
        
        print(f"[{timestamp}] Processing {found_count} found items against {lost_count} lost items...")
        
        # Clean up orphaned matches (where items no longer exist)
        # This handles cases where lost items expired (3 days) or found items were claimed
        cursor.execute('''
            DELETE FROM ml_matches 
            WHERE found_item_id NOT IN (SELECT rowid FROM found_items)
            OR lost_item_id NOT IN (SELECT rowid FROM lost_items)
        ''')
        orphaned_count = cursor.rowcount
        if orphaned_count > 0:
            print(f"[{timestamp}] Cleaned up {orphaned_count} orphaned matches")
        
        # Process matches (INSERT OR REPLACE preserves email_sent flags)
        print(f"[{timestamp}] Updating matches (preserving email notification status)...")
        
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
                    min_score=0.7,  # 70% threshold - only show high-quality matches
                    top_k=10
                )
                
                if matches:
                    total_matches += len(matches)
                    high_confidence += len([m for m in matches if m['match_score'] >= 0.8])
                    
                    # Store matches in database (only 70%+ matches are returned)
                    for match in matches:
                        try:
                            # Additional verification: only store matches >= 70%
                            if match['match_score'] >= 0.7:
                                score_breakdown = json.dumps({
                                    'description': match.get('description_similarity', 0),
                                    'image': match.get('image_similarity', 0),
                                    'location': match.get('location_similarity', 0),
                                    'category': match.get('category_similarity', 0),
                                    'color': match.get('color_similarity', 0),
                                    'date': match.get('date_similarity', 0)
                                })
                                
                                # Check if this match already exists and has email_sent = 1
                                existing = cursor.execute('''
                                    SELECT email_sent FROM ml_matches
                                    WHERE found_item_id = ? AND lost_item_id = ?
                                ''', (found_id, match['lost_item_id'])).fetchone()
                                
                                email_sent_value = existing[0] if existing and existing[0] else 0
                                
                                # Update match while preserving email_sent flag
                                cursor.execute('''
                                    INSERT OR REPLACE INTO ml_matches 
                                    (found_item_id, lost_item_id, match_score, score_breakdown, computed_at, email_sent)
                                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
                                ''', (found_id, match['lost_item_id'], match['match_score'], score_breakdown, email_sent_value))
                                
                                stored_matches += 1
                                
                                # Log all matches above 70%
                                score_pct = match['match_score'] * 100
                                if match['match_score'] >= 0.8:
                                    print(f"   [HIGH CONFIDENCE] Match: Found #{found_id} <-> Lost #{match['lost_item_id']} ({score_pct:.1f}%)")
                                else:
                                    print(f"   [MATCH] Found #{found_id} <-> Lost #{match['lost_item_id']} ({score_pct:.1f}%)")
                            
                            # Send email notification to lost item reporter (only once per match and only for 70%+ matches)
                            try:
                                # Only send email for matches >= 70%
                                if match['match_score'] >= 0.7:
                                    # Check if email was already sent for this match
                                    email_sent = cursor.execute('''
                                        SELECT email_sent FROM ml_matches
                                        WHERE found_item_id = ? AND lost_item_id = ?
                                    ''', (found_id, match['lost_item_id'])).fetchone()
                                    
                                    # Only send email if not already sent
                                    if not email_sent or not email_sent[0]:
                                        # Get lost item details with category and location
                                        lost_item_data = cursor.execute('''
                                            SELECT l.title, l.user_name, l.user_email, l.date_lost,
                                                   c.name as category, loc.name as location
                                            FROM lost_items l
                                            LEFT JOIN categories c ON l.category_id = c.id
                                            LEFT JOIN locations loc ON l.location_id = loc.id
                                            WHERE l.id = ?
                                        ''', (match['lost_item_id'],)).fetchone()
                                        
                                        # Get found item details
                                        found_item_data = cursor.execute('''
                                            SELECT f.title, f.date_found,
                                                   c.name as category, loc.name as location
                                            FROM found_items f
                                            LEFT JOIN categories c ON f.category_id = c.id
                                            LEFT JOIN locations loc ON f.location_id = loc.id
                                            WHERE f.id = ?
                                        ''', (found_id,)).fetchone()
                                        
                                        if lost_item_data and lost_item_data[2] and found_item_data:  # Has email
                                            from email_verification_service import send_email
                                            
                                            reporter_name = lost_item_data[1]
                                            reporter_email = lost_item_data[2]
                                            
                                            # Lost item details
                                            lost_title = lost_item_data[0]
                                            lost_date = lost_item_data[3]
                                            lost_category = lost_item_data[4] or 'N/A'
                                            lost_location = lost_item_data[5] or 'N/A'
                                            
                                            # Found item details
                                            found_title = found_item_data[0]
                                            found_date = found_item_data[1]
                                            found_category = found_item_data[2] or 'N/A'
                                            found_location = found_item_data[3] or 'N/A'
                                            
                                            match_score_pct = int(match['match_score'] * 100)
                                            
                                            subject = f"Potential Match Found for Your Lost Item - TraceBack"
                                            body = f"""Hello {reporter_name},

Good news! We found a potential match for your lost item report!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR LOST ITEM:
• Name: {lost_title}
• Category: {lost_category}
• Location: {lost_location}
• Date Lost: {lost_date}

MATCHED FOUND ITEM:
• Name: {found_title}
• Category: {found_category}
• Location: {found_location}
• Date Found: {found_date}

MATCH CONFIDENCE: {match_score_pct}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:

1. Log in to TraceBack and go to your Dashboard
2. In your Dashboard, you will see the matched found item for your lost item
3. Review the full match details and if this looks like your item, submit a claim
4. Provide accurate verification details - you have ONE claim attempt only
5. The finder will review your answers to validate ownership

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
TraceBack Team
Kent State University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated notification. Please do not reply to this email.
                                            """
                                            
                                            send_email(reporter_email, subject, body)
                                            
                                            # Mark email as sent
                                            cursor.execute('''
                                                UPDATE ml_matches 
                                                SET email_sent = 1
                                                WHERE found_item_id = ? AND lost_item_id = ?
                                            ''', (found_id, match['lost_item_id']))
                                            
                                            print(f"      [EMAIL] Notification sent to {reporter_email}")
                            
                            except Exception as email_error:
                                print(f"      ⚠️  Could not send email notification: {email_error}")
                        
                        except Exception as e:
                            print(f"   ⚠️  Error storing match: {e}")
                
            except Exception as e:
                print(f"   ⚠️  Error matching found item #{found_id}: {e}")
        
        conn.commit()
        conn.close()
        
        print(f"[{timestamp}] ML Matching Complete!")
        print(f"   Total matches found (>=70%): {total_matches}")
        print(f"   Matches stored in database: {stored_matches}")
        print(f"   High confidence matches (>=80%): {high_confidence}")
        print(f"   Average matches per found item: {total_matches/found_count if found_count > 0 else 0:.2f}")
        
        return total_matches
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [ERROR] ML matching failed: {e}")
        import traceback
        traceback.print_exc()
        return 0


def run_scheduler():
    """Run the ML matching scheduler"""
    print("Starting ML Matching Scheduler for TrackeBack")
    print("ML matching will run every 1 hour")
    print("Matches with >=70% confidence will be stored in database")
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
