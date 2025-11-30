"""
Create ML Matches table for storing pre-computed ML matching results
This improves performance by caching match results instead of computing on every dashboard load
"""

import sqlite3
from datetime import datetime

DB_PATH = 'traceback_100k.db'

def create_ml_matches_table():
    """Create the ml_matches table for storing pre-computed matching results"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create ml_matches table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ml_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                found_item_id INTEGER NOT NULL,
                lost_item_id INTEGER NOT NULL,
                match_score REAL NOT NULL,
                score_breakdown TEXT,
                computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (found_item_id) REFERENCES found_items(rowid) ON DELETE CASCADE,
                FOREIGN KEY (lost_item_id) REFERENCES lost_items(rowid) ON DELETE CASCADE,
                UNIQUE(found_item_id, lost_item_id)
            )
        ''')
        
        # Create indexes for fast lookups
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ml_matches_found 
            ON ml_matches(found_item_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ml_matches_lost 
            ON ml_matches(lost_item_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ml_matches_score 
            ON ml_matches(match_score DESC)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_ml_matches_computed 
            ON ml_matches(computed_at DESC)
        ''')
        
        conn.commit()
        conn.close()
        
        print("✅ ML Matches table created successfully!")
        print("📊 Table structure:")
        print("   - id: Primary key")
        print("   - found_item_id: Reference to found item")
        print("   - lost_item_id: Reference to lost item")
        print("   - match_score: Similarity score (0.0 to 1.0)")
        print("   - score_breakdown: JSON with detailed scoring")
        print("   - computed_at: When match was computed")
        print("\n🚀 Indexes created for fast queries:")
        print("   - By found_item_id (for found item detail pages)")
        print("   - By lost_item_id (for dashboard - user's lost items)")
        print("   - By match_score (for high-confidence matches)")
        print("   - By computed_at (for freshness checks)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating ml_matches table: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 70)
    print("Creating ML Matches Table")
    print("=" * 70)
    create_ml_matches_table()
