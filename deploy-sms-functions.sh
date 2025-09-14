#!/bin/bash

# SMS Functions Deployment Script
# This script deploys Firebase Functions with proper configuration

set -e  # Exit on any error

echo "🚀 Starting SMS Functions Deployment..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "  npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
print_status "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run:"
    echo "  firebase login"
    exit 1
fi

# Navigate to functions directory
cd functions

# Check if functions package.json exists
if [ ! -f "package.json" ]; then
    print_error "Functions package.json not found. Please ensure you're in the correct directory."
    exit 1
fi

# Install dependencies
print_status "Installing functions dependencies..."
npm install

# Navigate back to project root
cd ..

print_status "Setting Firebase environment configuration..."

# Set environment configuration for FastSMS
print_status "Configuring FastSMS API settings..."

firebase functions:config:set \
    fastsms.api_key="QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2" \
    fastsms.sender_id="ROTCMS" \
    fastsms.entity_id="1701175751242640436" \
    sms.daily_check_hour="10" \
    sms.expiry_reminder_days="3" \
    sms.timezone="Asia/Kolkata"

print_status "Environment configuration set successfully!"

# Build the functions
print_status "Building Firebase Functions..."
cd functions
npm run build 2>/dev/null || print_warning "No build script found, skipping build step..."

# Deploy functions
print_status "Deploying Firebase Functions..."
cd ..

# Deploy only the functions we need
firebase deploy --only functions:sendSMS,functions:dailyExpiryCheck,functions:retryFailedSMS,functions:getSMSStatistics,functions:smsHealthCheck

if [ $? -eq 0 ]; then
    print_status "✅ Functions deployed successfully!"
else
    print_error "❌ Functions deployment failed!"
    exit 1
fi

print_status "🎉 SMS Functions deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the functions using the provided test procedures"
echo "2. Monitor the first daily expiry check execution"
echo "3. Verify SMS logs in Firestore"
echo "4. Test the Send SMS button in the admin dashboard"
echo ""
echo "🔧 Useful Commands:"
echo "  - View function logs: firebase functions:log"
echo "  - Test functions: firebase functions:shell"
echo "  - Update config: firebase functions:config:set"
echo ""
echo "📞 Support: Check the logs for any errors or issues"