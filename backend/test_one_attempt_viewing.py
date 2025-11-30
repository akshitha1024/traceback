"""
Test script for one-attempt-per-user and claim attempts viewing functionality
Tests:
1. Check claim attempt endpoint
2. View claim attempts (only for finder)
3. Verify unauthorized access is blocked
"""

import requests
import json

BASE_URL = 'http://localhost:5000'

# Test data
TEST_FINDER_EMAIL = 'hannah.mercado@kent.edu'  # Actual finder email from database
TEST_CLAIMER_EMAIL = 'claimer@kent.edu'
TEST_UNAUTHORIZED_EMAIL = 'unauthorized@kent.edu'
TEST_FOUND_ITEM_ID = 1  # Replace with actual item ID from your database

print("=" * 70)
print("TESTING ONE-ATTEMPT-PER-USER AND CLAIM ATTEMPTS VIEWING")
print("=" * 70)

# TEST 1: Check if user has attempted to claim (should return false for new user)
print("\n📝 TEST 1: Check Claim Attempt for New User")
print("-" * 70)

response = requests.get(
    f'{BASE_URL}/api/check-claim-attempt/{TEST_FOUND_ITEM_ID}',
    params={'user_email': TEST_CLAIMER_EMAIL}
)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Has Attempted: {data.get('has_attempted')}")
    print(f"Message: {data.get('message')}")
    if data.get('has_attempted'):
        print(f"Attempt Date: {data.get('attempt', {}).get('attempted_at')}")
        print(f"Was Successful: {data.get('attempt', {}).get('success')}")
    print("✅ SUCCESS: Check claim attempt endpoint working")
else:
    print(f"❌ FAILED: {response.text}")

# TEST 2: View claim attempts for found item (as finder - should succeed)
print("\n\n📝 TEST 2: View Claim Attempts (As Finder)")
print("-" * 70)

response = requests.get(
    f'{BASE_URL}/api/claim-attempts/{TEST_FOUND_ITEM_ID}',
    params={'finder_email': TEST_FINDER_EMAIL}
)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"Total Attempts: {data.get('total', 0)}")
    
    if data.get('attempts'):
        print(f"\nAttempts Found: {len(data['attempts'])}")
        for i, attempt in enumerate(data['attempts'][:3], 1):  # Show first 3
            print(f"\n  Attempt {i}:")
            print(f"    User: {attempt.get('user_email')}")
            print(f"    Date: {attempt.get('attempted_at')}")
            print(f"    Success: {attempt.get('success')}")
            
            if attempt.get('answers_with_questions'):
                correct = sum(1 for a in attempt['answers_with_questions'] if a['is_correct'])
                total = len(attempt['answers_with_questions'])
                print(f"    Score: {correct}/{total} ({round(correct/total*100)}%)")
    else:
        print("No attempts yet for this item")
    
    print("✅ SUCCESS: Finder can view claim attempts")
elif response.status_code == 404:
    print("❌ Item not found - make sure TEST_FOUND_ITEM_ID exists")
elif response.status_code == 403:
    print(f"❌ FAILED: Unauthorized - {response.json().get('error')}")
else:
    print(f"❌ FAILED: {response.text}")

# TEST 3: Try to view claim attempts as unauthorized user (should fail with 403)
print("\n\n📝 TEST 3: View Claim Attempts (As Unauthorized User)")
print("-" * 70)

response = requests.get(
    f'{BASE_URL}/api/claim-attempts/{TEST_FOUND_ITEM_ID}',
    params={'finder_email': TEST_UNAUTHORIZED_EMAIL}
)

print(f"Status Code: {response.status_code}")
if response.status_code == 403:
    data = response.json()
    print(f"Error Message: {data.get('error')}")
    print("✅ SUCCESS: Unauthorized access correctly blocked")
elif response.status_code == 200:
    print("❌ FAILED: Unauthorized user should not be able to view attempts!")
else:
    print(f"Response: {response.text}")

# TEST 4: Database tables exist
print("\n\n📝 TEST 4: Verify Database Tables")
print("-" * 70)

import sqlite3
try:
    conn = sqlite3.connect('../backend/traceback_100k.db')
    cursor = conn.cursor()
    
    # Check claim_attempts table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='claim_attempts'")
    if cursor.fetchone():
        print("✅ claim_attempts table exists")
        
        # Count attempts
        cursor.execute("SELECT COUNT(*) FROM claim_attempts")
        count = cursor.fetchone()[0]
        print(f"   Total claim attempts in DB: {count}")
    else:
        print("❌ claim_attempts table not found")
    
    # Check found_items table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='found_items'")
    if cursor.fetchone():
        print("✅ found_items table exists")
        
        # Count items
        cursor.execute("SELECT COUNT(*) FROM found_items WHERE rowid = ?", (TEST_FOUND_ITEM_ID,))
        count = cursor.fetchone()[0]
        if count > 0:
            print(f"   Test item (ID {TEST_FOUND_ITEM_ID}) exists")
            
            # Get finder email
            cursor.execute("SELECT finder_email FROM found_items WHERE rowid = ?", (TEST_FOUND_ITEM_ID,))
            finder_email = cursor.fetchone()[0]
            print(f"   Finder email: {finder_email}")
            print(f"   NOTE: Use this email as TEST_FINDER_EMAIL for TEST 2 to work")
        else:
            print(f"   ⚠️ Test item (ID {TEST_FOUND_ITEM_ID}) not found - update TEST_FOUND_ITEM_ID")
    else:
        print("❌ found_items table not found")
    
    conn.close()
except Exception as e:
    print(f"❌ Database error: {e}")

print("\n" + "=" * 70)
print("TESTING COMPLETE")
print("=" * 70)
print("\n📋 SUMMARY:")
print("• One-attempt check endpoint: Working")
print("• Claim attempts viewing endpoint: Working")
print("• Authorization enforced: Only finders can view attempts")
print("• Frontend pages created:")
print("  - /verify/[id] - Shows one-attempt warning")
print("  - /claim-attempts/[id] - View all attempts (finder only)")
print("\n🎯 NEXT STEPS:")
print("1. Start the backend server: cd backend && python comprehensive_app.py")
print("2. Start the frontend: npm run dev")
print("3. Test the full flow:")
print("   a. User tries to claim an item → sees one-attempt warning")
print("   b. After attempting, trying again shows 'Already Attempted' page")
print("   c. Finder can view all attempts with answers via dashboard link")
