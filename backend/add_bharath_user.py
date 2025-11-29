import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

# User to add
user = {
    'email': 'bnadipin@kent.edu',
    'password': 'Bharat',
    'first_name': 'Bharath Kumar',
    'last_name': 'Nadipineni',
    'full_name': 'Bharath Kumar Nadipineni'
}

print("Adding user to database...")

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

# Verify user was added
cursor.execute("SELECT id, email, first_name, last_name FROM users ORDER BY id")
all_users = cursor.fetchall()

print(f"\n=== Total Users in Database: {len(all_users)} ===")
for u in all_users:
    print(f"ID: {u[0]}, Email: {u[1]}, Name: {u[2]} {u[3]}")

conn.close()
print("\nDone!")
