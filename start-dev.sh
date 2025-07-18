#!/bin/bash

echo "🚀 Starting NewGamma Development Servers"
echo "========================================"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "🎨 Starting frontend server on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting..."
echo "🔗 Backend: http://localhost:3001"
echo "🔗 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait 