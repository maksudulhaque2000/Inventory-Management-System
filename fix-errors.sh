#!/bin/bash

echo "🧹 Fixing Next.js Application Errors..."
echo ""

# Navigate to project directory
cd /home/maksudulhaque/DevZone/App

# Kill all Node.js processes
echo "1️⃣ Killing all Node processes..."
pkill -9 node 2>/dev/null || true
pkill -9 -f "next" 2>/dev/null || true
sleep 1

# Free ports 3000, 3001, 3003
echo "2️⃣ Freeing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3003 | xargs kill -9 2>/dev/null || true
sleep 1

# Clean Next.js cache and build files
echo "3️⃣ Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache
sleep 1

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "🚀 Starting development server..."
echo ""

# Start the development server
npm run dev

