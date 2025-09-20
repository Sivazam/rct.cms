#!/bin/bash

# Firebase Functions Deployment Script
# This script helps deploy Firebase Functions with proper cleanup

echo "🚀 Starting Firebase Functions Deployment..."

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

# List existing functions
echo "📋 Listing existing functions..."
firebase functions:list

# Ask for confirmation
echo ""
echo "⚠️  WARNING: This will delete all existing functions and deploy new ones."
echo "This action cannot be undone."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Delete existing functions
echo "🗑️  Deleting existing functions..."
firebase functions:delete sendSMS --force 2>/dev/null || true
firebase functions:delete dailyExpiryCheck --force 2>/dev/null || true

# Wait a moment for deletion to complete
echo "⏳ Waiting for deletion to complete..."
sleep 5

# Deploy new functions
echo "🚀 Deploying new functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Functions deployed successfully!"
    echo ""
    echo "📧 To set up SMS configuration, run:"
    echo "   firebase functions:config:set fastsms.api_key=\"YOUR_API_KEY\""
    echo "   firebase functions:config:set fastsms.sender_id=\"YOUR_SENDER_ID\""
    echo "   firebase functions:config:set fastsms.entity_id=\"YOUR_ENTITY_ID\""
    echo ""
    echo "📅 To set up the scheduled function, create a Pub/Sub topic:"
    echo "   gcloud pubsub topics create daily-expiry-check"
    echo ""
    echo "📅 Then create a Cloud Scheduler job:"
    echo "   gcloud scheduler jobs create pubsub daily-expiry-check \\"
    echo "     --schedule '0 10 * * *' \\"
    echo "     --time-zone 'Asia/Kolkata' \\"
    echo "     --topic 'daily-expiry-check' \\"
    echo "     --message-body 'Daily expiry check'"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi