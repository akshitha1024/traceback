"""
ML-based notification system for automatic matching
Sends notifications to lost item owners when matching found items are reported
"""

import sqlite3
from datetime import datetime
from email_config import send_email

class MLNotificationService:
    def __init__(self, db_path, ml_service):
        self.db_path = db_path
        self.ml_service = ml_service
    
    def notify_matching_lost_item_owners(self, found_item_id):
        """
        When a found item is reported, find matching lost items 
        and notify those users
        
        Args:
            found_item_id: ID of the newly reported found item
        
        Returns:
            Number of notifications sent
        """
        if not self.ml_service:
            print("⚠️ ML service not available for matching")
            return 0
        
        try:
            # Find matches for this found item
            matches = self.ml_service.find_matches_for_found_item(
                found_item_id=found_item_id,
                min_score=0.3,  # 30% threshold
                top_k=10
            )
            
            if not matches:
                print(f"ℹ️ No matches found for found item {found_item_id}")
                return 0
            
            # Get found item details
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            
            found_item = conn.execute("""
                SELECT f.rowid as id, f.*, c.name as category_name, loc.name as location_name
                FROM found_items f
                LEFT JOIN categories c ON f.category_id = c.id
                LEFT JOIN locations loc ON f.location_id = loc.id
                WHERE f.rowid = ?
            """, (found_item_id,)).fetchone()
            
            if not found_item:
                conn.close()
                return 0
            
            found_item = dict(found_item)
            notifications_sent = 0
            
            # Send notification to each matching lost item owner
            for match in matches:
                try:
                    # Get lost item owner details
                    lost_item = conn.execute("""
                        SELECT l.*, u.id as user_id, u.email as user_email
                        FROM lost_items l
                        LEFT JOIN users u ON l.user_email = u.email
                        WHERE l.rowid = ?
                    """, (match['rowid'],)).fetchone()
                    
                    if not lost_item:
                        continue
                    
                    lost_item = dict(lost_item)
                    owner_email = lost_item.get('user_email') or lost_item.get('user_email')
                    
                    if not owner_email:
                        print(f"⚠️ No email for lost item {match['rowid']}")
                        continue
                    
                    # Send email notification
                    match_score = int(match['match_score'] * 100)
                    
                    subject = f"Potential Match Found: {found_item['title']}"
                    
                    body = f"""
Hello,

We found a potential match for your lost item!

YOUR LOST ITEM:
- Item: {lost_item['title']}
- Description: {lost_item['description']}
- Lost on: {lost_item['date_lost']}
- Location: {lost_item.get('location', 'N/A')}

MATCHING FOUND ITEM:
- Item: {found_item['title']}
- Description: {found_item['description']}
- Found on: {found_item['date_found']}
- Location: {found_item['location_name']}
- Match Confidence: {match_score}%

WHY THIS MATCHED:
- Similar descriptions and details
- Found in nearby location
- Reported within reasonable timeframe

WHAT TO DO NEXT:
1. Log in to TraceBack: http://localhost:3000/login
2. Go to "Finding Matches" to see full details
3. If this is your item, answer verification questions to claim it

Note: This is an automated match based on AI similarity. Please verify the details before claiming.

Best regards,
TraceBack Team
"""
                    
                    send_email(
                        to_email=owner_email,
                        subject=subject,
                        body=body
                    )
                    
                    # Log notification
                    conn.execute("""
                        INSERT OR IGNORE INTO notifications (
                            user_email, notification_type, item_id, item_type,
                            title, message, match_score, created_at
                        ) VALUES (?, 'match_found', ?, 'FOUND', ?, ?, ?, ?)
                    """, (
                        owner_email,
                        found_item_id,
                        f"Match Found: {found_item['title']}",
                        f"A found item matching your lost item has been reported ({match_score}% match)",
                        match['match_score'],
                        datetime.now().isoformat()
                    ))
                    
                    notifications_sent += 1
                    print(f"✅ Notification sent to {owner_email} for item {found_item_id} (match score: {match_score}%)")
                    
                except Exception as e:
                    print(f"❌ Error sending notification: {e}")
                    continue
            
            conn.commit()
            conn.close()
            
            print(f"✅ Sent {notifications_sent} notifications for found item {found_item_id}")
            return notifications_sent
            
        except Exception as e:
            print(f"❌ Error in notify_matching_lost_item_owners: {e}")
            return 0
    
    def create_notifications_table(self):
        """Create notifications table if it doesn't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                notification_type TEXT NOT NULL,
                item_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                match_score REAL,
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_email, item_id, notification_type)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_notifications_user_email 
            ON notifications(user_email, is_read)
        """)
        
        conn.commit()
        conn.close()
        print("✅ Notifications table created")
