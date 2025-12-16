#!/bin/bash

# Cloud Functions Deployment Script
# This script deploys the updated cloud functions to Firebase

echo "🔥 Starting Cloud Functions Deployment..."

# Check if we're logged into Firebase
echo "📋 Checking Firebase authentication..."
npx firebase login --no-localhost

# Check current project
echo "📋 Checking Firebase project..."
npx firebase projects:list

# Deploy functions
echo "🚀 Deploying Cloud Functions..."
npx firebase deploy --only functions

echo "✅ Deployment completed!"
echo ""
echo "📊 Deployment Summary:"
echo "  - Partial Dispatch Customer Template: 205257"
echo "  - Partial Dispatch Admin Template: 205258"
echo "  - Full Dispatch Customer Template: 198611"
echo "  - Full Dispatch Admin Template: 198612"
echo "  - Firestore Trigger: onDispatchedLockerCreated"
echo ""
echo "🔧 Next Steps:"
echo "  1. Test partial dispatch functionality"
echo "  2. Verify SMS notifications are sent correctly"
echo "  3. Check Firebase Functions logs for any errors"
echo ""
echo "📱 To check logs: npx firebase functions:log"
echo "🌐 To monitor: https://console.firebase.google.com/"