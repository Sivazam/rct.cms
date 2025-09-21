# Firebase Functions Deployment Guide - Template ID Fixes

## 🎯 Issue Summary

The SMS system was encountering "Invalid Message ID (or Template, Entity ID)" errors because the Firebase Cloud Functions were running with outdated template IDs. The frontend code has been updated with the correct template IDs, but the cloud functions need to be force-deployed to apply these fixes.

## ✅ What Has Been Fixed

### 1. Frontend Code (src/lib/sms-templates.ts)
- **Fixed**: Duplicate `template` identifier declaration that was causing build failures
- **Updated**: Template ID mappings with correct Fast2SMS Message IDs:
  - `finalDisposalReminder`: `198613` (Customer template)
  - `finalDisposalReminderAdmin`: `198614` (Admin template)
- **Enhanced**: Variable validation logic to only validate actual mobile number variables

### 2. Firebase Functions (functions/lib/sms-templates.ts)
- **Updated**: All template IDs with correct Fast2SMS Message IDs
- **Verified**: Template structures match DLT requirements exactly
- **Enhanced**: Error handling and validation

### 3. Firebase Functions (functions/index.ts)
- **Updated**: Main functions file with correct template ID references
- **Enhanced**: Debug logging for template ID validation
- **Added**: Comprehensive error handling for template/entity ID issues

## 🚀 Deployment Instructions

### Prerequisites
1. **Firebase CLI Installed**: 
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticated with Firebase**:
   ```bash
   firebase login
   ```

3. **Project Set Correctly**:
   ```bash
   firebase use rctscm01
   ```

### Step 1: Force Deploy Functions

Run the force deployment script:
```bash
# Navigate to project directory
cd /path/to/your/project

# Make script executable
chmod +x force-deploy-functions.sh

# Run force deployment
./force-deploy-functions.sh
```

### Alternative: Manual Deployment

If the script doesn't work, run these commands manually:
```bash
# 1. Clean build directory
rm -rf functions/build
mkdir -p functions/build

# 2. Delete existing functions to force fresh deployment
firebase functions:delete sendSMSV2 --region us-central1
firebase functions:delete retryFailedSMSV2 --region us-central1
firebase functions:delete getSMSStatisticsV2 --region us-central1
firebase functions:delete dailyExpiryCheckV2 --region us-central1

# 3. Deploy functions
firebase deploy --only functions --force
```

### Step 2: Verify Configuration

Check that your Firebase configuration is correct:
```bash
# Check FastSMS configuration
firebase functions:config:get

# Expected output should include:
# {
#   "fastsms": {
#     "api_key": "YOUR_API_KEY",
#     "sender_id": "ROTCMS",
#     "entity_id": "YOUR_ENTITY_ID"
#   }
# }
```

If configuration is missing, set it:
```bash
firebase functions:config:set fastsms.api_key="YOUR_API_KEY"
firebase functions:config:set fastsms.sender_id="ROTCMS"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"
```

## 🧪 Testing the Deployment

### 1. Test Function Deployment
```bash
# Check function logs
firebase functions:log

# Test health check function
curl https://us-central1-rctscm01.cloudfunctions.net/healthCheck
```

### 2. Test SMS Sending

After deployment, test the SMS functionality:

**Test finalDisposalReminder Template:**
```javascript
// Test data
const testData = {
  templateKey: 'finalDisposalReminder',
  recipient: '919014882779', // Replace with test number
  variables: {
    var1: 'టెస్ట్ పేరు', // Deceased person name
    var2: 'లాకర్-A', // Location
    var3: 'లాకర్-A' // Location repeated
  }
};

// Call from frontend or test directly
```

**Test finalDisposalReminderAdmin Template:**
```javascript
// Test data
const testData = {
  templateKey: 'finalDisposalReminderAdmin',
  recipient: '919014882779', // Replace with test number
  variables: {
    var1: 'లాకర్-A', // Location name
    var2: 'టెస్ట్ పేరు' // Deceased person name
  }
};
```

### 3. Expected Results

✅ **Successful Response:**
```json
{
  "success": true,
  "messageId": "REQUEST_ID_FROM_FAST2SMS",
  "timestamp": "2025-01-21T10:30:00.000Z"
}
```

❌ **If Still Getting Errors:**
1. Check Fast2SMS dashboard to confirm template IDs are active
2. Verify Entity ID is configured correctly
3. Check template variables match DLT template exactly
4. Review function logs: `firebase functions:log`

## 🔍 Troubleshooting

### Issue: "Invalid Message ID" Error Still Occurs

**Check:**
1. **Template IDs in Fast2SMS Dashboard:**
   - Log in to Fast2SMS dashboard
   - Verify templates `198613` and `198614` are active
   - Confirm they are associated with Entity ID and Sender ID

2. **Entity ID Configuration:**
   ```bash
   firebase functions:config:get
   ```
   Ensure Entity ID matches what's configured in Fast2SMS

3. **Template Variables:**
   - Verify variable count matches template requirements
   - Ensure variables are in correct order
   - Check for any special characters or formatting issues

### Issue: Functions Won't Deploy

**Solution:**
```bash
# Complete cleanup and redeploy
rm -rf functions/build functions/node_modules
cd functions && npm install && cd ..
firebase deploy --only functions --force
```

### Issue: Frontend Still Shows Validation Errors

**Check:**
1. Ensure frontend build is updated with latest changes
2. Clear browser cache
3. Test with different templates to verify validation logic

## 📋 Final Verification Checklist

After deployment, verify:

- [ ] Firebase Functions deployed successfully
- [ ] Health check endpoint returns 200
- [ ] SMS sending returns `{success: true, messageId: "..."}`
- [ ] No "Invalid Message ID" errors in logs
- [ ] SMS delivered to test numbers
- [ ] Frontend validation works correctly
- [ ] All template types can be used successfully

## 🎯 Success Criteria

The deployment is successful when:

1. ✅ **SMS API Response**: All SMS sending attempts return `success: true`
2. ✅ **No Template Errors**: No "Invalid Message ID" or template-related errors
3. ✅ **SMS Delivery**: Messages are delivered to recipients successfully
4. ✅ **All Templates Work**: All 8 template types work correctly
5. ✅ **Frontend Validation**: Form validation passes for all template types

## 📞 Support

If you encounter any issues during deployment:

1. Check the Firebase Functions logs: `firebase functions:log`
2. Verify Fast2SMS dashboard configuration
3. Review this guide for any missed steps
4. Contact technical support with specific error messages

---

**Last Updated**: 2025-01-21
**Version**: 1.0
**Priority**: HIGH - This deployment is critical for SMS functionality