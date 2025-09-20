# Firebase Functions Deployment Cheat Sheet

## Quick Commands

### Project Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# List projects
firebase projects:list

# Use project
firebase use your-project-id
```

### Configuration
```bash
# Set FastSMS config
firebase functions:config:set fastsms.api_key="YOUR_KEY"
firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"
firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"

# Check config
firebase functions:config:get
```

### Local Development
```bash
# Start emulators
firebase emulators:start

# Functions shell
firebase functions:shell

# Test specific function
curl http://localhost:5001/your-project-id/us-central1/smsHealthCheck
```

### Deployment
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendSMS

# Deploy with debug
firebase deploy --only functions --debug
```

### Monitoring
```bash
# List functions
firebase functions:list

# View logs
firebase functions:log --follow

# Filter logs
firebase functions:log --only sendSMS
```

## Function URLs

After deployment, your functions will be available at:

```
https://us-central1-your-project-id.cloudfunctions.net/function-name
```

### Available Functions
- `sendSMS` - Callable function for sending SMS
- `smsHealthCheck` - HTTP health check
- `getSMSStatistics` - HTTP statistics endpoint
- `retryFailedSMS` - HTTP retry endpoint
- `dailyExpiryCheck` - Scheduled function (10 AM IST)

## Frontend Integration

### Import Firebase
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase-config';
```

### Send SMS
```javascript
const sendSMS = httpsCallable(functions, 'sendSMS');

const result = await sendSMS({
  templateKey: 'threeDayReminder',
  recipient: '+911234567890',
  variables: {
    deceasedPersonName: 'John Doe',
    locationName: 'Cremation Center',
    date: '24/09/2025',
    mobile: '9876543210'
  },
  entryId: 'entry-123',
  customerId: 'customer-123',
  locationId: 'location-123'
});
```

## Template Variables

### Three Day Reminder
```javascript
{
  deceasedPersonName: 'John Doe',
  locationName: 'Cremation Center',
  date: '24/09/2025',
  mobile: '9876543210'
}
```

### Dispatch Confirmation
```javascript
{
  deceasedPersonName: 'John Doe',
  locationName: 'Cremation Center',
  date: '24/09/2025',
  contactPersonName: 'Jane Smith',
  mobile: '9876543210',
  adminMobile: '8765432109'
}
```

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `unauthenticated` | User not logged in | Check Firebase auth |
| `permission-denied` | Insufficient permissions | Check user role |
| `invalid-argument` | Missing/invalid parameters | Validate input data |
| `internal` | Server error | Check logs and retry |

## Common Issues

### Deployment Fails
```bash
# Check dependencies
cd functions && npm install

# Check syntax
firebase functions:shell --exit

# Debug deployment
firebase deploy --only functions --debug
```

### SMS Not Sending
```bash
# Check FastSMS config
firebase functions:config:get

# Check logs
firebase functions:log --only sendSMS

# Test template
firebase functions:shell
```

### Scheduled Function Not Running
```bash
# Check Cloud Scheduler
gcloud scheduler jobs list --project=your-project-id

# Enable API
gcloud services enable cloudscheduler.googleapis.com
```

## Performance Tips

### Memory Allocation
- `sendSMS`: 256MB (single SMS)
- `dailyExpiryCheck`: 512MB (bulk processing)
- `retryFailedSMS`: 256MB (batch operations)

### Timeout Settings
- `sendSMS`: 60 seconds
- `dailyExpiryCheck`: 540 seconds (9 minutes)
- `retryFailedSMS`: 300 seconds (5 minutes)

### Cost Optimization
- Use Node.js 18 runtime
- Monitor execution times
- Set appropriate memory limits
- Use efficient queries

## Security

### Environment Variables
- Never commit API keys
- Use Firebase config
- Rotate keys regularly

### Authentication
- All functions require auth
- Role-based access control
- Location-based permissions

### Validation
- Input validation on all functions
- Mobile number format validation
- Template variable validation

## Monitoring

### Google Cloud Console
- Functions: https://console.cloud.google.com/functions
- Logs: https://console.cloud.google.com/logs
- Monitoring: https://console.cloud.google.com/monitoring

### Key Metrics
- Execution count
- Execution time
- Error rate
- Memory usage

### Alerts
- Set up error rate alerts
- Monitor function failures
- Track SMS delivery rates

## Rollback

### Redeploy Previous Version
```bash
# Check deployment history
firebase functions:log --limit 100

# Redeploy (if using git)
git checkout previous-commit
firebase deploy --only functions
```

### Emergency Disable
```bash
# Disable function in console
# Or return error immediately
```

---

**Print this cheat sheet for quick reference during deployment and maintenance!**