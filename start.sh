#!/bin/bash

# Kota Smart Product Platform Startup Script

echo "🚀 Starting Kota Smart Product Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create data directory if it doesn't exist
mkdir -p data

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the server."
fi

# Start the application
echo "🎯 Starting the application..."
echo "Backend will run on: http://localhost:3000"
echo "Frontend will run on: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start backend in background
npm start &
BACKEND_PID=$!

# Start frontend
cd frontend
npm start &
FRONTEND_PID=$!

# Wait for user to stop
wait

# Cleanup on exit
echo "🛑 Stopping application..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ Application stopped."
