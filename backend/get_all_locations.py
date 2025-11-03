import sqlite3

# Connect to database
conn = sqlite3.connect('trackeback_100k.db')
c = conn.cursor()

# Get all locations
c.execute('SELECT id, name FROM locations ORDER BY id')
locations = c.fetchall()

print('const fallbackLocations = [')
for loc in locations:
    print(f'  {{ id: {loc[0]}, name: "{loc[1]}" }},')
print('];')

conn.close()