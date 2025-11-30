import sqlite3

conn = sqlite3.connect('traceback_100k.db')

print("Lost items columns:")
cursor = conn.execute('PRAGMA table_info(lost_items)')
for row in cursor:
    print(f"  {row[1]} ({row[2]})")

print("\nFound items columns:")
cursor = conn.execute('PRAGMA table_info(found_items)')
for row in cursor:
    print(f"  {row[1]} ({row[2]})")

print("\nSample lost item:")
cursor = conn.execute('SELECT * FROM lost_items LIMIT 1')
print(cursor.fetchone())

print("\nSample found item:")
cursor = conn.execute('SELECT * FROM found_items LIMIT 1')
print(cursor.fetchone())

conn.close()
