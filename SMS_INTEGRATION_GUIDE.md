# 📱 SMS Integration Guide - FastSMS DLT-Compliant System

## 📋 Overview

This document provides a comprehensive guide for the SMS integration using FastSMS's DLT-compliant API for the Smart Cremation Management System (SCM).

## 🏗️ Architecture

### System Components
1. **SMS Template Registry** (`src/lib/sms-templates.ts`) - DLT-approved templates with strict typing
2. **SMS Service Module** (`src/lib/sms-service.ts`) - FastSMS API integration with retry logic
3. **Firebase Functions** (`functions/src/index.ts`) - Secure callable and scheduled functions
4. **Front-end Integration** (`src/components/admin/SendSMSButton.tsx`) - Secure UI components
5. **SMS Logging** (`src/lib/sms-logs.ts`) - Comprehensive audit logging

### Data Flow
```
Front-end → Firebase Functions → SMS Service → FastSMS API → Customer Mobile
     ↓            ↓                ↓              ↓            ↓
  UI Button → Callable Function → DLT Templates → HTTP Request → SMS Delivery
```

## 🔧 Configuration

### Environment Variables
The system uses Firebase Functions environment configuration:

```bash
# Set FastSMS configuration
firebase functions:config:set \
    fastsms.api_key="YOUR_API_KEY" \
    fastsms.sender_id="YOUR_SENDER_ID" \
    fastsms.entity_id="YOUR_ENTITY_ID" \
    sms.daily_check_hour="10" \
    sms.expiry_reminder_days="3" \
    sms.timezone="Asia/Kolkata"
```

### Current Configuration
- **API Key**: `QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2`
- **Sender ID**: `ROTCMS`
- **Entity ID**: `1701175751242640436`
- **Daily Check**: 10:00 AM IST
- **Expiry Reminder**: 3 days before expiry

## 📄 DLT Templates

### Approved Templates

| Template Key | Template ID | Description | Variables |
|-------------|-------------|-------------|------------|
| `threeDayReminder` | 1707175786299400837 | 3 Days Expiry Reminder | 5 variables |
| `lastdayRenewal` | 1707175786326312933 | Last Day Renewal Reminder | 5 variables |
| `renewalConfirmCustomer` | 1707175786362862204 | Renewal Confirmation (Customer) | 5 variables |
| `renewalConfirmAdmin` | 1707175786389503209 | Renewal Confirmation (Admin) | 2 variables |
| `dispatchConfirmCustomer` | 1707175786420863806 | Dispatch Confirmation (Customer) | 7 variables |
| `deliveryConfirmAdmin` | 1707175786441865610 | Delivery Confirmation (Admin) | 2 variables |
| `finalDisposalReminder` | 1707175786481546224 | Final Disposal Reminder | 3 variables |
| `finalDisposalReminderAdmin` | 1707175786495860514 | Final Disposal Reminder (Admin) | 2 variables |

### Variable Structure

All templates use DLT-compliant variable naming:
- `{#pname#}` - Person Name or Location Name
- `{#date#}` - Date field
- `{#mobile#}` - Mobile number

Variables must be provided in the exact order approved by DLT.

## 🚀 Deployment

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase authentication: `firebase login`
3. Project access and permissions

### Deployment Steps

1. **Navigate to project directory**
   ```bash
   cd /path/to/your/project
   ```

2. **Run deployment script**
   ```bash
   chmod +x deploy-sms-functions.sh
   ./deploy-sms-functions.sh
   ```

3. **Manual deployment (alternative)**
   ```bash
   # Set environment configuration
   firebase functions:config:set fastsms.api_key="YOUR_API_KEY" fastsms.sender_id="ROTCMS" fastsms.entity_id="1701175751242640436"

   # Deploy functions
   firebase deploy --only functions:sendSMS,functions:dailyExpiryCheck,functions:retryFailedSMS,functions:getSMSStatistics,functions:smsHealthCheck
   ```

### Deployed Functions

| Function | Type | Description | Access |
|----------|------|-------------|--------|
| `sendSMS` | Callable | Send SMS securely from front-end | Authenticated users |
| `dailyExpiryCheck` | Scheduled | Daily check for expiring entries | System (10 AM IST) |
| `retryFailedSMS` | Callable | Retry failed SMS messages | Admin only |
| `getSMSStatistics` | Callable | Get SMS statistics and logs | Admin only |
| `smsHealthCheck` | HTTP | Health check endpoint | Public |

## 🧪 Testing

### 1. API Connectivity Test

```bash
# Test health check
curl https://your-region-your-project.cloudfunctions.net/smsHealthCheck

# Expected response:
{
  "status": "healthy",
  "service": "SMS Service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "details": {
    "isInitialized": true,
    "templatesCount": 8,
    "maxRetries": 3,
    "retryDelay": 5000,
    "timeout": 30000
  }
}
```

### 2. Front-end SMS Test

1. **Login as admin user**
2. **Navigate to Dashboard → Pending Ash Pots**
3. **Click "Send SMS" button on any entry**
4. **Select SMS type and send**
5. **Check success/failure status**

### 3. Daily Expiry Check Test

```bash
# Manually trigger the scheduled function
firebase functions:shell
> dailyExpiryCheck()

# Check execution logs
firebase functions:log
```

