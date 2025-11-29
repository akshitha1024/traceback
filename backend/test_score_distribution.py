"""
Test to see what match scores we're actually getting
"""

import os
from ml_matching_service import MLMatchingService

db_path = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
service = MLMatchingService(db_path)

print("Testing match scores with different thresholds...\n")

# Test with lower thresholds
for threshold in [0.3, 0.4, 0.5, 0.6]:
    matches = service.batch_match_all_items(min_score=threshold)
    print(f"Threshold {threshold:.0%}: {len(matches)} matches")
    
    if matches and threshold == 0.3:
        print("\nTop 10 matches at 30% threshold:")
        for i, match in enumerate(matches[:10], 1):
            print(f"{i}. Score: {match['match_score']:.2%} - "
                  f"Desc:{match['description_similarity']:.2%}, "
                  f"Loc:{match['location_similarity']:.0%}, "
                  f"Cat:{match['category_similarity']:.0%}, "
                  f"Color:{match['color_similarity']:.0%}, "
                  f"Date:{match['date_similarity']:.2%}")
