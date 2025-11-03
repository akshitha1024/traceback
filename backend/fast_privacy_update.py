import sqlite3

conn = sqlite3.connect('trackeback_100k.db')
c = conn.cursor()

print("🚀 Fast update: Setting privacy to 1 month from posted date...")

# Update all items with privacy expiry = created_at + 30 days
c.execute("""
    UPDATE found_items 
    SET is_private = 1, 
        privacy_expires_at = datetime(created_at, '+30 days')
""")

updated_count = c.rowcount
conn.commit()

print(f"✅ Updated {updated_count} items in one query")

# Check current status
c.execute('SELECT COUNT(*) FROM found_items WHERE privacy_expires_at > datetime("now")')
private_count = c.fetchone()[0]

c.execute('SELECT COUNT(*) FROM found_items WHERE privacy_expires_at <= datetime("now")')
public_count = c.fetchone()[0]

print(f"📊 Currently private: {private_count}")
print(f"📊 Should be public: {public_count}")
print(f"📊 Total: {private_count + public_count}")

conn.close()
print("🎉 Done!")