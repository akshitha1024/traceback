"""
TrackeBack Email Verification System
Sends verification codes to @kent.edu email addresses
"""

import smtplib
import random
import string
import sqlite3
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json
from flask import request, jsonify

class EmailVerificationService:
    def __init__(self, db_path="trackeback_100k.db"):
        self.db_path = db_path
        
        # Try to load email config, fall back to default
        try:
            from email_config import EMAIL_CONFIG, VERIFICATION_SETTINGS
            self.smtp_config = EMAIL_CONFIG
            self.settings = VERIFICATION_SETTINGS
        except ImportError:
            # Default Gmail configuration (you need to update this)
            print("⚠️  email_config.py not found! Using default config.")
            print("📋 Please copy email_config_template.py to email_config.py and update it")
            self.smtp_config = {
                'provider': 'gmail',
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'email': 'your-app-email@gmail.com',  # UPDATE THIS
                'password': 'your-app-password',  # UPDATE THIS
                'from_name': 'TrackeBack - Kent State'
            }
            self.settings = {
                'code_length': 6,
                'expiry_minutes': 15,
                'max_attempts': 3,
                'rate_limit_per_hour': 5,
                'verification_valid_hours': 24
            }
        
        self.init_verification_table()
    
    def init_verification_table(self):
        """Create verification codes table if it doesn't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                verification_code TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                attempts INTEGER DEFAULT 0,
                item_type TEXT,
                item_id INTEGER
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def generate_verification_code(self, length=None):
        """Generate a random verification code"""
        if length is None:
            length = self.settings['code_length']
        return ''.join(random.choices(string.digits, k=length))
    
    def create_email_template(self, verification_code, item_title=None, item_type="item"):
        """Create HTML email template for verification"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1a365d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }}
                .code-box {{ background: #e2e8f0; border: 2px solid #4299e1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }}
                .verification-code {{ font-size: 36px; font-weight: bold; color: #2b6cb0; letter-spacing: 5px; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                .kent-logo {{ color: #ffd700; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏫 <span class="kent-logo">Kent State University</span></h1>
                    <h2>TrackeBack Verification</h2>
                </div>
                
                <div class="content">
                    <h3>Email Verification Required</h3>
                    
                    <p>Hello,</p>
                    
                    <p>You're receiving this email because you need to verify your Kent State email address for TrackeBack - the campus lost and found system.</p>
                    
                    {f'<p><strong>Item:</strong> {item_title}</p>' if item_title else ''}
                    
                    <div class="code-box">
                        <p>Your verification code is:</p>
                        <div class="verification-code">{verification_code}</div>
                    </div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This code expires in <strong>15 minutes</strong></li>
                        <li>Enter this code in the TrackeBack app to verify your email</li>
                        <li>Don't share this code with anyone</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                    
                    <p>Need help? Contact Campus Security or visit the Student Center information desk.</p>
                    
                    <p>Best regards,<br>
                    <strong>TrackeBack Team</strong><br>
                    Kent State University</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated email from TrackeBack Lost & Found System</p>
                    <p>Kent State University • 800 E Summit St, Kent, OH 44242</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content
    
    def send_verification_email(self, email, item_title=None, item_type="lost", item_id=None):
        """Send verification code to email address"""
        
        # Validate Kent State email
        if not email.lower().endswith('@kent.edu'):
            return False, "Only @kent.edu email addresses are allowed"
        
        # Generate verification code
        verification_code = self.generate_verification_code()
        
        # Store in database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Clean up old codes for this email
        cursor.execute("DELETE FROM email_verifications WHERE email = ? AND is_verified = FALSE", (email,))
        
        # Set expiration time (from settings)
        expires_at = datetime.now() + timedelta(minutes=self.settings['expiry_minutes'])
        
        # Insert new verification code
        cursor.execute('''
            INSERT INTO email_verifications (email, verification_code, expires_at, item_type, item_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (email, verification_code, expires_at, item_type, item_id))
        
        conn.commit()
        conn.close()
        
        try:
            # Create email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"TrackeBack Verification Code: {verification_code}"
            msg['From'] = f"{self.smtp_config['from_name']} <{self.smtp_config['email']}>"
            msg['To'] = email
            
            # Create HTML content
            html_content = self.create_email_template(verification_code, item_title, item_type)
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            server = smtplib.SMTP(self.smtp_config['smtp_server'], self.smtp_config['smtp_port'])
            server.starttls()
            server.login(self.smtp_config['email'], self.smtp_config['password'])
            
            text = msg.as_string()
            server.sendmail(self.smtp_config['email'], email, text)
            server.quit()
            
            return True, f"Verification code sent to {email}"
            
        except Exception as e:
            return False, f"Failed to send email: {str(e)}"
    
    def verify_code(self, email, code):
        """Verify the email code"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get the verification record
        cursor.execute('''
            SELECT id, verification_code, expires_at, attempts, is_verified
            FROM email_verifications
            WHERE email = ? AND is_verified = FALSE
            ORDER BY created_at DESC
            LIMIT 1
        ''', (email,))
        
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return False, "No verification code found or already verified"
        
        verification_id, stored_code, expires_at, attempts, is_verified = result
        
        # Check if expired
        if datetime.now() > datetime.fromisoformat(expires_at):
            conn.close()
            return False, "Verification code has expired"
        
        # Check attempts (max from settings)
        max_attempts = self.settings['max_attempts']
        if attempts >= max_attempts:
            conn.close()
            return False, f"Too many failed attempts. Request a new code."
        
        # Increment attempts
        cursor.execute('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?', (verification_id,))
        
        # Check code
        if code == stored_code:
            # Mark as verified
            cursor.execute('UPDATE email_verifications SET is_verified = TRUE WHERE id = ?', (verification_id,))
            conn.commit()
            conn.close()
            return True, "Email verified successfully!"
        else:
            conn.commit()
            conn.close()
            remaining_attempts = max_attempts - (attempts + 1)
            return False, f"Invalid code. {remaining_attempts} attempts remaining."
    
    def is_email_verified(self, email):
        """Check if email is already verified"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT COUNT(*) FROM email_verifications
            WHERE email = ? AND is_verified = TRUE
            AND datetime(created_at) > datetime('now', '-{} hours')
        '''.format(self.settings['verification_valid_hours']), (email,))
        
        count = cursor.fetchone()[0]
        conn.close()
        
        return count > 0

# Flask routes to add to your comprehensive_app.py
def add_verification_routes(app, verification_service):
    """Add email verification routes to Flask app"""
    
    @app.route('/api/send-verification', methods=['POST'])
    def send_verification():
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        item_title = data.get('item_title')
        item_type = data.get('item_type', 'item')
        item_id = data.get('item_id')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        success, message = verification_service.send_verification_email(
            email, item_title, item_type, item_id
        )
        
        if success:
            return jsonify({'message': message}), 200
        else:
            return jsonify({'error': message}), 400
    
    @app.route('/api/verify-email', methods=['POST'])
    def verify_email():
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({'error': 'Email and code are required'}), 400
        
        success, message = verification_service.verify_code(email, code)
        
        if success:
            return jsonify({'message': message, 'verified': True}), 200
        else:
            return jsonify({'error': message, 'verified': False}), 400
    
    @app.route('/api/check-verification/<email>')
    def check_verification(email):
        is_verified = verification_service.is_email_verified(email)
        return jsonify({'verified': is_verified})

# Example usage
if __name__ == "__main__":
    # Demo the email verification system
    verification_service = EmailVerificationService()
    
    print("🚀 TrackeBack Email Verification System")
    print("=" * 50)
    
    # Example: Send verification code
    email = "student@kent.edu"
    print(f"📧 Sending verification code to {email}...")
    
    success, message = verification_service.send_verification_email(
        email, "Lost iPhone 15", "lost", 12345
    )
    
    print(f"Result: {message}")
    
    if success:
        print("\n📱 Now you would:")
        print("1. Check your email for the verification code")
        print("2. Enter the code in your app")
        print("3. Call verify_code() method to validate")