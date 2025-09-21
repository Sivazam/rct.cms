# Firebase Configuration Setup

This document explains how to configure the Firebase functions with the required settings for SMS functionality.

## Required Configuration

### 1. FastSMS Configuration

The FastSMS configuration is already set up in the Firebase functions. You need to configure these environment variables:

```bash
# Set FastSMS API configuration
firebase functions:config:set fastsms.api_key="QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2"
firebase functions:config:set fastsms.sender_id="ROTCMS"
firebase functions:config:set fastsms.entity_id="1701175751242640436"
```

### 2. Admin Configuration

Add the admin mobile number to Firebase configuration:

```bash
# Set admin mobile number
firebase functions:config:set admin.mobile="+919014882779"
```

## Complete Configuration Script

Run all these commands to configure the Firebase functions:

```bash
# FastSMS Configuration
firebase functions:config:set fastsms.api_key="QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2"

firebase functions:config:set fastsms.sender_id="ROTCMS"

firebase functions:config:set fastsms.entity_id="1701175751242640436"

# Admin Configuration
firebase functions:config:set admin.mobile="+919014882779"

# Verify configuration
firebase functions:config:get
```

## Deploy the Functions

After configuring, deploy the functions:

```bash
firebase deploy --only functions
```

## SMS Functionality

The system now sends SMS to both admin and customer for the following events:

### 1. Daily Expiry Checks (Scheduled Functions)

- **3 Days Before Expiry**: Sends `threeDayReminder` to customer and `finalDisposalReminderAdmin` to admin
- **Last Day of Expiry**: Sends `lastdayRenewal` to customer and `finalDisposalReminderAdmin` to admin  
- **60 Days After Expiry**: Sends `finalDisposalReminder` to customer and `finalDisposalReminderAdmin` to admin

### 2. New Entry Confirmations (When records are created)

- **Renewal Confirmation**: Sends `renewalConfirmCustomer` to customer and `renewalConfirmAdmin` to admin
- **Dispatch Confirmation**: Sends `dispatchConfirmCustomer` to customer and `deliveryConfirmAdmin` to admin

### 3. Template Mapping

The system uses the following Fast2SMS template IDs:

| Template Key | Fast2SMS Message ID | Description |
|-------------|-------------------|-------------|
| threeDayReminder | 198607 | 3 days before expiry reminder |
| lastdayRenewal | 198608 | Last day renewal reminder |
| renewalConfirmCustomer | 198609 | Renewal confirmation to customer |
| renewalConfirmAdmin | 198610 | Renewal confirmation to admin |
| dispatchConfirmCustomer | 198611 | Dispatch confirmation to customer |
| deliveryConfirmAdmin | 198612 | Delivery confirmation to admin |
| finalDisposalReminder | 198613 | Final disposal reminder to customer |
| finalDisposalReminderAdmin | 198614 | Final disposal reminder to admin |

## Testing the SMS Functionality

You can test the SMS functionality using the SendSMSButton component in the admin interface, which is designed for testing purposes.

## Troubleshooting

If SMS are not being sent:

1. Check Firebase configuration: `firebase functions:config:get`
2. Verify FastSMS credentials are correct
3. Check template IDs are valid and active
4. Ensure admin mobile number is properly configured
5. Check Firebase function logs for errors

## Security Notes

- All SMS templates use DLT-compliant format
- Mobile numbers are validated and cleaned before sending
- All SMS sends are logged to Firestore for audit purposes
- Admin mobile number is securely stored in Firebase config