# 🚀 SMS Template ID Fix - Deployment Guide

## 📋 Current Issue
The error "Invalid Message ID (or Template, Entity ID)" is occurring because the Firebase Functions are still running the old code with incorrect template IDs. We've fixed the code locally, but it needs to be deployed.

## ✅ What We've Fixed

### Template ID Corrections:
- **finalDisposalReminder** (Customer): Now uses Fast2SMS Message ID `198613`
- **finalDisposalReminderAdmin** (Admin): Now uses Fast2SMS Message ID `198614`

### Variable Structure Updates:
- **finalDisposalReminder**: 3 variables (Deceased name, Location, Location repeated)
- **finalDisposalReminderAdmin**: 2 variables (Location name, Deceased person name)

## 🚀 Deployment Steps

### Option 1: Quick Deploy (Recommended)
```bash
# Navigate to project directory
cd /home/z/my-project

# Run the deployment script
./deploy-template-fixes.sh
```

### Option 2: Manual Deploy
```bash
# 1. Login to Firebase (if not already logged in)
firebase login

# 2. Set the correct project
firebase use rctscm01

# 3. Deploy the functions
firebase deploy --only functions

# 4. Verify deployment
firebase functions:list
```

### Option 3: Check Status First
```bash
# Check current status before deploying
./check-functions-status.sh
```

## 🔍 After Deployment

### 1. Verify Deployment
```bash
# List deployed functions
firebase functions:list

# Check recent logs
firebase functions:log --limit 5
```

### 2. Test the Fix
Try sending an SMS with the `finalDisposalReminder` template again. The error should now be resolved.

### 3. Expected Result
After successful deployment, you should see:
- ✅ SMS sent successfully
- ✅ Return message: `{return: true, request_id: "..."}`
- ✅ No more "Invalid Message ID" errors

## 🐛 If Issues Persist

### Check 1: Fast2SMS Template Status
1. Log in to your Fast2SMS dashboard
2. Verify that templates `198613` and `198614` are active
3. Check that the Entity ID is correctly associated

### Check 2: Firebase Configuration
```bash
# Check FastSMS configuration
firebase functions:config:get

# Should show:
# fastsms
#   api_key: "YOUR_API_KEY"
#   sender_id: "ROTCMS"
#   entity_id: "YOUR_ENTITY_ID"
```

### Check 3: Function Logs
```bash
# View real-time logs
firebase functions:log --follow

# Or check recent logs
firebase functions:log --limit 20
```

## 📞 Additional Support

If you still encounter issues after deployment:

1. **Check the exact error message** in the browser console
2. **Verify the template variables** match the DLT template exactly
3. **Confirm the mobile number format** is correct (10 digits, starting with 6-9)
4. **Check Fast2SMS API credits** and account status

## 🎯 Success Criteria

The deployment is successful when:
- ✅ Functions deploy without errors
- ✅ SMS sends return `success: true`
- ✅ No "Invalid Message ID" errors
- ✅ SMS logs appear in Firestore
- ✅ SMS are delivered to recipients

---

**Next Steps:** Run the deployment script and test the SMS functionality!