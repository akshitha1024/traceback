# 🚀 TraceBack - Quick Reference Card

## ⚡ Quick Start Commands

### Windows
```bash
start.bat
```

### Linux/Mac
```bash
chmod +x start.sh && ./start.sh
```

### Manual Start
```bash
# Terminal 1 - Backend API
cd backend && python comprehensive_app.py

# Terminal 2 - ML Scheduler (Every 1 Hour)
cd backend && python combined_scheduler.py

# Terminal 3 - Frontend
pnpm dev
```

---

## 🌐 URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:5000 | 5000 |

---

## ⏰ Automated Schedules

| Task | Frequency | What It Does |
|------|-----------|--------------|
| ML Matching | Every 1 hour | Matches lost & found items (≥60% confidence) |
| Cleanup | Daily at 2:00 AM | Removes items claimed >3 days ago |

---

## 🔑 Key Features

### User Journey
1. **Sign Up** → Kent State email + OTP verification
2. **Report Lost** → Private, for ML matching only
3. **Report Found** → Add photos, create security questions
4. **72-Hour Private** → Only matched users see item
5. **Public After 72h** → All users can attempt claim
6. **One Attempt** → Answer security questions (no edits)
7. **3-Day Window** → Finder reviews all attempts
8. **Final Decision** → Contact info shared with security code
9. **8-Day Visibility** → Meet for handover
10. **Return Recorded** → Permanent credibility record

### Time-Based Rules
- **72 hours**: Found items stay private
- **3 days**: Decision window after marking potential claimer
- **8 days**: Contact info visible after final selection
- **30 days**: Lost reports auto-deleted
- **1 hour**: ML matching runs automatically

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Account information |
| `lost_items` | Lost reports (private) |
| `found_items` | Found reports |
| `claim_attempts` | Security question answers |
| `ml_matches` | ML-generated matches |
| `successful_returns` | Permanent return records |
| `abuse_reports` | Content moderation |
| `bug_reports` | Technical issues |
| `notifications` | User alerts |
| `messages` | User communication |

---

## 🎯 Important Timestamps

### In `claim_attempts` Table:
- `attempted_at` - When user submitted answers
- `marked_as_potential_at` - When marked as potential claimer ⏰ **3-DAY TIMER STARTS HERE**

### In `found_items` Table:
- `posted_date` - When item was reported
- `claimed_date` - When potential claimer marked (from earliest `marked_as_potential_at`)
- `date_found` - Actual date item was found
- `time_found` - Time item was found

---

## 🔧 Common Tasks

### Check Database
```bash
cd backend
sqlite3 traceback_100k.db
.tables
.schema claim_attempts
.quit
```

### View Logs (if using start scripts)
```bash
# Backend logs
cat logs/backend.log

# Scheduler logs
cat logs/scheduler.log

# Frontend logs
cat logs/frontend.log
```

### Test ML Matching Manually
```bash
cd backend
python ml_scheduler.py
# Press Ctrl+C to stop
```

### Add Sample Data
```bash
cd backend
python add_sample_users.py
python check_sample_items.py
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
cd backend
pip install -r requirements.txt
pip install -r requirements_ml.txt
```

### Frontend Won't Start
```bash
pnpm install
# or
npm install
```

### ML Not Running
- Check scheduler terminal for errors
- Verify `ml_matching_service.py` exists
- Check ML dependencies installed

### Database Errors
```bash
# Recreate bug_reports table if needed
cd backend
python create_bug_reports_table.py
```

---

## 📱 User Roles

### Regular User
- Report lost/found items
- Claim items
- View dashboard with ML matches
- Message other users
- Report abuse/bugs

### Moderator
- Access `/moderation` page
- View successful returns
- Review abuse reports
- Track bug reports
- Take moderation actions

---

## 🎨 UI Features

### Time Format
- **All times in 12-hour format** with AM/PM
- **Countdown format**: "dd days, hh hours, mm minutes"
- **No seconds shown** in countdown displays

### Navigation
- Logo → Dashboard (if logged in) or Home (if not)
- Footer works on all pages without logout issues

### Key Pages
- `/dashboard` - Main hub with ML matches
- `/claimed-items` - Items with potential claimers (3-day countdown)
- `/found-item-details/[id]` - Claim response management
- `/moderation` - Moderator tools (3 tabs)
- `/report-bug` - Bug/issue reporting

---

## 📝 Configuration Files

### Backend
- `backend/comprehensive_app.py` - Main API
- `backend/combined_scheduler.py` - Scheduler (1 hour intervals)
- `backend/email_config.py` - Email settings (optional)
- `backend/traceback_100k.db` - Database

### Frontend
- `package.json` - Dependencies
- `tailwind.config.js` - Styling
- `jsconfig.json` - Path aliases

---

## 📞 Quick Links

- **Documentation**: `DEPLOYMENT_GUIDE.md`
- **Project Summary**: `PROJECT_SUMMARY.md`
- **How It Works**: http://localhost:3000/how-it-works
- **FAQ**: http://localhost:3000/faq
- **Terms**: http://localhost:3000/terms

---

## ✅ Deployment Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database exists (`traceback_100k.db`)
- [ ] ML scheduler tested
- [ ] All three terminals running
- [ ] Can access http://localhost:3000
- [ ] Bug reports saving to database
- [ ] Moderation dashboard working

---

## 🎓 Project Info

**Name**: TraceBack
**Institution**: Kent State University
**Type**: Capstone Project
**Date**: November 2025
**Status**: ✅ Production Ready
**Version**: 1.0.0

---

**🚀 READY TO DEPLOY - ML RUNS EVERY 1 HOUR**
