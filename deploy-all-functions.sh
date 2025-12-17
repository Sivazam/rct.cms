#!/bin/bash

echo "🚀 Deploying all updated expiry reminder functions..."

# Navigate to functions directory
cd functions

echo "📦 Building TypeScript..."
bun run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    
    # Deploy all updated functions
    echo "🚀 Deploying debugEntries function..."
    firebase deploy --only functions:debugEntries --project rctscm01
    
    if [ $? -eq 0 ]; then
        echo "✅ debugEntries function deployed successfully!"
    else
        echo "❌ debugEntries deployment failed"
    fi
    
    echo "🚀 Deploying testExpiryReminders function..."
    firebase deploy --only functions:testExpiryReminders --project rctscm01
    
    if [ $? -eq 0 ]; then
        echo "✅ testExpiryReminders function deployed successfully!"
    else
        echo "❌ testExpiryReminders deployment failed"
    fi
    
    echo "🚀 Deploying updated scheduled functions..."
    firebase deploy --only functions:sendExpiryReminders,functions:sendLastDayReminders,functions:sendFinalDisposalReminders --project rctscm01
    
    if [ $? -eq 0 ]; then
        echo "✅ All scheduled functions deployed successfully!"
    else
        echo "❌ Scheduled functions deployment failed"
    fi
    
    echo ""
    echo "🎯 All functions deployed with date range fixes!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Go to Admin Settings page"
    echo "2. Click 'Debug Data' to check your data format"
    echo "3. Click 'Test Now' to test all reminder types"
    echo "4. Check logs: firebase functions:log"
    
else
    echo "❌ Build failed"
    exit 1
fi