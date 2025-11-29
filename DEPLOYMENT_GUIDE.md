# TraceBack Deployment Guide

## 🚀 Complete Deployment Instructions

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.8+
- SQLite3
- Git

---

## 📦 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
pip install -r requirements_ml.txt
```

### 3. Database Setup
The database `traceback_100k.db` should already exist with all tables. If you need to recreate tables:

```bash
# Create all necessary tables
python create_abuse_reports_table.py
python create_bug_reports_table.py
python create_claim_attempts_table.py
python create_claims_table.py
python create_messaging_and_reviews.py
python create_notifications_table.py
python create_reviews_table.py
```

### 4. Add marked_as_potential_at Column (if not exists)
```bash
sqlite3 traceback_100k.db "ALTER TABLE claim_attempts ADD COLUMN marked_as_potential_at TIMESTAMP;"
```

### 5. Configure Email (Optional)
Edit `email_config.py` with your email settings if you want email notifications:
```python
EMAIL_USER = "your-email@example.com"
EMAIL_PASSWORD = "your-app-password"
```

---

## 🎨 Frontend Setup

### 1. Navigate to Root Directory
```bash
cd ..  # from backend to root
```

### 2. Install Dependencies
```bash
pnpm install
# or
npm install
```

### 3. Configure API Endpoint
If deploying to production, update all API URLs from `http://localhost:5000` to your production backend URL in:
- All pages in `app/` directory
- Look for `fetch('http://localhost:5000/api/...`

---

## 🏃 Running the Application

### Option 1: Development Mode

**Terminal 1 - Backend API:**
```bash
cd backend
python comprehensive_app.py
```
Backend runs on: `http://localhost:5000`

**Terminal 2 - ML Scheduler (runs every 1 hour):**
```bash
cd backend
python combined_scheduler.py
```
This runs:
- ML matching every 1 hour
- Cleanup of old claimed items daily at 2:00 AM

**Terminal 3 - Frontend:**
```bash
pnpm dev
# or
npm run dev
```
Frontend runs on: `http://localhost:3000`

### Option 2: Production Build

**Build Frontend:**
```bash
pnpm build
pnpm start
# or
npm run build
npm start
```

---

## 🤖 ML Scheduler Details

The ML scheduler (`combined_scheduler.py`) automatically:

1. **ML Matching (Every 1 Hour)**
   - Matches found items with lost items
   - Stores matches with ≥60% confidence
   - Notifies users of high-confidence matches (≥70%)
   - Updates ml_matches table in database

2. **Cleanup (Daily at 2:00 AM)**
   - Removes claimed items older than 3 days
   - Cleans up expired data

**To run only ML matching:**
```bash
python ml_scheduler.py
```

**To run combined tasks:**
```bash
python combined_scheduler.py
```

---

## 🗄️ Database Schema

### Key Tables:
- `users` - User accounts with Kent State email verification
- `lost_items` - Lost item reports (private, for ML matching only)
- `found_items` - Found item reports (private for 72 hours)
- `claim_attempts` - Claim attempts with security answers
- `ml_matches` - ML-generated matches between lost/found items
- `successful_returns` - Completed item returns (permanent records)
- `abuse_reports` - Reported inappropriate content
- `bug_reports` - Bug/issue reports from users
- `notifications` - User notifications
- `messages` - User messaging system

---

## 🔒 Security Features

1. **Email Verification**: OTP-based Kent State email verification
2. **Privacy Protection**:
   - Lost reports never shown publicly
   - Found items private for first 72 hours
   - Contact info only shared during valid claims
3. **One Attempt Policy**: Users get only one attempt to answer security questions
4. **3-Day Decision Window**: Finders have 3 days to review all claims
5. **Moderation System**: Moderators can review abuse reports and bug reports

---

## 📊 Key Features

### For Users:
- Report lost/found items with photos
- ML-powered matching (≥60% threshold)
- Answer security questions to claim items
- 3-day final chance window for claims
- Credibility tracking (successful returns/claims)
- Report abuse functionality
- Bug reporting system

### For Moderators:
- View all successful returns
- Review and action abuse reports
- Track bug reports and mark as resolved
- Access permanent moderation logs

---

## 🌐 Production Deployment

### Backend Deployment:
1. Use a process manager like `pm2` or `supervisor`
2. Set up reverse proxy with nginx
3. Configure SSL certificates
4. Set environment variables for production

### Frontend Deployment:
1. Build the Next.js app: `npm run build`
2. Deploy to Vercel, Netlify, or your hosting provider
3. Update API_URL environment variable

### Database:
- For production, consider migrating to PostgreSQL or MySQL
- Set up automated backups
- Configure proper database connection pooling

### Scheduler:
Run as a system service:
```bash
# Create systemd service (Linux)
sudo nano /etc/systemd/system/traceback-scheduler.service
```

Service file content:
```ini
[Unit]
Description=TraceBack ML Scheduler
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/traceback/backend
ExecStart=/usr/bin/python3 combined_scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable traceback-scheduler
sudo systemctl start traceback-scheduler
```

---

## 🔧 Troubleshooting

### ML Matching Not Running
- Check if `ml_matching_service.py` exists
- Verify all ML dependencies installed: `pip install -r requirements_ml.txt`
- Check scheduler logs for errors

### Database Connection Issues
- Verify `traceback_100k.db` exists in backend folder
- Check file permissions
- Ensure SQLite3 is installed

### Frontend API Errors
- Verify backend is running on port 5000
- Check CORS settings in `comprehensive_app.py`
- Verify API URLs in frontend code

### Email Notifications Not Working
- Check `email_config.py` settings
- Verify email app password (not regular password)
- Check spam folder for test emails

---

## 📝 Environment Variables (Production)

Create `.env` file in backend:
```
DB_PATH=./traceback_100k.db
UPLOAD_FOLDER=./uploads
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
```

Create `.env.local` in frontend:
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## 📞 Support

For issues or questions:
- Check FAQ page in the application
- Review How It Works page
- Contact system administrators

---

## ✅ Pre-Deployment Checklist

- [ ] All database tables created
- [ ] Python dependencies installed
- [ ] Frontend dependencies installed
- [ ] Email configuration set (optional)
- [ ] ML scheduler tested
- [ ] Backend API running and accessible
- [ ] Frontend built and tested
- [ ] All API endpoints working
- [ ] Security questions working
- [ ] ML matching running every hour
- [ ] Moderation dashboard accessible
- [ ] Bug report system working

---

## 🎯 Quick Start Commands

```bash
# Terminal 1: Backend
cd backend && python comprehensive_app.py

# Terminal 2: ML Scheduler
cd backend && python combined_scheduler.py

# Terminal 3: Frontend
pnpm dev

# Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

---

**Project Status**: ✅ Ready for Deployment
**Last Updated**: November 2025
**Version**: 1.0.0
