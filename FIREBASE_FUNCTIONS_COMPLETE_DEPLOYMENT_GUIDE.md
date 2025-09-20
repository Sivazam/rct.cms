# Firebase Functions Complete Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Firebase Project Setup](#step-1-firebase-project-setup)
3. [Step 2: Firebase Initialization](#step-2-firebase-initialization)
4. [Step 3: Environment Configuration](#step-3-environment-configuration)
5. [Step 4: Local Testing](#step-4-local-testing)
6. [Step 5: Build & Deploy](#step-5--build--deploy)
7. [Step 6: Post-Deployment Verification](#step-6-post-deployment-verification)
8. [Step 7: Monitoring & Maintenance](#step-7-monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Prerequisites

Before you begin, ensure you have:

### Required Accounts
- **Google Account**: For Firebase console access
- **FastSMS Account**: For SMS API credentials

### Required Tools
- **Node.js**: Version 18 or higher
- **Firebase CLI**: Install globally
- **Git**: For version control
- **Code Editor**: VS Code recommended

### Project Requirements
- **FastSMS Credentials**: API Key, Sender ID, Entity ID
- **Firebase Project**: Created in Firebase console
- **Billing Enabled**: For Cloud Functions (free tier available)

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **Create New Project**
   - Click "Add project"
   - Enter project name (e.g., "rotary-cms-sms")
   - Enable Google Analytics (optional but recommended)
   - Select Analytics account or create new one
   - Click "Create project"

3. **Project Configuration**
   - Wait for project creation (2-3 minutes)
   - Note your **Project ID** (looks like: `rotary-cms-sms-12345`)
   - Enable billing if required (Functions have free tier)

### 1.2 Enable Required Services

1. **In Firebase Console**
   - Go to your project
   - Navigate to "Build" → "Functions"
   - Click "Get started"
   - Accept terms if prompted

2. **Enable Cloud APIs**
   - Go to "Project Settings" → "Integrations"
   - Ensure "Cloud Functions API" is enabled
   - Enable "Cloud Scheduler API" (for scheduled functions)

---

## Step 2: Firebase Initialization

### 2.1 Install Firebase CLI

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
# Should show: 12.0.0 or higher
```

### 2.2 Login to Firebase

```bash
# Login to your Google account
firebase login

# This will open a browser window for authentication
# Grant necessary permissions
```

### 2.3 Initialize Firebase Project

```bash
# Navigate to your project root
cd /path/to/your/project

# Initialize Firebase (this project is already configured, but for reference)
firebase init

# For new projects, you would select:
# - Functions: Configure Cloud Functions
# - Firestore: Configure Firestore
# - Hosting: Configure web hosting
```

### 2.4 Verify Project Configuration

```bash
# Check current project configuration
firebase projects:list

# Verify you're in the correct project
firebase use your-project-id

# Check Firebase configuration
firebase functions:config:get
```

---

## Step 3: Environment Configuration

### 3.1 FastSMS Configuration

**Get Your FastSMS Credentials:**
1. Log in to your FastSMS account
2. Navigate to API section
3. Copy:
   - API Key
   - Sender ID
   - Entity ID

### 3.2 Set Environment Variables

```bash
# Set FastSMS configuration
firebase functions:config:set fastsms.api_key="YOUR_ACTUAL_API_KEY"
firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"

# Verify configuration
firebase functions:config:get

# Expected output:
# {
#   "fastsms": {
#     "api_key": "YOUR_ACTUAL_API_KEY",
#     "sender_id": "YOUR_SENDER_ID", 
#     "entity_id": "YOUR_ENTITY_ID"
#   }
# }
```

### 3.3 Install Functions Dependencies

```bash
# Navigate to functions directory
cd functions

# Install dependencies (clean install)
rm -rf node_modules package-lock.json
npm install

# Verify installation
npm list --depth=0
# Should show: firebase-admin, firebase-functions, axios
```

---

## Step 4: Local Testing

### 4.1 Start Firebase Emulators

```bash
# From project root directory
firebase emulators:start

# Or start specific emulators
firebase emulators:start --only functions,firestore

# This will start:
# - Functions emulator on port 5001
# - Firestore emulator on port 8080
# - Web UI on http://localhost:4000
```

### 4.2 Test Functions Locally

#### Test SMS Function
```bash
# In another terminal, test the sendSMS function
curl -X POST \
  http://localhost:5001/your-project-id/us-central1/sendSMS \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "templateKey": "threeDayReminder",
      "recipient": "+911234567890",
      "variables": {
        "deceasedPersonName": "Test Person",
        "locationName": "Test Location",
        "date": "24/09/2025",
        "mobile": "9876543210"
      },
      "entryId": "test-entry-123",
      "customerId": "test-customer-123",
      "locationId": "test-location-123"
    }
  }'
```

#### Test Health Check Function
```bash
# Test health check
curl http://localhost:5001/your-project-id/us-central1/smsHealthCheck
```

### 4.3 Test with Firebase Shell

```bash
# Interactive testing shell
firebase functions:shell

# In the shell, you can call functions:
# sendSMS({ templateKey: "threeDayReminder", recipient: "+911234567890", variables: {...} })
```

---

## Step 5: Build & Deploy

### 5.1 Pre-Deployment Checks

```bash
# Ensure you're in correct project
firebase use your-project-id

# Check functions syntax
firebase functions:shell --exit

# Verify configuration
firebase functions:config:get

# Clean functions directory
cd functions
npm prune --production  # Remove dev dependencies
cd ..
```

### 5.2 Deploy Functions

#### Option A: Deploy Only Functions (Recommended)
```bash
# Deploy only functions (safer for first deployment)
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:sendSMS
```

#### Option B: Deploy Everything
```bash
# Deploy functions, firestore rules, and hosting
firebase deploy
```

### 5.3 Deployment Process

During deployment, you'll see:

```bash
i  deploying functions
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (X.XX KB) for uploading
i  functions: uploading functions folder...
⚠  functions: there might be an issue with your deployment configuration.
ℹ  functions: checking functions deploy status...
✔  functions[sendSMS]: Successful deploy operation.
✔  functions[dailyExpiryCheck]: Successful deploy operation.
✔  functions[retryFailedSMS]: Successful deploy operation.
✔  functions[getSMSStatistics]: Successful deploy operation.
✔  functions[smsHealthCheck]: Successful deploy operation.

✅ Deploy complete!
```

---

## Step 6: Post-Deployment Verification

### 6.1 Check Deployment Status

```bash
# List all deployed functions
firebase functions:list

# Expected output:
# +------------------+------------------+------------------+
# | Name             | Region           | Trigger          |
# +------------------+------------------+------------------+
# | sendSMS          | us-central1      | HTTPS Callable   |
# | dailyExpiryCheck | us-central1      | Scheduled        |
# | retryFailedSMS    | us-central1      | HTTP             |
# | getSMSStatistics | us-central1      | HTTP             |
# | smsHealthCheck   | us-central1      | HTTP             |
# +------------------+------------------+------------------+
```

### 6.2 Test Deployed Functions

#### Test SMS Function (Callable)
```javascript
// In your frontend application
const sendSMS = firebase.functions().httpsCallable('sendSMS');

const result = await sendSMS({
  templateKey: 'threeDayReminder',
  recipient: '+911234567890',
  variables: {
    deceasedPersonName: 'Test Person',
    locationName: 'Test Location',
    date: '24/09/2025',
    mobile: '9876543210'
  },
  entryId: 'test-entry-123',
  customerId: 'test-customer-123',
  locationId: 'test-location-123'
});

console.log('SMS Result:', result.data);
```

#### Test Health Check (HTTP)
```bash
# Get your function URL from Firebase console
# Format: https://us-central1-your-project-id.cloudfunctions.net/smsHealthCheck

curl https://us-central1-your-project-id.cloudfunctions.net/smsHealthCheck
```

### 6.3 Check Logs

```bash
# View real-time logs
firebase functions:log --follow

# Filter by specific function
firebase functions:log --only sendSMS

# View recent logs
firebase functions:log --limit 50
```

---

## Step 7: Monitoring & Maintenance

### 7.1 Google Cloud Console

1. **Access Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Navigate to Functions**
   - Select your project
   - Go to "Cloud Functions"
   - Monitor function metrics

### 7.2 Set Up Monitoring

#### Create Alerts
```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Create notification channel (email)
gcloud alpha monitoring channels create \
  --display-name="email-alerts" \
  --type=email \
  --channel-labels=email=admin@yourdomain.com \
  --project=your-project-id
```

#### Create Alert Policy
```bash
# Create alert for function errors
gcloud alpha monitoring policies create \
  --policy-from-file="alert-policy.json" \
  --project=your-project-id
```

### 7.3 Scheduled Function Monitoring

```bash
# Check Cloud Scheduler jobs
gcloud scheduler jobs list --project=your-project-id

# View job details
gcloud scheduler jobs describe daily-expiry-check --project=your-project-id

# Manually trigger scheduled function
gcloud scheduler jobs run daily-expiry-check --project=your-project-id
```

---

## Step 8: Security & Performance

### 8.1 Security Rules

Your Firestore security rules are already configured in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User access control
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only collections
    match /smsLogs/{smsLogId} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 8.2 Performance Optimization

#### Function Configuration
Your functions are optimized:

```javascript
// sendSMS - 256MB memory, 60s timeout
exports.sendSMS = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(...);

// dailyExpiryCheck - 512MB memory, 540s timeout  
exports.dailyExpiryCheck = functions
  .runWith({ memory: '512MB', timeoutSeconds: 540 })
  .pubsub.schedule('0 10 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(...);
```

#### Cost Optimization
- Uses Node.js 18 runtime (cost-effective)
- Memory allocated per function needs
- Efficient database queries with indexes

---

## Troubleshooting

### Common Issues & Solutions

#### 1. "Function deployment failed"
**Problem**: Missing dependencies or syntax errors
**Solution**:
```bash
# Check functions dependencies
cd functions && npm install

# Check syntax
firebase functions:shell --exit

# View detailed error
firebase deploy --only functions --debug
```

#### 2. "Permission denied" errors
**Problem**: Incorrect security rules or user permissions
**Solution**:
```bash
# Check user roles in Firestore
# Verify security rules in firebase console
# Test with different user accounts
```

#### 3. "FastSMS configuration not found"
**Problem**: Missing environment variables
**Solution**:
```bash
# Verify configuration
firebase functions:config:get

# Re-set configuration
firebase functions:config:set fastsms.api_key="YOUR_KEY"
firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"
```

#### 4. "Scheduled function not running"
**Problem**: Cloud Scheduler not enabled
**Solution**:
```bash
# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Verify job exists
gcloud scheduler jobs list --project=your-project-id

# Manually trigger
gcloud scheduler jobs run daily-expiry-check --project=your-project-id
```

#### 5. "SMS sending failed"
**Problem**: FastSMS API issues
**Solution**:
```bash
# Check logs for specific error
firebase functions:log --only sendSMS

# Verify FastSMS credentials
# Test FastSMS API directly
# Check template IDs and variables
```

### Debug Commands

```bash
# Full deployment debug
firebase deploy --only functions --debug

# Function shell for interactive testing
firebase functions:shell

# Check function configuration
firebase functions:config:get

# View all logs
firebase functions:log --follow
```

---

## Best Practices

### 1. Version Control
```bash
# Always commit before deployment
git add .
git commit -m "feat: Update SMS functions with handover person fields"
git push origin main

# Then deploy
firebase deploy --only functions
```

### 2. Environment Management
```bash
# Use different configurations for different environments
firebase functions:config:set env.name="production"
firebase functions:config:set env.debug="false"

# For development
firebase use dev-project-id
firebase functions:config:set env.name="development"
firebase functions:config:set env.debug="true"
```

### 3. Error Handling
- All functions have comprehensive error handling
- Retry logic for SMS failures (3 attempts)
- Detailed logging for debugging
- Graceful degradation for non-critical failures

### 4. Security
- Never commit API keys or secrets
- Use Firebase environment configuration
- Implement proper authentication and authorization
- Validate all input parameters

### 5. Performance
- Use appropriate memory allocation
- Set reasonable timeouts
- Implement efficient database queries
- Monitor function execution times

---

## Quick Reference Commands

### Essential Commands
```bash
# Login
firebase login

# Project management
firebase projects:list
firebase use your-project-id

# Configuration
firebase functions:config:get
firebase functions:config:set fastsms.api_key="YOUR_KEY"

# Deployment
firebase deploy --only functions
firebase deploy --only functions:sendSMS

# Testing
firebase emulators:start
firebase functions:shell

# Monitoring
firebase functions:list
firebase functions:log --follow
```

### URLs and Links
- **Firebase Console**: https://console.firebase.google.com/
- **Cloud Console**: https://console.cloud.google.com/
- **Functions Documentation**: https://firebase.google.com/docs/functions
- **FastSMS Documentation**: https://www.fastsms.com/dev/docs

---

## Conclusion

Your Firebase Functions are now fully configured and ready for deployment. Follow this guide step by step, and you'll have a robust SMS system running in production.

**Key Points to Remember:**
1. Always test locally before deploying
2. Keep your FastSMS credentials secure
3. Monitor function performance and logs
4. Implement proper error handling
5. Use version control for all changes

Your system is now ready to handle SMS notifications for the cremation management system with proper handover person tracking!