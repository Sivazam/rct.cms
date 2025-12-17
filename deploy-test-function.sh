#!/bin/bash

echo "🚀 Deploying testExpiryReminders function to Firebase..."

# Navigate to functions directory
cd functions

# Build the TypeScript code
echo "📦 Building TypeScript..."
bun run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Deploy only the testExpiryReminders function
    echo "🚀 Deploying testExpiryReminders function..."
    firebase deploy --only functions:testExpiryReminders
    
    if [ $? -eq 0 ]; then
        echo "✅ testExpiryReminders function deployed successfully!"
        echo "🎯 You can now test the expiry reminders from the Admin Settings page."
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi