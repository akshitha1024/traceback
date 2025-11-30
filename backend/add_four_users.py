import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# Users to add
users = [
    {
        'email': 'bdharav1@kent.edu',
        'password': 'Bhanup',
        'first_name': 'Bhanu Prasad',
        'last_name': 'Dharavathu',
        'full_name': 'Bhanu Prasad Dharavathu'
    },
    {
        'email': 'idommara@kent.edu',
        'password': 'Lahari',
        'first_name': 'Lahari',
        'last_name': 'Dommaraju',
        'full_name': 'Lahari Dommaraju'
    },
    {
        'email': 'rnimmana@kent.edu',
        'password': 'Roopan',
        'first_name': 'Roopa',
        'last_name': 'Nimmanapalli',
        'full_name': 'Roopa Nimmanapalli'
    },
    {
        'email': 'psamala@kent.edu',
        'password': 'Samala',
        'first_name': 'Poojitha',
        'last_name': 'Samala',
        'full_name': 'Poojitha Samala'
    }
]

print("Adding users to database...")

for user in users:
    # Generate password hash using Werkzeug (matches the login system)
    password_hash = generate_password_hash(user['password'])
    
    try:
        cursor.execute("""
            INSERT INTO users (
                email, password_hash, first_name, last_name, full_name,
                is_verified, is_active, profile_completed, 
                notification_preferences, privacy_settings, created_at
            ) VALUES (?, ?, ?, ?, ?, 1, 1, 0, 'all', 'public', ?)
        """, (
            user['email'],
            password_hash,
            user['first_name'],
            user['last_name'],
            user['full_name'],
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        print(f"✓ Added user: {user['email']} (password: {user['password']})")
        
    except sqlite3.IntegrityError as e:
        print(f"✗ User {user['email']} already exists: {e}")

conn.commit()

# Verify users were added
cursor.execute("SELECT id, email, first_name, last_name FROM users ORDER BY id")
all_users = cursor.fetchall()

print(f"\n=== Total Users in Database: {len(all_users)} ===")
for user in all_users:
    print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}")

conn.close()
print("\nDone!")
