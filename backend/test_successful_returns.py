"""
Test Script for Successful Returns Feature
Demonstrates the complete flow of finalizing a claim and viewing success history
"""

import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'traceback_100k.db')

def test_successful_returns_flow():
    """Test the complete successful returns flow"""
    
    print("🧪 Testing Successful Returns Feature")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 1. Find a test item with claim attempts
    print("\n1️⃣ Finding test item with claim attempts...")
    cursor.execute('''
        SELECT fi.rowid, fi.title, fi.finder_email, fi.date_found,
               ca.user_email, ca.success, u.full_name as claimer_name
        FROM found_items fi
        JOIN claim_attempts ca ON ca.found_item_id = fi.rowid
        LEFT JOIN users u ON u.email = ca.user_email
        WHERE ca.success = 1 
        LIMIT 1
    ''')
    
    test_item = cursor.fetchone()
    
    if not test_item:
        print("❌ No test items found. Creating a test scenario...")
        # For demo purposes, you would create test data here
        conn.close()
        return
    
    print(f"✅ Found test item:")
    print(f"   - Item ID: {test_item['rowid']}")
    print(f"   - Title: {test_item['title']}")
    print(f"   - Owner: {test_item['finder_email']}")
    print(f"   - Potential Claimer: {test_item['user_email']}")
    print(f"   - Date Found: {test_item['date_found']}")
    
    # 2. Check if 3 days have passed (for testing, we'll check the date)
    date_found = datetime.strptime(test_item['date_found'], '%Y-%m-%d')
    days_since_found = (datetime.now() - date_found).days
    
    print(f"\n2️⃣ Checking waiting period...")
    print(f"   - Days since found: {days_since_found}")
    print(f"   - Required waiting period: 3 days")
    
    if days_since_found < 3:
        print(f"   ⚠️  Still need to wait {3 - days_since_found} more days")
        print(f"   💡 For testing, you can modify the date_found in the database")
    else:
        print(f"   ✅ Waiting period complete!")
    
    # 3. Show what the finalization API call would look like
    print(f"\n3️⃣ API Call Example (finalize-claim):")
    print(f"""
    POST /api/finalize-claim
    {{
        "found_item_id": {test_item['rowid']},
        "user_email": "{test_item['user_email']}",
        "owner_email": "{test_item['finder_email']}",
        "claim_reason": "This person correctly answered all verification questions including the unique identifier on the item. They provided specific details about where and when they lost it that matched exactly with when and where I found it."
    }}
    """)
    
    # 4. Check existing successful returns
    print(f"\n4️⃣ Checking existing successful returns...")
    cursor.execute('SELECT COUNT(*) as count FROM successful_returns')
    count = cursor.fetchone()['count']
    print(f"   - Total successful returns in database: {count}")
    
    if count > 0:
        print(f"\n   📊 Sample successful returns:")
        cursor.execute('''
            SELECT return_id, item_title, owner_email, claimer_email, 
                   finalized_date, days_to_finalize, claim_reason
            FROM successful_returns
            ORDER BY finalized_date DESC
            LIMIT 3
        ''')
        
        for i, ret in enumerate(cursor.fetchall(), 1):
            print(f"\n   Return #{ret['return_id']}:")
            print(f"   - Item: {ret['item_title']}")
            print(f"   - Owner: {ret['owner_email']}")
            print(f"   - Claimer: {ret['claimer_email']}")
            print(f"   - Finalized: {ret['finalized_date']}")
            print(f"   - Days to finalize: {ret['days_to_finalize']}")
            print(f"   - Reason: {ret['claim_reason'][:100]}...")
    
    # 5. Show stats query examples
    print(f"\n5️⃣ Example Stats Queries:")
    
    # Get a test user email
    cursor.execute('SELECT email FROM users LIMIT 1')
    test_email = cursor.fetchone()
    if test_email:
        test_email = test_email['email']
        
        # Count returns as owner
        cursor.execute('''
            SELECT COUNT(*) as count FROM successful_returns 
            WHERE owner_email = ?
        ''', (test_email,))
        owner_count = cursor.fetchone()['count']
        
        # Count claims as claimer
        cursor.execute('''
            SELECT COUNT(*) as count FROM successful_returns 
            WHERE claimer_email = ?
        ''', (test_email,))
        claimer_count = cursor.fetchone()['count']
        
        print(f"   - User: {test_email}")
        print(f"   - Successful returns (as owner): {owner_count}")
        print(f"   - Successful claims (as claimer): {claimer_count}")
        print(f"   - Total: {owner_count + claimer_count}")
    
    # 6. Test moderation query
    print(f"\n6️⃣ Moderation Query Example:")
    cursor.execute('''
        SELECT 
            COUNT(*) as total_returns,
            COUNT(DISTINCT owner_email) as unique_owners,
            COUNT(DISTINCT claimer_email) as unique_claimers,
            AVG(days_to_finalize) as avg_days
        FROM successful_returns
    ''')
    
    stats = cursor.fetchone()
    print(f"   - Total returns: {stats['total_returns']}")
    print(f"   - Unique owners: {stats['unique_owners']}")
    print(f"   - Unique claimers: {stats['unique_claimers']}")
    if stats['avg_days']:
        print(f"   - Average days to finalize: {stats['avg_days']:.1f}")
    
    conn.close()
    
    print(f"\n✅ Test Complete!")
    print(f"\n📝 Next Steps:")
    print(f"   1. Start the backend: python comprehensive_app.py")
    print(f"   2. Start the frontend: npm run dev")
    print(f"   3. Navigate to a found item details page as the owner")
    print(f"   4. Click 'Declare as Final Claimer' for a potential claimer")
    print(f"   5. Fill out the reason form")
    print(f"   6. Confirm finalization")
    print(f"   7. View success history at /success-history")

