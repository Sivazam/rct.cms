#!/bin/bash

# Fixed Firebase Functions Deployment Script
# This script deploys the fixed functions with the missing delay function

echo "🚀 Starting Fixed Firebase Functions Deployment..."
echo "================================================"

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
echo "🔐 Checking Firebase authentication..."
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Firebase. Please run: firebase login"
    exit 1
fi

# Navigate to functions directory and install dependencies
echo "📦 Installing functions dependencies..."
cd functions
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ TypeScript build failed"
    exit 1
fi

# Go back to project root
cd ..

# List existing functions
echo "📋 Listing existing functions..."
firebase functions:list

# Ask for confirmation
echo ""
echo "⚠️  This will deploy the updated functions with the DLT fix."
read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Deploy functions
echo "🚀 Deploying functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Functions deployed successfully!"
    echo ""
    echo "📧 To configure SMS, run:"
    echo "   firebase functions:config:set fastsms.api_key=\"YOUR_API_KEY\""
    echo "   firebase functions:config:set fastsms.sender_id=\"YOUR_SENDER_ID\""
    echo "   firebase functions:config:set fastsms.entity_id=\"YOUR_ENTITY_ID\""
    echo ""
    echo "📋 Available functions:"
    echo "   - sendSMSV2 (SMS sending with DLT compliance)"
    echo "   - dailyExpiryCheckV2 (Daily expiry check)"
    echo "   - getSMSStatisticsV2 (SMS statistics)"
    echo "   - retryFailedSMSV2 (Retry failed SMS)"
    echo "   - smsHealthCheckV2 (Health check)"
    echo ""
    echo "🔗 Project Console: https://console.firebase.google.com/project/rctscm01/overview"
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check Firebase project configuration: firebase use rctscm01"
    echo "   2. Verify Node.js version: node --version (should be 20.x)"
    echo "   3. Clear cache and retry: firebase deploy --only functions --force"
    echo "   4. Check logs: firebase functions:log --follow"
    exit 1
fi