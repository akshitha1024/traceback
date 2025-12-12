# Traceback - Campus Lost & Found

A modern, responsive web application for tracking lost and found items on campus with machine learning-powered matching.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: JavaScript (React 18)
- **Styling**: Tailwind CSS 3
- **UI Components**: Custom React components
- **State Management**: React Hooks
- **Routing**: Next.js file-based routing

### Backend
- **API Framework**: Flask 2.3.3
- **Database**: SQLite (traceback_100k.db)
- **ORM**: Flask-SQLAlchemy 3.0.5
- **Authentication**: Flask-JWT-Extended 4.5.2
- **Email Services**: Email verification and notification system
- **Image Processing**: Pillow 10.4.0
- **Data Validation**: Marshmallow 3.20.1

### Machine Learning
- **Text Embeddings**: Sentence Transformers 2.2.2
- **Deep Learning**: PyTorch 2.0.1, TorchVision 0.15.2
- **Image Processing**: OpenCV 4.8.0
- **Numerical Computing**: NumPy 1.24.3
- **Matching Engine**: Multi-modal similarity scoring

### Automation & Scheduling
- **Task Scheduler**: Python Schedule 1.2.0
- **ML Matching**: Automated item matching service
- **Data Cleanup**: Scheduled database maintenance
- **Notifications**: Automated email notifications

## Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.8+
- Visual Studio Code

### Step-by-Step Installation

1. **Create project folder and open in VS Code** (use any folder name)
   ```bash
   mkdir your-project-folder
   cd your-project-folder
   code .
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/akshitha1024/traceback
   ```

3. **Move to traceback folder**
   ```bash
   cd traceback
   ```

4. **Install node packages**
   ```bash
   npm install
   ```

5. **Run frontend** (Terminal 1)
   ```bash
   npm run dev
   ```
   Frontend runs on [http://localhost:3000](http://localhost:3000)

6. **Open another terminal and go to backend folder**
   ```bash
   cd traceback/backend
   ```

7. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

8. **Activate virtual environment**
   
   **Windows (Git Bash):**
   ```bash
   source venv/Scripts/activate
   ```
   
   **Windows (Command Prompt):**
   ```bash
   venv\Scripts\activate
   ```
   
   **Windows (PowerShell):**
   ```bash
   venv\Scripts\Activate.ps1
   ```
   
   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

9. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

10. **Run the Flask server** (Terminal 2)
    ```bash
    python comprehensive_app.py
    ```
    Backend API runs on [http://localhost:5000](http://localhost:5000)

11. **Open another terminal and go to backend folder**
    ```bash
    cd traceback/backend
    ```

12. **Activate virtual environment** (use the same activation command from step 8 based on your OS)

13. **Install ML dependencies**
    ```bash
    pip install -r requirements_ml.txt
    ```

14. **Start the ML scheduler** (Terminal 3)
    ```bash
    python ml_scheduler.py
    ```
    Runs automated matching and cleanup tasks

## Project Structure

```
traceback/
├── app/                           # Next.js App Router pages
│   ├── about/                    # About page
│   ├── claim-attempts/           # Claim attempt tracking
│   ├── claimed-items/            # Claimed items management
│   ├── claims/                   # Claims processing
│   ├── connect/                  # Connection requests
│   ├── connections/              # User connections
│   ├── contact/                  # Contact page
│   ├── contact-admin/            # Admin contact
│   ├── contact-requests/         # Contact request management
│   ├── dashboard/                # User dashboard
│   ├── faq/                      # FAQ page
│   ├── forgot-password/          # Password recovery
│   ├── found/                    # Found items listing
│   ├── found-item-details/       # Found item details
│   ├── found-item-questions/     # Found item verification
│   ├── how-it-works/             # How it works page
│   ├── items/                    # Item management
│   ├── login/                    # User login
│   ├── lost/                     # Lost items listing
│   ├── lost-item-details/        # Lost item details
│   ├── matches/                  # ML matching results
│   ├── messages/                 # User messaging
│   ├── moderation/               # Content moderation
│   ├── profile/                  # User profile
│   ├── report/                   # Report lost/found items
│   ├── report-abuse/             # Abuse reporting
│   ├── report-bug/               # Bug reporting
│   ├── review/                   # Item reviews
│   ├── search/                   # Search functionality
│   ├── signup/                   # User registration
│   ├── success-history/          # Successful returns
│   ├── terms/                    # Terms of service
│   ├── verify/                   # Item verification
│   ├── verify-email/             # Email verification
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Landing page
│   └── globals.css               # Global styles
├── backend/                       # Flask API backend
│   ├── comprehensive_app.py      # Main Flask application
│   ├── ml_matching_service.py    # ML matching engine
│   ├── ml_scheduler.py           # ML automation scheduler
│   ├── combined_scheduler.py     # Combined task scheduler
│   ├── cleanup_scheduler.py      # Data cleanup scheduler
│   ├── models.py                 # Database models
│   ├── routes.py                 # API routes
│   ├── config.py                 # Configuration
│   ├── email_verification_service.py  # Email verification
│   ├── email_notification_service.py  # Email notifications
│   ├── ml_notification_service.py     # ML match notifications
│   ├── user_management.py        # User administration
│   ├── profile_manager.py        # Profile management
│   ├── image_similarity.py       # Image comparison
│   ├── requirements.txt          # Backend dependencies
│   ├── requirements_ml.txt       # ML dependencies
│   ├── traceback_100k.db         # SQLite database
│   └── uploads/                  # User uploaded images
├── components/                    # Reusable React components
│   ├── Navbar.js                 # Navigation bar
│   ├── Sidebar.js                # Sidebar navigation
│   ├── ItemCard.js               # Item display card
│   ├── Protected.js              # Route protection
│   ├── EmailVerification.js      # Email verification UI
│   ├── EnhancedMatchResults.js   # ML match display
│   ├── PotentialMatchCard.js     # Match card component
│   ├── SearchAndFilter.js        # Search/filter UI
│   ├── LogoutOnClose.js          # Auto logout handler
│   ├── SecurityVerification.js   # Security checks
│   └── Reviews.js                # Review system
├── utils/                         # Utility functions
├── data/                          # Static data files
├── public/                        # Static assets
├── logs/                          # Application logs
├── config/                        # Configuration files
├── package.json                   # Node dependencies
├── tailwind.config.js             # Tailwind configuration
└── jsconfig.json                  # JavaScript configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

**Developer**: Akshitha  
**Repository**: https://github.com/akshitha1024/traceback