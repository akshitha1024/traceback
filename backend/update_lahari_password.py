#!/usr/bin/env python3
import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

email = 'idommara@kent.edu'
password = 'Lahari'
password_hash = generate_password_hash(password)

cursor.execute('UPDATE users SET password_hash = ? WHERE email = ?', (password_hash, email))
conn.commit()

print(f'Password updated for {email}')
print(f'Password: {password}')

conn.close()