def simulate_finalization():
    """Simulate a finalization for testing (if needed)"""
    
    print("\n🎯 Simulating Finalization (for testing)")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Find an item older than 3 days with a potential claimer
    cursor.execute('''
        SELECT fi.rowid, fi.*, 
               cat.name as category_name,
               loc.name as location_name,
               ca.user_email, u.full_name as claimer_name
        FROM found_items fi
        JOIN claim_attempts ca ON ca.found_item_id = fi.rowid
        LEFT JOIN categories cat ON cat.id = fi.category_id
        LEFT JOIN locations loc ON loc.id = fi.location_id
        LEFT JOIN users u ON u.email = ca.user_email
        WHERE ca.success = 1 
        AND julianday('now') - julianday(fi.date_found) >= 3
        LIMIT 1
    ''')
    
    item = cursor.fetchone()
    
    if not item:
        print("❌ No eligible items found for simulation")
        conn.close()
        return
    
    print(f"✅ Found eligible item: {item['title']}")
    
    # Get owner details
    cursor.execute('SELECT full_name FROM users WHERE email = ?', (item['finder_email'],))
    owner = cursor.fetchone()
    owner_name = owner['full_name'] if owner else 'Unknown'
    
    # Calculate days
    date_found = datetime.strptime(item['date_found'], '%Y-%m-%d')
    days_to_finalize = (datetime.now() - date_found).days
    
    # Insert into successful_returns
    cursor.execute('''
        INSERT INTO successful_returns (
            item_id,
            item_title,
            item_description,
            item_category,
            item_location,
            date_found,
            owner_email,
            owner_name,
            claimer_email,
            claimer_name,
            claim_reason,
            finalized_date,
            days_to_finalize
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), ?)
    ''', (
        item['rowid'],
        item['title'],
        item['description'],
        item['category_name'] or 'Unknown',
        item['location_name'] or 'Unknown',
        item['date_found'],
        item['finder_email'],
        owner_name,
        item['user_email'],
        item['claimer_name'] or 'Unknown',
        'TEST: This person correctly answered all verification questions and provided specific details that matched the item.',
        days_to_finalize
    ))
    
    return_id = cursor.lastrowid
    
    # Delete the found item
    cursor.execute('DELETE FROM found_items WHERE rowid = ?', (item['rowid'],))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Finalization simulated successfully!")
    print(f"   - Return ID: {return_id}")
    print(f"   - Item deleted from found_items")
    print(f"   - Record saved in successful_returns")
    print(f"\nYou can now view this in the success history page!")

if __name__ == '__main__':
    test_successful_returns_flow()
    
    print("\n" + "=" * 60)
    response = input("\n❓ Would you like to simulate a finalization? (y/n): ")
    if response.lower() == 'y':
        simulate_finalization()
