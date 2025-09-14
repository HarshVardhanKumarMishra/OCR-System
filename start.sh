#!/bin/bash
set -e

echo "🚀 Starting ProCheck OCR System..."
echo "📍 Server will be available at: http://localhost:3000"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Missing .env file. Please create one with MONGO_URI and ADMIN_TOKEN."
    exit 1
fi

# Start the server
echo "🔥 Starting development server..."
npm run dev