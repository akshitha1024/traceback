#!/usr/bin/env python3
"""
Set privacy period for found items to 1 month from their posted date
"""

import sqlite3
from datetime import datetime, timedelta

def set_privacy_from_posted_date():
    conn = sqlite3.connect('traceback_100k.db')
    c = conn.cursor()
    
    print("🔍 Setting privacy period to 1 month from posted date...")
    
    # Get all found items with their creation dates
    c.execute('SELECT id, title, created_at FROM found_items')
    items = c.fetchall()
    
    print(f"📋 Processing {len(items)} found items...")
    
    updated_count = 0
    
    for item in items:
        item_id, title, created_at = item
        
        try:
            # Parse the creation date
            if created_at:
                # Handle different date formats
                try:
                    posted_date = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    try:
                        posted_date = datetime.strptime(created_at, '%Y-%m-%d')
                    except ValueError:
                        # If we can't parse the date, use current date
                        posted_date = datetime.now()
                        print(f"⚠️  Could not parse date for {title}, using current date")
            else:
                posted_date = datetime.now()
                print(f"⚠️  No creation date for {title}, using current date")
            
            # Calculate expiry date (1 month = 30 days from posted date)
            expiry_date = posted_date + timedelta(days=30)
            expiry_str = expiry_date.strftime('%Y-%m-%d %H:%M:%S')
            
            # Update the item
            c.execute('''
                UPDATE found_items 
                SET is_private = 1, 
                    privacy_expires_at = ?
                WHERE id = ?
            ''', (expiry_str, item_id))
            
            updated_count += 1
            
            # Show sample of what we're doing
            if updated_count <= 5:
                current_date = datetime.now()
                days_remaining = (expiry_date - current_date).days
                status = "Private" if days_remaining > 0 else "Public"
                print(f"📝 {title[:20]:<20} | Posted: {posted_date.strftime('%Y-%m-%d')} | Expires: {expiry_date.strftime('%Y-%m-%d')} | Status: {status} ({days_remaining} days)")
            
        except Exception as e:
            print(f"❌ Error processing {title}: {e}")
    
    conn.commit()
    
    print(f"\n✅ Updated {updated_count} items with privacy based on posted date")
    
    # Check current status
    current_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 1 AND privacy_expires_at > ?', (current_date,))
    currently_private = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 1 AND privacy_expires_at <= ?', (current_date,))
    should_be_public = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 0', ())
    already_public = c.fetchone()[0]
    
    print(f"\n📊 Current Privacy Status:")
    print(f"Currently Private (unexpired): {currently_private}")
    print(f"Should be Public (expired): {should_be_public}")
    print(f"Already Public: {already_public}")
    print(f"Total items: {currently_private + should_be_public + already_public}")
    
    conn.close()
    return updated_count

if __name__ == "__main__":
    set_privacy_from_posted_date()