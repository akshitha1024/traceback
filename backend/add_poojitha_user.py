#!/usr/bin/env python3
import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

first_name = 'Poojitha'
last_name = 'Samala'
full_name = f'{first_name} {last_name}'
email = 'psamala@kent.edu'
password = 'Samala'

# Check if exists
cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
existing = cursor.fetchone()

if existing:
    print(f'User already exists with ID: {existing[0]}')
    # Update password
    password_hash = generate_password_hash(password)
    cursor.execute('UPDATE users SET password_hash = ?, first_name = ?, last_name = ?, full_name = ? WHERE email = ?', 
                   (password_hash, first_name, last_name, full_name, email))
    conn.commit()
    print(f'Password and name updated')
else:
    password_hash = generate_password_hash(password)
    
    cursor.execute('''INSERT INTO users (first_name, last_name, full_name, email, password_hash, is_verified, is_active, profile_completed, created_at) 
                      VALUES (?, ?, ?, ?, ?, 1, 1, 0, ?)''',
                   (first_name, last_name, full_name, email, password_hash, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    
    user_id = cursor.lastrowid
    conn.commit()
    
    print(f'User created with ID: {user_id}')

print('=' * 50)
print(f'Name: {full_name}')
print(f'Email: {email}')
print(f'Password: {password}')
print('=' * 50)

cursor.execute('SELECT COUNT(*) FROM users')
print(f'Total users: {cursor.fetchone()[0]}')

conn.close()
