#!/usr/bin/env python3
"""
Check and update privacy settings for found items
"""

import sqlite3
from datetime import datetime, timedelta

def check_privacy_status():
    conn = sqlite3.connect('traceback_100k.db')
    c = conn.cursor()
    
    # Check current privacy status
    c.execute('SELECT id, title, is_private, privacy_expires_at FROM found_items LIMIT 10')
    items = c.fetchall()
    
    print("📋 Current Found Items Privacy Status:")
    print("-" * 60)
    for item in items:
        print(f"ID: {item[0]:<3} | Title: {item[1]:<20} | Private: {item[2]} | Expires: {item[3]}")
    
    # Count public vs private items
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 0')
    public_count = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 1')
    private_count = c.fetchone()[0]
    
    print(f"\n📊 Summary:")
    print(f"Public items: {public_count}")
    print(f"Private items: {private_count}")
    print(f"Total items: {public_count + private_count}")
    
    conn.close()
    return public_count, private_count

def make_all_found_items_private():
    conn = sqlite3.connect('traceback_100k.db')
    c = conn.cursor()
    
    # Set privacy expiry date to 30 days from now
    expiry_date = datetime.now() + timedelta(days=30)
    expiry_str = expiry_date.strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"🔒 Making all found items private...")
    print(f"📅 Privacy will expire on: {expiry_str}")
    
    # Update all found items to be private
    c.execute('''
        UPDATE found_items 
        SET is_private = 1, 
            privacy_expires_at = ?
        WHERE is_private = 0
    ''', (expiry_str,))
    
    updated_count = c.rowcount
    conn.commit()
    
    print(f"✅ Updated {updated_count} items to private status")
    
    conn.close()
    return updated_count

if __name__ == "__main__":
    print("🔍 Checking current privacy status...")
    public_count, private_count = check_privacy_status()
    
    if public_count > 0:
        response = input(f"\n❓ Make {public_count} public items private? (y/n): ")
        if response.lower() == 'y':
            updated = make_all_found_items_private()
            print(f"\n🎉 Successfully made {updated} items private!")
            
            # Check status again
            print("\n🔍 New privacy status:")
            check_privacy_status()
        else:
            print("❌ Operation cancelled")
    else:
        print("\n✅ All found items are already private!")