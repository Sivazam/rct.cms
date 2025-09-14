# 🧪 SMS Integration Test Procedures

## 📋 Test Overview

This document provides comprehensive test procedures for validating the SMS integration system using FastSMS DLT-compliant API.

## 🎯 Test Objectives

1. **Functionality**: Verify all SMS features work as expected
2. **Reliability**: Ensure SMS delivery with retry mechanisms
3. **Security**: Validate authentication and authorization
4. **Compliance**: Verify DLT template compliance
5. **Performance**: Test response times and error handling

## 📝 Test Environment

### Prerequisites
- Firebase project with functions deployed
- Test mobile numbers (real numbers for actual SMS testing)
- Admin and operator user accounts
- Access to Firestore for log verification
- FastSMS API credentials configured

### Test Data
```javascript
const testData = {
  customer: {
    name: 'Test Customer',
    mobile: '9876543210', // Replace with actual test number
    city: 'Test City'
  },
  location: {
    name: 'Test Location',
    id: 'test-location-id',
    contactNumber: '9876543210'
  },
  entry: {
    id: 'test-entry-id',
    customerId: 'test-customer-id',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'active'
  }
};
```

## 🧪 Test Cases

### 1. SMS Template Registry Tests

#### 1.1 Template Validation Test
**Objective**: Verify all DLT templates are properly configured

```javascript
// Test Code
const templates = SMSTemplatesService.getInstance();

// Test 1: Get all templates
const allTemplates = templates.getAllTemplates();
console.log('Total templates:', allTemplates.length);
assert(allTemplates.length === 8, 'Should have 8 templates');

// Test 2: Get template by key
const template = templates.getTemplateByKey('threeDayReminder');
assert(template !== undefined, 'Template should exist');
assert(template.variableCount === 5, 'Should have 5 variables');

// Test 3: Variable validation
const variables = {
  deceasedPersonName: 'Test User',
  locationName: 'Test Location',
  date: '15/01/2024',
  mobile: '9876543210'
};

const validation = templates.validateTemplateVariables('threeDayReminder', variables);
assert(validation.isValid === true, 'Variables should be valid');

// Test 4: Variable formatting
const formatted = templates.formatVariablesForAPI('threeDayReminder', variables);
console.log('Formatted:', formatted);
assert(formatted === 'Test User|Test Location|15/01/2024|9876543210|Test Location', 'Format should match DLT requirements');
```

**Expected Results**:
- ✅ All 8 templates loaded successfully
- ✅ Template validation passes with correct variables
- ✅ Variable formatting matches DLT requirements
- ✅ Error handling for invalid variables

#### 1.2 Template Coverage Test
**Objective**: Verify all required templates are available

```javascript
const requiredTemplates = [
  'threeDayReminder',
  'lastdayRenewal', 
  'renewalConfirmCustomer',
  'renewalConfirmAdmin',
  'dispatchConfirmCustomer',
  'deliveryConfirmAdmin',
  'finalDisposalReminder',
  'finalDisposalReminderAdmin'
];

requiredTemplates.forEach(templateKey => {
  const template = templates.getTemplateByKey(templateKey);
  assert(template !== undefined, `Template ${templateKey} should exist`);
  assert(template.isActive === true, `Template ${templateKey} should be active`);
});
```

### 2. SMS Service Tests

#### 2.1 Service Initialization Test
**Objective**: Verify SMS service initializes correctly

```javascript
// Test Code
const smsService = SMSService.getInstance();

// Test 1: Initialize service
try {
  smsService.initialize();
  console.log('Service initialized successfully');
} catch (error) {
  console.error('Service initialization failed:', error);
}

// Test 2: Get service status
const status = smsService.getServiceStatus();
console.log('Service status:', status);
assert(status.isInitialized === true, 'Service should be initialized');
assert(status.templatesCount === 8, 'Should have 8 templates');
```

**Expected Results**:
- ✅ Service initializes without errors
- ✅ Service status shows healthy state
- ✅ All templates are loaded

#### 2.2 SMS Sending Test
**Objective**: Test actual SMS sending via FastSMS API

```javascript
// Test Code - 3 Day Reminder
const result = await smsService.sendThreeDayReminder(
  '9876543210', // Test mobile number
  'Test Customer',
  'Test Location',
  '15/01/2024',
  '9876543210', // Admin mobile
  'test-entry-id',
  'test-customer-id',
  'test-location-id'
);

console.log('SMS Result:', result);
assert(result.success === true, 'SMS should send successfully');
assert(result.messageId !== undefined, 'Should have message ID');
```

**Expected Results**:
- ✅ SMS sent successfully to test number
- ✅ Message ID received from FastSMS
- ✅ Success logged in Firestore
- ✅ Retry mechanism works on failures

#### 2.3 Error Handling Test
**Objective**: Test error handling for invalid inputs

