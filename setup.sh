#!/bin/bash

echo "🚀 Setting up NewGamma - AI Presentation Builder"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Create environment files
echo ""
echo "🔧 Setting up environment files..."

# Frontend environment
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "✅ Created .env.local for frontend"
else
    echo "⚠️  .env.local already exists, skipping..."
fi

# Backend environment
if [ ! -f server/.env.local ]; then
    cp server/env.example server/.env.local
    echo "✅ Created server/.env.local for backend"
    echo ""
    echo "⚠️  IMPORTANT: Please edit server/.env.local and add your OpenAI API key:"
    echo "   OPENAI_API_KEY=your-actual-api-key-here"
else
    echo "⚠️  server/.env.local already exists, skipping..."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit server/.env.local and add your OpenAI API key"
echo "2. Start the backend server: cd server && npm run dev"
echo "3. Start the frontend: npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "🔗 Backend will run on: http://localhost:3001"
echo "🔗 Frontend will run on: http://localhost:5173" 