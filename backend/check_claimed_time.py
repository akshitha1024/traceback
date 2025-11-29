import sqlite3
from datetime import datetime, timedelta

conn = sqlite3.connect('traceback_100k.db')
cursor = conn.cursor()

print('Current time (ET):', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
print()

cursor.execute('''
    SELECT ca.found_item_id, ca.user_email, ca.attempted_at, ca.success
    FROM claim_attempts ca
    WHERE ca.success = 1
    LIMIT 5
''')

rows = cursor.fetchall()
print('Claim Attempts with success=1:')
for row in rows:
    item_id, user, attempted_at, success = row
    print(f'Item ID: {item_id}, User: {user}')
    print(f'  Attempted at: {attempted_at}')
    
    if attempted_at:
        attempted = datetime.strptime(attempted_at, '%Y-%m-%d %H:%M:%S')
        now = datetime.now()
        deadline = attempted + timedelta(seconds=120)
        
        diff_seconds = (now - attempted).total_seconds()
        remaining_seconds = (deadline - now).total_seconds()
        
        print(f'  Seconds since attempt: {diff_seconds:.0f}')
        print(f'  Deadline: {deadline.strftime("%Y-%m-%d %H:%M:%S")}')
        print(f'  Seconds remaining: {remaining_seconds:.0f}')
    print()

conn.close()
