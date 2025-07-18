#!/bin/bash

echo "🎨 Ideogram API Setup for NewGamma"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f "server/.env.local" ]; then
    echo "Creating server/.env.local file..."
    cp server/env.example server/.env.local
fi

echo "To use Ideogram AI-generated images instead of Unsplash:"
echo ""
echo "1. Get your Ideogram API key from: https://ideogram.ai"
echo "2. Edit server/.env.local and replace:"
echo "   IDEOGRAM_API_KEY=your-ideogram-api-key-here"
echo "   with your actual API key"
echo ""
echo "3. Restart the server:"
echo "   cd server && npm run dev"
echo ""
echo "Note: If no Ideogram API key is provided, the app will use"
echo "professional stock photos as placeholders."
echo ""

# Check current configuration
if [ -f "server/.env.local" ]; then
    echo "Current configuration:"
    if grep -q "IDEOGRAM_API_KEY=your-ideogram-api-key-here" server/.env.local; then
        echo "❌ Ideogram API key not configured"
    else
        echo "✅ Ideogram API key configured"
    fi
fi

echo ""
echo "Setup complete! 🚀" 