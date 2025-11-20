#!/bin/bash

echo "=========================================="
echo "🧹 CLEANING NEXT.JS APPLICATION"
echo "=========================================="
echo ""

# Navigate to project
cd /home/maksudulhaque/DevZone/App

# Step 1: Kill all node processes
echo "Step 1: Killing all Node.js processes..."
pkill -9 node 2>/dev/null
pkill -9 -f "next" 2>/dev/null
pkill -9 -f "turbopack" 2>/dev/null
sleep 2
echo "✅ Done"
echo ""

# Step 2: Free specific ports
echo "Step 2: Freeing ports 3000, 3001, 3002, 3003..."
for port in 3000 3001 3002 3003; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null
        echo "  ✓ Port $port freed"
    fi
done
sleep 2
echo "✅ Done"
echo ""

# Step 3: Clean all cache and build files
echo "Step 3: Cleaning cache and build directories..."
rm -rf .next 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
rm -rf .turbo 2>/dev/null
sleep 1
echo "✅ Done"
echo ""

# Step 4: Verify ports are free
echo "Step 4: Verifying ports..."
for port in 3000 3001 3002 3003; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ⚠️  Port $port still in use"
    else
        echo "  ✅ Port $port is free"
    fi
done
echo ""

# Wait a moment
sleep 2

echo "=========================================="
echo "🚀 STARTING DEVELOPMENT SERVER"
echo "=========================================="
echo ""

# Start the server
npm run dev

