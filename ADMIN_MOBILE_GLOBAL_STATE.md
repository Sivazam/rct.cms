# Admin Mobile Number Global State Management

This document explains the new global state management system for the admin mobile number in the frontend.

## Overview

Previously, the admin mobile number was hardcoded in multiple frontend components, leading to inconsistent behavior and maintenance issues. Now, we have implemented a centralized global state management system using Zustand.

## Architecture

### 1. Zustand Store (`src/stores/adminConfigStore.ts`)

The core of the system is a Zustand store that manages the admin mobile number configuration:

- **State**: `adminMobile` - stores the current admin mobile number
- **Actions**: 
  - `setAdminMobile(mobile: string)` - updates the admin mobile number
  - `resetToDefault()` - resets to the default admin mobile number
  - `isValidAdminMobile()` - validates the mobile number format
- **Persistence**: The admin mobile number is persisted in localStorage using Zustand's persist middleware

### 2. Admin Settings Component (`src/components/admin/AdminSettings.tsx`)

A user-friendly interface for managing the admin mobile number:

- **Features**:
  - Input field for admin mobile number
  - Real-time validation for Indian mobile numbers
  - Update and reset buttons
  - Toast notifications for user feedback
- **Validation**: Ensures mobile numbers follow the format `+91XXXXXXXXXX`

### 3. Integration with Admin Dashboard

The AdminSettings component is integrated into the admin dashboard under the "Settings" tab, providing easy access for administrators.

## Usage

### 1. Using the Global State in Components

```tsx
import { useAdminMobile } from '@/stores/adminConfigStore';

function MyComponent() {
  const { adminMobile, setAdminMobile, isValidAdminMobile } = useAdminMobile();
  
  // Get the current admin mobile number
  console.log('Current admin mobile:', adminMobile);
  
  // Update the admin mobile number
  const handleUpdate = (newMobile: string) => {
    if (isValidAdminMobile()) {
      setAdminMobile(newMobile);
    }
  };
}
```

### 2. Using in SMS Service

The SMS service has been updated to use the global state:

```tsx
// In sms-service.ts
import { useAdminMobile } from '@/stores/adminConfigStore';

class SMSService {
  async sendAdminNotification() {
    const { adminMobile } = useAdminMobile.getState();
    
    // Use adminMobile instead of hardcoded value
    return await this.sendSMSWithRetry({
      recipient: adminMobile,
      // ... other parameters
    });
  }
}
```

### 3. Using in React Components

```tsx
// In React components
import { useAdminMobile } from '@/stores/adminConfigStore';

function RenewalForm() {
  const adminMobile = useAdminMobile();
  
  const handleRenewal = async () => {
    const smsService = SMSService.getInstance();
    
    // Send SMS to admin using global config
    await smsService.sendRenewalConfirmationAdmin(
      adminMobile, // Uses global admin mobile
      // ... other parameters
    );
  };
}
```

## Benefits

1. **Centralized Configuration**: Admin mobile number is managed in one place
2. **Consistency**: All components use the same admin mobile number
3. **Dynamic Updates**: Admin mobile number can be updated without code changes
4. **Persistence**: Configuration is saved and persists across browser sessions
5. **Validation**: Built-in validation ensures correct mobile number format
6. **User-Friendly**: Easy-to-use interface for administrators

## Migration from Hardcoded Values

### Before:
```tsx
// Hardcoded in multiple files
const adminSMSResult = await smsService.sendRenewalConfirmationAdmin(
  '+919014882779', // Hardcoded admin mobile
  locationName,
  customerName,
  entry.id
);
```

### After:
```tsx
// Using global state
const { adminMobile } = useAdminMobile();
const adminSMSResult = await smsService.sendRenewalConfirmationAdmin(
  adminMobile, // From global state
  locationName,
  customerName,
  entry.id
);
```

## Files Updated

1. **New Files**:
   - `src/stores/adminConfigStore.ts` - Zustand store
   - `src/components/admin/AdminSettings.tsx` - Admin settings component

2. **Modified Files**:
   - `src/lib/sms-service.ts` - Updated to use global state
   - `src/components/dashboard/InteractiveEntriesList.tsx` - Updated to use global state
   - `src/components/renewals/RenewalForm.tsx` - Updated to use global state
   - `src/app/dashboard/admin/page.tsx` - Added AdminSettings to settings tab

## Default Configuration

The default admin mobile number is set to `+919014882779`, which should match the Firebase Functions configuration. This can be changed in the store or through the admin interface.

## Validation

The system validates mobile numbers using the regex pattern: `^\+91[6-9]\d{9}$`

This ensures:
- Starts with `+91` (Indian country code)
- Followed by a digit between 6-9 (valid Indian mobile prefix)
- Followed by 9 more digits
- Total length of 13 characters

## Error Handling

The system includes proper error handling:
- Invalid mobile numbers are rejected with user feedback
- SMS operations fail gracefully if the admin mobile is invalid
- Toast notifications provide clear feedback to users

## Future Enhancements

Potential future improvements:
1. **Multiple Admin Numbers**: Support for multiple admin mobile numbers
2. **Role-Based Configuration**: Different mobile numbers for different roles
3. **Environment-Based Defaults**: Different defaults for development/production
4. **Audit Logging**: Track changes to admin mobile configuration
5. **API Integration**: Sync with backend configuration