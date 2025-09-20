# Firebase Functions Deployment Instructions

## Current Status
✅ **Project is ready for deployment**
- Project ID: `rctscm01`
- Firebase configuration files are in place
- FastSMS configuration is already set
- Functions code has been fixed with the correct parameters

## Required Manual Steps

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```
This will open a browser window for you to authenticate with your Google account.

### Step 3: Deploy the Functions
```bash
cd /home/z/my-project
firebase deploy --only functions:sendSMS
```

### Step 4: Verify Deployment
```bash
# List deployed functions
firebase functions:list

# Check function logs
firebase functions:log --only sendSMS
```

## What This Deployment Fixes

Based on the previous conversation summary, this deployment will fix:

### 1. Parameter Name Mismatch
- **Before**: `customerMobile` (Next.js) → `recipient` (Firebase Functions)
- **After**: Both use `recipient` parameter name

### 2. FastSMS API Configuration
- **Fixed API URL**: `https://www.fast2sms.com/dev/bulkV2` (correct domain)
- **Fixed Route**: Using `dlt_manual` instead of `dlt`
- **Proper Template Handling**: DLT template ID and message variables

### 3. Error Handling
- **Fixed Firestore undefined values**: Proper handling of `messageId`
- **Better error responses**: Clear error messages for debugging

## Expected Result After Deployment

After successful deployment, the SMS functionality should:
- ✅ No longer show "Template key, recipient, and variables are required" error
- ✅ Successfully send SMS through Fast2SMS API
- ✅ Return success response: `{return: true, request_id: "..."}`
- ✅ Log SMS activities in Firestore

## Testing the Fix

After deployment, test the SMS functionality by:

1. **From Admin Dashboard**: Use the "Send SMS" button
2. **From Customer Entry**: Trigger automatic SMS reminders
3. **Check Logs**: Verify SMS logs in Firestore
4. **Monitor Delivery**: Confirm SMS are actually delivered

## Troubleshooting

If deployment fails:
1. Check Firebase authentication: `firebase login --reauth`
2. Verify project ID: `firebase use rctscm01`
3. Check FastSMS config: `firebase functions:config:get`

If SMS still doesn't work after deployment:
1. Check function logs: `firebase functions:log --only sendSMS`
2. Verify FastSMS API credentials
3. Test with a simple SMS template first

## Alternative: Manual Deployment

If Firebase CLI deployment continues to fail, you can:

1. **Use Firebase Console**: 
   - Go to https://console.firebase.google.com/project/rctscm01/functions
   - Upload the functions manually

2. **Use Google Cloud Console**:
   - Go to https://console.cloud.google.com/functions/
   - Select project `rctscm01`
   - Deploy from source

The functions are located in `/home/z/my-project/functions/` directory.