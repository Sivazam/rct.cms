# Firebase Functions Deployment Checklist

## Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Google account with Firebase access
- [ ] FastSMS account with API credentials
- [ ] Node.js 18+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Project code ready with all changes

### ✅ Firebase Project Setup
- [ ] Firebase project created in console
- [ ] Project ID noted down
- [ ] Billing enabled (if required)
- [ ] Cloud Functions API enabled
- [ ] Cloud Scheduler API enabled

### ✅ FastSMS Configuration
- [ ] FastSMS API key obtained
- [ ] FastSMS Sender ID obtained
- [ ] FastSMS Entity ID obtained
- [ ] All credentials tested and working

### ✅ Local Environment
- [ ] Functions dependencies installed (`cd functions && npm install`)
- [ ] No syntax errors (`firebase functions:shell --exit`)
- [ ] Local emulators working (`firebase emulators:start`)
- [ ] All configuration files present

---

## Deployment Process Checklist

### ✅ Step 1: Firebase Login & Project Selection
- [ ] Login to Firebase: `firebase login`
- [ ] Select correct project: `firebase use your-project-id`
- [ ] Verify project: `firebase projects:list`

### ✅ Step 2: Environment Configuration
- [ ] Set FastSMS API key: `firebase functions:config:set fastsms.api_key="YOUR_KEY"`
- [ ] Set FastSMS Sender ID: `firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"`
- [ ] Set FastSMS Entity ID: `firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"`
- [ ] Verify configuration: `firebase functions:config:get`

### ✅ Step 3: Pre-Deployment Testing
- [ ] Start local emulators: `firebase emulators:start`
- [ ] Test health check: `curl http://localhost:5001/your-project-id/us-central1/smsHealthCheck`
- [ ] Test SMS function with valid data
- [ ] Test with invalid data (error handling)
- [ ] Check all function logs

### ✅ Step 4: Deployment
- [ ] Clean functions directory: `cd functions && npm prune --production`
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Wait for successful deployment message
- [ ] Note any warnings or errors

### ✅ Step 5: Post-Deployment Verification
- [ ] List deployed functions: `firebase functions:list`
- [ ] Test health check via deployed URL
- [ ] Test SMS function from frontend
- [ ] Check real-time logs: `firebase functions:log --follow`
- [ ] Verify scheduled function is active

---

## Post-Deployment Checklist

### ✅ Functionality Testing
- [ ] Send SMS with all template types
- [ ] Test with valid mobile numbers
- [ ] Test with invalid mobile numbers (error handling)
- [ ] Test scheduled function (manually trigger)
- [ ] Test retry functionality
- [ ] Verify SMS logs in Firestore

### ✅ Integration Testing
- [ ] Test from frontend application
- [ ] Test with different user roles (admin/operator)
- [ ] Test location-based permissions
- [ ] Test payment processing integration
- [ ] Verify handover person data flow

### ✅ Monitoring Setup
- [ ] Google Cloud Console access verified
- [ ] Function metrics monitoring set up
- [ ] Error alerts configured
- [ ] Performance dashboards created
- [ ] Log exports configured (if needed)

### ✅ Documentation
- [ ] Deployment guide updated
- [ ] API documentation current
- [ ] Team members notified
- [ ] Access credentials shared securely
- [ ] Maintenance procedures documented

---

## Emergency Rollback Checklist

### ✅ Identify Issue
- [ ] Problem clearly identified
- [ ] Impact assessed (users affected)
- [ ] Root cause determined

### ✅ Rollback Options
- [ ] Redeploy from git (if version controlled)
- [ ] Disable problematic function
- [ ] Implement temporary fix
- [ ] Communicate with users

### ✅ Verification
- [ ] System stable after rollback
- [ ] Data integrity maintained
- [ ] All services functional
- [ ] Users notified of resolution

---

## Maintenance Checklist

### ✅ Daily
- [ ] Check function logs for errors
- [ ] Monitor SMS delivery rates
- [ ] Verify scheduled function execution

### ✅ Weekly
- [ ] Review performance metrics
- [ ] Check cost and usage
- [ ] Update any outdated dependencies

### ✅ Monthly
- [ ] Full system health check
- [ ] Security audit
- [ ] Backup verification
- [ ] Performance optimization review

### ✅ Quarterly
- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Cost optimization analysis
- [ ] Disaster recovery testing

---

## Success Criteria

### ✅ Deployment Success
- [ ] All 5 functions deployed successfully
- [ ] No deployment errors or warnings
- [ ] Functions responding within expected time
- [ ] All environment variables set correctly

### ✅ Functionality Success
- [ ] SMS sending works with all templates
- [ ] Error handling works correctly
- [ ] Scheduled function runs automatically
- [ ] Integration with frontend works
- [ ] Handover person data flows correctly

### ✅ Performance Success
- [ ] Functions respond within timeout limits
- [ ] Memory usage within allocated limits
- [ ] Error rate < 1%
- [ ] Cost within budget
- [ ] User satisfaction maintained

---

## Troubleshooting Quick Reference

### Common Issues
- **Deployment fails**: Check dependencies, syntax, and config
- **SMS not sending**: Verify FastSMS credentials and template IDs
- **Scheduled function not running**: Check Cloud Scheduler API and job
- **Permission denied**: Verify user roles and security rules
- **Timeout errors**: Increase memory/timeout limits

### Critical Commands
```bash
# Debug deployment
firebase deploy --only functions --debug

# Check configuration
firebase functions:config:get

# View logs
firebase functions:log --follow

# Test locally
firebase emulators:start
```

### Support Contacts
- **Firebase Support**: https://firebase.google.com/support
- **FastSMS Support**: Check your FastSMS dashboard
- **Internal Team**: [Add your team contacts here]

---

**Print this checklist and mark each item as completed during deployment!**