### 4. Template Validation Test

```javascript
// Test template formatting
const templates = SMSTemplatesService.getInstance();
const variables = {
  deceasedPersonName: 'Test User',
  locationName: 'Test Location',
  date: '15/01/2024',
  mobile: '9876543210'
};

const formatted = templates.formatVariablesForAPI('threeDayReminder', variables);
console.log('Formatted variables:', formatted);

// Expected: "Test User|Test Location|15/01/2024|9876543210|Test Location"
```

## 📊 Monitoring & Logging

### Firestore Collections

1. **`smsLogs`** - All SMS transactions
   ```typescript
   interface SMSLog {
     id?: string;
     type: string;           // Template key
     recipient: string;      // Mobile number
     templateId: string;     // DLT template ID
     message: string;        // Formatted message
     status: 'sent' | 'failed' | 'pending';
     errorMessage?: string;
     timestamp: Date;
     retryCount: number;
     entryId?: string;
     customerId?: string;
     locationId?: string;
     operatorId?: string;
   }
   ```

2. **`smsFunctionCalls`** - Function call audit log
3. **`smsExecutionLogs`** - Scheduled execution results

### Monitoring Commands

```bash
# View real-time logs
firebase functions:log --follow

# Filter by function
firebase functions:log --only sendSMS

# View recent logs
firebase functions:log --limit 50
```

### Key Metrics to Monitor

- **SMS Success Rate**: Should be >95%
- **Retry Attempts**: Should be minimal (<5% of total)
- **Daily Check Execution**: Should run successfully every day
- **API Response Time**: Should be <5 seconds

## 🔒 Security

### Authentication & Authorization

1. **User Authentication**: All functions require Firebase authentication
2. **Role-based Access**:
   - **Admin**: Full access to all SMS functions
   - **Operator**: Limited to assigned locations only
   - **Public**: Only health check endpoint

### Data Protection

1. **API Keys**: Stored in Firebase environment configuration
2. **Mobile Numbers**: Partially logged for privacy
3. **Audit Trail**: All SMS operations logged with user context
4. **DLT Compliance**: All templates approved and variables validated

### Rate Limiting

- **Per User**: No explicit limit (business requirement)
- **Per Function**: Firebase Functions default quotas apply
- **Retry Logic**: Maximum 3 attempts with 5-second delay

## 🚨 Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check FastSMS API key configuration
   - Verify mobile number format (10 digits, starting with 6-9)
   - Check template variable validation
   - Review function logs for errors

2. **Daily Check Not Running**
   - Verify scheduled function deployment
   - Check timezone configuration (Asia/Kolkata)
   - Review execution logs for errors

3. **Front-end SMS Button Not Working**
   - Check user authentication status
   - Verify user role and permissions
   - Check browser console for JavaScript errors
   - Verify Firebase Functions initialization

4. **Template Validation Errors**
   - Verify variable order matches DLT approval
   - Check all required variables are provided
   - Validate date format (DD/MM/YYYY)
   - Verify mobile number format

### Debug Commands

```bash
# Check function configuration
firebase functions:config:get

# Test function locally
firebase functions:shell
> sendSMS({templateKey: 'threeDayReminder', recipient: '9876543210', variables: {...}})

# View specific log entries
firebase functions:log --filter "sendSMS"
```

## 🔄 Maintenance

### Regular Tasks

1. **Monthly**: Review SMS success rates and failed deliveries
2. **Quarterly**: Update DLT templates if needed
3. **Annually**: Review and rotate API keys if required

### Configuration Updates

```bash
# Update API key
firebase functions:config:set fastsms.api_key="NEW_API_KEY"

# Update timing
firebase functions:config:set sms.daily_check_hour="9"

# View current configuration
firebase functions:config:get
```

### Redeployment

```bash
# Redeploy all functions
firebase deploy --only functions

# Redeploy specific function
firebase deploy --only functions:sendSMS
```

## 📞 Support

### Emergency Contacts

- **FastSMS Support**: Contact through FastSMS dashboard
- **Firebase Support**: https://firebase.google.com/support
- **DLT Support**: Your telecom regulatory body

### Documentation Updates

- **Template Changes**: Update `src/lib/sms-templates.ts`
- **API Changes**: Update `src/lib/sms-service.ts`
- **Function Changes**: Update `functions/src/index.ts`

---

## 📋 Checklist

### Pre-deployment Checklist
- [ ] Firebase CLI installed and authenticated
- [ ] FastSMS API credentials verified
- [ ] DLT templates approved and configured
- [ ] Test environment prepared
- [ ] Backup of existing configuration

### Post-deployment Checklist
- [ ] Functions deployed successfully
- [ ] Environment configuration set
- [ ] Health check endpoint responding
- [ ] Test SMS sent successfully
- [ ] Daily expiry check scheduled
- [ ] Monitoring and logging active
- [ ] Documentation updated

### Production Monitoring Checklist
- [ ] SMS success rate monitoring
- [ ] Failed SMS alerting setup
- [ ] Daily execution verification
- [ ] User access review
- [ ] API usage monitoring
- [ ] Cost optimization review

---

**Note**: This SMS integration is DLT-compliant and follows all regulatory requirements for commercial SMS in India. Ensure all template changes are approved by your DLT provider before deployment.