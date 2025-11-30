"""
Create successful_returns table to permanently store information about finalized claims
This data is kept for moderation purposes even after found items are deleted
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traceback_100k.db')

def create_successful_returns_table():
    """Create table to store successful return/claim records permanently"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create successful_returns table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS successful_returns (
                return_id INTEGER PRIMARY KEY AUTOINCREMENT,
                
                -- Item Information (captured before deletion)
                item_id INTEGER NOT NULL,
                item_title TEXT NOT NULL,
                item_description TEXT,
                item_category TEXT,
                item_location TEXT,
                date_found DATE,
                
                -- Owner/Finder Information
                owner_email TEXT NOT NULL,
                owner_name TEXT,
                
                -- Claimer Information
                claimer_email TEXT NOT NULL,
                claimer_name TEXT,
                
                -- Claim Details
                claim_reason TEXT NOT NULL,
                finalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                finalized_date DATE,
                
                -- Additional Context
                answers_provided TEXT,
                days_to_finalize INTEGER,
                
                -- Moderation Flags
                is_verified BOOLEAN DEFAULT 1,
                moderation_notes TEXT,
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        print("✅ Created successful_returns table")
        
        # Create indexes for efficient querying
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_successful_returns_owner 
            ON successful_returns(owner_email)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_successful_returns_claimer 
            ON successful_returns(claimer_email)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_successful_returns_date 
            ON successful_returns(finalized_date)
        ''')
        
        print("✅ Created indexes on successful_returns table")
        
        conn.commit()
        conn.close()
        
        print("✅ Successfully created successful_returns table with indexes")
        return True
        
    except Exception as e:
        print(f"❌ Error creating successful_returns table: {e}")
        return False

if __name__ == '__main__':
    create_successful_returns_table()
