#!/bin/bash

echo "🚀 Deploying Instagram Scraper API..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "✅ Please edit .env with your configuration"
fi

# Start with PM2
if command -v pm2 &> /dev/null; then
    echo "🚀 Starting with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    echo "⚠️  PM2 not found. Installing..."
    npm install -g pm2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
fi

echo "✅ Deployment complete!"
echo "📡 API running on http://localhost:3000"