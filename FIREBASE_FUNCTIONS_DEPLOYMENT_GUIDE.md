# Firebase Functions Deployment Guide

## Overview
This guide will help you deploy the fixed Firebase functions for your Rotary CMS SMS system. The functions have been completely rewritten to eliminate export warnings and ensure proper deployment.

## What Was Fixed

### 1. Import Path Issues
- **Problem**: Functions were importing from `../src/lib/` which doesn't exist in the functions context
- **Solution**: Created Admin SDK compatible services in `functions/lib/` directory
- **Files Modified**: 
  - `functions/src/index.ts` → `functions/src/index.js` (converted to JavaScript)
  - `functions/lib/sms-templates.ts` (Admin SDK compatible)
  - `functions/lib/sms-logs.ts` (Admin SDK compatible)

### 2. Export Warnings
- **Problem**: TypeScript module export issues causing deployment failures
- **Solution**: 
  - Converted from TypeScript to JavaScript for better compatibility
  - Used proper CommonJS exports (`exports.functionName = functions...`)
  - Eliminated all type-related compilation errors

### 3. Firebase Admin SDK Usage
- **Problem**: Using client-side Firebase SDK in server environment
- **Solution**: 
  - Proper Firebase Admin SDK initialization
  - Correct Firestore database access patterns
  - Fixed Timestamp handling for server environment

### 4. Configuration Files
- **Problem**: Missing Firebase configuration files
- **Solution**: Created comprehensive configuration:
  - `firebase.json` - Functions and hosting configuration
  - `firestore.rules` - Security rules for data protection
  - `firestore.indexes.json` - Database indexes for performance

## Deployment Steps

### Prerequisites
1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Verify Firebase Project**:
   ```bash
   firebase projects:list
   ```

### Step 1: Configure Environment Variables
Before deploying, you need to set up your FastSMS configuration:

```bash
# Set FastSMS configuration
firebase functions:config:set fastsms.api_key="YOUR_API_KEY"
firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"
```

**Note**: Replace the values with your actual FastSMS credentials that you've already set up.

### Step 2: Deploy Functions
Navigate to your project root and run:

```bash
# Deploy only functions (recommended for first deployment)
firebase deploy --only functions

# Or deploy everything (functions, firestore rules, hosting)
firebase deploy
```

### Step 3: Verify Deployment
After deployment, verify that all functions are deployed:

```bash
# List all deployed functions
firebase functions:list

# Check function logs
firebase functions:log
```

## Available Functions

### 1. `sendSMS` (Callable)
- **Purpose**: Send SMS from frontend with authentication
- **Type**: Callable Function
- **Memory**: 256MB
- **Timeout**: 60 seconds
- **Usage**: Called from frontend to send SMS with proper authorization

### 2. `dailyExpiryCheck` (Scheduled)
- **Purpose**: Automated daily check for expiring entries
- **Type**: Scheduled Function
- **Schedule**: Daily at 10 AM IST
- **Memory**: 512MB
- **Timeout**: 9 minutes
- **Usage**: Automatically sends reminders for entries expiring in 3 days and today

### 3. `retryFailedSMS` (HTTP)
- **Purpose**: Manually retry failed SMS messages
- **Type**: HTTP Request
- **Memory**: 256MB
- **Timeout**: 5 minutes
- **Usage**: Can be called via HTTP request to retry failed messages

### 4. `getSMSStatistics` (HTTP)
- **Purpose**: Get SMS usage statistics
- **Type**: HTTP Request
- **Memory**: 128MB
- **Timeout**: 60 seconds
- **Usage**: Returns statistics for the last 30 days

### 5. `smsHealthCheck` (HTTP)
- **Purpose**: Health check for SMS service
- **Type**: HTTP Request
- **Memory**: 64MB
- **Timeout**: 30 seconds
- **Usage**: Monitor service health and configuration

## Google Scheduler Setup

The `dailyExpiryCheck` function uses Google Cloud Scheduler to run automatically. To set it up:

### 1. Enable Cloud Scheduler
```bash
# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com
```

### 2. Verify Scheduler Job
The function is already configured with:
- **Schedule**: `0 10 * * *` (10 AM daily)
- **Timezone**: `Asia/Kolkata`
- **Retry**: Default retry configuration

### 3. Monitor Scheduler
```bash
# Check scheduler jobs
gcloud scheduler jobs list --project=YOUR_PROJECT_ID

# View job details
gcloud scheduler jobs describe daily-expiry-check --project=YOUR_PROJECT_ID
```

