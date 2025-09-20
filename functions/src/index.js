const { onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

// Configuration constants
const DAILY_CHECK_HOUR = 10; // 10 AM as requested
const TIME_ZONE = 'Asia/Kolkata';
const EXPIRY_REMINDER_DAYS = 3; // 3 days before expiry

// FastSMS Configuration - Securely loaded from environment
const FASTSMS_CONFIG = {
  apiKey: functions.config().fastsms?.api_key,
  senderId: functions.config().fastsms?.sender_id,
  entityId: functions.config().fastsms?.entity_id,
  baseUrl: 'https://www.fastsms.com/dev/bulkV2'
};

// Admin Configuration - Single admin for all locations
const ADMIN_CONFIG = {
  mobile: functions.config().admin?.mobile || '9876543210', // Default fallback
  name: functions.config().admin?.name || 'System Administrator'
};

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Template IDs - DLT Approved
const TEMPLATE_IDS = {
  threeDayReminder: '1707175786299400837',
  lastdayRenewal: '1707175786326312933',
  renewalConfirmCustomer: '1707175786362862204',
  renewalConfirmAdmin: '1707175786389503209',
  dispatchConfirmCustomer: '1707175786420863806',
  deliveryConfirmAdmin: '1707175786441865610',
  finalDisposalReminder: '1707175786481546224',
  finalDisposalReminderAdmin: '1707175786495860514',
};

// Validate FastSMS configuration
function validateFastSMSConfig() {
  if (!FASTSMS_CONFIG.apiKey) {
    throw new Error('FastSMS API key not configured. Please run: firebase functions:config:set fastsms.api_key="YOUR_API_KEY"');
  }
  if (!FASTSMS_CONFIG.senderId) {
    throw new Error('FastSMS sender ID not configured. Please run: firebase functions:config:set fastsms.sender_id="YOUR_SENDER_ID"');
  }
  if (!FASTSMS_CONFIG.entityId) {
    throw new Error('FastSMS entity ID not configured. Please run: firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"');
  }
}

// Helper function to get template ID by key
function getTemplateIdByKey(templateKey) {
  const templateId = TEMPLATE_IDS[templateKey];
  if (!templateId) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  return templateId;
}

// Helper function to get recipient based on template type
function getRecipientForTemplate(templateKey, customerMobile, variables) {
  const adminOnlyTemplates = [
    'renewalConfirmAdmin',
    'deliveryConfirmAdmin', 
    'finalDisposalReminderAdmin'
  ];
  
  if (adminOnlyTemplates.includes(templateKey)) {
    // For admin templates, send to admin mobile
    return ADMIN_CONFIG.mobile;
  } else {
    // For customer templates, send to customer mobile
    return customerMobile;
  }
}

// Helper function to format variables for API
function formatVariablesForAPI(templateKey, variables) {
  const template = getTemplateIdByKey(templateKey);
  
  // Define variable structures for each template
  const variableStructures = {
    threeDayReminder: ['deceasedPersonName', 'locationName', 'date', 'mobile', 'locationName'],
    lastdayRenewal: ['deceasedPersonName', 'locationName', 'date', 'mobile', 'locationName'],
    renewalConfirmCustomer: ['deceasedPersonName', 'locationName', 'date', 'mobile', 'locationName'],
    renewalConfirmAdmin: ['locationName', 'deceasedPersonName'],
    dispatchConfirmCustomer: ['deceasedPersonName', 'locationName', 'date', 'contactPersonName', 'mobile', 'mobile', 'locationName'],
    deliveryConfirmAdmin: ['deceasedPersonName', 'locationName'],
    finalDisposalReminder: ['deceasedPersonName', 'locationName', 'locationName'],
    finalDisposalReminderAdmin: ['locationName', 'deceasedPersonName'],
  };

  const structure = variableStructures[templateKey];
  if (!structure) {
    throw new Error(`Variable structure not found for template: ${templateKey}`);
  }

  const variableValues = structure.map(varName => {
    const value = variables[varName];
    if (value === undefined || value === null || value === '') {
      return '';
    }
    return value.toString();
  });

  return variableValues.join('|');
}

// Secure SMS sending function (server-side only)
async function sendSMSAPI(recipient, templateId, variablesValues, attempt = 1) {
  try {
    validateFastSMSConfig();
    
    const apiUrl = new URL(FASTSMS_CONFIG.baseUrl);
    apiUrl.searchParams.append('authorization', FASTSMS_CONFIG.apiKey);
    apiUrl.searchParams.append('sender_id', FASTSMS_CONFIG.senderId);
    apiUrl.searchParams.append('message', templateId);
    apiUrl.searchParams.append('variables_values', variablesValues);
    apiUrl.searchParams.append('route', 'dlt');
    apiUrl.searchParams.append('numbers', recipient);

    console.log(`FastSMS API Call (Attempt ${attempt}):`, {
      recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
      templateId,
      variablesValues: variablesValues.substring(0, 20) + '...',
      url: apiUrl.toString().substring(0, 100) + '...'
    });

    const response = await axios.get(apiUrl.toString(), {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Rotary-CMS/1.0'
      }
    });

    console.log('FastSMS API Response:', response.data);

    if (response.data.return === true) {
      return {
        success: true,
        messageId: response.data.request_id
      };
    } else {
      throw {
        type: 'API_ERROR',
        message: response.data.message || 'SMS sending failed',
        code: 'API_ERROR',
        details: response.data,
        timestamp: new Date()
      };
    }

  } catch (error) {
    console.error('FastSMS API Error:', error);

    if (error.response) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      let errorType = 'API_ERROR';
      if (status === 401) errorType = 'AUTHENTICATION_ERROR';
      else if (status === 429) errorType = 'RATE_LIMIT_ERROR';
      else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorType = 'NETWORK_ERROR';
      }

      return {
        success: false,
        error: {
          type: errorType,
          message: `FastSMS API Error: ${message}`,
          code: status?.toString(),
          details: error.response?.data,
          timestamp: new Date()
        }
      };
    } else {
      return {
        success: false,
        error: {
          type: 'UNKNOWN',
          message: error.message || 'Unknown error occurred',
          timestamp: new Date()
        }
      };
    }
  }
}

