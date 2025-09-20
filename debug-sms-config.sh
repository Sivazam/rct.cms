#!/bin/bash

# Debug script to check SMS template configuration
echo "🔍 Debugging SMS Template Configuration..."

# Check if logged in
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Firebase. Please run: firebase login"
    exit 1
fi

# Set project
firebase use rctscm01

echo ""
echo "📋 Checking FastSMS Configuration..."
firebase functions:config:get

echo ""
echo "🔍 Testing template configuration..."
echo "Calling debugTemplateConfig function..."

# Call the debug function
curl -X POST \
  "https://us-central1-rctscm01.cloudfunctions.net/debugTemplateConfig" \
  -H "Content-Type: application/json" \
  -d '{
    "templateKey": "finalDisposalReminder",
    "test": true
  }'

echo ""
echo ""
echo "📊 Checking recent function logs..."
firebase functions:log --limit 5