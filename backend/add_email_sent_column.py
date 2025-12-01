"""
Add email_sent column to ml_matches table
This tracks whether a notification email has been sent for each match
"""

import sqlite3

DB_PATH = 'traceback_100k.db'

def add_email_sent_column():
    """Add email_sent column to ml_matches table"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(ml_matches)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'email_sent' not in columns:
            print("Adding email_sent column to ml_matches table...")
            cursor.execute('''
                ALTER TABLE ml_matches 
                ADD COLUMN email_sent INTEGER DEFAULT 0
            ''')
            conn.commit()
            print("✅ email_sent column added successfully!")
        else:
            print("✅ email_sent column already exists")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error adding email_sent column: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    add_email_sent_column()
