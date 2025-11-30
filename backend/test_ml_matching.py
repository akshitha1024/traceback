"""
Test ML Matching Service
"""

import os
from ml_matching_service import MLMatchingService

def test_ml_service():
    print("=" * 70)
    print("Testing ML Matching Service")
    print("=" * 70)
    
    db_path = os.path.join(os.path.dirname(__file__), 'traceback_100k.db')
    upload_folder = os.path.join(os.path.dirname(__file__), 'uploads')
    
    print("\n1. Initializing ML Matching Service...")
    try:
        service = MLMatchingService(db_path, upload_folder=upload_folder)
        print("✅ ML Service initialized successfully!")
    except Exception as e:
        print(f"❌ Error initializing service: {e}")
        return
    
    print("\n2. Testing text similarity...")
    desc1 = "Lost brown leather wallet near library"
    desc2 = "Found brown wallet at library entrance"
    desc3 = "Found blue backpack in cafeteria"
    
    sim1 = service.text_similarity(desc1, desc2)
    sim2 = service.text_similarity(desc1, desc3)
    
    print(f"   Similar descriptions (wallet): {sim1:.4f}")
    print(f"   Different descriptions (wallet vs backpack): {sim2:.4f}")
    
    print("\n3. Testing location similarity...")
    loc_sim1 = service.location_similarity("Library", "Library")
    loc_sim2 = service.location_similarity("Library", "Student Center")
    print(f"   Same location: {loc_sim1:.4f}")
    print(f"   Different location: {loc_sim2:.4f}")
    
    print("\n4. Testing category similarity...")
    cat_sim1 = service.category_similarity("Wallet", "Wallet")
    cat_sim2 = service.category_similarity("Wallet", "Backpack")
    print(f"   Same category: {cat_sim1:.4f}")
    print(f"   Different category: {cat_sim2:.4f}")
    
    print("\n5. Testing date similarity...")
    date_sim1 = service.date_similarity_linear("2025-11-20", "2025-11-20", window=14)
    date_sim2 = service.date_similarity_linear("2025-11-20", "2025-11-25", window=14)
    date_sim3 = service.date_similarity_linear("2025-11-20", "2025-12-10", window=14)
    print(f"   Same date: {date_sim1:.4f}")
    print(f"   5 days apart: {date_sim2:.4f}")
    print(f"   20 days apart: {date_sim3:.4f}")
    
    print("\n6. Testing find matches for lost item...")
    try:
        matches = service.find_matches_for_lost_item(lost_item_id=1, min_score=0.2, top_k=5)
        print(f"   Found {len(matches)} matches for lost item #1")
        
        if matches:
            print("\n   Top 3 matches:")
            for i, match in enumerate(matches[:3], 1):
                print(f"\n   Match #{i}:")
                print(f"      Found Item ID: {match['found_item_id']}")
                print(f"      Match Score: {match['match_score']:.4f}")
                print(f"      - Description Sim: {match['description_similarity']:.4f}")
                print(f"      - Image Sim: {match['image_similarity']:.4f}")
                print(f"      - Location Sim: {match['location_similarity']:.4f}")
                print(f"      - Category Sim: {match['category_similarity']:.4f}")
                print(f"      - Color Sim: {match['color_similarity']:.4f}")
                print(f"      - Date Sim: {match['date_similarity']:.4f}")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    print("\n7. Testing find matches for found item...")
    try:
        matches = service.find_matches_for_found_item(found_item_id=1, min_score=0.2, top_k=5)
        print(f"   Found {len(matches)} matches for found item #1")
        
        if matches:
            print(f"\n   Top match score: {matches[0]['match_score']:.4f}")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    print("\n" + "=" * 70)
    print("✅ ML Matching Service Test Complete!")
    print("=" * 70)

if __name__ == '__main__':
    test_ml_service()
