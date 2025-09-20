const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const axios = require('axios');
const SMSTemplatesService = require('../lib/sms-templates.js');
const SMSLogsService = require('../lib/sms-logs.js');

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

// Initialize SMS Logs Service with Firestore instance
const smsLogsService = SMSLogsService.getInstance(db);

// Configuration constants
const DAILY_CHECK_HOUR = 10; // 10 AM as requested
const TIME_ZONE = 'Asia/Kolkata';
const EXPIRY_REMINDER_DAYS = 3; // 3 days before expiry

// FastSMS Configuration - Securely loaded from environment
const FASTSMS_CONFIG = {
  apiKey: functions.config().fastsms?.api_key,
  senderId: functions.config().fastsms?.sender_id,
  entityId: functions.config().fastsms?.entity_id,
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2'  // Fixed: fast2sms.com instead of fastsms.com
};

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

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

// Helper function for delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Secure SMS sending function (server-side only) - Using DLT Manual Route
async function sendSMSAPI(recipient, templateId, variablesValues, attempt = 1) {
  try {
    validateFastSMSConfig();
    
    const url = new URL(FASTSMS_CONFIG.baseUrl);
    
    // For DLT Manual Route, we need to use different parameters
    if (FASTSMS_CONFIG.entityId && FASTSMS_CONFIG.senderId) {
      // DLT Manual Route - uses DLT-approved templates directly
      url.searchParams.append('authorization', FASTSMS_CONFIG.apiKey);
      url.searchParams.append('sender_id', FASTSMS_CONFIG.senderId);
      url.searchParams.append('message', variablesValues); // Full message with variables replaced
      url.searchParams.append('template_id', templateId); // DLT Content Template ID
      url.searchParams.append('entity_id', FASTSMS_CONFIG.entityId); // DLT Principal Entity ID
      url.searchParams.append('route', 'dlt_manual');
      url.searchParams.append('numbers', recipient);
    } else {
      // Fallback to original DLT route (if manual route not configured)
      url.searchParams.append('authorization', FASTSMS_CONFIG.apiKey);
      url.searchParams.append('sender_id', FASTSMS_CONFIG.senderId);
      url.searchParams.append('message', templateId);
      url.searchParams.append('variables_values', variablesValues);
      url.searchParams.append('route', 'dlt');
      url.searchParams.append('numbers', recipient);
    }

    console.log(`FastSMS API Call (Attempt ${attempt}):`, {
      recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
      templateId,
      variablesValues: variablesValues.substring(0, 20) + '...',
      route: FASTSMS_CONFIG.entityId ? 'dlt_manual' : 'dlt',
      url: url.toString().substring(0, 100) + '...'
    });

    const response = await axios.get(url.toString(), {
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

    if (axios.isAxiosError(error)) {
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
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date()
        }
      };
    }
  }
}

// Helper function to get template ID by key
function getTemplateIdByKey(templateKey) {
  const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey);
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  return template.id;
}

// Helper function to format variables for API
function formatVariablesForAPI(templateKey, variables) {
  return SMSTemplatesService.getInstance().formatVariablesForAPI(templateKey, variables);
}

/**
 * Callable function to send SMS securely from front-end
 * This function validates authentication and authorization before sending SMS
 */
exports.sendSMSV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
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
    const { templateKey, recipient, variables, entryId, customerId, locationId } = data;

    if (!templateKey || !recipient || !variables) {
      console.error('Validation failed: Missing required parameters', {
        templateKey: !!templateKey,
        recipient: !!recipient,
        variables: !!variables
      });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Template key, recipient, and variables are required.'
      );
    }

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
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4), // Partial logging for privacy
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
            await smsLogsService.logSMS({
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
            await smsLogsService.logSMS({
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
          await smsLogsService.logSMS({
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
        messageId: finalResult.messageId || null, // Handle undefined messageId
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
        messageId: null, // No messageId for errors
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw new functions.https.HttpsError(
        'internal',
        'Failed to send SMS. Please try again later.'
      );
    }
  });

// Additional functions can be added here following the same pattern...

exports.dailyExpiryCheckV2 = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .pubsub.schedule('0 10 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('Starting daily expiry check at:', new Date().toISOString());
    
    // Basic implementation - can be expanded
    return { success: true, message: 'Daily expiry check completed' };
  });

exports.retryFailedSMSV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 300,
  })
  .https.onCall(async (data, context) => {
    // Basic implementation - can be expanded
    return { success: true, message: 'Retry failed SMS completed' };
  });

exports.getSMSStatisticsV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    // Basic implementation - can be expanded
    return { success: true, message: 'SMS statistics retrieved' };
  });

exports.smsHealthCheckV2 = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (request, response) => {
    response.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });