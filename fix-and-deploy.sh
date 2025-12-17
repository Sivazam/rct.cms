#!/bin/bash

echo "🔧 Fixing Firebase Functions deployment issues..."

# Navigate to functions directory
cd functions

echo "📦 Step 1: Installing dependencies with correct versions..."
# Remove old lock file
rm -f package-lock.json

# Install with npm to generate compatible lock file
npm install --save firebase-functions@4.9.0

echo "🔧 Step 2: Fixing Node.js version requirement..."
# Update package.json to use Node.js 20
npm pkg set engines.node=20

echo "📦 Step 3: Adding missing dependencies..."
npm install --save @types/express@4.17.3

echo "🏗️ Step 4: Building TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🚀 Step 5: Deploying testExpiryReminders function..."
    firebase deploy --only functions:testExpiryReminders --project rctscm01
    
    if [ $? -eq 0 ]; then
        echo "✅ testExpiryReminders function deployed successfully!"
        echo "🎯 You can now test expiry reminders from Admin Settings page."
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi