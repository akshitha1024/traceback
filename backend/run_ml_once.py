import sqlite3
import json
from datetime import datetime
from ml_matching_service import MLMatchingService

def run_matching():
    print("Starting ML matching...")
    
    # Initialize ML service
    ml_service = MLMatchingService(db_path='traceback_100k.db')
    
    # Get database connection
    conn = sqlite3.connect('traceback_100k.db')
    conn.row_factory = sqlite3.Row
    
    # Clear old matches
    conn.execute("DELETE FROM ml_matches")
    conn.commit()
    print("Cleared old matches")
    
    # Get all found items
    found_items = conn.execute("""
        SELECT rowid as id, * FROM found_items 
        WHERE is_claimed = 0
    """).fetchall()
    
    print(f"Processing {len(found_items)} found items...")
    
    total_matches = 0
    high_confidence = 0
    
    for found_item in found_items:
        found_id = found_item['id']
        
        # Find matches for this found item
        matches = ml_service.find_matches_for_found_item(
            found_item_id=found_id,
            min_score=0.7,
            top_k=10
        )
        
        # Store matches in database
        for match in matches:
            lost_id = match.get('lost_item_id')
            match_score = match.get('match_score', 0)
            score_breakdown = match.get('score_breakdown', {})
            
            conn.execute("""
                INSERT INTO ml_matches 
                (found_item_id, lost_item_id, match_score, score_breakdown, computed_at)
                VALUES (?, ?, ?, ?, ?)
            """, (found_id, lost_id, match_score, json.dumps(score_breakdown), datetime.now()))
            
            total_matches += 1
            if match_score >= 0.8:
                high_confidence += 1
            
            print(f"  Match: Found #{found_id} <-> Lost #{lost_id} ({match_score:.1%})")
    
    conn.commit()
    conn.close()
    
    print(f"\nComplete! Total matches: {total_matches}, High confidence (>=80%): {high_confidence}")

if __name__ == "__main__":
    run_matching()
