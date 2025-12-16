// SMS Template Management System - Firebase Cloud Functions
// Clean version with proper syntax

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import SMSTemplatesService from './lib/sms-templates';
import smsLogsService from './lib/sms-logs';

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

// Initialize SMS Logs Service with Firestore instance
const smsLogs = smsLogsService.getInstance(db);

// Initialize SMS Templates Service
const smsTemplates = SMSTemplatesService.getInstance();

// Configuration constants
const DAILY_CHECK_HOUR = 10; // 10 AM as requested
const TIME_ZONE = 'Asia/Kolkata';
const EXPIRY_REMINDER_DAYS = 3; // 3 days before expiry

// FastSMS Configuration - Securely loaded from environment
const FASTSMS_CONFIG = {
  apiKey: functions.config()?.fastsms?.api_key,
  senderId: functions.config()?.fastsms?.sender_id,
  entityId: functions.config()?.fastsms?.entity_id,
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2'
};

// Admin Configuration - Securely loaded from environment
const ADMIN_CONFIG = {
  mobile: functions.config()?.admin?.mobile
};

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Validate FastSMS configuration
function validateFastSMSConfig() {
  if (!FASTSMS_CONFIG.apiKey) {
    throw new Error('FastSMS API key not configured');
  }
  if (!FASTSMS_CONFIG.senderId) {
    throw new Error('FastSMS sender ID not configured');
  }
}

// Validate Admin configuration
function validateAdminConfig() {
  if (!ADMIN_CONFIG.mobile) {
    throw new Error('Admin mobile not configured');
  }
}

