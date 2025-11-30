"""
Test Automatic Matching with 70% Threshold
"""

import os
from ml_matching_service import MLMatchingService

def test_automatic_matching():
    print("=" * 70)
    print("Testing Automatic ML Matching (>70% threshold)")
    print("=" * 70)
    
    db_path = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
    upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
    
    print("\n1. Initializing ML Matching Service...")
    service = MLMatchingService(db_path, upload_folder=upload_folder)
    print("✅ ML Service initialized!")
    
    print("\n2. Finding high-confidence matches (>70%)...")
    
    # Test with first 10 found items
    print("\n   Testing Found Items -> Lost Items matches:")
    for found_id in range(1, 11):
        try:
            matches = service.find_matches_for_found_item(
                found_item_id=found_id,
                min_score=0.7,  # 70% threshold
                top_k=5
            )
            
            if matches:
                print(f"\n   ✅ Found Item #{found_id}: {len(matches)} match(es)")
                for i, match in enumerate(matches[:2], 1):
                    print(f"      Match {i}: Lost Item #{match['lost_item_id']} - Score: {match['match_score']:.2%}")
                    print(f"         Description: {match['description_similarity']:.2%}, "
                          f"Location: {match['location_similarity']:.0%}, "
                          f"Category: {match['category_similarity']:.0%}")
            else:
                print(f"   ⚪ Found Item #{found_id}: No matches above 70%")
        except Exception as e:
            print(f"   ❌ Error for Found Item #{found_id}: {e}")
    
    print("\n\n   Testing Lost Items -> Found Items matches:")
    for lost_id in range(1, 11):
        try:
            matches = service.find_matches_for_lost_item(
                lost_item_id=lost_id,
                min_score=0.7,  # 70% threshold
                top_k=5
            )
            
            if matches:
                print(f"\n   ✅ Lost Item #{lost_id}: {len(matches)} match(es)")
                for i, match in enumerate(matches[:2], 1):
                    print(f"      Match {i}: Found Item #{match['found_item_id']} - Score: {match['match_score']:.2%}")
                    print(f"         Description: {match['description_similarity']:.2%}, "
                          f"Location: {match['location_similarity']:.0%}, "
                          f"Category: {match['category_similarity']:.0%}")
            else:
                print(f"   ⚪ Lost Item #{lost_id}: No matches above 70%")
        except Exception as e:
            print(f"   ❌ Error for Lost Item #{lost_id}: {e}")
    
    print("\n\n3. Summary Statistics:")
    print("   Finding all matches across database...")
    
    try:
        all_matches = service.batch_match_all_items(min_score=0.7)
        
        print(f"\n   📊 Total high-confidence matches (>70%): {len(all_matches)}")
        
        if all_matches:
            print(f"\n   Top 5 Matches:")
            for i, match in enumerate(all_matches[:5], 1):
                print(f"\n   {i}. Lost #{match['lost_item_id']} ↔️ Found #{match['found_item_id']}")
                print(f"      Score: {match['match_score']:.2%}")
                print(f"      Lost: {match['lost_item_title']}")
                print(f"      Found: {match['found_item_title']}")
        
        # Count distribution
        score_ranges = {
            '70-75%': 0,
            '75-80%': 0,
            '80-85%': 0,
            '85-90%': 0,
            '90-95%': 0,
            '95-100%': 0
        }
        
        for match in all_matches:
            score = match['match_score']
            if 0.70 <= score < 0.75:
                score_ranges['70-75%'] += 1
            elif 0.75 <= score < 0.80:
                score_ranges['75-80%'] += 1
            elif 0.80 <= score < 0.85:
                score_ranges['80-85%'] += 1
            elif 0.85 <= score < 0.90:
                score_ranges['85-90%'] += 1
            elif 0.90 <= score < 0.95:
                score_ranges['90-95%'] += 1
            elif score >= 0.95:
                score_ranges['95-100%'] += 1
        
        print(f"\n   📈 Score Distribution:")
        for range_name, count in score_ranges.items():
            if count > 0:
                print(f"      {range_name}: {count} matches")
    
    except Exception as e:
        print(f"   ❌ Error in batch matching: {e}")
    
    print("\n" + "=" * 70)
    print("✅ Automatic Matching Test Complete!")
    print("=" * 70)

if __name__ == '__main__':
    test_automatic_matching()
