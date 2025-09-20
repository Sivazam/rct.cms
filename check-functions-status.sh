#!/bin/bash

# Verification script to check Firebase Functions status
echo "🔍 Checking Firebase Functions Status..."

# Check if logged in
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not authenticated with Firebase. Please run: firebase login"
    exit 1
fi

# Set project
firebase use rctscm01

echo ""
echo "📋 Current deployed functions:"
firebase functions:list

echo ""
echo "🔧 Current Firebase configuration:"
firebase functions:config:get

echo ""
echo "📊 Recent function logs (last 10 entries):"
firebase functions:log --limit 10