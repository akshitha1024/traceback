import sqlite3

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Create bug_reports table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS bug_reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        issue_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT DEFAULT 'MEDIUM',
        browser TEXT,
        device_type TEXT,
        status TEXT DEFAULT 'OPEN',
        moderator_notes TEXT,
        moderator_email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
    )
""")

print("✅ bug_reports table created successfully!")

# Verify the table
cursor.execute("PRAGMA table_info(bug_reports)")
columns = cursor.fetchall()
print("\nTable schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.commit()
conn.close()
