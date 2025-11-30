# 📧 TrackeBack Email Verification Setup Guide

## Quick Start (5 minutes)

### Step 1: Choose Your Email Provider

**RECOMMENDED: Gmail (Easiest for testing)**
- Free and reliable
- Works immediately
- Good for development/testing

**ALTERNATIVES:**
- Outlook/Hotmail
- Kent State email (contact IT)
- SendGrid (professional)

### Step 2: Gmail Setup (Recommended)

1. **Create/Use Gmail Account**
   ```
   Create: traceback.kentstate@gmail.com
   Or use your existing Gmail
   ```

2. **Enable 2-Factor Authentication**
   - Go to Google Account Settings
   - Security → 2-Step Verification → Turn On

3. **Create App Password**
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "TrackeBack App"
   - **SAVE THE 16-CHARACTER PASSWORD** (e.g., "abcd efgh ijkl mnop")

4. **Configure TrackeBack**
   ```bash
   cd backend
   cp email_config_template.py email_config.py
   ```
   
   Edit `email_config.py`:
   ```python
   EMAIL_CONFIG = {
       'provider': 'gmail',
       'smtp_server': 'smtp.gmail.com',
       'smtp_port': 587,
       'email': 'traceback.kentstate@gmail.com',  # Your Gmail
       'password': 'abcd efgh ijkl mnop',  # App password (16 chars)
       'from_name': 'TrackeBack - Kent State'
   }
   ```

### Step 3: Test the System

1. **Start Backend**
   ```bash
   cd backend
   python comprehensive_app.py
   ```

2. **Test API** (use Postman or curl)
   ```bash
   # Send verification code
   curl -X POST http://localhost:5000/api/send-verification \
     -H "Content-Type: application/json" \
     -d '{"email": "student@kent.edu", "item_title": "Lost iPhone"}'
   
   # Verify code
   curl -X POST http://localhost:5000/api/verify-email \
     -H "Content-Type: application/json" \
     -d '{"email": "student@kent.edu", "code": "123456"}'
   ```

## Complete Email Verification Flow

```
1. User reports lost/found item
2. User enters @kent.edu email
3. System sends 6-digit code to email
4. User checks email and enters code
5. System verifies code
6. Item is published/contact info revealed
```

## API Endpoints

### Send Verification Code
```http
POST /api/send-verification
Content-Type: application/json

{
  "email": "student@kent.edu",
  "item_title": "Lost iPhone 15",
  "item_type": "lost",
  "item_id": 12345
}
```

**Response (Success):**
```json
{
  "message": "Verification code sent to student@kent.edu"
}
```

### Verify Email Code
```http
POST /api/verify-email
Content-Type: application/json

{
  "email": "student@kent.edu",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "message": "Email verified successfully!",
  "verified": true
}
```

### Check if Email is Verified
```http
GET /api/check-verification/student@kent.edu
```

**Response:**
```json
{
  "verified": true
}
```

### Resend Verification Code
```http
POST /api/resend-verification
Content-Type: application/json

{
  "email": "student@kent.edu"
}
```

## Email Template Features

- 🏫 Kent State branding (Navy & Gold colors)
- 🔒 Security-focused messaging
- ⏰ Clear expiration time (15 minutes)
- 📱 Mobile-friendly HTML design
- 🚨 Abuse prevention warnings

## Security Features

- ✅ Only @kent.edu emails allowed
- ⏰ Codes expire in 15 minutes
- 🔢 6-digit random codes
- 🚫 Max 3 verification attempts
- 🗑️ Old codes auto-deleted
- ⏱️ Rate limiting (5 codes/hour)
- 🔐 24-hour verification validity

## Troubleshooting

### "Failed to send email" Error
1. Check Gmail app password is correct
2. Verify 2FA is enabled
3. Check email/password in config
4. Test with different email

### "Only @kent.edu emails allowed"
- This is intentional - system only accepts Kent State emails
- Use a real @kent.edu address for testing

### Codes not arriving
1. Check spam folder
2. Verify email address is correct
3. Wait 2-3 minutes (SMTP can be slow)
4. Try resending code

### Database errors
```bash
# Reset verification table
python -c "
import sqlite3
conn = sqlite3.connect('traceback_100k.db')
conn.execute('DROP TABLE IF EXISTS email_verifications')
conn.close()
print('Verification table reset')
"
```

## Production Deployment

### 1. Use Professional Email Service
- **SendGrid** (recommended)
- **AWS SES**
- **Mailgun**

### 2. Environment Variables
```bash
export EMAIL_PROVIDER=sendgrid
export SENDGRID_API_KEY=your-key
export FROM_EMAIL=traceback@yourdomain.com
```

### 3. SSL/HTTPS Required
- Verification codes contain sensitive data
- Always use HTTPS in production

### 4. Rate Limiting
- Implement per-IP rate limiting
- Monitor for abuse

## Kent State Integration Options

### Option 1: Use Kent State Email Server
- Contact Kent State IT
- Request SMTP server access
- Use official @kent.edu sending address

### Option 2: Partner with Campus IT
- Integrate with existing email systems
- Use campus authentication (Shibboleth)
- Leverage student directory

### Option 3: Third-party with Kent Branding
- Use SendGrid/AWS SES
- Configure proper SPF/DKIM records
- Maintain Kent State visual identity

## Development Tips

1. **Test with Multiple Emails**
   ```python
   test_emails = [
       "john.doe@kent.edu",
       "jane.smith@kent.edu", 
       "student123@kent.edu"
   ]
   ```

2. **Monitor Email Delivery**
   - Check Gmail "Sent" folder
   - Monitor for bounces
   - Track verification rates

3. **Customize Email Content**
   - Edit `create_email_template()` method
   - Add more Kent State specific content
   - Include campus maps/links

4. **Database Monitoring**
   ```sql
   -- Check verification stats
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as codes_sent,
     SUM(is_verified) as verified,
     AVG(attempts) as avg_attempts
   FROM email_verifications 
   GROUP BY DATE(created_at);
   ```

## Next Steps

1. ✅ Set up Gmail App Password
2. ✅ Configure email_config.py  
3. ✅ Test verification flow
4. 🔄 Integrate with frontend
5. 🚀 Deploy to production

**Need Help?** 
- Check the logs in terminal
- Test with curl commands first
- Verify database table was created
- Contact Kent State IT for official email integration