# SMS Template Configuration Guide

## 🚨 **IMPORTANT: Template Configuration Required**

The SMS system is currently using **placeholder template IDs** that are **NOT VALID** for your FastSMS account. You need to configure your actual DLT-approved template IDs.

## 🔧 **Current Issue**

**Error Message:** `FastSMS API Error: Invalid Message ID (or Template, Entity ID)`

**Root Cause:** The template IDs in `/functions/lib/sms-templates.ts` are sample IDs and must be replaced with your actual DLT-approved template IDs.

## 📝 **Steps to Fix**

### 1. **Get Your Actual DLT Template IDs**

You need to obtain the real template IDs from your FastSMS account. These are the DLT-approved template IDs that you registered.

### 2. **Update the Template Configuration**

Edit `/functions/lib/sms-templates.ts` and replace the placeholder template IDs with your actual ones:

```typescript
// Replace these placeholder IDs with your actual DLT template IDs
export const TEMPLATE_IDS = {
  threeDayReminder: 'YOUR_ACTUAL_3_DAY_REMINDER_TEMPLATE_ID',
  lastdayRenewal: 'YOUR_ACTUAL_LAST_DAY_RENEWAL_TEMPLATE_ID',
  renewalConfirmCustomer: 'YOUR_ACTUAL_RENEWAL_CONFIRM_CUSTOMER_TEMPLATE_ID',
  renewalConfirmAdmin: 'YOUR_ACTUAL_RENEWAL_CONFIRM_ADMIN_TEMPLATE_ID',
  dispatchConfirmCustomer: 'YOUR_ACTUAL_DISPATCH_CONFIRM_CUSTOMER_TEMPLATE_ID',
  deliveryConfirmAdmin: 'YOUR_ACTUAL_DELIVERY_CONFIRM_ADMIN_TEMPLATE_ID',
  finalDisposalReminder: 'YOUR_ACTUAL_FINAL_DISPOSAL_REMINDER_TEMPLATE_ID',
  finalDisposalReminderAdmin: 'YOUR_ACTUAL_FINAL_DISPOSAL_REMINDER_ADMIN_TEMPLATE_ID',
} as const;
```

### 3. **Template Variable Mapping**

Ensure your DLT templates have the correct variable structure. The system expects these variables:

#### **3-Day Reminder Template**
- **Variables:** `{#var#} {#var#} {#var#} {#var#} {#var#}`
- **Order:** Deceased Name, Location Name, Expiry Date, Mobile Number, Location Name (signature)

#### **Last Day Renewal Template**
- **Variables:** `{#var#} {#var#} {#var#} {#var#} {#var#}`
- **Order:** Deceased Name, Location Name, Expiry Date, Mobile Number, Location Name (signature)

#### **Renewal Confirmation (Customer)**
- **Variables:** `{#var#} {#var#} {#var#} {#var#} {#var#}`
- **Order:** Deceased Name, Location Name, Extended Expiry Date, Mobile Number, Location Name (signature)

#### **Renewal Confirmation (Admin)**
- **Variables:** `{#var#} {#var#}`
- **Order:** Location Name, Deceased Name

#### **Dispatch Confirmation (Customer)**
- **Variables:** `{#var#} {#var#} {#var#} {#var#} {#var#} {#var#} {#var#}`
- **Order:** Deceased Name, Location Name, Delivery Date, Contact Person Name, Contact Mobile, Admin Mobile, Location Name (signature)

#### **Delivery Confirmation (Admin)**
- **Variables:** `{#var#} {#var#}`
- **Order:** Deceased Name, Location Name

#### **Final Disposal Reminder**
- **Variables:** `{#var#} {#var#} {#var#}`
- **Order:** Deceased Name, Location Name, Location Name (signature)

#### **Final Disposal Reminder (Admin)**
- **Variables:** `{#var#} {#var#}`
- **Order:** Location Name, Deceased Name

### 4. **Redeploy Functions**

After updating the template IDs, redeploy your Firebase Functions:

```bash
cd /path/to/your/project/functions
npm run build
firebase deploy --only functions
```

### 5. **Test the SMS System**

After deployment, test the SMS system again. The error should be resolved if:
- Template IDs are correct
- Entity ID is configured properly
- Sender ID is valid

## 🔍 **Debugging Steps**

If you still get errors after updating template IDs:

### 1. **Check FastSMS Configuration**
```bash
firebase functions:config:get
```

Ensure you have:
- `fastsms.api_key`
- `fastsms.sender_id`
- `fastsms.entity_id`

### 2. **Test Individual Templates**
Use the Firebase Console to test individual templates with the FastSMS API directly.

### 3. **Check Template Status**
Ensure your templates are:
- ✅ Approved by DLT
- ✅ Active in FastSMS account
- ✅ Correctly mapped to your Entity ID

### 4. **Verify Mobile Number Format**
Ensure mobile numbers are in the correct format:
- ✅ `919876543210` (without + or spaces)
- ✅ Starts with 91 (India country code)
- ✅ 12 digits total

## 📞 **FastSMS Support**

If you need help:
1. **FastSMS Dashboard:** https://www.fast2sms.com/
2. **DLT Template Registration:** Ensure templates are registered under your Entity ID
3. **API Documentation:** https://www.fast2sms.com/dev/bulkV2

## 🚀 **Quick Fix Template**

Here's a temporary fix for testing - replace with your actual template IDs:

```typescript
// Example - REPLACE WITH YOUR ACTUAL TEMPLATE IDs
export const TEMPLATE_IDS = {
  threeDayReminder: '1707160000000000001', // Replace with your actual ID
  lastdayRenewal: '1707160000000000002',   // Replace with your actual ID
  renewalConfirmCustomer: '1707160000000000003', // Replace with your actual ID
  renewalConfirmAdmin: '1707160000000000004',    // Replace with your actual ID
  dispatchConfirmCustomer: '1707160000000000005', // Replace with your actual ID
  deliveryConfirmAdmin: '1707160000000000006',   // Replace with your actual ID
  finalDisposalReminder: '1707160000000000007',  // Replace with your actual ID
  finalDisposalReminderAdmin: '1707160000000000008', // Replace with your actual ID
} as const;
```

---

**⚠️ IMPORTANT:** Do not use the example template IDs above. They are just for format reference. You MUST use your actual DLT-approved template IDs from your FastSMS account.