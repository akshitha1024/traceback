import sqlite3

conn = sqlite3.connect('traceback_100k.db')
c = conn.cursor()

print("📋 Sample found items privacy data:")
c.execute('SELECT id, title, is_private, privacy_expires_at, created_at FROM found_items LIMIT 3')
items = c.fetchall()

for item in items:
    print(f"ID: {item[0]}")
    print(f"Title: {item[1]}")
    print(f"Private: {item[2]}")
    print(f"Expires: {item[3]}")
    print(f"Created: {item[4]}")
    print("-" * 40)

conn.close()