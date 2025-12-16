#!/bin/bash

# Firebase Functions Deployment Script - Downgrade Solution
# Using Firebase Functions v4.7.0 with functions.config() support

echo "🔧 Firebase Functions Deployment - Downgrade Solution"
echo "📦 Using Firebase Functions v4.7.0 (supports functions.config())"
echo ""

# Navigate to functions directory
cd functions

# Clean up any existing build
echo "🧹 Cleaning up previous builds..."
rm -rf build/

# Install dependencies (with downgraded firebase-functions)
echo "📦 Installing dependencies (firebase-functions@4.7.0)..."
npm install

# Build the functions
echo "🔨 Building TypeScript functions..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    echo "🔍 Check TypeScript errors above"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Firebase
echo "🚀 Deploying functions to Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Functions deployed successfully!"
    echo ""
    echo "📝 IMPORTANT: Set up your configuration with:"
    echo "   firebase functions:config:set fastsms.api_key=\"YOUR_ACTUAL_API_KEY\""
    echo "   firebase functions:config:set fastsms.sender_id=\"YOUR_SENDER_ID\""
    echo "   firebase functions:config:set fastsms.entity_id=\"YOUR_ENTITY_ID\""
    echo "   firebase functions:config:set admin.mobile=\"YOUR_ADMIN_MOBILE\""
    echo ""
    echo "🔍 Verify configuration:"
    echo "   firebase functions:config:get"
    echo ""
    echo "📊 View function logs:"
    echo "   firebase functions:log"
    echo ""
    echo "🧪 Test functions:"
    echo "   firebase functions:shell"
else
    echo "❌ Deployment failed!"
    echo "🔍 Check the error messages above"
    echo "💡 Make sure you're logged in: firebase login"
    exit 1
fi