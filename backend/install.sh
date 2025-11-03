#!/bin/bash

echo "Installing Traceback Backend Dependencies..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

echo "Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "Failed to create virtual environment. Make sure Python 3 is installed."
    exit 1
fi

echo ""
echo "Activating virtual environment..."
source venv/bin/activate

echo ""
echo "Installing Python packages..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install packages."
    exit 1
fi

echo ""
echo "Initializing database..."
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database initialized successfully!')"

echo ""
echo "Backend setup completed successfully!"
echo ""
echo "To start the backend server, run:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""