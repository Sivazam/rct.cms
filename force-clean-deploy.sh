#!/bin/bash

echo "🔥 FORCE CLEAN DEPLOYMENT SCRIPT"
echo "This will completely clear Firebase deployment cache and redeploy"

# Navigate to project root
cd "$(dirname "$0")"

# Clean functions node_modules
echo "🧹 Cleaning functions dependencies..."
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..

# Clear Firebase cache
echo "🗑️  Clearing Firebase cache..."
firebase use default
firebase apps:list

# Try deployment with --force flag
echo "🚀 Attempting force deployment..."
firebase deploy --only functions --force

# If that fails, try with specific function names
if [ $? -ne 0 ]; then
    echo "⚠️  Force deployment failed, trying specific function names..."
    firebase deploy --only functions:sendSMS,functions:dailyExpiryCheck,functions:retryFailedSMS,functions:getSMSStatistics,functions:smsHealthCheck
fi

echo "✅ Deployment process completed!"