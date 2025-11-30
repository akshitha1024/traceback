"""
Update TrackeBack Database with Multiple Dates
Updates the database to have items from August 1st, 2025 to present
"""

import sqlite3
import random
from datetime import datetime, timedelta
import os

DB_PATH = "traceback_100k.db"

def update_database_dates():
    """Update database with multiple dates from August 1st, 2025"""
    
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        return False
    
    print("🗄️ Updating TrackeBack Database Dates")
    print("📅 Date range: August 1, 2025 to October 27, 2025")
    print("=" * 50)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Define date range
    start_date = datetime(2025, 8, 1)
    end_date = datetime(2025, 10, 27)
    
    print("📊 Updating lost_items dates...")
    
    # Get all lost items
    cursor.execute("SELECT id FROM lost_items")
    lost_items = cursor.fetchall()
    
    # Update lost items with random dates
    for i, (item_id,) in enumerate(lost_items):
        # Generate random date between start_date and end_date
        time_diff = end_date - start_date
        random_days = random.randint(0, time_diff.days)
        random_date = start_date + timedelta(days=random_days)
        date_str = random_date.strftime("%Y-%m-%d")
        
        cursor.execute("UPDATE lost_items SET date_lost = ? WHERE id = ?", (date_str, item_id))
        
        # Show progress every 5000 items
        if (i + 1) % 5000 == 0:
            print(f"   ✅ Updated {i + 1:,} lost items")
    
    print(f"✅ Updated all {len(lost_items):,} lost items")
    
    print("📊 Updating found_items dates...")
    
    # Get all found items
    cursor.execute("SELECT id FROM found_items")
    found_items = cursor.fetchall()
    
    # Update found items with random dates
    for i, (item_id,) in enumerate(found_items):
        # Generate random date between start_date and end_date
        time_diff = end_date - start_date
        random_days = random.randint(0, time_diff.days)
        random_date = start_date + timedelta(days=random_days)
        date_str = random_date.strftime("%Y-%m-%d")
        
        cursor.execute("UPDATE found_items SET date_found = ? WHERE id = ?", (date_str, item_id))
        
        # Show progress every 5000 items
        if (i + 1) % 5000 == 0:
            print(f"   ✅ Updated {i + 1:,} found items")
    
    print(f"✅ Updated all {len(found_items):,} found items")
    
    # Commit changes
    conn.commit()
    
    # Verify the update
    print("\n📊 Verification - Date ranges after update:")
    
    cursor.execute("SELECT MIN(date_lost), MAX(date_lost) FROM lost_items")
    min_lost, max_lost = cursor.fetchone()
    print(f"   Lost items: {min_lost} to {max_lost}")
    
    cursor.execute("SELECT MIN(date_found), MAX(date_found) FROM found_items")
    min_found, max_found = cursor.fetchone()
    print(f"   Found items: {min_found} to {max_found}")
    
    # Show sample of different dates
    print("\n📅 Sample dates in database:")
    cursor.execute("SELECT DISTINCT date_lost FROM lost_items ORDER BY date_lost LIMIT 10")
    sample_dates = cursor.fetchall()
    for date in sample_dates:
        cursor.execute("SELECT COUNT(*) FROM lost_items WHERE date_lost = ?", (date[0],))
        count = cursor.fetchone()[0]
        print(f"   {date[0]}: {count:,} lost items")
    
    conn.close()
    
    print("\n🎉 Database updated successfully!")
    print("📊 Items now span from August 1, 2025 to October 27, 2025")
    
    return True

def show_date_distribution():
    """Show the distribution of dates in the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n📊 Date Distribution Analysis")
    print("=" * 40)
    
    # Count items by month
    print("📅 Lost Items by Month:")
    cursor.execute("""
        SELECT strftime('%Y-%m', date_lost) as month, COUNT(*) as count
        FROM lost_items 
        GROUP BY month 
        ORDER BY month
    """)
    
    for month, count in cursor.fetchall():
        print(f"   {month}: {count:,} items")
    
    print("\n📅 Found Items by Month:")
    cursor.execute("""
        SELECT strftime('%Y-%m', date_found) as month, COUNT(*) as count
        FROM found_items 
        GROUP BY month 
        ORDER BY month
    """)
    
    for month, count in cursor.fetchall():
        print(f"   {month}: {count:,} items")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 TrackeBack Database Date Updater")
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    if update_database_dates():
        show_date_distribution()
    else:
        print("❌ Failed to update database")