```javascript
// Test 1: Invalid mobile number
try {
  await smsService.sendThreeDayReminder(
    '123', // Invalid mobile
    'Test Customer',
    'Test Location',
    '15/01/2024',
    '9876543210'
  );
  assert(false, 'Should throw error for invalid mobile');
} catch (error) {
  console.log('Correctly caught invalid mobile error:', error.message);
}

// Test 2: Missing required variables
try {
  await smsService.sendThreeDayReminder(
    '9876543210',
    '', // Missing customer name
    'Test Location',
    '15/01/2024',
    '9876543210'
  );
  assert(false, 'Should throw error for missing variables');
} catch (error) {
  console.log('Correctly caught missing variables error:', error.message);
}
```

### 3. Firebase Functions Tests

#### 3.1 Health Check Test
**Objective**: Verify health check endpoint works

```bash
# Test Command
curl -X GET https://your-region-your-project.cloudfunctions.net/smsHealthCheck

# Expected Response
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

**Expected Results**:
- ✅ HTTP 200 response
- ✅ Status shows "healthy"
- ✅ Service details are correct

#### 3.2 Send SMS Function Test
**Objective**: Test callable function from front-end

```javascript
// Test Code (in browser console or testing framework)
const sendSMS = httpsCallable(functions, 'sendSMS');

const testData = {
  templateKey: 'threeDayReminder',
  recipient: '9876543210',
  variables: {
    deceasedPersonName: 'Test Customer',
    locationName: 'Test Location',
    date: '15/01/2024',
    mobile: '9876543210'
  },
  entryId: 'test-entry-id',
  customerId: 'test-customer-id',
  locationId: 'test-location-id'
};

try {
  const result = await sendSMS(testData);
  console.log('Function result:', result.data);
  
  assert(result.data.success === true, 'Function should succeed');
  assert(result.data.messageId !== undefined, 'Should have message ID');
  
} catch (error) {
  console.error('Function call failed:', error);
}
```

**Expected Results**:
- ✅ Function executes successfully
- ✅ SMS sent to recipient
- ✅ Proper authorization check
- ✅ Audit log created

#### 3.3 Authorization Tests
**Objective**: Test role-based access control

```javascript
// Test 1: Unauthenticated user
try {
  const result = await sendSMS(testData); // Without auth context
  assert(false, 'Should fail for unauthenticated user');
} catch (error) {
  assert(error.message.includes('unauthenticated'), 'Should require authentication');
}

// Test 2: Operator accessing admin-only template
const adminTemplateData = {
  ...testData,
  templateKey: 'renewalConfirmAdmin' // Admin-only template
};

try {
  const result = await sendSMS(adminTemplateData); // With operator auth
  assert(false, 'Should fail for operator accessing admin template');
} catch (error) {
  assert(error.message.includes('permission-denied'), 'Should require admin role');
}
```

### 4. Front-end Integration Tests

#### 4.1 Send SMS Button Test
**Objective**: Test front-end SMS functionality

**Manual Test Steps**:
1. Login as admin user
2. Navigate to Dashboard → Pending Ash Pots
3. Find an entry with expired status
4. Click "Send SMS" button
5. Select SMS type from dropdown
6. Click "Send SMS"
7. Verify success message appears

**Expected Results**:
- ✅ Dialog opens with entry details
- ✅ SMS type dropdown shows all available templates
- ✅ Send button is enabled when template is selected
- ✅ Loading state appears during sending
- ✅ Success/error message displays appropriately

#### 4.2 Mobile Responsiveness Test
**Objective**: Test SMS functionality on mobile devices

**Test Steps**:
1. Open application on mobile device or responsive testing tool
2. Login as admin user
3. Navigate to Pending Ash Pots
4. Test Send SMS button functionality
5. Verify dialog is mobile-friendly

**Expected Results**:
- ✅ Button is accessible on mobile
- ✅ Dialog fits mobile screen
- ✅ All form elements are touch-friendly
- ✅ No horizontal scrolling required

### 5. Scheduled Function Tests

#### 5.1 Daily Expiry Check Test
**Objective**: Test scheduled function execution

```bash
# Manual Trigger
firebase functions:shell
> dailyExpiryCheck()

# Expected Output
{
  success: true,
  message: 'Daily expiry check completed successfully',
  results: {
    totalEntries: 5,
    entriesProcessed: 2,
    smsSent: 2,
    smsFailed: 0,
    errors: []
  }
}
```

**Expected Results**:
- ✅ Function executes without errors
- ✅ Correct entries identified for reminders
- ✅ SMS sent for expiring entries
- ✅ Execution logged in Firestore

#### 5.2 Timezone Test
**Objective**: Verify function runs at correct time

```bash
# Check scheduled function configuration
firebase functions:config:get