// Helper function to log SMS to Firestore
async function logSMS(logData) {
  try {
    const docRef = await db.collection('smsLogs').add({
      ...logData,
      timestamp: admin.firestore.Timestamp.fromDate(logData.timestamp instanceof Date ? logData.timestamp : new Date(logData.timestamp))
    });
    
    console.log('SMS logged successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error logging SMS to Firestore:', error);
    throw error;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Callable function to send SMS securely from front-end
 * This function validates authentication and authorization before sending SMS
 */
exports.sendSMS = onCall({
  memory: "256MiB",
  timeoutSeconds: 60,
}, async (request) => {
  const { data, context } = request;
  console.log('sendSMS called with data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    if (!context.auth) {
      console.error('Authentication failed: No auth context');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Validate required parameters
    const { templateKey, customerMobile, variables, entryId, customerId, locationId } = data;

    if (!templateKey || !customerMobile || !variables) {
      console.error('Validation failed: Missing required parameters', {
        templateKey: !!templateKey,
        customerMobile: !!customerMobile,
        variables: !!variables
      });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Template key, customer mobile, and variables are required.'
      );
    }

    // Determine recipient based on template type
    const recipient = getRecipientForTemplate(templateKey, customerMobile, variables);

    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();

    if (!user) {
      console.error('User not found:', context.auth.uid);
      throw new functions.https.HttpsError(
        'not-found',
        'User not found.'
      );
    }

    // Check if user is active
    if (user.isActive !== true) {
      console.error('User not active:', context.auth.uid);
      throw new functions.https.HttpsError(
        'permission-denied',
        'User account is not active.'
      );
    }

    // Additional authorization checks based on template type
    const adminOnlyTemplates = [
      'renewalConfirmAdmin',
      'deliveryConfirmAdmin', 
      'finalDisposalReminderAdmin'
    ];

    if (adminOnlyTemplates.includes(templateKey) && user.role !== 'admin') {
      console.error('Permission denied: Admin-only template access attempted', {
        userId: context.auth.uid,
        role: user.role,
        templateKey
      });
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can send this type of SMS.'
      );
    }

    // For operator-restricted templates, check location access
    const locationRestrictedTemplates = [
      'threeDayReminder',
      'lastdayRenewal',
      'renewalConfirmCustomer',
      'dispatchConfirmCustomer',
      'finalDisposalReminder'
    ];

    if (locationRestrictedTemplates.includes(templateKey) && user.role === 'operator') {
      if (!user.locationIds || !user.locationIds.includes(locationId)) {
        console.error('Permission denied: Operator accessing unauthorized location', {
          userId: context.auth.uid,
          locationId,
          assignedLocations: user.locationIds
        });
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to send SMS for this location.'
        );
      }
    }

    try {
      console.log('Authorization passed, attempting to send SMS', {
        templateKey,
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
        userId: context.auth.uid,
        role: user.role
      });

      // Get template ID and format variables
      const templateId = getTemplateIdByKey(templateKey);
      const variablesValues = formatVariablesForAPI(templateKey, variables);

      let lastError = undefined;
      let finalResult = undefined;

      // Retry mechanism
      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          console.log(`SMS Send Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for template ${templateKey}`);

          const apiResult = await sendSMSAPI(recipient, templateId, variablesValues, attempt);

          if (apiResult.success) {
            // Log successful SMS
            await logSMS({
              type: templateKey,
              recipient,
              templateId,
              message: variablesValues,
              status: 'sent',
              timestamp: new Date(),
              retryCount: attempt - 1,
              entryId,
              customerId,
              locationId,
              operatorId: context.auth.uid
            });

            finalResult = {
              success: true,
              messageId: apiResult.messageId,
              timestamp: new Date().toISOString()
            };

            console.log(`SMS sent successfully on attempt ${attempt}. Message ID: ${apiResult.messageId}`);
            break;
          } else {
            lastError = apiResult.error;
            
            // Log failed attempt
            await logSMS({
              type: templateKey,
              recipient,
              templateId,
              message: variablesValues,
              status: 'failed',
              errorMessage: lastError.message,
              timestamp: new Date(),
              retryCount: attempt,
              entryId,
              customerId,
              locationId,
              operatorId: context.auth.uid
            });

            if (attempt < MAX_RETRY_ATTEMPTS) {
              console.log(`SMS failed on attempt ${attempt}, retrying in ${RETRY_DELAY_MS}ms...`);
              await delay(RETRY_DELAY_MS);
            }
          }

        } catch (error) {
          lastError = error;
          
          // Log exception
          await logSMS({
            type: templateKey,
            recipient,
            templateId,
            message: variablesValues,
            status: 'failed',
            errorMessage: lastError.message || 'Unexpected error',
            timestamp: new Date(),
            retryCount: attempt,
            entryId,
            customerId,
            locationId,
            operatorId: context.auth.uid
          });

          if (attempt < MAX_RETRY_ATTEMPTS) {
            console.log(`Exception on attempt ${attempt}, retrying in ${RETRY_DELAY_MS}ms...`);
            await delay(RETRY_DELAY_MS);
          }
        }
      }

      if (!finalResult) {
        finalResult = {
          success: false,
          error: lastError.message,
          timestamp: new Date().toISOString()
        };
      }

      // Log the function call for audit purposes
      await db.collection('smsFunctionCalls').add({
        userId: context.auth.uid,
        userRole: user.role,
        templateKey,
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
        entryId,
        customerId,
        locationId,
        success: finalResult.success,
        messageId: finalResult.messageId,
        error: finalResult.error,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return finalResult;

    } catch (error) {
      console.error('Error in sendSMS function:', error);

      // Log the error for audit purposes
      await db.collection('smsFunctionCalls').add({
        userId: context.auth.uid,
        userRole: user.role,
        templateKey,
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
        entryId,
        customerId,
        locationId,
        success: false,
        error: error.message || 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw new functions.https.HttpsError(
        'internal',
        'Failed to send SMS. Please try again later.'
      );
    }
  });

/**
 * Scheduled function to check for expiring entries and send SMS reminders
 * Runs daily at 10 AM IST to check for entries expiring in 3 days and today
 */
exports.dailyExpiryCheck = onSchedule({
  schedule: `0 ${DAILY_CHECK_HOUR} * * *`,
  timeZone: TIME_ZONE,
  memory: "512MiB",
  timeoutSeconds: 540, // 9 minutes
}, async (event) => {
  console.log('Starting daily expiry check at:', new Date().toISOString());

    try {
      const results = {
        entries3Days: 0,
        entriesToday: 0,
        totalSMS: 0,
        successfulSMS: 0,
        failedSMS: 0,
        errors: [],
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        endTime: null
      };

      // Get all active entries
      const entriesSnapshot = await db.collection('entries')
        .where('status', '==', 'active')
        .get();

      console.log(`Found ${entriesSnapshot.size} active entries to process`);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate target dates
      const threeDaysFromNow = new Date(today.getTime() + EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000);

      for (const doc of entriesSnapshot.docs) {
        const entry = doc.data();
        
        try {
          // Parse expiry date
          const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
          
          if (!expiryDate || isNaN(expiryDate.getTime())) {
            console.warn(`Invalid expiry date for entry ${doc.id}`);
            results.errors.push(`Invalid expiry date for entry ${doc.id}`);
            continue;
          }

          // Get customer details
          const customerDoc = await db.collection('customers').doc(entry.customerId).get();
          const customer = customerDoc.data();
          
          if (!customer) {
            console.warn(`Customer not found for entry ${doc.id}`);
            results.errors.push(`Customer not found for entry ${doc.id}`);
            continue;
          }

          // Get location details
          const locationDoc = await db.collection('locations').doc(entry.locationId).get();
          const location = locationDoc.data();
          
          if (!location) {
            console.warn(`Location not found for entry ${doc.id}`);
            results.errors.push(`Location not found for entry ${doc.id}`);
            continue;
          }

          // Check if expiry date matches our target dates
          const isExpiringIn3Days = expiryDate.toDateString() === threeDaysFromNow.toDateString();
          const isExpiringToday = expiryDate.toDateString() === today.toDateString();

          let smsResult = null;

          if (isExpiringIn3Days) {
            console.log(`Sending 3-day reminder for entry ${doc.id}`);
            
            smsResult = await sendSMSAPI(
              customer.mobile,
              getTemplateIdByKey('threeDayReminder'),
              formatVariablesForAPI('threeDayReminder', {
                deceasedPersonName: customer.name,
                locationName: location.venueName,
                date: expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                mobile: location.contactNumber || '9876543210'
              })
            );
            
            results.entries3Days++;
            results.totalSMS++;
            
          } else if (isExpiringToday) {
            console.log(`Sending same-day reminder for entry ${doc.id}`);
            
            smsResult = await sendSMSAPI(
              customer.mobile,
              getTemplateIdByKey('lastdayRenewal'),
              formatVariablesForAPI('lastdayRenewal', {
                deceasedPersonName: customer.name,
                locationName: location.venueName,
                date: expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                mobile: location.contactNumber || '9876543210'
              })
            );
            
            results.entriesToday++;
            results.totalSMS++;
          }

          if (smsResult) {
            if (smsResult.success) {
              results.successfulSMS++;
            } else {
              results.failedSMS++;
            }

            // Log the SMS
            await logSMS({
              type: isExpiringIn3Days ? 'threeDayReminder' : 'lastdayRenewal',
              recipient: customer.mobile,
              templateId: isExpiringIn3Days ? TEMPLATE_IDS.threeDayReminder : TEMPLATE_IDS.lastdayRenewal,
              message: formatVariablesForAPI(isExpiringIn3Days ? 'threeDayReminder' : 'lastdayRenewal', {
                deceasedPersonName: customer.name,
                locationName: location.venueName,
                date: expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                mobile: location.contactNumber || '9876543210'
              }),
              status: smsResult.success ? 'sent' : 'failed',
              timestamp: new Date(),
              retryCount: 0,
              entryId: doc.id,
              customerId: entry.customerId,
              locationId: entry.locationId,
              operatorId: 'system'
            });
          }

        } catch (error) {
          console.error(`Error processing entry ${doc.id}:`, error);
          results.errors.push(`Error processing entry ${doc.id}: ${error.message}`);
        }
      }

      results.endTime = admin.firestore.FieldValue.serverTimestamp();

      // Log the daily check results
      await db.collection('dailyExpiryChecks').add({
        ...results,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Daily expiry check completed:', results);

      return {
        success: true,
        results,
        message: `Processed ${entriesSnapshot.size} entries, sent ${results.totalSMS} SMS reminders`
      };

    } catch (error) {
      console.error('Error in daily expiry check:', error);

      // Log the error
      await db.collection('dailyExpiryChecks').add({
        success: false,
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw new Error(`Daily expiry check failed: ${error.message}`);
    }
  });

/**
 * Function to retry failed SMS messages
 * Can be called manually or scheduled
 */
exports.retryFailedSMS = onRequest({
  memory: "256MiB",
  timeoutSeconds: 300, // 5 minutes
}, async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

    try {
      console.log('Starting SMS retry process');

      // Get failed SMS logs that haven't exceeded max retry count
      const failedSMSsnapshot = await db.collection('smsLogs')
        .where('status', '==', 'failed')
        .where('retryCount', '<', MAX_RETRY_ATTEMPTS)
        .orderBy('timestamp', 'asc')
        .limit(50) // Process in batches
        .get();

      console.log(`Found ${failedSMSsnapshot.size} failed SMS to retry`);

      const results = {
        total: failedSMSsnapshot.size,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const doc of failedSMSsnapshot.docs) {
        const smsLog = doc.data();
        
        try {
          console.log(`Retrying SMS for ${smsLog.recipient} with template ${smsLog.type}`);

          const apiResult = await sendSMSAPI(
            smsLog.recipient,
            smsLog.templateId,
            smsLog.message,
            smsLog.retryCount + 1
          );

          if (apiResult.success) {
            // Update SMS log to sent
            await db.collection('smsLogs').doc(doc.id).update({
              status: 'sent',
              messageId: apiResult.messageId,
              retryCount: smsLog.retryCount + 1,
              lastRetryAt: admin.firestore.FieldValue.serverTimestamp()
            });

            results.successful++;
          } else {
            // Update SMS log with error
            await db.collection('smsLogs').doc(doc.id).update({
              status: 'failed',
              errorMessage: apiResult.error.message,
              retryCount: smsLog.retryCount + 1,
              lastRetryAt: admin.firestore.FieldValue.serverTimestamp()
            });

            results.failed++;
          }

        } catch (error) {
          console.error(`Error retrying SMS ${doc.id}:`, error);
          results.errors.push(`Error retrying SMS ${doc.id}: ${error.message}`);
          results.failed++;
        }
      }

      response.status(200).json({
        success: true,
        results,
        message: `Retried ${results.total} SMS: ${results.successful} successful, ${results.failed} failed`
      });

    } catch (error) {
      console.error('Error in retryFailedSMS function:', error);
      
      response.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * Get SMS statistics
 */
exports.getSMSStatistics = onRequest({
  memory: "128MiB",
  timeoutSeconds: 60,
}, async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

    try {
      console.log('Getting SMS statistics');

      // Get SMS logs from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const smsSnapshot = await db.collection('smsLogs')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();

      const stats = {
        total: smsSnapshot.size,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {},
        byDate: {}
      };

      smsSnapshot.forEach(doc => {
        const sms = doc.data();
        
        // Count by status
        if (sms.status === 'sent') stats.sent++;
        else if (sms.status === 'failed') stats.failed++;
        else if (sms.status === 'pending') stats.pending++;

        // Count by type
        stats.byType[sms.type] = (stats.byType[sms.type] || 0) + 1;

        // Count by date
        const date = sms.timestamp.toDate();
        const dateKey = date.toISOString().split('T')[0];
        stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
      });

      response.status(200).json({
        success: true,
        stats,
        message: 'Statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting SMS statistics:', error);
      
      response.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

/**
 * Health check function for SMS service
 */
exports.smsHealthCheck = onRequest({
  memory: "128MiB",
  timeoutSeconds: 30,
}, async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

    try {
      console.log('SMS health check requested');

      // Validate FastSMS configuration
      let configValid = false;
      let configError = null;
      
      try {
        validateFastSMSConfig();
        configValid = true;
      } catch (error) {
        configError = error.message;
      }

      response.status(200).json({
        status: 'healthy',
        service: 'SMS Service',
        timestamp: new Date().toISOString(),
        details: {
          isInitialized: true,
          templatesCount: Object.keys(TEMPLATE_IDS).length,
          functionsAvailable: true,
          configValid,
          configError,
          fastsmsConfigured: !!FASTSMS_CONFIG.apiKey
        }
      });

    } catch (error) {
      console.error('SMS health check failed:', error);
      
      response.status(500).json({
        status: 'unhealthy',
        service: 'SMS Service',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });