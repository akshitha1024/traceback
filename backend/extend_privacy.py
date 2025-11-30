#!/usr/bin/env python3
"""
Extend privacy period for all found items to keep them private longer
"""

import sqlite3
from datetime import datetime, timedelta

def extend_privacy_period():
    conn = sqlite3.connect('traceback_100k.db')
    c = conn.cursor()
    
    # Set privacy expiry date to 90 days from now (instead of 30)
    expiry_date = datetime.now() + timedelta(days=90)
    expiry_str = expiry_date.strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"🔒 Extending privacy period for all found items...")
    print(f"📅 Privacy will now expire on: {expiry_str}")
    
    # Update all found items to have extended privacy
    c.execute('''
        UPDATE found_items 
        SET is_private = 1, 
            privacy_expires_at = ?
    ''', (expiry_str,))
    
    updated_count = c.rowcount
    conn.commit()
    
    print(f"✅ Updated {updated_count} items with extended privacy")
    
    # Verify the update
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 1')
    private_count = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM found_items WHERE is_private = 0')
    public_count = c.fetchone()[0]
    
    print(f"\n📊 Final Status:")
    print(f"Private items: {private_count}")
    print(f"Public items: {public_count}")
    
    conn.close()
    return updated_count

if __name__ == "__main__":
    extend_privacy_period()