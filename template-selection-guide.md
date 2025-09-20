# 🎯 FastSMS Template Selection Guide

## 📋 How to Identify Which Template to Use

### 📊 Template Overview

| Template Name | Message ID | Purpose | Variables | Use Case |
|---------------|------------|---------|-----------|----------|
| Three Day Reminder | 198607 | Reminder before disposal | 5 variables | 3 days before deadline |
| Last Day Renewal | 198608 | Final renewal reminder | 5 variables | Last day for renewal |
| Renewal Confirm Customer | 198609 | Confirm renewal to customer | 5 variables | After successful renewal |
| Renewal Confirm Admin | 198610 | Notify admin about renewal | 2 variables | After renewal (admin) |
| Dispatch Confirm Customer | 198611 | Confirm dispatch to customer | 7 variables | When items are dispatched |
| Delivery Confirm Admin | 198612 | Confirm delivery to admin | 2 variables | When items are delivered |
| Final Disposal Reminder Admin | 198613 | Final disposal warning | 3 variables | Before final disposal |

## 🔍 Detailed Template Guide

### 1. **Three Day Reminder** (Message ID: 198607)
```
Purpose: Send reminder 3 days before disposal deadline
When to use: When an item's renewal period is ending in 3 days
Variables: [Deceased Name, Locker Number, Expiry Date, Contact Number, Contact Person]
Example: "నమస్తే, దివంగత రాముడు గారి అస్థికలు లాకర్-1 లో ఉంచారు. 2025-09-25 న గడువు ముగుస్తున్నందున..."
```

### 2. **Last Day Renewal** (Message ID: 198608)
```
Purpose: Final reminder on the last day for renewal
When to use: Today is the final day for renewal
Variables: [Deceased Name, Locker Number, Expiry Date, Contact Number, Contact Person]
Example: "నమస్తే, దివంగత రాముడు గారి అస్థికలు లాకర్-1 లో ఉంచారు. ఈ రోజు 2025-09-25 న గడువు ముగుస్తున్నందున..."
```

### 3. **Renewal Confirm Customer** (Message ID: 198609)
```
Purpose: Confirm successful renewal to customer
When to use: After customer has renewed the storage period
Variables: [Deceased Name, Locker Number, Extended Date, Contact Number, Contact Person]
Example: "ధన్యవాదాలు, దివంగత రాముడు గారి అస్థికలు లాకర్-1 లో ఉంచి ఉన్నాయి. ఇవి 2025-12-25 వరకు స్టోరేజ్ టైమ్ పొడిగించబడ్డాయి..."
```

### 4. **Renewal Confirm Admin** (Message ID: 198610)
```
Purpose: Notify admin about renewal
When to use: After renewal is processed (internal notification)
Variables: [Locker Number, Deceased Name]
Example: "లాకర్-1 లాకర్‌లో, దివంగత రాముడు గారి అస్థికలు పొడిగించబడ్డాయి - ROTCMS"
```

### 5. **Dispatch Confirm Customer** (Message ID: 198611)
```
Purpose: Confirm dispatch to customer
When to use: When remains are being dispatched to family
Variables: [Deceased Name, Source Locker, Date, Recipient Name, Recipient Mobile, Contact Number, Contact Person]
Example: "నమస్తే, దివంగత రాముడు గారి అస్థికలు లాకర్-1 నుండి 2025-09-25 న సీత గారికి (మొబైల్: 919876543210) హ్యాండోవర్ చేయబడినాయి..."
```

### 6. **Delivery Confirm Admin** (Message ID: 198612)
```
Purpose: Confirm delivery to admin
When to use: When remains have been delivered to family
Variables: [Deceased Name, Locker Number]
Example: "దివంగత రాముడు గారి అస్థికలు లాకర్-1 నుండి వారి కుటుంబానికి హ్యాండోవర్ చేయబడ్డాయి - ROTCMS"
```

### 7. **Final Disposal Reminder Admin** (Message ID: 198613)
```
Purpose: Final warning before disposal
When to use: When no response after multiple reminders (admin only)
Variables: [Deceased Name, Locker Number, Contact Person]
Example: "నమస్తే, దివంగత రాముడు గారి అస్థికలు లాకర్-1 లో 2 నెలలుగా రిన్యువల్ చేయబడలేదు..."
```

## 🔄 Decision Flow: Which Template to Use?

### Step 1: Identify the Scenario
- **Renewal Reminder?** → Go to Step 2
- **Renewal Confirmation?** → Go to Step 3
- **Dispatch/Delivery?** → Go to Step 4
- **Final Disposal?** → Go to Step 5

### Step 2: Renewal Reminder
- **3 days before deadline?** → Use `threeDayReminder` (198607)
- **Last day for renewal?** → Use `lastdayRenewal` (198608)

### Step 3: Renewal Confirmation
- **Notify customer?** → Use `renewalConfirmCustomer` (198609)
- **Notify admin?** → Use `renewalConfirmAdmin` (198610)

### Step 4: Dispatch/Delivery
- **Confirming dispatch to customer?** → Use `dispatchConfirmCustomer` (198611)
- **Confirming delivery to admin?** → Use `deliveryConfirmAdmin` (198612)

### Step 5: Final Disposal
- **Final warning to admin?** → Use `finalDisposalReminderAdmin` (198613)

## 💡 Implementation Tips

### 1. **Variable Mapping**
Always map variables in the correct order:
```javascript
// Example for threeDayReminder
const variables = [
    deceasedName,      // {#var#}
    lockerNumber,      // {#var#}
    expiryDate,        // {#var#}
    contactNumber,     // {#var#}
    contactPerson      // {#var#}
];
```

### 2. **Language Setting**
All templates are in Telugu, so set:
```javascript
language: 'telugu'
```

### 3. **Template ID Usage**
Use the `message_id` from Fast2SMS (not the DLT template ID):
```javascript
template_id: '198607'  // Use Fast2SMS message ID
```

### 4. **Error Handling**
Always check the number of variables matches the template requirements:
```javascript
if (variables.length !== template.variable_count) {
    throw new Error(`Template ${templateName} requires ${template.variable_count} variables`);
}
```

## 🚀 Quick Reference

```javascript
// Template mapping for Firebase Functions
const templateIds = {
    threeDayReminder: "198607",
    lastdayRenewal: "198608",
    renewalConfirmCustomer: "198609",
    renewalConfirmAdmin: "198610",
    dispatchConfirmCustomer: "198611",
    deliveryConfirmAdmin: "198612",
    finalDisposalReminderAdmin: "198613"
};
```

This guide should help you select the right template for each scenario in your RCT CMS application!