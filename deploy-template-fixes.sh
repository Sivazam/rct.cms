#!/bin/bash

# Quick Deployment Script for Firebase Functions with Template ID Fixes
# This script deploys the updated SMS templates with correct Fast2SMS Message IDs

echo "🚀 Starting Firebase Functions Deployment for SMS Template Fixes..."

# Check if firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "🔐 Checking Firebase authentication..."
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Firebase."
    echo "Please run: firebase login"
    echo "Then run this script again."
    exit 1
fi

# Set project
echo "📋 Setting Firebase project to rctscm01..."
firebase use rctscm01

# Show what we're deploying
echo ""
echo "📋 Deploying updated SMS templates:"
echo "   ✅ finalDisposalReminder (Customer) -> ID: 198613"
echo "   ✅ finalDisposalReminderAdmin (Admin) -> ID: 198614"
echo ""

# Deploy functions
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Functions deployed successfully!"
    echo ""
    echo "📋 What was fixed:"
    echo "   • finalDisposalReminder template now uses correct ID: 198613"
    echo "   • finalDisposalReminderAdmin template now uses correct ID: 198614"
    echo "   • Variable structures updated as per requirements"
    echo ""
    echo "🧪 To test the deployment:"
    echo "   1. Try sending SMS with finalDisposalReminder template"
    echo "   2. Check function logs: firebase functions:log"
    echo "   3. Verify SMS delivery in Fast2SMS dashboard"
    echo ""
    echo "🔍 If you still see 'Invalid Message ID' error:"
    echo "   1. Check Fast2SMS dashboard to confirm template IDs are active"
    echo "   2. Verify Entity ID is configured: firebase functions:config:get"
    echo "   3. Check template variables match DLT template exactly"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi