# 🚀 Cloud Functions Deployment Guide

## 📋 Prerequisites
1. ✅ Firebase CLI installed (v14.17.0)
2. ✅ Firebase project configured
3. ✅ Functions code updated with partial dispatch templates
4. ✅ All fixes applied (pricing, pot calculations, etc.)

## 🔧 Deployment Steps

### Option 1: Quick Deploy (Recommended)
```bash
# From project root directory
cd /home/z/my-project

# Run the deployment script
./deploy-functions.sh
```

### Option 2: Manual Deploy
```bash
# Navigate to functions directory
cd /home/z/my-project/functions

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Deploy to Firebase
npx firebase deploy --only functions
```

### Option 3: Step-by-Step
```bash
# 1. Login to Firebase (if not already logged in)
npx firebase login

# 2. Check current project
npx firebase projects:list

# 3. Switch to correct project if needed
npx firebase use your-project-id

# 4. Deploy functions only
npx firebase deploy --only functions
```

## 📊 What's Being Deployed

### 🆕 New Partial Dispatch Templates
- **Template ID 205257**: Partial Dispatch Customer (8 variables)
- **Template ID 205258**: Partial Dispatch Admin (4 variables)
- **Trigger**: Firestore `onDispatchedLockerCreated`

### 🔧 Existing Templates (Unchanged)
- **Template ID 198611**: Full Dispatch Customer
- **Template ID 198612**: Full Dispatch Admin
- **Template ID 198607-198614**: Renewal & Disposal reminders

## 🎯 Key Features Deployed

### ✅ Smart Dispatch Logic
- Partial dispatch SMS sent when `totalRemainingPots > 0`
- Full dispatch SMS sent when `totalRemainingPots === 0`
- Triple redundancy (API + Firestore trigger + Manual)

### ✅ Correct Variable Mappings
- Uses `deceasedPersonName` with fallback to `customerName`
- Proper date formatting (DD/MM/YYYY)
- Admin mobile number integration

### ✅ Fixed Pricing
- Entry fee: ₹500 per entry (fixed)
- Renewal fee: ₹300 per month (fixed)
- No per-pot multiplication

## 🔍 Post-Deployment Verification

### 1. Check Deployment Status
```bash
npx firebase functions:list
```

### 2. Monitor Logs
```bash
# Real-time logs
npx firebase functions:log

# Specific function logs
npx firebase functions:log --only onDispatchedLockerCreated
```

### 3. Test in Firebase Console
1. Go to: https://console.firebase.google.com/
2. Navigate to Functions → Logs
3. Look for successful deployment
4. Test partial dispatch from frontend

### 4. Verify SMS Templates
1. Go to Firebase Console → Functions
2. Check `sendSMSV2` function logs
3. Verify template IDs: 205257, 205258
4. Check for any Fast2SMS API errors

## 🚨 Common Issues & Solutions

### Issue: "FUNCTIONS_CONTAINER_CPU_TIMEOUT"
**Solution**: Function is taking too long, check Fast2SMS API response time

### Issue: "PERMISSION_DENIED"
**Solution**: Check Firebase Functions IAM permissions

### Issue: "Fast2SMS API errors"
**Solution**: 
1. Verify API key in Firebase config
2. Check template IDs are correct
3. Verify sender ID is approved

## 📱 Testing Checklist

### ✅ Partial Dispatch Test
- [ ] Create test entry with 5 pots
- [ ] Dispatch 2 pots (should send partial dispatch SMS)
- [ ] Verify remaining pots shows 3
- [ ] Check SMS logs for successful delivery

### ✅ Full Dispatch Test  
- [ ] Dispatch remaining 3 pots (should send full dispatch SMS)
- [ ] Verify remaining pots shows 0
- [ ] Check SMS logs for full dispatch templates

### ✅ Error Handling
- [ ] Test with invalid mobile number
- [ ] Test with missing fields
- [ ] Verify fallback mechanisms work

## 🔄 Continuous Deployment

For production, consider setting up CI/CD:
```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Functions
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: w9jds/firebase-action@v1.0
        with:
          args: deploy --only functions
```

## 📞 Support

If you encounter any issues:
1. Check Firebase Console logs
2. Verify environment variables
3. Test templates individually
4. Check Fast2SMS dashboard

## 🎉 Success Indicators

✅ **Deployment Successful**: 
- "functions[onDispatchedLockerCreated]" is up-to-date
- No error messages in deployment output
- Can see functions in Firebase Console

✅ **SMS Working**:
- Partial dispatch SMS sent correctly
- Full dispatch SMS sent correctly  
- Variables populated correctly
- No Fast2SMS API errors

---

**Ready to deploy! Run `./deploy-functions.sh` to get started.**