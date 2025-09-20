# 🚀 Firebase Functions Deployment Guide

## 📋 Issue Fixed

The deployment error "Cannot determine backend specification. Timeout after 10000" was caused by a missing `delay` function in the Firebase Functions code. This has been resolved.

## 🔧 Fix Applied

### Added Missing Function:
```typescript
// Helper function for delay/sleep
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## 🚀 Deployment Steps

### Step 1: Navigate to Project Root
```bash
cd /path/to/your/project
```

### Step 2: Install Functions Dependencies
```bash
cd functions
npm install
```

### Step 3: Compile TypeScript
```bash
npm run build
```

### Step 4: Deploy Functions
```bash
cd ..
firebase deploy --only functions
```

## 🔍 Expected Output

### Successful Deployment:
```
=== Deploying to 'rctscm01'...

i  deploying functions
i  functions: preparing codebase default for deployment
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
i  artifactregistry: ensuring required API artifactregistry.googleapis.com is enabled...
i  functions: Loading and analyzing source code for codebase default to determine what to deploy

✔  functions[sendSMSV2(us-central1)]: Successful update operation. 
✔  functions[dailyExpiryCheckV2(us-central1)]: Successful update operation.
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/rctscm01/overview
```

## 📞 Functions Available

After successful deployment, these functions will be available:

1. **sendSMSV2** - Send SMS with DLT compliance
2. **dailyExpiryCheckV2** - Daily expiry check scheduler
3. **getSMSStatisticsV2** - Get SMS statistics
4. **retryFailedSMSV2** - Retry failed SMS
5. **smsHealthCheckV2** - Health check function

## 🔧 Configuration Required

Before using SMS functionality, configure FastSMS:

```bash
firebase functions:config:set fastsms.api_key="YOUR_API_KEY"
firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"
```

## ✅ Verification

### 1. Check Deployment Status
```bash
firebase functions:list
```

### 2. Test SMS Functionality
Use the application to send SMS and check console logs.

### 3. Monitor Logs
```bash
firebase functions:log --follow
```

## 🚨 Troubleshooting

### If deployment fails again:

1. **Clear Firebase Cache**:
   ```bash
   firebase use default
   firebase deploy --only functions --force
   ```

2. **Check Node Version**:
   ```bash
   node --version  # Should be 20.x
   ```

3. **Reinstall Dependencies**:
   ```bash
   cd functions
   rm -rf node_modules package-lock.json
   npm install
   cd ..
   ```

4. **Manual Build**:
   ```bash
   cd functions
   npx tsc
   cd ..
   firebase deploy --only functions
   ```

## 📞 Support

If issues persist:
1. **Firebase Console**: Check for error messages
2. **Functions Logs**: `firebase functions:log --follow`
3. **Fast2SMS Support**: Contact with configuration details

---

## 🎯 Success Metrics

- ✅ Functions deploy without timeout errors
- ✅ All 5 functions successfully deployed
- ✅ SMS functionality works with DLT compliance
- ✅ No more "Cannot determine backend specification" errors

---

**🚀 Ready to deploy! The missing delay function has been added and the code should now deploy successfully.**