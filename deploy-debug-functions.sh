#!/bin/bash

echo "🚀 Deploying updated functions with debug capabilities..."

# Navigate to functions directory
cd functions

echo "📦 Building TypeScript..."
bun run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Deploy both functions
    echo "🚀 Deploying simpleTest function..."
    firebase deploy --only functions:simpleTest --project rctscm01
    
    if [ $? -eq 0 ]; then
        echo "✅ simpleTest function deployed successfully!"
    else
        echo "❌ simpleTest deployment failed"
    fi
    
    echo "🚀 Deploying testExpiryReminders function..."
    firebase deploy --only functions:testExpiryReminders --project rctscm01
    
    if [ $? -eq 0 ]; then
        echo "✅ testExpiryReminders function deployed successfully!"
        echo "🎯 Both test functions are now deployed!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Go to Admin Settings page"
        echo "2. Click 'Test Reminders' button"
        echo "3. Check browser console for detailed logs"
        echo "4. Check Firebase logs: firebase functions:log --only testExpiryReminders"
    else
        echo "❌ testExpiryReminders deployment failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi