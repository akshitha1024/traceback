#!/bin/bash

# TraceBack - Start All Services Script
# This script starts all required services for TraceBack

echo "================================================"
echo "🚀 Starting TraceBack Lost & Found System"
echo "================================================"
echo ""

# Check if we're in the correct directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found!"
    echo "Please run this script from the traceback root directory"
    exit 1
fi

# Check Python
echo "🔍 Checking Python..."
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

PYTHON_CMD=$(command -v python3 || command -v python)
echo "✅ Python found: $PYTHON_CMD"

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check package manager
if command -v pnpm &> /dev/null; then
    PKG_MGR="pnpm"
    echo "✅ Using pnpm"
elif command -v npm &> /dev/null; then
    PKG_MGR="npm"
    echo "✅ Using npm"
else
    echo "❌ No package manager found. Please install npm or pnpm"
    exit 1
fi

echo ""
echo "================================================"
echo "📦 Starting Services..."
echo "================================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend API
echo "🔧 Starting Backend API on port 5000..."
cd backend
$PYTHON_CMD comprehensive_app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "✅ Backend API started (PID: $BACKEND_PID)"
sleep 2

# Start ML Scheduler
echo "🤖 Starting ML Scheduler (runs every 1 hour)..."
cd backend
$PYTHON_CMD combined_scheduler.py > ../logs/scheduler.log 2>&1 &
SCHEDULER_PID=$!
cd ..
echo "✅ ML Scheduler started (PID: $SCHEDULER_PID)"
sleep 2

# Start Frontend
echo "🎨 Starting Frontend on port 3000..."
$PKG_MGR run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "================================================"
echo "✅ All Services Started Successfully!"
echo "================================================"
echo ""
echo "📊 Service Status:"
echo "   Backend API: http://localhost:5000 (PID: $BACKEND_PID)"
echo "   ML Scheduler: Running (PID: $SCHEDULER_PID)"
echo "   Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "📁 Logs:"
echo "   Backend: logs/backend.log"
echo "   Scheduler: logs/scheduler.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "⏰ ML Matching runs every 1 hour automatically"
echo "🗑️  Cleanup runs daily at 2:00 AM"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================================"

# Wait for all background processes
wait