# Verify timezone setting
firebase functions:config:get sms.timezone
# Should return "Asia/Kolkata"
```

**Expected Results**:
- ✅ Function configured for 10:00 AM IST
- ✅ Timezone set correctly
- ✅ Function runs at expected time

### 6. Error Handling & Recovery Tests

#### 6.1 API Failure Test
**Objective**: Test behavior when FastSMS API is unavailable

```javascript
// Test with invalid API key (temporarily)
const originalKey = process.env.FASTSMS_API_KEY;
process.env.FASTSMS_API_KEY = 'INVALID_KEY';

try {
  const result = await smsService.sendThreeDayReminder(
    '9876543210',
    'Test Customer',
    'Test Location',
    '15/01/2024',
    '9876543210'
  );
  
  assert(result.success === false, 'Should fail with invalid API key');
  assert(result.error !== undefined, 'Should have error details');
  
} finally {
  // Restore original key
  process.env.FASTSMS_API_KEY = originalKey;
}
```

**Expected Results**:
- ✅ Function handles API failures gracefully
- ✅ Error logged appropriately
- ✅ Retry mechanism attempts recovery
- ✅ User receives meaningful error message

#### 6.2 Retry Logic Test
**Objective**: Verify retry mechanism works correctly

```javascript
// Test retry count in logs
const failedLogs = await SMSLogsService.getInstance().getFailedSMSLogs(2);
console.log('Failed logs for retry:', failedLogs.length);

// Should show logs with retryCount < 2
failedLogs.forEach(log => {
  assert(log.retryCount < 2, 'Should not exceed max retry count');
});
```

**Expected Results**:
- ✅ Failed SMS are retried up to 3 times
- ✅ Retry count is properly logged
- ✅ Retry delay is respected (5 seconds)

## 📊 Test Results & Reporting

### Test Checklist

| Test Category | Test Cases | Passed | Failed | Notes |
|---------------|------------|--------|--------|-------|
| Template Registry | 4 | | | |
| SMS Service | 3 | | | |
| Firebase Functions | 3 | | | |
| Front-end Integration | 2 | | | |
| Scheduled Functions | 2 | | | |
| Error Handling | 2 | | | |
| **Total** | **16** | | | |

### Success Criteria

- **Overall Success Rate**: ≥95%
- **SMS Delivery Success**: ≥95%
- **Function Response Time**: <5 seconds
- **Error Handling**: 100% of errors caught and logged
- **Security**: 100% authorization checks pass

### Performance Metrics

| Metric | Target | Actual | Status |
|--------|---------|--------|--------|
| SMS Send Time | <5 seconds | | |
| API Response Time | <3 seconds | | |
| Function Cold Start | <2 seconds | | |
| Retry Success Rate | >80% | | |

## 🐛 Known Issues & Workarounds

### Issue 1: Firebase Functions Cold Start
**Symptom**: First SMS send takes longer than expected
**Workaround**: Implement keep-alive mechanism or pre-warm functions

### Issue 2: DLT Template Validation
**Symptom**: SMS rejected due to variable mismatch
**Workaround**: Double-check variable order against DLT approval

### Issue 3: Mobile Number Format
**Symptom**: SMS fails for certain mobile numbers
**Workaround**: Ensure 10-digit format starting with 6-9

## 🔄 Test Automation

### Automated Test Script

```bash
#!/bin/bash
# Automated SMS Test Script

echo "🧪 Running Automated SMS Tests..."

# Test 1: Health Check
echo "1. Testing health check..."
health_response=$(curl -s -o /dev/null -w "%{http_code}" https://your-region-your-project.cloudfunctions.net/smsHealthCheck)
if [ "$health_response" -eq 200 ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed: $health_response"
fi

# Test 2: Firebase Functions deployment
echo "2. Checking functions deployment..."
functions_status=$(firebase functions:list | grep -c "sendSMS\|dailyExpiryCheck")
if [ "$functions_status" -ge 2 ]; then
    echo "✅ Functions deployed successfully"
else
    echo "❌ Functions deployment issue"
fi

# Test 3: Environment configuration
echo "3. Checking environment configuration..."
config_status=$(firebase functions:config:get | grep -c "fastsms")
if [ "$config_status" -ge 1 ]; then
    echo "✅ Environment configuration set"
else
    echo "❌ Environment configuration missing"
fi

echo "🎉 Automated tests completed!"
```

### Continuous Integration

Add to your CI/CD pipeline:
```yaml
# .github/workflows/sms-tests.yml
name: SMS Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run SMS tests
        run: npm test:sms
      - name: Deploy to test environment
        if: github.ref == 'refs/heads/main'
        run: ./deploy-sms-functions.sh
```

---

**Note**: Always test with real mobile numbers in a controlled environment before deploying to production. Keep track of SMS costs during testing.