## Security Rules

The Firestore security rules have been configured with:

### User Access Control
- **Authentication**: All users must be authenticated
- **Active Status**: Only active users can access data
- **Role-based Access**: Admin and Operator roles with different permissions

### Location-based Access
- **Operators**: Can only access data for their assigned locations
- **Admins**: Full access to all data
- **Customers**: Limited access to their own data

### Sensitive Collections
- **SMS Logs**: Admin access only
- **Function Calls**: Admin access only
- **Daily Checks**: Admin access only

## Testing the Deployment

### 1. Health Check
Test the health check endpoint:
```bash
# Get your function URL from Firebase console
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/smsHealthCheck
```

### 2. Test SMS Sending
From your frontend application, test SMS sending with:
```javascript
// Example call from frontend
const sendSMS = firebase.functions().httpsCallable('sendSMS');

const result = await sendSMS({
  templateKey: 'threeDayReminder',
  recipient: '+911234567890',
  variables: {
    deceasedPersonName: 'Test Name',
    locationName: 'Test Location',
    date: '24/09/2025',
    mobile: '9876543210'
  },
  entryId: 'test-entry-id',
  customerId: 'test-customer-id',
  locationId: 'test-location-id'
});
```

### 3. Monitor Logs
Check function logs for any issues:
```bash
# View real-time logs
firebase functions:log --follow

# Filter by specific function
firebase functions:log --only sendSMS
```

## Troubleshooting

### Common Issues

#### 1. "Function deployment failed"
- **Cause**: Missing dependencies or syntax errors
- **Solution**: Check the JavaScript syntax and ensure all dependencies are in `functions/package.json`

#### 2. "Permission denied" errors
- **Cause**: Incorrect security rules or user permissions
- **Solution**: Verify user roles and location assignments in Firestore

#### 3. "FastSMS configuration not found"
- **Cause**: Missing environment variables
- **Solution**: Run the `firebase functions:config:set` commands with your credentials

#### 4. "Scheduled function not running"
- **Cause**: Cloud Scheduler not enabled or misconfigured
- **Solution**: Enable Cloud Scheduler API and verify the job configuration

### Performance Optimization

#### Memory and Timeout Settings
- **sendSMS**: 256MB memory, 60s timeout (sufficient for single SMS)
- **dailyExpiryCheck**: 512MB memory, 540s timeout (handles bulk processing)
- **retryFailedSMS**: 256MB memory, 300s timeout (batch retry operations)

#### Cost Optimization
- Uses Node.js 18 runtime (cost-effective)
- Memory allocation optimized for each function's needs
- Efficient database queries with proper indexes

## File Size Management

The fixed implementation maintains a small file size:
- **Functions Directory**: ~50KB (without node_modules)
- **Main Function**: ~25KB (JavaScript)
- **Dependencies**: Only essential packages (firebase-admin, firebase-functions, axios)

### Removing Test Dependencies
After testing, you can remove:
```bash
# Remove development dependencies from functions/package.json
# Keep only: firebase-admin, firebase-functions, axios
npm prune --production
```

## Post-Deployment Checklist

### 1. Verify All Functions
- [ ] All 5 functions deployed successfully
- [ ] Health check returns 200 OK
- [ ] SMS sending works with proper authentication
- [ ] Scheduled function is active in Google Cloud Console

### 2. Configure Monitoring
- [ ] Set up Cloud Monitoring alerts
- [ ] Configure error reporting
- [ ] Set up log exports (if needed)

### 3. Test End-to-End Flow
- [ ] Test SMS sending from frontend
- [ ] Verify SMS logs are created in Firestore
- [ ] Test daily expiry check (manually trigger if needed)
- [ ] Verify retry functionality for failed SMS

### 4. Security Verification
- [ ] Test user authentication and authorization
- [ ] Verify location-based access controls
- [ ] Test admin-only operations

## Maintenance

### Regular Updates
- Monitor Firebase SDK updates and update as needed
- Review and optimize security rules periodically
- Monitor SMS delivery rates and adjust retry logic if needed

### Backup and Recovery
- Enable Firestore data export
- Regular backup of function configurations
- Document any custom configurations

## Support

If you encounter any issues:
1. Check Firebase function logs: `firebase functions:log`
2. Verify FastSMS configuration and API status
3. Ensure all environment variables are set correctly
4. Review Firestore security rules if access issues occur

The functions are now ready for production deployment and should work seamlessly with your existing Rotary CMS application.