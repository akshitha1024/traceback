import sqlite3

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Create notifications table for ML matching alerts
cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        match_score REAL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, item_id, notification_type)
    )
""")

print("✅ notifications table created successfully!")

# Create index for faster lookups
cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_notifications_user_email 
    ON notifications(user_email, is_read)
""")

print("✅ Index created for notifications!")

# Verify the table
cursor.execute("PRAGMA table_info(notifications)")
columns = cursor.fetchall()
print("\nTable schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.commit()
conn.close()

print("\n✅ Migration complete! Automatic ML notifications are now ready.")
