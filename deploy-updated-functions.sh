#!/bin/bash

# Firebase Functions Deployment Script
# Deploys updated functions with correct Fast2SMS Message IDs

echo "🚀 Starting Firebase Functions Deployment"
echo "========================================="

# Check if we're in the correct directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI not found. Please install it with:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Error: Not authenticated with Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase authentication verified"

# Show current configuration
echo "📋 Current FastSMS Configuration:"
echo "================================"
firebase functions:config:get

echo ""
echo "🔍 Pre-deployment checks:"
echo "========================="

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo "❌ Error: functions directory not found"
    exit 1
fi

# Check if required files exist
required_files=("functions/index.ts" "functions/lib/sms-templates.ts" "functions/package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file $file not found"
        exit 1
    fi
done

echo "✅ All required files found"

# Check if node_modules exists in functions directory
if [ ! -d "functions/node_modules" ]; then
    echo "📦 Installing dependencies in functions directory..."
    cd functions
    npm install
    cd ..
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Build the functions
echo "🔨 Building TypeScript functions..."
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error: TypeScript build failed"
    exit 1
fi
cd ..
echo "✅ Functions built successfully"

# Show what will be deployed
echo ""
echo "📦 Functions to be deployed:"
echo "============================"
functions_to_deploy=("sendSMSV2" "sendExpiryReminders" "getSMSTemplates" "getSMSLogs" "testSMSTemplate" "testFunction" "healthCheck")
for func in "${functions_to_deploy[@]}"; do
    echo "  - $func"
done

echo ""
echo "🎯 Template IDs being used:"
echo "============================"
echo "  - threeDayReminder: 198607"
echo "  - lastdayRenewal: 198608"
echo "  - renewalConfirmCustomer: 198609"
echo "  - renewalConfirmAdmin: 198610"
echo "  - dispatchConfirmCustomer: 198611"
echo "  - deliveryConfirmAdmin: 198612"
echo "  - finalDisposalReminderAdmin: 198613"

# Ask for confirmation
echo ""
read -p "🚀 Do you want to proceed with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy functions
echo ""
echo "🚀 Deploying Firebase Functions..."
echo "================================"

# Deploy with verbose output for better debugging
firebase deploy --only functions --verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "========================"
    echo ""
    echo "📋 Next Steps:"
    echo "============="
    echo "1. Test SMS functionality in your application"
    echo "2. Check Firebase Functions logs for any errors"
    echo "3. Verify SMS are being delivered successfully"
    echo ""
    echo "🔍 Useful Commands:"
    echo "=================="
    echo "  firebase functions:log   # View function logs"
    echo "  firebase functions:config:get  # View configuration"
    echo ""
    echo "📞 If you encounter issues:"
    echo "=========================="
    echo "1. Check if Fast2SMS API key is valid"
    echo "2. Verify templates are active in Fast2SMS portal"
    echo "3. Ensure proper variable formatting"
    echo "4. Check Firebase Functions logs for detailed errors"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "===================="
    echo ""
    echo "🔍 Troubleshooting:"
    echo "=================="
    echo "1. Check the error messages above"
    echo "2. Ensure Firebase project is correctly configured"
    echo "3. Verify all dependencies are installed"
    echo "4. Check TypeScript compilation errors"
    echo ""
    echo "📞 Common Issues:"
    echo "================="
    echo "- Network connectivity problems"
    echo "- Firebase authentication issues"
    echo "- Insufficient permissions"
    echo "- TypeScript compilation errors"
    exit 1
fi

echo ""
echo "🎉 Deployment process completed!"