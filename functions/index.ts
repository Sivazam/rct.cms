// SMS Template Management System - Firebase Cloud Functions
// Clean version with proper syntax

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import SMSTemplatesService, { TEMPLATE_IDS } from './lib/sms-templates';
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

// FastSMS Configuration - Using Firebase Functions Config with proper typing
// @ts-ignore
const functionsConfig = functions.config();
const FASTSMS_CONFIG = {
  apiKey: functionsConfig.fastsms?.api_key,
  senderId: functionsConfig.fastsms?.sender_id,
  entityId: functionsConfig.fastsms?.entity_id,
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2'
};

// Admin Configuration - Using Firebase Functions Config with proper typing
const ADMIN_CONFIG = {
  mobile: functionsConfig.admin?.mobile
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

  const template = smsTemplates.getTemplateByKey(templateKey as keyof typeof TEMPLATE_IDS);
  if (!template) {
    throw new functions.https.HttpsError('not-found', `Template ${templateKey} not found`);
  }

  const variablesValues = variables ? variables.join('|') : '';
  const result = await sendSMSAPI(recipient, template.id, variablesValues);
  
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

/**
 * Function to send expiry reminders for specific entries
 * This function can be called manually to send reminders for specific entries
 */
export const sendExpiry = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .https.onCall(async (data, context) => {
    console.log('🔔 [MANUAL] Starting manual expiry reminders...');

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const { entryIds, reminderType } = data;

      if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Entry IDs array is required.'
        );
      }

      if (!reminderType || !['threeDay', 'lastDay', 'finalDisposal'].includes(reminderType)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Valid reminder type (threeDay, lastDay, finalDisposal) is required.'
        );
      }

      console.log(`📅 [MANUAL] Sending ${reminderType} reminders for ${entryIds.length} entries`);

      let successCount = 0;
      let failureCount = 0;
      const results = [];

      // Query for specified entries
      const entriesSnapshot = await db.collection('entries')
        .where('id', 'in', entryIds)
        .where('status', '==', 'active')
        .get();

      console.log(`📊 [MANUAL] Found ${entriesSnapshot.size} matching entries`);

      if (entriesSnapshot.empty) {
        return {
          success: true,
          message: 'No active entries found for the provided IDs',
          processed: 0,
          successful: 0,
          failed: 0,
          timestamp: new Date().toISOString()
        };
      }

      // Process each entry
      for (const doc of entriesSnapshot.docs) {
        const entry = doc.data();
        
        try {
          console.log(`🔄 [MANUAL] Processing entry: ${entry.id}`);

          let customerTemplateKey: keyof typeof TEMPLATE_IDS;
          let adminTemplateKey: keyof typeof TEMPLATE_IDS;
          let customerVariables: any;
          let adminVariables: any;

          // Set templates and variables based on reminder type
          if (reminderType === 'threeDay') {
            customerTemplateKey = 'threeDayReminder';
            adminTemplateKey = 'finalDisposalReminderAdmin';
            
            customerVariables = {
              var1: entry.deceasedName || '',
              var2: entry.location || '',
              var3: entry.expiryDate || '',
              var4: entry.contactNumber || '',
              var5: entry.location || ''
            };

            adminVariables = {
              var1: entry.location || '',
              var2: entry.deceasedName || ''
            };
          } else if (reminderType === 'lastDay') {
            customerTemplateKey = 'lastdayRenewal';
            adminTemplateKey = 'finalDisposalReminderAdmin';
            
            customerVariables = {
              var1: entry.deceasedName || '',
              var2: entry.location || '',
              var3: entry.expiryDate || '',
              var4: entry.contactNumber || '',
              var5: entry.location || ''
            };

            adminVariables = {
              var1: entry.location || '',
              var2: entry.deceasedName || ''
            };
          } else if (reminderType === 'finalDisposal') {
            customerTemplateKey = 'finalDisposalReminder';
            adminTemplateKey = 'finalDisposalReminderAdmin';
            
            customerVariables = {
              var1: entry.deceasedName || '',
              var2: entry.location || '',
              var3: entry.location || ''
            };

            adminVariables = {
              var1: entry.location || '',
              var2: entry.deceasedName || ''
            };
          }

          // Send SMS to both admin and customer
          const smsResults = await sendSMSToBothParties(
            entry.contactNumber || '',
            adminTemplateKey,
            customerTemplateKey,
            customerVariables,
            adminVariables,
            entry.id
          );
          
          if (smsResults.success) {
            successCount++;
            console.log(`✅ [MANUAL] Reminder sent for entry: ${entry.id}`);
            
            // Update entry to mark reminder sent
            const updateData: any = {
              [`${reminderType}ReminderSent`]: true,
              [`${reminderType}ReminderSentAt`]: admin.firestore.FieldValue.serverTimestamp(),
              [`${reminderType}ReminderSentBy`]: context.auth.uid
            };
            
            await doc.ref.update(updateData);

            // Log customer SMS
            if (smsResults.customerSMS?.success) {
              await smsLogs.logSMS({
                type: customerTemplateKey,
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey(customerTemplateKey),
                message: smsTemplates.getTemplateByKey(customerTemplateKey)?.name || 'Manual Reminder',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

            // Log admin SMS
            if (smsResults.adminSMS?.success) {
              await smsLogs.logSMS({
                type: adminTemplateKey,
                recipient: ADMIN_CONFIG.mobile!,
                templateId: getTemplateIdByKey(adminTemplateKey),
                message: smsTemplates.getTemplateByKey(adminTemplateKey)?.name || 'Manual Admin Reminder',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

            results.push({
              entryId: entry.id,
              success: true,
              customerSMS: smsResults.customerSMS?.success || false,
              adminSMS: smsResults.adminSMS?.success || false
            });

          } else {
            failureCount++;
            console.error(`❌ [MANUAL] Failed to send reminder for entry: ${entry.id}`, smsResults.errors);
            
            results.push({
              entryId: entry.id,
              success: false,
              errors: smsResults.errors
            });
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [MANUAL] Error processing entry ${entry.id}:`, error);
          
          results.push({
            entryId: entry.id,
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
        }
      }

      console.log(`📊 [MANUAL] Manual expiry reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: true,
        reminderType,
        processed: entriesSnapshot.size,
        successful: successCount,
        failed: failureCount,
        results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 [CRITICAL] Manual expiry reminders failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Manual expiry reminders failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * SMS Health Check Function
 * This function checks the health of the SMS system and provides diagnostic information
 */
export const smsHealth = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 180, // 3 minutes
  })
  .https.onCall(async (data, context) => {
    console.log('🏥 [HEALTH] Starting SMS health check...');

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const healthStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {} as any,
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0
        }
      };

      // Check 1: FastSMS Configuration
      healthStatus.summary.totalChecks++;
      try {
        validateFastSMSConfig();
        validateAdminConfig();
        
        healthStatus.checks.configuration = {
          status: 'pass',
          message: 'FastSMS and Admin configuration is valid',
          details: {
            hasApiKey: !!FASTSMS_CONFIG.apiKey,
            hasSenderId: !!FASTSMS_CONFIG.senderId,
            hasEntityId: !!FASTSMS_CONFIG.entityId,
            hasAdminMobile: !!ADMIN_CONFIG.mobile,
            apiKeyLength: FASTSMS_CONFIG.apiKey?.length || 0,
            senderIdLength: FASTSMS_CONFIG.senderId?.length || 0
          }
        };
        healthStatus.summary.passedChecks++;
      } catch (error) {
        healthStatus.checks.configuration = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Configuration error',
          details: {
            hasApiKey: !!FASTSMS_CONFIG.apiKey,
            hasSenderId: !!FASTSMS_CONFIG.senderId,
            hasEntityId: !!FASTSMS_CONFIG.entityId,
            hasAdminMobile: !!ADMIN_CONFIG.mobile
          }
        };
        healthStatus.summary.failedChecks++;
        healthStatus.status = 'unhealthy';
      }

      // Check 2: SMS Templates Service
      healthStatus.summary.totalChecks++;
      try {
        const templates = smsTemplates.getAllTemplates();
        const activeTemplates = templates.filter(t => t.isActive);
        
        healthStatus.checks.templates = {
          status: 'pass',
          message: `Found ${activeTemplates.length} active SMS templates`,
          details: {
            totalTemplates: templates.length,
            activeTemplates: activeTemplates.length,
            categories: {
              reminder: activeTemplates.filter(t => t.category === 'reminder').length,
              confirmation: activeTemplates.filter(t => t.category === 'confirmation').length,
              disposal: activeTemplates.filter(t => t.category === 'disposal').length
            },
            templateIds: Object.keys(smsTemplates).map(key => ({
              key,
              id: smsTemplates[key]?.id || 'N/A',
              name: smsTemplates[key]?.name || 'N/A'
            }))
          }
        };
        healthStatus.summary.passedChecks++;
      } catch (error) {
        healthStatus.checks.templates = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Templates service error',
          details: {}
        };
        healthStatus.summary.failedChecks++;
        healthStatus.status = 'unhealthy';
      }

      // Check 3: SMS Logs Service
      healthStatus.summary.totalChecks++;
      try {
        const recentLogs = await smsLogs.getRecentSMSLogs(10);
        const sentLogs = recentLogs.filter(log => log.status === 'sent');
        const failedLogs = recentLogs.filter(log => log.status === 'failed');
        
        healthStatus.checks.logs = {
          status: 'pass',
          message: `SMS logs service working - ${sentLogs.length} sent, ${failedLogs.length} failed in last 10 logs`,
          details: {
            totalRecentLogs: recentLogs.length,
            sentCount: sentLogs.length,
            failedCount: failedLogs.length,
            successRate: recentLogs.length > 0 ? Math.round((sentLogs.length / recentLogs.length) * 100) : 0,
            lastLogTime: recentLogs.length > 0 ? recentLogs[0].timestamp : null
          }
        };
        healthStatus.summary.passedChecks++;
      } catch (error) {
        healthStatus.checks.logs = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'SMS logs service error',
          details: {}
        };
        healthStatus.summary.failedChecks++;
        healthStatus.status = 'unhealthy';
      }

      // Check 4: Firestore Connectivity
      healthStatus.summary.totalChecks++;
      try {
        const testDoc = await db.collection('health_checks').add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: 'sms_health_check'
        });
        
        await testDoc.delete();
        
        healthStatus.checks.firestore = {
          status: 'pass',
          message: 'Firestore connectivity is working',
          details: {
            writeSuccess: true,
            deleteSuccess: true
          }
        };
        healthStatus.summary.passedChecks++;
      } catch (error) {
        healthStatus.checks.firestore = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Firestore connectivity error',
          details: {}
        };
        healthStatus.summary.failedChecks++;
        healthStatus.status = 'unhealthy';
      }

      // Check 5: Recent SMS Activity (last 24 hours)
      healthStatus.summary.totalChecks++;
      try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const dayLogs = await smsLogs.getSMSLogs({
          dateRange: {
            start: oneDayAgo,
            end: new Date()
          }
        });
        
        const daySent = dayLogs.filter(log => log.status === 'sent');
        const dayFailed = dayLogs.filter(log => log.status === 'failed');
        
        healthStatus.checks.activity = {
          status: 'pass',
          message: `Last 24 hours: ${daySent.length} sent, ${dayFailed.length} failed`,
          details: {
            total24h: dayLogs.length,
            sent24h: daySent.length,
            failed24h: dayFailed.length,
            successRate24h: dayLogs.length > 0 ? Math.round((daySent.length / dayLogs.length) * 100) : 0
          }
        };
        healthStatus.summary.passedChecks++;
      } catch (error) {
        healthStatus.checks.activity = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Activity check error',
          details: {}
        };
        healthStatus.summary.failedChecks++;
        healthStatus.status = 'unhealthy';
      }

      // Overall status determination
      if (healthStatus.summary.failedChecks === 0) {
        healthStatus.status = 'healthy';
      } else if (healthStatus.summary.failedChecks < healthStatus.summary.totalChecks) {
        healthStatus.status = 'degraded';
      } else {
        healthStatus.status = 'unhealthy';
      }

      console.log(`🏥 [HEALTH] SMS health check completed: ${healthStatus.status} (${healthStatus.summary.passedChecks}/${healthStatus.summary.totalChecks} checks passed)`);
      
      return healthStatus;

    } catch (error) {
      console.error('💥 [CRITICAL] SMS health check failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        `SMS health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * Scheduled function to check for expiring entries and send reminders
 * Runs daily at 10 AM Asia/Kolkata time
 */
export const sendExpiryReminders = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .pubsub.schedule('0 10 * * *')
  .timeZone(TIME_ZONE)
  .onRun(async (context) => {
    console.log('🔔 [SCHEDULED] Starting expiry reminders check...');
    
    try {
      const now = new Date();
      const reminderDate = new Date(now.getTime() + (EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000));
      
      console.log('📅 [SCHEDULED] Checking for entries expiring on:', reminderDate.toISOString());

      // Query for entries expiring in 3 days
      const expiringEntries = await db.collection('entries')
        .where('expiryDate', '==', reminderDate.toISOString().split('T')[0])
        .where('status', '==', 'active')
        .get();

      console.log(`📊 [SCHEDULED] Found ${expiringEntries.size} entries expiring in ${EXPIRY_REMINDER_DAYS} days`);

      if (expiringEntries.empty) {
        console.log('✅ [SCHEDULED] No entries require expiry reminders');
        return null;
      }

      let successCount = 0;
      let failureCount = 0;

      // Process each expiring entry
      for (const doc of expiringEntries.docs) {
        const entry = doc.data();
        
        try {
          console.log(`🔄 [SCHEDULED] Processing entry: ${entry.id}`);

          let customerTemplateKey: keyof typeof TEMPLATE_IDS;
          let adminTemplateKey: keyof typeof TEMPLATE_IDS;

          // Prepare variables for customer SMS
          const customerVariables = {
            var1: entry.deceasedName || '',
            var2: entry.location || '',
            var3: entry.expiryDate || '',
            var4: entry.contactNumber || '',
            var5: entry.location || '' // Repeated location
          };

          // Prepare variables for admin SMS
          const adminVariables = {
            var1: entry.location || '',
            var2: entry.deceasedName || ''
          };

          customerTemplateKey = 'threeDayReminder';
          adminTemplateKey = 'finalDisposalReminderAdmin';
          
          // Send SMS to both admin and customer
          const results = await sendSMSToBothParties(
            entry.contactNumber || '',
            adminTemplateKey,
            customerTemplateKey,
            customerVariables,
            adminVariables,
            entry.id
          );
          
          if (results.success) {
            successCount++;
            console.log(`✅ [SCHEDULED] Reminder sent for entry: ${entry.id}`);
            
            // Update entry to mark reminder sent
            await doc.ref.update({
              reminderSent: true,
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
              reminderSentBy: 'system'
            });

            // Log customer SMS
            if (results.customerSMS?.success) {
              await smsLogs.logSMS({
                type: 'threeDayReminder',
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey('threeDayReminder'),
                message: smsTemplates.getTemplateByKey('threeDayReminder')?.name || 'Three Day Reminder',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

            // Log admin SMS
            if (results.adminSMS?.success) {
              await smsLogs.logSMS({
                type: 'finalDisposalReminderAdmin',
                recipient: ADMIN_CONFIG.mobile!,
                templateId: getTemplateIdByKey('finalDisposalReminderAdmin'),
                message: smsTemplates.getTemplateByKey('finalDisposalReminderAdmin')?.name || 'Final Disposal Reminder Admin',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

          } else {
            failureCount++;
            console.error(`❌ [SCHEDULED] Failed to send reminder for entry: ${entry.id}`, results.errors);
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [SCHEDULED] Error processing entry ${entry.id}:`, error);
        }
      }

      console.log(`📊 [SCHEDULED] Expiry reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: true,
        processed: expiringEntries.size,
        successful: successCount,
        failed: failureCount,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 [CRITICAL] Expiry reminders failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Expiry reminders failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * Scheduled function to check for entries expiring today (last day) and send final reminders
 * Runs daily at 10 AM Asia/Kolkata time
 */
export const sendLastDayReminders = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .pubsub.schedule('0 10 * * *')
  .timeZone(TIME_ZONE)
  .onRun(async (context) => {
    console.log('🔔 [SCHEDULED] Starting last day expiry reminders check...');
    
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
      
      console.log('📅 [SCHEDULED] Checking for entries expiring today:', today);

      // Query for entries expiring today
      const expiringEntries = await db.collection('entries')
        .where('expiryDate', '==', today)
        .where('status', '==', 'active')
        .get();

      console.log(`📊 [SCHEDULED] Found ${expiringEntries.size} entries expiring today`);

      if (expiringEntries.empty) {
        console.log('✅ [SCHEDULED] No entries require last day expiry reminders');
        return null;
      }

      let successCount = 0;
      let failureCount = 0;

      // Process each expiring entry
      for (const doc of expiringEntries.docs) {
        const entry = doc.data();
        
        try {
          console.log(`🔄 [SCHEDULED] Processing last day reminder for entry: ${entry.id}`);

          let customerTemplateKey: keyof typeof TEMPLATE_IDS;
          let adminTemplateKey: keyof typeof TEMPLATE_IDS;

          // Prepare variables for customer SMS
          const customerVariables = {
            var1: entry.deceasedName || '',
            var2: entry.location || '',
            var3: today,
            var4: entry.contactNumber || '',
            var5: entry.location || '' // Repeated location
          };

          // Prepare variables for admin SMS
          const adminVariables = {
            var1: entry.location || '',
            var2: entry.deceasedName || ''
          };

          customerTemplateKey = 'lastdayRenewal';
          adminTemplateKey = 'finalDisposalReminderAdmin';
          
          // Send SMS to both admin and customer
          const results = await sendSMSToBothParties(
            entry.contactNumber || '',
            adminTemplateKey,
            customerTemplateKey,
            customerVariables,
            adminVariables,
            entry.id
          );
          
          if (results.success) {
            successCount++;
            console.log(`✅ [SCHEDULED] Last day reminder sent for entry: ${entry.id}`);
            
            // Update entry to mark last day reminder sent
            await doc.ref.update({
              lastDayReminderSent: true,
              lastDayReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
              lastDayReminderSentBy: 'system'
            });

            // Log customer SMS
            if (results.customerSMS?.success) {
              await smsLogs.logSMS({
                type: 'lastdayRenewal',
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey('lastdayRenewal'),
                message: smsTemplates.getTemplateByKey('lastdayRenewal')?.name || 'Last Day Renewal Reminder',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

            // Log admin SMS
            if (results.adminSMS?.success) {
              await smsLogs.logSMS({
                type: 'finalDisposalReminderAdmin',
                recipient: ADMIN_CONFIG.mobile!,
                templateId: getTemplateIdByKey('finalDisposalReminderAdmin'),
                message: smsTemplates.getTemplateByKey('finalDisposalReminderAdmin')?.name || 'Final Disposal Reminder Admin',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

          } else {
            failureCount++;
            console.error(`❌ [SCHEDULED] Failed to send last day reminder for entry: ${entry.id}`, results.errors);
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [SCHEDULED] Error processing last day reminder for entry ${entry.id}:`, error);
        }
      }

      console.log(`📊 [SCHEDULED] Last day expiry reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: true,
        processed: expiringEntries.size,
        successful: successCount,
        failed: failureCount,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 [CRITICAL] Last day expiry reminders failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Last day expiry reminders failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * Scheduled function to check for entries that expired 60 days ago and send final disposal reminders
 * Runs daily at 10 AM Asia/Kolkata time
 */
export const sendFinalDisposalReminders = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .pubsub.schedule('0 10 * * *')
  .timeZone(TIME_ZONE)
  .onRun(async (context) => {
    console.log('🔔 [SCHEDULED] Starting final disposal reminders check...');
    
    try {
      const now = new Date();
      const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
      const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0]; // 60 days ago in YYYY-MM-DD format
      
      console.log('📅 [SCHEDULED] Checking for entries that expired 60 days ago:', sixtyDaysAgoStr);

      // Query for entries that expired 60 days ago and are still active
      const expiredEntries = await db.collection('entries')
        .where('expiryDate', '==', sixtyDaysAgoStr)
        .where('status', '==', 'active')
        .get();

      console.log(`📊 [SCHEDULED] Found ${expiredEntries.size} entries expired 60 days ago`);

      if (expiredEntries.empty) {
        console.log('✅ [SCHEDULED] No entries require final disposal reminders');
        return null;
      }

      let successCount = 0;
      let failureCount = 0;

      // Process each expired entry
      for (const doc of expiredEntries.docs) {
        const entry = doc.data();
        
        try {
          console.log(`🔄 [SCHEDULED] Processing final disposal reminder for entry: ${entry.id}`);

          let customerTemplateKey: keyof typeof TEMPLATE_IDS;
          let adminTemplateKey: keyof typeof TEMPLATE_IDS;

          // Prepare variables for customer SMS
          const customerVariables = {
            var1: entry.deceasedName || '',
            var2: entry.location || '',
            var3: entry.location || '' // Repeated location
          };

          // Prepare variables for admin SMS
          const adminVariables = {
            var1: entry.location || '',
            var2: entry.deceasedName || ''
          };

          customerTemplateKey = 'finalDisposalReminder';
          adminTemplateKey = 'finalDisposalReminderAdmin';
          
          // Send SMS to both admin and customer
          const results = await sendSMSToBothParties(
            entry.contactNumber || '',
            adminTemplateKey,
            customerTemplateKey,
            customerVariables,
            adminVariables,
            entry.id
          );
          
          if (results.success) {
            successCount++;
            console.log(`✅ [SCHEDULED] Final disposal reminder sent for entry: ${entry.id}`);
            
            // Update entry to mark final disposal reminder sent
            await doc.ref.update({
              finalDisposalReminderSent: true,
              finalDisposalReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
              finalDisposalReminderSentBy: 'system'
            });

            // Log customer SMS
            if (results.customerSMS?.success) {
              await smsLogs.logSMS({
                type: 'finalDisposalReminder',
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey('finalDisposalReminder'),
                message: smsTemplates.getTemplateByKey('finalDisposalReminder')?.name || 'Final Disposal Reminder',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

            // Log admin SMS
            if (results.adminSMS?.success) {
              await smsLogs.logSMS({
                type: 'finalDisposalReminderAdmin',
                recipient: ADMIN_CONFIG.mobile!,
                templateId: getTemplateIdByKey('finalDisposalReminderAdmin'),
                message: smsTemplates.getTemplateByKey('finalDisposalReminderAdmin')?.name || 'Final Disposal Reminder Admin',
                status: 'sent',
                entryId: entry.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                timestamp: new Date(),
                retryCount: 0
              });
            }

          } else {
            failureCount++;
            console.error(`❌ [SCHEDULED] Failed to send final disposal reminder for entry: ${entry.id}`, results.errors);
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [SCHEDULED] Error processing final disposal reminder for entry ${entry.id}:`, error);
        }
      }

      console.log(`📊 [SCHEDULED] Final disposal reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: true,
        processed: expiredEntries.size,
        successful: successCount,
        failed: failureCount,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💥 [CRITICAL] Final disposal reminders failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Final disposal reminders failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

// Helper function to send SMS to both admin and customer (updated version)
async function sendSMSToBothParties(customerMobile: string, adminTemplateKey: string, customerTemplateKey: string, customerVariables: any, adminVariables: any, entryId?: string) {
  const results = {
    customerSMS: null as any,
    adminSMS: null as any,
    success: false,
    errors: [] as string[]
  };

  try {
    validateFastSMSConfig();
    validateAdminConfig();

    // Send SMS to customer first
    if (customerMobile && customerTemplateKey && customerVariables) {
      try {
        const customerTemplateId = getTemplateIdByKey(customerTemplateKey);
        const customerFormattedVariables = formatVariablesForAPI(customerTemplateKey, customerVariables);
        
        console.log('📱 [DEBUG] Sending customer SMS to:', customerMobile.substring(0, 4) + '****' + customerMobile.substring(-4));
        results.customerSMS = await sendSMSAPI(customerMobile, customerTemplateId, customerFormattedVariables);
        
        if (results.customerSMS.success) {
          console.log('✅ [DEBUG] Customer SMS sent successfully');
        } else {
          results.errors.push(`Customer SMS failed: ${results.customerSMS.error?.message || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error sending customer SMS';
        results.errors.push(errorMessage);
        console.error('❌ [DEBUG] Error sending customer SMS:', error);
      }
    }

    // Send SMS to admin
    if (ADMIN_CONFIG.mobile && adminTemplateKey && adminVariables) {
      try {
        const adminTemplateId = getTemplateIdByKey(adminTemplateKey);
        const adminFormattedVariables = formatVariablesForAPI(adminTemplateKey, adminVariables);
        
        console.log('📱 [DEBUG] Sending admin SMS to:', ADMIN_CONFIG.mobile.substring(0, 4) + '****' + ADMIN_CONFIG.mobile.substring(-4));
        results.adminSMS = await sendSMSAPI(ADMIN_CONFIG.mobile!, adminTemplateId, adminFormattedVariables);
        
        if (results.adminSMS.success) {
          console.log('✅ [DEBUG] Admin SMS sent successfully');
        } else {
          results.errors.push(`Admin SMS failed: ${results.adminSMS.error?.message || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error sending admin SMS';
        results.errors.push(errorMessage);
        console.error('❌ [DEBUG] Error sending admin SMS:', error);
      }
    }

    // Set overall success if at least one SMS was sent successfully
    results.success = (results.customerSMS?.success || results.adminSMS?.success);

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in sendSMSToBothParties';
    results.errors.push(errorMessage);
    console.error('❌ [DEBUG] Error in sendSMSToBothParties:', error);
    return results;
  }
}

// Helper function to get template ID by key with enhanced validation
function getTemplateIdByKey(templateKey: string): string {
  console.log('🔍 [DEBUG] Getting template ID for key:', templateKey);
  
  const template = smsTemplates.getTemplateByKey(templateKey as any);
  if (!template) {
    console.error('🔍 [DEBUG] Template not found for key:', templateKey);
    throw new Error(`Template not found: ${templateKey}`);
  }
  
  // Enhanced template validation
  console.log('🔍 [DEBUG] Template details:', {
    key: template.key,
    id: template.id,
    name: template.name,
    variableCount: template.variableCount,
    isActive: template.isActive,
    idLength: template.id.length,
    idFormat: /^\d+$/.test(template.id) ? 'NUMERIC' : 'INVALID'
  });

  // Validate template ID format (should be numeric for Fast2SMS)
  if (!/^\d+$/.test(template.id)) {
    console.error('🔍 [DEBUG] Invalid template ID format (should be numeric):', template.id);
    throw new Error(`Invalid template ID format: ${template.id}. Template IDs must be numeric for Fast2SMS compliance.`);
  }

  // Validate template ID length (Fast2SMS Message IDs are typically 6 digits)
  if (template.id.length !== 6) {
    console.warn('🔍 [DEBUG] Unusual template ID length (expected 6 digits for Fast2SMS):', template.id.length);
  }

  // Check if template is active
  if (!template.isActive) {
    console.error('🔍 [DEBUG] Template is not active:', template.key);
    throw new Error(`Template is not active: ${templateKey}`);
  }
  
  console.log('🔍 [DEBUG] Template validation passed, returning ID:', template.id);
  return template.id;
}

// Helper function to format variables for API with enhanced validation
function formatVariablesForAPI(templateKey: string, variables: any): string {
  console.log('🔍 [DEBUG] Formatting variables for API:', {
    templateKey,
    variables,
    variableKeys: Object.keys(variables || {}),
    variableValues: Object.values(variables || {})
  });

  // Validate variables before formatting
  const validation = smsTemplates.validateTemplateVariables ? 
    smsTemplates.validateTemplateVariables(templateKey as any, variables) : 
    { isValid: true, errors: [] };

  if (!validation.isValid) {
    console.error('🔍 [DEBUG] Template variable validation failed:', validation.errors);
    throw new Error(`Template variable validation failed: ${validation.errors.join(', ')}`);
  }

  const formattedVariables = smsTemplates.formatVariablesForAPI ? 
    smsTemplates.formatVariablesForAPI(templateKey as any, variables) :
    Object.values(variables || {}).join('|');
  
  console.log('🔍 [DEBUG] Formatted variables result:', {
    originalVariables: variables,
    formattedVariables,
    variableCount: formattedVariables.split('|').length,
    isEmpty: formattedVariables === ''
  });

  return formattedVariables;
}