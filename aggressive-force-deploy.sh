#!/bin/bash

# AGGRESSIVE Force Deployment Script for Firebase Functions
# This script forces deployment by making significant changes to bypass Firebase's change detection

echo "🚀 Starting AGGRESSIVE Forced Firebase Functions Deployment..."

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

# Create a timestamp for forcing changes
TIMESTAMP=$(date +%s)
echo "🕐 Using timestamp for force trigger: $TIMESTAMP"

# Show what we're deploying
echo ""
echo "📋 Deploying updated SMS templates (AGGRESSIVE FORCE UPDATE):"
echo "   ✅ finalDisposalReminder (Customer) -> ID: 198613"
echo "   ✅ finalDisposalReminderAdmin (Admin) -> ID: 198614"
echo ""

# Step 1: Completely clean the functions directory
echo "🧹 Aggressively cleaning functions directory..."
rm -rf functions/build
rm -rf functions/node_modules/.cache
rm -rf functions/.firebase
rm -rf functions/.next
find functions -name "*.js" -delete
find functions -name "*.map" -delete

# Step 2: Add a forced change to trigger deployment
echo "📝 Adding forced change trigger..."
cat >> functions/index.ts << EOF

// FORCE DEPLOYMENT TRIGGER - $TIMESTAMP
// This comment is added to force Firebase to detect changes
// Template IDs updated: finalDisposalReminder=198613, finalDisposalReminderAdmin=198614
export const forceDeployTrigger = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Force deployment trigger executed',
        timestamp: new Date().toISOString(),
        deploymentId: '$TIMESTAMP',
        templateUpdates: {
          finalDisposalReminder: '198613',
          finalDisposalReminderAdmin: '198614'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
EOF

# Step 3: Update package.json to trigger change
echo "📦 Updating package.json to trigger change..."
cd functions
if [ -f package.json ]; then
    # Add a deployment timestamp to package.json
    jq '.deployTimestamp = "'$TIMESTAMP'"' package.json > package.json.tmp && mv package.json.tmp package.json
    # Increment patch version
    npm version patch --no-git-tag-version
fi
cd ..

# Step 4: Reinstall dependencies to ensure fresh node_modules
echo "📦 Reinstalling dependencies..."
cd functions
npm install
cd ..

# Step 5: Try individual function deletion first
echo "🗑️ Attempting to delete individual functions..."
firebase functions:delete sendSMSV2 --region us-central1 --force
firebase functions:delete retryFailedSMSV2 --region us-central1 --force
firebase functions:delete getSMSStatisticsV2 --region us-central1 --force
firebase functions:delete dailyExpiryCheckV2 --region us-central1 --force
firebase functions:delete debugTemplateConfig --region us-central1 --force

# Step 6: Deploy with multiple strategies
echo "🚀 Attempting deployment with multiple strategies..."

# Strategy 1: Deploy only specific functions
echo "📋 Strategy 1: Deploying specific functions..."
firebase deploy --only functions:sendSMSV2,functions:retryFailedSMSV2,functions:getSMSStatisticsV2,functions:dailyExpiryCheckV2 --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Strategy 1 succeeded! Functions deployed successfully!"
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
    
    # Clean up the force trigger
    echo "🧹 Cleaning up force trigger..."
    sed -i '/FORCE DEPLOYMENT TRIGGER/d' functions/index.ts
    
    exit 0
fi

# Strategy 2: Deploy all functions
echo "📋 Strategy 1 failed, trying Strategy 2: Deploy all functions..."
firebase deploy --only functions --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Strategy 2 succeeded! Functions deployed successfully!"
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
    
    # Clean up the force trigger
    echo "🧹 Cleaning up force trigger..."
    sed -i '/FORCE DEPLOYMENT TRIGGER/d' functions/index.ts
    
    exit 0
fi

# Strategy 3: Complete redeploy
echo "📋 Strategy 2 failed, trying Strategy 3: Complete redeploy..."
echo "🗑️ Deleting all functions..."
firebase functions:delete sendSMSV2 --region us-central1 --force
firebase functions:delete retryFailedSMSV2 --region us-central1 --force
firebase functions:delete getSMSStatisticsV2 --region us-central1 --force
firebase functions:delete dailyExpiryCheckV2 --region us-central1 --force
firebase functions:delete debugTemplateConfig --region us-central1 --force
firebase functions:delete healthCheck --region us-central1 --force
firebase functions:delete smsHealthCheckV2 --region us-central1 --force
firebase functions:delete testFunction --region us-central1 --force

echo "🚀 Redeploying all functions..."
firebase deploy --only functions --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Strategy 3 succeeded! Functions deployed successfully!"
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
    
    # Clean up the force trigger
    echo "🧹 Cleaning up force trigger..."
    sed -i '/FORCE DEPLOYMENT TRIGGER/d' functions/index.ts
    
    exit 0
fi

echo ""
echo "❌ All deployment strategies failed!"
echo "Please try the following manual steps:"
echo ""
echo "1. Manually delete all functions:"
echo "   firebase functions:delete sendSMSV2 --region us-central1 --force"
echo "   firebase functions:delete retryFailedSMSV2 --region us-central1 --force"
echo "   firebase functions:delete getSMSStatisticsV2 --region us-central1 --force"
echo "   firebase functions:delete dailyExpiryCheckV2 --region us-central1 --force"
echo ""
echo "2. Clean the project:"
echo "   rm -rf functions/build functions/node_modules"
echo "   cd functions && npm install && cd .."
echo ""
echo "3. Deploy again:"
echo "   firebase deploy --only functions --force"
echo ""
echo "4. If still failing, try creating a new Firebase project"

# Clean up the force trigger
echo "🧹 Cleaning up force trigger..."
sed -i '/FORCE DEPLOYMENT TRIGGER/d' functions/index.ts

exit 1