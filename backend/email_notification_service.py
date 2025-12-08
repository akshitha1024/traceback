"""
TraceBack Email Notification Service
Sends email notifications to users when found items become public
"""

import smtplib
import sqlite3
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

class EmailNotificationService:
    def __init__(self, db_path="traceback_100k.db"):
        self.db_path = db_path
        
        # Try to load email config
        try:
            from email_config import EMAIL_CONFIG
            self.smtp_config = EMAIL_CONFIG
            self.enabled = True
        except ImportError:
            print("⚠️  email_config.py not found! Email notifications disabled.")
            print("📋 To enable, copy email_config_template.py to email_config.py and update it")
            self.enabled = False
    
    def send_email(self, to_email, subject, html_content):
        """Send email using configured SMTP"""
        if not self.enabled:
            print(f"📧 [DISABLED] Would send email to {to_email}: {subject}")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.smtp_config['from_name']} <{self.smtp_config['email']}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Connect and send
            with smtplib.SMTP(self.smtp_config['smtp_server'], self.smtp_config['smtp_port']) as server:
                server.starttls()
                server.login(self.smtp_config['email'], self.smtp_config['password'])
                server.send_message(msg)
            
            print(f"✅ Sent email to {to_email}: {subject}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
            return False
    
    def get_email_template(self, item_title, category, location, date_found, item_id):
        """Generate HTML email template for new public found item"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
        }}
        .item-details {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }}
        .detail-row {{
            display: flex;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }}
        .detail-label {{
            font-weight: bold;
            color: #667eea;
            min-width: 100px;
        }}
        .detail-value {{
            color: #374151;
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }}
        .warning {{
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🔔 New Found Item Available</h1>
        <p>A found item has just become publicly visible</p>
    </div>
    
    <div class="content">
        <p>Hello,</p>
        
        <p>A <strong>found item</strong> has completed its 72-hour privacy period and is now publicly available on TraceBack. Check if this might be something you lost!</p>
        
        <div class="item-details">
            <h3 style="margin-top: 0; color: #667eea;">📦 Item Details</h3>
            
            <div class="detail-row">
                <span class="detail-label">Item:</span>
                <span class="detail-value">{item_title}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">{category}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">{location}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Date Found:</span>
                <span class="detail-value">{date_found}</span>
            </div>
        </div>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>How to Claim:</strong>
        </p>
        <ol style="color: #6b7280; font-size: 14px;">
            <li>Visit the TraceBack Found Items page</li>
            <li>Click "Claim This Item" if you believe it's yours</li>
            <li>Answer the security questions (one attempt only)</li>
            <li>Wait for the finder to review your answers</li>
        </ol>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            <strong>Remember:</strong> You only get <strong>ONE attempt</strong> to claim an item. Make sure you're certain before submitting your answers!
        </p>
        
        <p style="margin-top: 15px; color: #9ca3af; font-size: 13px; font-style: italic;">
            Note: If you have already attempted to claim this item, please ignore this email.
        </p>
    </div>
    
    <div class="footer">
        <p><strong>TraceBack</strong> - Kent State University Lost & Found</p>
        <p>Helping reunite you with your belongings</p>
        <p style="font-size: 12px; margin-top: 20px;">
            You received this email because you have an active account on TraceBack.<br>
            To stop receiving these notifications, update your preferences in your dashboard.
        </p>
    </div>
</body>
</html>
"""
    
    def notify_users_of_public_item(self, found_item_id):
        """
        Send email notification to all users (except finder) when item becomes public
        Called after 72-hour privacy period expires
        """
        if not self.enabled:
            print(f"📧 Email notifications disabled - skipping notification for item {found_item_id}")
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get found item details
            cursor.execute("""
                SELECT 
                    f.id, f.title, f.finder_email, f.date_found,
                    c.name as category_name,
                    l.name as location_name
                FROM found_items f
                LEFT JOIN categories c ON f.category_id = c.id
                LEFT JOIN locations l ON f.location_id = l.id
                WHERE f.id = ?
            """, (found_item_id,))
            
            item = cursor.fetchone()
            
            if not item:
                print(f"⚠️  Item {found_item_id} not found")
                conn.close()
                return
            
            # Get all active users except the finder who haven't been notified yet about public status
            cursor.execute("""
                SELECT u.email, u.full_name, u.first_name
                FROM users u
                LEFT JOIN email_notifications en 
                    ON u.email = en.user_email 
                    AND en.found_item_id = ?
                    AND en.notification_type = 'public'
                WHERE u.is_active = 1 
                AND u.is_verified = 1
                AND u.email != ?
                AND en.notification_id IS NULL
                ORDER BY u.email
            """, (found_item_id, item['finder_email']))
            
            users = cursor.fetchall()
            conn.close()
            
            if not users:
                print(f"📧 No users to notify for item {found_item_id}")
                return
            
            # Prepare email content
            subject = f"🔔 New Found Item: {item['title']}"
            
            # Format date
            try:
                date_obj = datetime.strptime(item['date_found'], '%Y-%m-%d')
                formatted_date = date_obj.strftime('%B %d, %Y')
            except:
                formatted_date = item['date_found']
            
            html_content = self.get_email_template(
                item_title=item['title'],
                category=item['category_name'] or 'N/A',
                location=item['location_name'] or 'N/A',
                date_found=formatted_date,
                item_id=item['id']
            )
            
            # Send emails in background thread to not block the main process
            def send_batch():
                success_count = 0
                fail_count = 0
                
                # Track successful notifications in database
                batch_conn = sqlite3.connect(self.db_path)
                batch_cursor = batch_conn.cursor()
                
                for user in users:
                    if self.send_email(user['email'], subject, html_content):
                        success_count += 1
                        # Record that this user was notified
                        try:
                            batch_cursor.execute("""
                                INSERT OR IGNORE INTO email_notifications 
                                (found_item_id, user_email, notification_type) 
                                VALUES (?, ?, 'public')
                            """, (found_item_id, user['email']))
                            batch_conn.commit()
                        except Exception as e:
                            print(f"⚠️  Failed to record notification for {user['email']}: {e}")
                    else:
                        fail_count += 1
                
                batch_conn.close()
                
                print(f"📧 Email notification batch complete for item {found_item_id}:")
                print(f"   ✅ Sent: {success_count}")
                print(f"   ❌ Failed: {fail_count}")
            
            # Start background thread
            thread = threading.Thread(target=send_batch, daemon=True)
            thread.start()
            
            print(f"📧 Started email notification process for item {found_item_id} to {len(users)} users")
            
        except Exception as e:
            print(f"❌ Error in notify_users_of_public_item: {e}")
            import traceback
            traceback.print_exc()
    
    def get_claimed_item_email_template(self, item_title, category, location, date_found, claimer_count):
        """Generate HTML email template for item moved to claimed section"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
        }}
        .item-details {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }}
        .detail-row {{
            display: flex;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }}
        .detail-label {{
            font-weight: bold;
            color: #f59e0b;
            min-width: 100px;
        }}
        .detail-value {{
            color: #374151;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }}
        .alert {{
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Item Has Potential Claimer</h1>
        <p>Competition window now open - 3 days remaining</p>
    </div>
    
    <div class="content">
        <p>Hello,</p>
        
        <p>A <strong>found item</strong> now has potential claimer(s) and has been moved to the <strong>Claimed Items</strong> section. You have <strong>3 days</strong> to compete if you think this is your item!</p>
        
        <div class="item-details">
            <h3 style="margin-top: 0; color: #f59e0b;">📦 Item Details</h3>
            
            <div class="detail-row">
                <span class="detail-label">Item:</span>
                <span class="detail-value">{item_title}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">{category}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">{location}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Date Found:</span>
                <span class="detail-value">{date_found}</span>
            </div>
        </div>
        
        <div class="alert">
            <strong>⏰ 3-Day Competition Window:</strong> This item already has potential claimer(s). You can still claim it if you believe it's yours, but you only have <strong>3 days</strong> from the first claim attempt. After that, the finder will review all claims.
        </div>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>How to Compete:</strong>
        </p>
        <ol style="color: #6b7280; font-size: 14px;">
            <li>Visit the TraceBack Claimed Items page</li>
            <li>Find this item in the 3-day competition window section</li>
            <li>Click "Claim This Item" if you believe it's yours</li>
            <li>Answer the security questions (one attempt only)</li>
            <li>Wait for the finder to review all claims after 3 days</li>
        </ol>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            <strong>Remember:</strong> You only get <strong>ONE attempt</strong> to claim an item. Make sure you're certain before submitting your answers!
        </p>
        
        <p style="margin-top: 15px; color: #9ca3af; font-size: 13px; font-style: italic;">
            Note: If you have already attempted to claim this item, please ignore this email.
        </p>
    </div>
    
    <div class="footer">
        <p><strong>TraceBack</strong> - Kent State University Lost & Found</p>
        <p>Helping reunite you with your belongings</p>
        <p style="font-size: 12px; margin-top: 20px;">
            You received this email because you have an active account on TraceBack.<br>
            To stop receiving these notifications, update your preferences in your dashboard.
        </p>
    </div>
</body>
</html>
"""
    
    def notify_users_of_claimed_item(self, found_item_id):
        """
        Send email notification to all users (except finder) when item gets first potential claimer
        Called when item moves to claimed items section (3-day competition window)
        """
        if not self.enabled:
            print(f"📧 Email notifications disabled - skipping claimed notification for item {found_item_id}")
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get found item details
            cursor.execute("""
                SELECT f.id, f.title, f.date_found, f.finder_email,
                       c.name as category_name, l.name as location_name,
                       COUNT(DISTINCT ca.user_email) as claimer_count
                FROM found_items f
                LEFT JOIN categories c ON f.category_id = c.id
                LEFT JOIN locations l ON f.location_id = l.id
                LEFT JOIN claim_attempts ca ON f.id = ca.found_item_id AND ca.success = 1
                WHERE f.id = ?
                GROUP BY f.id
            """, (found_item_id,))
            
            item = cursor.fetchone()
            
            if not item:
                print(f"⚠️  Item {found_item_id} not found")
                conn.close()
                return
            
            # Get all active users except the finder who haven't been notified yet about claimed status
            # Use different notification type to differentiate from public item notifications
            cursor.execute("""
                SELECT u.email, u.full_name, u.first_name
                FROM users u
                LEFT JOIN email_notifications en 
                    ON u.email = en.user_email 
                    AND en.found_item_id = ?
                    AND en.notification_type = 'claimed'
                WHERE u.is_active = 1 
                AND u.is_verified = 1
                AND u.email != ?
                AND en.notification_id IS NULL
                ORDER BY u.email
            """, (found_item_id, item['finder_email']))
            
            users = cursor.fetchall()
            conn.close()
            
            if not users:
                print(f"📧 No users to notify for claimed item {found_item_id}")
                return
            
            # Prepare email content
            subject = f"⏰ Item Has Claimer: {item['title']} - 3 Days to Compete!"
            
            # Format date
            try:
                date_obj = datetime.strptime(item['date_found'], '%Y-%m-%d')
                formatted_date = date_obj.strftime('%B %d, %Y')
            except:
                formatted_date = item['date_found']
            
            html_content = self.get_claimed_item_email_template(
                item_title=item['title'],
                category=item['category_name'] or 'N/A',
                location=item['location_name'] or 'N/A',
                date_found=formatted_date,
                claimer_count=item['claimer_count']
            )
            
            # Send emails in background thread
            def send_batch():
                success_count = 0
                fail_count = 0
                
                # Track successful notifications in database
                batch_conn = sqlite3.connect(self.db_path)
                batch_cursor = batch_conn.cursor()
                
                for user in users:
                    if self.send_email(user['email'], subject, html_content):
                        success_count += 1
                        # Record that this user was notified about claimed status
                        try:
                            batch_cursor.execute("""
                                INSERT OR IGNORE INTO email_notifications 
                                (found_item_id, user_email, notification_type) 
                                VALUES (?, ?, 'claimed')
                            """, (found_item_id, user['email']))
                            batch_conn.commit()
                        except Exception as e:
                            print(f"⚠️  Failed to record claimed notification for {user['email']}: {e}")
                    else:
                        fail_count += 1
                
                batch_conn.close()
                
                print(f"📧 Claimed item email notification batch complete for item {found_item_id}:")
                print(f"   ✅ Sent: {success_count}")
                print(f"   ❌ Failed: {fail_count}")
            
            # Start background thread
            thread = threading.Thread(target=send_batch, daemon=True)
            thread.start()
            
            print(f"📧 Started claimed item notification process for item {found_item_id} to {len(users)} users")
            
        except Exception as e:
            print(f"❌ Error in notify_users_of_claimed_item: {e}")
            import traceback
            traceback.print_exc()
    
    def get_finder_decision_email_template(self, item_title, category, location, date_found, claimer_count):
        """Generate HTML email template for finder when 3-day window expires"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
        }}
        .item-details {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
        }}
        .detail-row {{
            display: flex;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }}
        .detail-label {{
            font-weight: bold;
            color: #dc2626;
            min-width: 100px;
        }}
        .detail-value {{
            color: #374151;
        }}
        .footer {{
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
        }}
        .urgent {{
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Time to Make a Decision!</h1>
        <p>3-day competition window has ended</p>
    </div>
    
    <div class="content">
        <p>Hello,</p>
        
        <p>The <strong>3-day competition window</strong> for your found item has ended. You now have <strong>potential claimer(s)</strong> waiting for your decision.</p>
        
        <div class="item-details">
            <h3 style="margin-top: 0; color: #dc2626;">📦 Your Found Item</h3>
            
            <div class="detail-row">
                <span class="detail-label">Item:</span>
                <span class="detail-value">{item_title}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">{category}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">{location}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Date Found:</span>
                <span class="detail-value">{date_found}</span>
            </div>
        </div>
        
        <div class="urgent">
            <strong>⚠️ It's Time to Make a Decision!</strong> The 3-day competition window has ended. You now need to review all claim attempts and choose the rightful owner for this item.
        </div>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            <strong>What to do now:</strong>
        </p>
        <ol style="color: #6b7280; font-size: 14px;">
            <li>Log in to your TraceBack account</li>
            <li>Go to your Found Items dashboard</li>
            <li>Review all {claimer_count} claimer(s)' answers to your security questions</li>
            <li>Select the person who provided the most accurate answers</li>
            <li>Finalize the claim and arrange item return</li>
        </ol>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            <strong>Remember:</strong> Take your time to review each claim carefully. Choose the person whose answers best match your item. Once you finalize, the item will be marked as successfully returned!
        </p>
    </div>
    
    <div class="footer">
        <p><strong>TraceBack</strong> - Kent State University Lost & Found</p>
        <p>Thank you for helping reunite people with their belongings</p>
        <p style="font-size: 12px; margin-top: 20px;">
            This is an important notification about your found item.<br>
            Please take action as soon as possible.
        </p>
    </div>
</body>
</html>
"""
    
    def notify_finder_decision_time(self, found_item_id):
        """
        Send email notification to finder when 3-day competition window ends
        Called when it's time for finder to make decision on claims
        """
        if not self.enabled:
            print(f"📧 Email notifications disabled - skipping finder decision notification for item {found_item_id}")
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get found item details and claimer count
            cursor.execute("""
                SELECT f.id, f.title, f.date_found, f.finder_email,
                       c.name as category_name, l.name as location_name,
                       COUNT(DISTINCT ca.user_email) as claimer_count,
                       MIN(ca.marked_as_potential_at) as first_claim_time
                FROM found_items f
                LEFT JOIN categories c ON f.category_id = c.id
                LEFT JOIN locations l ON f.location_id = l.id
                LEFT JOIN claim_attempts ca ON f.id = ca.found_item_id AND ca.success = 1
                WHERE f.id = ?
                GROUP BY f.id
            """, (found_item_id,))
            
            item = cursor.fetchone()
            
            if not item or not item['finder_email']:
                print(f"⚠️  Item {found_item_id} or finder email not found")
                conn.close()
                return
            
            if item['claimer_count'] == 0:
                print(f"⚠️  No claimers for item {found_item_id}, skipping finder notification")
                conn.close()
                return
            
            # Check if finder has already been notified about decision time
            cursor.execute("""
                SELECT notification_id 
                FROM email_notifications 
                WHERE found_item_id = ? 
                AND user_email = ? 
                AND notification_type = 'decision_time'
            """, (found_item_id, item['finder_email']))
            
            already_notified = cursor.fetchone()
            conn.close()
            
            if already_notified:
                print(f"📧 Finder already notified about decision time for item {found_item_id}")
                return
            
            # Prepare email content
            subject = f"⏰ Decision Time: {item['title']} - Action Required"
            
            # Format date
            try:
                date_obj = datetime.strptime(item['date_found'], '%Y-%m-%d')
                formatted_date = date_obj.strftime('%B %d, %Y')
            except:
                formatted_date = item['date_found']
            
            html_content = self.get_finder_decision_email_template(
                item_title=item['title'],
                category=item['category_name'] or 'N/A',
                location=item['location_name'] or 'N/A',
                date_found=formatted_date,
                claimer_count=item['claimer_count']
            )
            
            # Send email
            if self.send_email(item['finder_email'], subject, html_content):
                # Record notification
                try:
                    conn = sqlite3.connect(self.db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT OR IGNORE INTO email_notifications 
                        (found_item_id, user_email, notification_type) 
                        VALUES (?, ?, 'decision_time')
                    """, (found_item_id, item['finder_email']))
                    conn.commit()
                    conn.close()
                    print(f"📧 Sent finder decision notification for item {found_item_id} to {item['finder_email']}")
                except Exception as e:
                    print(f"⚠️  Failed to record finder notification: {e}")
            
        except Exception as e:
            print(f"❌ Error in notify_finder_decision_time: {e}")
            import traceback
            traceback.print_exc()


# For testing
if __name__ == '__main__':
    service = EmailNotificationService()
    
    # Test email (update with your email)
    test_email = "test@kent.edu"
    
    html = service.get_email_template(
        item_title="Black Laptop",
        category="Electronics",
        location="Smith Hall",
        date_found="November 29, 2025",
        item_id=15
    )
    
    print("Testing email notification service...")
    print(f"Enabled: {service.enabled}")
    
    if service.enabled:
        service.send_email(test_email, "🔔 Test: New Found Item", html)
    else:
        print("\nEmail preview:")
        print(html)