// Secure SMS sending function
async function sendSMSAPI(recipient: string, templateId: string, variablesValues: string, attempt = 1) {
  try {
    validateFastSMSConfig();

    // Enhanced validation of recipient number
    if (!recipient || !/^[6-9]\d{9}$/.test(recipient.replace('+91', ''))) {
      throw new Error(`Invalid recipient number format: ${recipient}`);
    }

    // Enhanced validation of template ID
    if (!templateId || !/^\d+$/.test(templateId)) {
      throw new Error(`Invalid template ID format: ${templateId}`);
    }

    // Enhanced validation of variables
    if (!variablesValues || typeof variablesValues !== 'string') {
      throw new Error(`Invalid variables values: ${variablesValues}`);
    }

    const apiUrl = new URL(FASTSMS_CONFIG.baseUrl);
    apiUrl.searchParams.append('authorization', FASTSMS_CONFIG.apiKey!);
    apiUrl.searchParams.append('route', 'dlt');
    apiUrl.searchParams.append('sender_id', FASTSMS_CONFIG.senderId!);
    apiUrl.searchParams.append('message', templateId);
    apiUrl.searchParams.append('variables_values', variablesValues);
    apiUrl.searchParams.append('flash', '0');
    apiUrl.searchParams.append('numbers', recipient.replace('+91', ''));

    if (FASTSMS_CONFIG.entityId) {
      apiUrl.searchParams.append('entity_id', FASTSMS_CONFIG.entityId);
    }

    const response = await axios.get(apiUrl.toString(), {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Rotary-CMS/1.0',
        'Accept': 'application/json'
      }
    });

    if (response.data.return === true) {
      return {
        success: true,
        messageId: response.data.request_id
      };
    } else {
      const errorMessage = response.data.message || 'SMS sending failed';
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('FastSMS API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test function
exports.testFunction = functions.https.onCall(async (data, context) => {
  return { message: 'Cloud functions are working!', timestamp: new Date().toISOString() };
});

// Health check function
exports.healthCheck = functions.https.onCall(async (data, context) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Send SMS function
exports.sendSMSV2 = functions.https.onCall(async (data, context) => {
  const { recipient, templateId, variablesValues } = data;
  
  if (!recipient || !templateId || !variablesValues) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  const result = await sendSMSAPI(recipient, templateId, variablesValues);
  return result;
});

// Get SMS templates
exports.getSMSTemplates = functions.https.onCall(async (data, context) => {
  return smsTemplates;
});

// Get SMS logs
exports.getSMSLogs = functions.https.onCall(async (data, context) => {
  try {
    const logs = await smsLogs.getSMSLogs(data?.filters);
    return { success: true, logs };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to get SMS logs');
  }
});

// Test SMS template
exports.testSMSTemplate = functions.https.onCall(async (data, context) => {
  const { templateKey, recipient, variables } = data;
  
  if (!templateKey || !recipient) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  const template = smsTemplates[templateKey];
  if (!template) {
    throw new functions.https.HttpsError('not-found', `Template ${templateKey} not found`);
  }

  const variablesValues = variables ? variables.join('|') : '';
  const result = await sendSMSAPI(recipient, template.templateId, variablesValues);
  
  return result;
});

// Force deploy trigger
exports.forceDeployTrigger = functions.https.onCall(async (data, context) => {
  return { 
    message: 'Force deploy triggered successfully', 
    timestamp: new Date().toISOString() 
  };
});

// Debug SMS logs
exports.debugSMSLogs = functions.https.onCall(async (data, context) => {
  try {
    const logs = await smsLogs.getRecentSMSLogs(50);
    return { success: true, logs };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Debug template IDs
exports.debugTemplateIds = functions.https.onCall(async (data, context) => {
  return {
    templates: Object.keys(smsTemplates).map(key => ({
      key,
      ...smsTemplates[key]
    })),
    config: {
      hasApiKey: !!FASTSMS_CONFIG.apiKey,
      hasSenderId: !!FASTSMS_CONFIG.senderId,
      hasEntityId: !!FASTSMS_CONFIG.entityId
    }
  };
});

// Firestore Trigger for Dispatched Lockers - Send SMS notifications
exports.onDispatchedLockerCreated = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .firestore
  .document('dispatchedLockers/{docId}')
  .onCreate(async (snap, context) => {
    console.log('🔥 [DISPATCH_TRIGGER] New dispatched locker record created');
    
    try {
      const dispatchedData = snap.data();
      if (!dispatchedData) {
        console.error('🔥 [DISPATCH_TRIGGER] No data found in dispatched locker record');
        return null;
      }

      const dispatchInfo = dispatchedData.dispatchInfo;
      const originalEntryData = dispatchedData.originalEntryData;

      if (!dispatchInfo || !originalEntryData) {
        console.error('🔥 [DISPATCH_TRIGGER] Missing dispatch info or original entry data');
        return null;
      }

      console.log('🔥 [DISPATCH_TRIGGER] Processing dispatch:', {
        entryId: dispatchedData.entryId,
        dispatchType: dispatchInfo.dispatchType,
        totalRemainingPots: dispatchInfo.totalRemainingPots,
        potsDispatched: dispatchInfo.potsDispatched
      });

      // Only send SMS for partial dispatches (when some pots remain)
      if (dispatchInfo.dispatchType === 'partial' && dispatchInfo.totalRemainingPots > 0) {
        console.log('🔥 [DISPATCH_TRIGGER] Partial dispatch detected - sending SMS notifications');
        
        const results = {
          customerSMS: null,
          adminSMS: null
        };

        try {
          // Send SMS to customer
          const customerTemplate = smsTemplates.getTemplateByKey('partialDispatchCustomer');
          if (customerTemplate) {
            const customerVariables = [
              originalEntryData.deceasedPersonName || originalEntryData.customerName,
              dispatchInfo.potsDispatched.toString(),
              dispatchInfo.totalRemainingPots.toString(),
              new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              dispatchInfo.handoverPersonName || 'N/A',
              dispatchInfo.handoverPersonMobile || 'N/A',
              ADMIN_CONFIG.mobile || 'N/A',
              originalEntryData.locationName || 'N/A'
            ].join('|');
            
            results.customerSMS = await sendSMSAPI(
              originalEntryData.customerMobile,
              customerTemplate.id,
              customerVariables
            );
          }

          // Send SMS to admin
          const adminTemplate = smsTemplates.getTemplateByKey('partialDispatchAdmin');
          if (adminTemplate) {
            const adminVariables = [
              originalEntryData.deceasedPersonName || originalEntryData.customerName,
              dispatchInfo.potsDispatched.toString(),
              dispatchInfo.totalRemainingPots.toString(),
              originalEntryData.locationName || 'N/A'
            ].join('|');
            
            results.adminSMS = await sendSMSAPI(
              ADMIN_CONFIG.mobile!,
              adminTemplate.id,
              adminVariables
            );
          }

          // Log SMS results
          await smsLogs.logSMS({
            type: 'partial_dispatch_customer',
            recipient: originalEntryData.customerMobile,
            templateId: customerTemplate?.id || '',
            message: 'Partial dispatch notification to customer',
            status: results.customerSMS?.success ? 'sent' : 'failed',
            errorMessage: results.customerSMS?.error,
            timestamp: new Date(),
            retryCount: 1,
            entryId: dispatchedData.entryId,
            customerId: originalEntryData.customerId,
            locationId: originalEntryData.locationId,
            operatorId: originalEntryData.operatorId
          });

          await smsLogs.logSMS({
            type: 'partial_dispatch_admin',
            recipient: ADMIN_CONFIG.mobile!,
            templateId: adminTemplate?.id || '',
            message: 'Partial dispatch notification to admin',
            status: results.adminSMS?.success ? 'sent' : 'failed',
            errorMessage: results.adminSMS?.error,
            timestamp: new Date(),
            retryCount: 1,
            entryId: dispatchedData.entryId,
            customerId: originalEntryData.customerId,
            locationId: originalEntryData.locationId,
            operatorId: originalEntryData.operatorId
          });

        } catch (smsError) {
          console.error('🔥 [DISPATCH_TRIGGER] Error sending SMS:', smsError);
        }

        console.log('🔥 [DISPATCH_TRIGGER] SMS sending completed:', {
          customerSMS: results.customerSMS?.success,
          adminSMS: results.adminSMS?.success,
          totalRemainingPots: dispatchInfo.totalRemainingPots
        });

      } else if (dispatchInfo.dispatchType === 'full') {
        console.log('🔥 [DISPATCH_TRIGGER] Full dispatch detected - partial dispatch SMS skipped');
      } else {
        console.log('🔥 [DISPATCH_TRIGGER] No SMS sent - dispatchType:', dispatchInfo.dispatchType, 'totalRemainingPots:', dispatchInfo.totalRemainingPots);
      }

      return null;
    } catch (error) {
      console.error('🔥 [DISPATCH_TRIGGER] Error processing dispatched locker:', error);
      return null;
    }
  });