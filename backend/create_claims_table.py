import sqlite3

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Create ownership_claims table to track verified claims
cursor.execute("""
    CREATE TABLE IF NOT EXISTS ownership_claims (
        claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        item_title TEXT,
        claimer_user_id INTEGER,
        claimer_name TEXT,
        claimer_email TEXT,
        claimer_phone TEXT,
        finder_name TEXT,
        finder_email TEXT,
        finder_phone TEXT,
        verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        claimed_status TEXT DEFAULT 'PENDING',
        claimed_date TIMESTAMP,
        notes TEXT
    )
""")

print("✅ ownership_claims table created successfully!")

# Verify the table
cursor.execute("PRAGMA table_info(ownership_claims)")
columns = cursor.fetchall()
print("\nTable schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.commit()
conn.close()
