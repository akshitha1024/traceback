"""
Update TrackeBack Database Times and Privacy Expiration
- Updates timestamps to have varied times throughout the day
- Sets privacy expiration to 1 month from report date
"""

import sqlite3
import random
from datetime import datetime, timedelta
import os

DB_PATH = "trackeback_100k.db"

def generate_random_time():
    """Generate a random time during business hours (7 AM to 11 PM)"""
    hour = random.randint(7, 23)  # 7 AM to 11 PM
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return f"{hour:02d}:{minute:02d}:{second:02d}"

def update_times_and_privacy():
    """Update database with varied times and 1-month privacy expiration"""
    
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        return False
    
    print("⏰ Updating TrackeBack Database Times and Privacy")
    print("🕐 Adding varied timestamps throughout the day")
    print("🔒 Setting privacy expiration to 1 month from report date")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if timestamp columns exist, if not add them
    cursor.execute("PRAGMA table_info(lost_items)")
    lost_columns = [column[1] for column in cursor.fetchall()]
    
    cursor.execute("PRAGMA table_info(found_items)")
    found_columns = [column[1] for column in cursor.fetchall()]
    
    # Add timestamp columns if they don't exist
    if 'time_lost' not in lost_columns:
        cursor.execute("ALTER TABLE lost_items ADD COLUMN time_lost TEXT")
        print("   ✅ Added time_lost column to lost_items")
    
    if 'time_found' not in found_columns:
        cursor.execute("ALTER TABLE found_items ADD COLUMN time_found TEXT")
        print("   ✅ Added time_found column to found_items")
    
    if 'privacy_expires' not in found_columns:
        cursor.execute("ALTER TABLE found_items ADD COLUMN privacy_expires TEXT")
        print("   ✅ Added privacy_expires column to found_items")
    
    print("\n📊 Updating lost_items with random times...")
    
    # Update lost items with random times
    cursor.execute("SELECT id, date_lost FROM lost_items")
    lost_items = cursor.fetchall()
    
    for i, (item_id, date_lost) in enumerate(lost_items):
        random_time = generate_random_time()
        cursor.execute("UPDATE lost_items SET time_lost = ? WHERE id = ?", (random_time, item_id))
        
        # Show progress every 5000 items
        if (i + 1) % 5000 == 0:
            print(f"   ✅ Updated {i + 1:,} lost items with times")
    
    print(f"✅ Updated all {len(lost_items):,} lost items with random times")
    
    print("\n📊 Updating found_items with random times and privacy expiration...")
    
    # Update found items with random times and privacy expiration
    cursor.execute("SELECT id, date_found FROM found_items")
    found_items = cursor.fetchall()
    
    for i, (item_id, date_found) in enumerate(found_items):
        random_time = generate_random_time()
        
        # Calculate privacy expiration (1 month from found date)
        try:
            found_date = datetime.strptime(date_found, "%Y-%m-%d")
            privacy_expires = found_date + timedelta(days=30)  # 1 month = 30 days
            privacy_expires_str = privacy_expires.strftime("%Y-%m-%d")
        except:
            # If date parsing fails, use a default
            privacy_expires_str = "2025-11-28"
        
        cursor.execute("""
            UPDATE found_items 
            SET time_found = ?, privacy_expires = ? 
            WHERE id = ?
        """, (random_time, privacy_expires_str, item_id))
        
        # Show progress every 5000 items
        if (i + 1) % 5000 == 0:
            print(f"   ✅ Updated {i + 1:,} found items with times and privacy")
    
    print(f"✅ Updated all {len(found_items):,} found items")
    
    # Commit changes
    conn.commit()
    
    # Verify the updates
    print("\n📊 Verification - Sample data after update:")
    
    print("\n⏰ Sample Lost Item Times:")
    cursor.execute("SELECT id, date_lost, time_lost FROM lost_items LIMIT 10")
    for item_id, date_lost, time_lost in cursor.fetchall():
        print(f"   Item {item_id}: {date_lost} at {time_lost}")
    
    print("\n⏰ Sample Found Item Times and Privacy:")
    cursor.execute("SELECT id, date_found, time_found, privacy_expires FROM found_items LIMIT 10")
    for item_id, date_found, time_found, privacy_expires in cursor.fetchall():
        print(f"   Item {item_id}: {date_found} at {time_found} (expires: {privacy_expires})")
    
    # Statistics
    cursor.execute("SELECT COUNT(*) FROM lost_items WHERE time_lost IS NOT NULL")
    lost_with_time = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM found_items WHERE time_found IS NOT NULL AND privacy_expires IS NOT NULL")
    found_with_time_privacy = cursor.fetchone()[0]
    
    print(f"\n📈 Update Statistics:")
    print(f"   Lost items with times: {lost_with_time:,}")
    print(f"   Found items with times & privacy: {found_with_time_privacy:,}")
    
    # Show privacy expiration distribution
    print(f"\n🔒 Privacy Expiration Sample:")
    cursor.execute("""
        SELECT date_found, privacy_expires, 
               CASE 
                   WHEN privacy_expires > date('now') THEN 'Active'
                   ELSE 'Expired'
               END as status
        FROM found_items 
        LIMIT 10
    """)
    
    for date_found, privacy_expires, status in cursor.fetchall():
        print(f"   Found: {date_found} → Expires: {privacy_expires} ({status})")
    
    conn.close()
    
    print("\n🎉 Database updated successfully!")
    print("⏰ All items now have varied timestamps")
    print("🔒 Privacy expiration set to 1 month from report date")
    
    return True

def show_time_distribution():
    """Show the distribution of times in the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n📊 Time Distribution Analysis")
    print("=" * 40)
    
    # Count items by hour for lost items
    print("🕐 Lost Items by Hour:")
    cursor.execute("""
        SELECT substr(time_lost, 1, 2) as hour, COUNT(*) as count
        FROM lost_items 
        WHERE time_lost IS NOT NULL
        GROUP BY hour 
        ORDER BY hour
    """)
    
    for hour, count in cursor.fetchall():
        hour_12 = int(hour)
        ampm = "AM" if hour_12 < 12 else "PM"
        if hour_12 == 0:
            hour_12 = 12
        elif hour_12 > 12:
            hour_12 -= 12
        print(f"   {hour_12:2d} {ampm}: {count:,} items")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 TrackeBack Time & Privacy Updater")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    if update_times_and_privacy():
        show_time_distribution()
    else:
        print("❌ Failed to update times and privacy")