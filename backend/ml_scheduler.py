"""
ML Matching Scheduler
Runs ML matching between lost and found items every hour
Also handles finder decision notifications
"""

import sqlite3
import os
import time
from datetime import datetime, timedelta
import schedule
from ml_matching_service import MLMatchingService
from finder_decision_notification_scheduler import check_and_notify_finders, load_already_notified_finders

DB_PATH = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')

def update_expired_privacy():
    """
    Automatically set is_private=0 for found items where privacy_expires_at has passed
    Also sends email notifications to lost item owners when items become public
    """
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get items where privacy period has expired (before updating)
        cursor.execute("""
            SELECT rowid, title, category_id, location_id, finder_email, finder_name
            FROM found_items 
            WHERE is_private = 1 
            AND datetime(privacy_expires_at) < datetime('now', 'localtime')
        """)
        
        expired_items = cursor.fetchall()
        
        # Update items to make them public
        cursor.execute("""
            UPDATE found_items 
            SET is_private = 0 
            WHERE is_private = 1 
            AND datetime(privacy_expires_at) < datetime('now', 'localtime')
        """)
        
        updated_count = cursor.rowcount
        conn.commit()
        
        # Send email notifications about newly public items
        if updated_count > 0:
            print(f"[{timestamp}] ✅ Updated {updated_count} items from private to public (privacy expired)")
            send_public_item_notifications(expired_items, conn)
        
        conn.close()
        return updated_count
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [ERROR] Privacy update failed: {e}")
        import traceback
        traceback.print_exc()
        return 0

def send_public_item_notifications(items, conn):
    """
    Send email notifications to ALL users (except finder) when found items become public
    Only sends once per user per item (duplicate prevention)
    """
    try:
        from email_verification_service import send_email
        cursor = conn.cursor()
        
        for item in items:
            # Get category and location names
            cursor.execute("SELECT name FROM categories WHERE id = ?", (item['category_id'],))
            category = cursor.fetchone()
            category_name = category[0] if category else 'Unknown'
            
            cursor.execute("SELECT name FROM locations WHERE id = ?", (item['location_id'],))
            location = cursor.fetchone()
            location_name = location[0] if location else 'Unknown'
            
            # Get ALL users except the finder
            cursor.execute("""
                SELECT email, full_name 
                FROM users 
                WHERE email != ? 
                AND email IS NOT NULL
            """, (item['finder_email'],))
            
            all_users = cursor.fetchall()
            
            for user in all_users:
                # Check if notification already sent to this user for this item
                cursor.execute("""
                    SELECT notification_id 
                    FROM email_notifications 
                    WHERE found_item_id = ? 
                    AND user_email = ? 
                    AND notification_type = 'public_item'
                """, (item['rowid'], user[0]))
                
                already_sent = cursor.fetchone()
                if already_sent:
                    continue  # Skip if already notified
                
                subject = f"🔔 New Public Found Item: {item['title']}"
                body = f"""
Dear {user[1] or 'User'},

A new found item is now publicly available on TraceBack!

<strong>Item Details:</strong>
- Title: {item['title']}
- Category: {category_name}
- Location: {location_name}

This item is now available for everyone to view and claim if it's yours.

<strong>What to do next:</strong>
1. Visit TraceBack and browse found items
2. If this is your item, submit a claim with proof of ownership
3. Answer security questions to verify ownership

<strong>Note:</strong> If you don't see this item in the found items page, it may be in the claimed items section (last 3-day chance).

Best regards,
The TraceBack Team
                """
                
                try:
                    send_email(user[0], subject, body)
                    
                    # Record notification to prevent duplicates
                    cursor.execute("""
                        INSERT OR IGNORE INTO email_notifications 
                        (found_item_id, user_email, notification_type) 
                        VALUES (?, ?, 'public_item')
                    """, (item['rowid'], user[0]))
                    conn.commit()
                    
                    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 📧 Sent public item notification to {user[0]}")
                except Exception as e:
                    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Failed to send email to {user[0]}: {e}")
                    
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [ERROR] Failed to send public item notifications: {e}")

def run_ml_matching():
    """
    Run ML matching for all unclaimed found items against all lost items
    Stores matches with scores >= 80% in ml_matches table for fast dashboard loading
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
                    min_score=0.8,  # 80% threshold - only show high-quality matches
                    top_k=10
                )
                
                if matches:
                    total_matches += len(matches)
                    high_confidence += len([m for m in matches if m['match_score'] >= 0.8])
                    
                    # Store matches in database (only 80%+ matches are returned)
                    for match in matches:
                        try:
                            # Additional verification: only store matches >= 80%
                            if match['match_score'] >= 0.8:
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
                            
                            # Send email notification to lost item reporter (only once per match and only for 80%+ matches)
                            try:
                                # Only send email for matches >= 80%
                                if match['match_score'] >= 0.8:
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


def cleanup_old_lost_items():
    """Delete lost items that are older than 30 days"""
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"\n[{timestamp}] 🧹 Starting cleanup of lost items older than 30 days...")
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get items to be deleted for logging
        cursor.execute('''
            SELECT rowid, title, created_at 
            FROM lost_items 
            WHERE datetime(created_at) <= datetime('now', 'localtime', '-30 days')
        ''')
        items_to_delete = cursor.fetchall()
        
        if items_to_delete:
            print(f"[{timestamp}] 🗑️  Deleting {len(items_to_delete)} lost items older than 30 days:")
            for item in items_to_delete[:5]:  # Show first 5
                print(f"   - {item[1]} (created: {item[2]})")
            if len(items_to_delete) > 5:
                print(f"   ... and {len(items_to_delete) - 5} more")
        else:
            print(f"[{timestamp}] ✨ No lost items older than 30 days to delete")
        
        # Delete the items
        cursor.execute('''
            DELETE FROM lost_items 
            WHERE datetime(created_at) <= datetime('now', 'localtime', '-30 days')
        ''')
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            print(f"[{timestamp}] ✅ Successfully deleted {deleted_count} old lost items")
        
        return deleted_count
        
    except Exception as e:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ❌ Error cleaning up lost items: {e}")
        return 0


def run_hourly_tasks():
    """Run all hourly tasks: privacy updates, ML matching, and finder notifications"""
    print("\n" + "="*60)
    print("RUNNING HOURLY TASKS")
    print("="*60)
    
    # First, update expired privacy items
    update_expired_privacy()
    
    # Then run ML matching
    run_ml_matching()
    
    # Finally, check for finder decision notifications
    check_and_notify_finders()
    
    print("="*60)
    print("HOURLY TASKS COMPLETED")
    print("="*60 + "\n")

def run_scheduler():
    """Run the ML matching scheduler"""
    print("Starting ML Matching Scheduler for TrackeBack")
    print("Tasks will run:")
    print("  HOURLY:")
    print("    1. Update expired privacy items (make public)")
    print("    2. Run ML matching (>=80% confidence)")
    print("    3. Notify finders when 3-day decision period ends")
    print("  DAILY (2:00 AM):")
    print("    4. Delete lost items older than 30 days")
    print("Press Ctrl+C to stop the scheduler\n")
    
    # Load already notified finders to avoid duplicate notifications
    load_already_notified_finders()
    
    # Schedule hourly tasks
    schedule.every().hour.do(run_hourly_tasks)
    
    # Schedule daily cleanup at 2:00 AM
    schedule.every().day.at("02:00").do(cleanup_old_lost_items)
    
    # Run tasks immediately on start
    print("Running initial tasks...")
    run_hourly_tasks()
    cleanup_old_lost_items()
    
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
