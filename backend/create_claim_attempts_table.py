import sqlite3

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Create claim_attempts table to track who has attempted to claim each item
cursor.execute("""
    CREATE TABLE IF NOT EXISTS claim_attempts (
        attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
        found_item_id INTEGER NOT NULL,
        user_id INTEGER,
        user_email TEXT NOT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT 0,
        answers_json TEXT,
        UNIQUE(found_item_id, user_email)
    )
""")

print("✅ claim_attempts table created successfully!")

# Create index for faster lookups
cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_claim_attempts_item_user 
    ON claim_attempts(found_item_id, user_email)
""")

print("✅ Index created for claim_attempts!")

# Verify the table
cursor.execute("PRAGMA table_info(claim_attempts)")
columns = cursor.fetchall()
print("\nTable schema:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

conn.commit()
conn.close()

print("\n✅ Migration complete! Users can now only answer verification questions once per item.")
