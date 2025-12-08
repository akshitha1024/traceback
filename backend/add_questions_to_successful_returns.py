"""
Add columns to successful_returns table to store finder's questions and answers
This allows moderators to see what questions were asked and what the correct answers were
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traceback_100k.db')

def add_questions_columns():
    """Add questions_json and all_claim_responses columns to successful_returns table"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Add questions_json column to store finder's questions with correct answers
        # Format: [{"question": "...", "answer": "...", "type": "text/multiple_choice", "choices": {...}}]
        cursor.execute('''
            ALTER TABLE successful_returns 
            ADD COLUMN questions_json TEXT
        ''')
        print("✅ Added questions_json column")
        
        # Add all_claim_responses column to store ALL claim attempts (not just the winner)
        # Format: [{"email": "...", "name": "...", "answers": [...], "attempted_at": "...", "marked_as_potential": false}]
        cursor.execute('''
            ALTER TABLE successful_returns 
            ADD COLUMN all_claim_responses TEXT
        ''')
        print("✅ Added all_claim_responses column")
        
        conn.commit()
        conn.close()
        
        print("✅ Successfully added columns to successful_returns table")
        return True
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️ Columns already exist, skipping...")
            return True
        else:
            print(f"❌ Error: {e}")
            return False
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        return False

if __name__ == '__main__':
    add_questions_columns()
