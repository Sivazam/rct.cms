# 🔧 Firebase Functions v4.9 Deployment Fix

## Current Issues:
1. Node.js version mismatch (package.json requires 22, you have 20.19.5)
2. package-lock.json has firebase-functions@7.0.1 but package.json wants 4.9.0
3. Missing @types/express dependency

## ✅ Fixed Files:
I've already updated `/functions/package.json` with:
- Node.js engine: "20" (to match your environment)
- firebase-functions: "4.9.0" (exact version you want)
- Added @types/express: "4.17.3" (missing dependency)

## 🚀 Deployment Steps:

### Option 1: Manual Commands (Recommended)
```bash
cd functions
rm -f package-lock.json
npm install
npm run build
firebase deploy --only functions:testExpiryReminders --project rctscm01
```

### Option 2: Use the script I created
```bash
cd /home/z/my-project
./fix-and-deploy.sh
```

### Option 3: Deploy all functions (if needed)
```bash
cd functions
rm -f package-lock.json  
npm install
npm run build
firebase deploy --only functions --project rctscm01
```

## 🎯 After Deployment:
Once `testExpiryReminders` is deployed, go to Admin Settings page and click "Test Reminders" button.

The function will:
- ✅ Find customers expiring in 3 days
- ✅ Find customers expiring today  
- ✅ Find customers expired 60+ days ago
- ✅ Send SMS notifications to customers and admin
- ✅ Show detailed results with counts

## 🔍 If You Still Get Errors:
1. Make sure you're logged into Firebase: `firebase login`
2. Check project access: `firebase projects:list`
3. Verify Node.js version: `node --version` (should be 20.x)

The TypeScript compilation errors are now fixed and the function should deploy successfully!