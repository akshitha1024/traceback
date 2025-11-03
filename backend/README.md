# Backend Setup and Installation Script

# Flask Backend for Traceback - Setup Instructions

## Quick Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize Database
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

### 5. Run the Server
```bash
python app.py
```

Server will start on: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile
- PUT /api/auth/profile - Update user profile

### Items
- GET /api/lost-items - Get all lost items
- POST /api/lost-items - Create lost item
- GET /api/found-items - Get all found items  
- POST /api/found-items - Create found item
- GET /api/search - Search all items

### Reports
- POST /api/reports - Submit abuse report
- GET /api/admin/reports - Get all reports (admin)

### Utility
- GET /api/health - Health check

## Frontend Integration

Update your frontend API calls to use: http://localhost:5000/api

Example:
```javascript
// Login API call
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password })
});
```

## Environment Variables

Create .env file in backend directory:
```
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///traceback.db
FLASK_ENV=development
```

## Database Schema

- Users: Authentication and profiles
- LostItems: Lost item reports
- FoundItems: Found item reports  
- Reports: Abuse reports
- Matches: Item matching system

## Next Steps

1. Install backend dependencies
2. Run the Flask server
3. Update frontend to use backend APIs
4. Test authentication flow
5. Test item creation/search
6. Test reporting system