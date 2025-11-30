"""
Test User-Specific Reports with Matches
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_user_reports_with_matches():
    print("=" * 70)
    print("Testing User Reports with ML Matches (>30% threshold)")
    print("=" * 70)
    
    # Test with user_id = 1
    user_id = 1
    
    print(f"\n1. Testing /api/user/{user_id}/reports-with-matches")
    print("-" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/api/user/{user_id}/reports-with-matches")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n✅ Success! Response:")
            print(f"   User ID: {data['user_id']}")
            print(f"   Total Reports: {data['total_reports']}")
            print(f"   Lost Reports: {data['total_lost']}")
            print(f"   Found Reports: {data['total_found']}")
            print(f"   Total Matches: {data['total_matches']}")
            
            # Show lost reports with matches
            if data['lost_reports']:
                print(f"\n   📋 Lost Reports:")
                for report in data['lost_reports'][:3]:
                    print(f"\n      Lost Item: {report.get('title', 'N/A')}")
                    print(f"      Category: {report.get('category_name', 'N/A')}")
                    print(f"      Location: {report.get('location_name', 'N/A')}")
                    print(f"      Matches: {report['match_count']}")
                    
                    if report['matches']:
                        print(f"      Top Match:")
                        top_match = report['matches'][0]
                        print(f"         - Found Item ID: {top_match['found_item_id']}")
                        print(f"         - Score: {top_match['match_score']:.2%}")
                        print(f"         - Description Sim: {top_match['description_similarity']:.2%}")
                        print(f"         - Location Match: {top_match['location_similarity']:.0%}")
                        print(f"         - Category Match: {top_match['category_similarity']:.0%}")
            
            # Show found reports with matches
            if data['found_reports']:
                print(f"\n   📋 Found Reports:")
                for report in data['found_reports'][:3]:
                    print(f"\n      Found Item: {report.get('title', 'N/A')}")
                    print(f"      Category: {report.get('category_name', 'N/A')}")
                    print(f"      Location: {report.get('location_name', 'N/A')}")
                    print(f"      Matches: {report['match_count']}")
                    
                    if report['matches']:
                        print(f"      Top Match:")
                        top_match = report['matches'][0]
                        print(f"         - Lost Item ID: {top_match['lost_item_id']}")
                        print(f"         - Score: {top_match['match_score']:.2%}")
                        print(f"         - Description Sim: {top_match['description_similarity']:.2%}")
                        print(f"         - Location Match: {top_match['location_similarity']:.0%}")
                        print(f"         - Category Match: {top_match['category_similarity']:.0%}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server")
        print("   Please start the server with: python comprehensive_app.py")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print(f"\n\n2. Testing /api/user/{user_id}/matches-summary")
    print("-" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/api/user/{user_id}/matches-summary")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n✅ Success! Summary:")
            print(f"   User ID: {data['user_id']}")
            print(f"   Lost Reports: {data['lost_reports']}")
            print(f"   Found Reports: {data['found_reports']}")
            print(f"   Total Reports: {data['total_reports']}")
            print(f"   Total Matches: {data['total_matches']}")
            print(f"   High Confidence (>50%): {data['high_confidence_matches']}")
            print(f"   Has Matches: {'Yes' if data['has_matches'] else 'No'}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 70)
    print("✅ User Reports with Matches Test Complete!")
    print("=" * 70)
    print("\nEndpoints Available:")
    print(f"  GET /api/user/<user_id>/reports-with-matches")
    print(f"  GET /api/user/<user_id>/matches-summary")
    print("\nUsage Example:")
    print(f"  curl {BASE_URL}/api/user/1/reports-with-matches")

if __name__ == '__main__':
    test_user_reports_with_matches()
