import sqlite3

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Create abuse_reports table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS abuse_reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        target_title TEXT,
        reported_by_id INTEGER,
        reported_by_name TEXT,
        reported_by_email TEXT,
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'PENDING',
        priority TEXT DEFAULT 'MEDIUM',
        moderator_notes TEXT,
        moderator_action TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")

print("✅ abuse_reports table created successfully!")

# Verify the table
cursor.execute("PRAGMA table_info(abuse_reports)")
columns = cursor.fetchall()
print("\nTable schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.commit()
conn.close()
