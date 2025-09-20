# SMS Debug - Next Steps Guide

## 🎯 Current Situation
You have successfully deployed Firebase cloud functions but are encountering the error:
```
FastSMS API Error: Invalid Message ID (or Template, Entity ID)
```

## 🚀 Immediate Actions Required

### 1. Run Debug Function (Highest Priority)
The debug function is already deployed and ready to use. You have two options:

#### Option A: Use the HTML Debug Tool (Recommended)
1. Open the `debug-sms.html` file in your browser
2. Update the Firebase configuration with your actual project details
3. Login as an admin user
4. Click "Debug Configuration" to check your setup
5. Click "Test API Call" to test actual SMS sending

#### Option B: Use the Command Line Scripts
1. Update the configuration in `test-sms-debug.sh` or `test-sms-debug.js`
2. Run the script to test the debug function
3. Analyze the output for configuration issues

### 2. Check FastSMS Dashboard (Critical)
Based on the error message, the most likely issue is a configuration mismatch. You need to:

1. **Login to your FastSMS account**
2. **Navigate to DLT Templates section**
3. **Verify the following for each template:**
   - Template ID matches exactly with your Firebase configuration
   - Entity ID matches your Firebase configuration (`1701175751242640436`)
   - Sender ID is set to `ROTCMS`
   - Template status is "Approved" and active

### 3. Expected Configuration
From your Excel data, the templates should be registered with:
- **Entity ID**: `1701175751242640436`
- **Sender ID**: `ROTCMS`
- **Template IDs**: (from your Excel file)
  - `1707175786299400837` (threeDayReminder)
  - `1707175786326312933` (lastdayRenewal)
  - `1707175786362862204` (renewalConfirmCustomer)
  - `1707175786389503209` (renewalConfirmAdmin)
  - `1707175786420863806` (dispatchConfirmCustomer)
  - `1707175786441865610` (deliveryConfirmAdmin)
  - `1707175786481546224` (finalDisposalReminder)
  - `1707175786495860514` (finalDisposalReminderAdmin)

## 🔍 Debug Function Output Analysis

When you run the debug function, look for these key indicators:

### ✅ Good Signs
- `config.status: "OK"`
- `hasApiKey: true`
- `hasSenderId: true`
- `hasEntityId: true`
- `templateIdValidation: "VALID_NUMERIC"`
- `apiTest.success: true`

### ❌ Bad Signs
- `config.status: "MISSING_CONFIG"`
- `templateIdValidation: "INVALID_FORMAT"`
- `apiTest.success: false`
- Error messages mentioning "Invalid Message ID" or "Entity ID mismatch"

## 🛠️ Common Fixes

### 1. Entity ID Mismatch (Most Common)
**Problem**: Templates are registered under a different Entity ID in FastSMS
**Solution**: 
- Check FastSMS dashboard for the correct Entity ID
- Update Firebase configuration: `firebase functions:config:set fastsms.entity_id="CORRECT_ENTITY_ID"`
- Redeploy functions

### 2. Template ID Issues
**Problem**: Template IDs don't match or are not properly registered
**Solution**:
- Verify template IDs in FastSMS dashboard
- Ensure all templates are approved and active
- Check that template IDs are numeric (DLT format)

### 3. Sender ID Issues
**Problem**: Sender ID not activated or incorrect
**Solution**:
- Verify `ROTCMS` is active in FastSMS account
- Check sender ID is linked to correct Entity ID

### 4. API Key Permissions
**Problem**: API key missing DLT route permissions
**Solution**:
- Generate new API key with DLT permissions
- Update Firebase configuration
- Redeploy functions

## 📋 Step-by-Step Debug Process

### Step 1: Run Configuration Debug
```bash
# Using the HTML tool (easiest)
# Open debug-sms.html in browser and click "Debug Configuration"

# Or using command line
./test-sms-debug.sh
```

### Step 2: Analyze Results
Look for the specific error message in the debug output. The debug function will tell you exactly what's wrong.

### Step 3: Fix Configuration Issues
Based on the debug output, update your Firebase configuration:
```bash
# Update Entity ID if needed
firebase functions:config:set fastsms.entity_id="CORRECT_ENTITY_ID"

# Update Sender ID if needed
firebase functions:config:set fastsms.sender_id="CORRECT_SENDER_ID"

# Update API Key if needed
firebase functions:config:set fastsms.api_key="NEW_API_KEY"
```

### Step 4: Redeploy Functions
```bash
firebase deploy --only functions
```

### Step 5: Test Again
Run the debug function again to verify fixes worked.

## 🎯 Expected Outcomes

### After Successful Fix
- Debug function shows `config.status: "OK"`
- API test shows `apiTest.success: true`
- SMS sending works without errors

### If Problems Persist
- Check FastSMS account status
- Verify template approval status
- Contact FastSMS support for Entity ID issues
- Test with a different template

## 📞 Support

If you continue to have issues:
1. Run the debug function and save the output
2. Take screenshots of your FastSMS dashboard showing template registration
3. Check Firebase logs for detailed error messages
4. Contact FastSMS support with specific error details

## 🔗 Quick Reference

### Firebase Commands
```bash
# Check current configuration
firebase functions:config:get

# Update configuration
firebase functions:config:set fastsms.api_key="YOUR_KEY"
firebase functions:config:set fastsms.sender_id="ROTCMS"
firebase functions:config:set fastsms.entity_id="1701175751242640436"

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log
```

### Debug Tools
- HTML Tool: `debug-sms.html`
- Shell Script: `test-sms-debug.sh`
- Node.js Script: `test-sms-debug.js`

### Important URLs
- FastSMS Dashboard: https://www.fast2sms.com/
- Firebase Console: https://console.firebase.google.com/
- DLT Portal: https://www.dlt.gov.in/