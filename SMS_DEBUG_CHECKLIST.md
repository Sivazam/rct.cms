# 🔍 SMS Template Debug Guide

## ✅ Deployment Status
Your Firebase Functions have been successfully deployed! However, you're still getting "Invalid Message ID" errors. Let's debug this step by step.

## 🚨 Possible Issues

### 1. **FastSMS Configuration Not Set**
The most common issue is that the FastSMS API configuration is not properly set in Firebase Functions.

**Check your configuration:**
```bash
firebase functions:config:get
```

**Expected output should show:**
```bash
fastsms
  api_key: "YOUR_API_KEY"
  sender_id: "ROTCMS"
  entity_id: "YOUR_ENTITY_ID"
```

**If it's empty or missing, set it:**
```bash
firebase functions:config:set fastsms.api_key="YOUR_FAST2SMS_API_KEY"
firebase functions:config:set fastsms.sender_id="ROTCMS"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"
```

### 2. **Template IDs Not Active in Fast2SMS**
Even with correct IDs, they need to be active in your Fast2SMS account.

**Check in Fast2SMS Dashboard:**
1. Log in to [Fast2SMS](https://www.fast2sms.com/)
2. Go to DLT Templates section
3. Verify that template IDs `198613` and `198614` are:
   - ✅ Approved status
   - ✅ Associated with your Entity ID
   - ✅ Associated with Sender ID "ROTCMS"

### 3. **Entity ID Mismatch**
The Entity ID in your Firebase config must match the Entity ID associated with the templates in Fast2SMS.

## 🔧 Debug Steps

### Step 1: Check Configuration
```bash
firebase functions:config:get
```

### Step 2: Test Template Configuration
Run the debug script:
```bash
./debug-sms-config.sh
```

### Step 3: Check Function Logs
```bash
firebase functions:log --limit 10
```

### Step 4: Test with Simple Template
Try testing with a known working template first:
```bash
# Test with threeDayReminder template (ID: 198607)
curl -X POST \
  "https://us-central1-rctscm01.cloudfunctions.net/sendSMSV2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "templateKey": "threeDayReminder",
    "recipient": "919014882779",
    "variables": {
      "var1": "Test Name",
      "var2": "Test Location",
      "var3": "2025-09-25",
      "var4": "919014882779",
      "var5": "Test Location"
    }
  }'
```

## 🎯 Quick Fix Checklist

### ✅ Configuration Check
- [ ] FastSMS API key is set
- [ ] Sender ID is set to "ROTCMS"
- [ ] Entity ID is set and correct
- [ ] All configuration values are strings

### ✅ Fast2SMS Dashboard Check
- [ ] Templates 198613 and 198614 exist
- [ ] Templates are in "Approved" status
- [ ] Templates are associated with correct Entity ID
- [ ] Templates are associated with Sender ID "ROTCMS"

### ✅ Code Check
- [ ] Functions deployed successfully (✅ Done)
- [ ] Template IDs are correct in code (✅ Done)
- [ ] Variable structures match DLT templates (✅ Done)

## 🚀 If All Else Fails

### Option 1: Use Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/rctscm01/functions)
2. Click on "sendSMSV2" function
3. Test it directly from the console

### Option 2: Check Template Variables
The error might be due to variable format mismatch. Ensure:
- Variables are in the exact order as per DLT template
- No special characters that might break the API
- Mobile numbers are in correct format (10 digits, starting with 6-9)

### Option 3: Contact Fast2SMS Support
If everything looks correct but still getting errors:
- Contact Fast2SMS support
- Provide them with the exact error message
- Ask them to verify template status on their end

---

**Next:** Run the configuration check and let me know what you find!