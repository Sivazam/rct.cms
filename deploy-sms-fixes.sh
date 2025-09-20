#!/bin/bash

# 🚀 SMS Fixes Deployment Script
# This script deploys the updated Firebase Functions with SMS template fixes

set -e  # Exit on any error

echo "🚀 Starting SMS Fixes Deployment..."
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found${NC}"
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if logged in
echo -e "${YELLOW}🔐 Checking Firebase authentication...${NC}"
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Not authenticated with Firebase${NC}"
    echo "Please run: firebase login"
    echo "Then run this script again."
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting Firebase project to rctscm01...${NC}"
firebase use rctscm01

# Show deployment summary
echo ""
echo -e "${GREEN}📋 Deployment Summary:${NC}"
echo "   ✅ finalDisposalReminder template ID: 198613"
echo "   ✅ finalDisposalReminderAdmin template ID: 198614"
echo "   ✅ Mobile number auto-cleaning enabled"
echo "   ✅ Enhanced error handling and logging"
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Deployment cancelled${NC}"
    exit 1
fi

# Deploy functions
echo -e "${YELLOW}🚀 Deploying Firebase Functions...${NC}"
if firebase deploy --only functions; then
    echo ""
    echo -e "${GREEN}✅ Functions deployed successfully!${NC}"
    echo ""
    echo -e "${GREEN}📋 What was fixed:${NC}"
    echo "   • Template IDs corrected to Fast2SMS Message IDs"
    echo "   • Mobile number validation and auto-cleaning"
    echo "   • Enhanced error handling and debugging"
    echo "   • DLT compliance improvements"
    echo ""
    echo -e "${YELLOW}🧪 Testing instructions:${NC}"
    echo "   1. Test SMS sending with finalDisposalReminder template"
    echo "   2. Check logs: firebase functions:log"
    echo "   3. Verify delivery in Fast2SMS dashboard"
    echo ""
    echo -e "${GREEN}🎉 SMS system should now work correctly!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Please check the error messages above and try again."
    exit 1
fi