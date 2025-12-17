// SMS Template Management System - Firebase Cloud Functions
// Clean version with proper syntax - Firebase Functions v4.7.0 Compatible

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import SMSTemplatesService, { TEMPLATE_IDS } from './lib/sms-templates';
import smsLogsService from './lib/sms-logs';

// Initialize Firebase Admin with app name for Functions compatibility
const adminApp = admin.initializeApp({
  projectId: 'rctscm01',
  // Add any other required configurations for v4.7.0
});

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

// Helper function to filter entries that expired on or before a specific calendar date
function filterEntriesExpiredByCalendarDate(
  entries: any[], 
  targetDate: Date
): any[] {
  const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  console.log(`🔍 [FILTER_EXPIRED] Target cutoff date: ${targetDateStr}`);
  
  return entries.filter(doc => {
    const entry = doc.data();
    const expiryDate = entry.expiryDate;
    
    if (!expiryDate) {
      return false;
    }
    
    // Handle different timestamp formats
    let expiryDateObj: Date;
    
    if (expiryDate instanceof Date) {
      // Regular JavaScript Date
      expiryDateObj = expiryDate;
    } else if (expiryDate && typeof expiryDate === 'object') {
      // Firestore Timestamp - handle both _seconds and toDate() methods
      try {
        if (expiryDate.toDate && typeof expiryDate.toDate === 'function') {
          // Use Firestore's toDate() method if available
          expiryDateObj = expiryDate.toDate();
        } else if (expiryDate._seconds !== undefined) {
          // Handle timestamp with _seconds and _nanoseconds
          expiryDateObj = new Date(expiryDate._seconds * 1000 + (expiryDate._nanoseconds || 0) / 1000000);
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
    
    // Convert expiry date to Indian Standard Time (UTC+5:30) for comparison
    // because the Firestore UI shows dates in IST
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
    const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
    
    // Check if expiry date is on or before the target date (expired 60+ days ago)
    const matches = expiryDateStr <= targetDateStr;
    
    // Log only matching entries for cleaner output
    if (matches) {
      console.log(`🔍 [FILTER_EXPIRED] Entry ${doc.id} (${entry.customerName}): EXPIRED ✅`);
      console.log(`  - Expiry IST: ${expiryDateStr} (<= ${targetDateStr})`);
    }
    
    return matches;
  });
}

// Helper function to filter entries by calendar date (simple and clean)
function filterEntriesByCalendarDate(
  entries: any[], 
  targetDate: Date
): any[] {
  const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  console.log(`🔍 [FILTER] Target date: ${targetDateStr}`);
  
  return entries.filter(doc => {
    const entry = doc.data();
    const expiryDate = entry.expiryDate;
    
    if (!expiryDate) {
      return false;
    }
    
    // Handle different timestamp formats
    let expiryDateObj: Date;
    
    if (expiryDate instanceof Date) {
      // Regular JavaScript Date
      expiryDateObj = expiryDate;
    } else if (expiryDate && typeof expiryDate === 'object') {
      // Firestore Timestamp - handle both _seconds and toDate() methods
      try {
        if (expiryDate.toDate && typeof expiryDate.toDate === 'function') {
          // Use Firestore's toDate() method if available
          expiryDateObj = expiryDate.toDate();
        } else if (expiryDate._seconds !== undefined) {
          // Handle timestamp with _seconds and _nanoseconds
          expiryDateObj = new Date(expiryDate._seconds * 1000 + (expiryDate._nanoseconds || 0) / 1000000);
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
    
    // Convert expiry date to Indian Standard Time (UTC+5:30) for comparison
    // because the Firestore UI shows dates in IST
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
    const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
    
    // Simple calendar date comparison (ignoring time completely)
    const matches = expiryDateStr === targetDateStr;
    
    // Log only matching entries for cleaner output
    if (matches) {
      console.log(`🔍 [FILTER] Entry ${doc.id} (${entry.customerName}): MATCHES ✅`);
      console.log(`  - Expiry UTC: ${expiryDateObj.toISOString().split('T')[0]}`);
      console.log(`  - Expiry IST: ${expiryDateStr}`);
    }
    
    return matches;
  });
}

// Helper function to create a snapshot-like object from filtered docs
function createSnapshotFromDocs(docs: any[]) {
  return {
    docs: docs,
    size: docs.length,
    empty: docs.length === 0
  };
}

// Helper function to filter entries by expiry date range (for 3-day reminders)
function filterEntriesByDateRange(
  entries: any[], 
  startDate: Date, 
  endDate: Date
): any[] {
  return entries.filter(doc => {
    const entry = doc.data();
    const expiryDate = entry.expiryDate;
    
    if (!expiryDate) return false;
    
    // Handle Firestore timestamp format
    let expiryDateObj: Date;
    if (expiryDate instanceof Date) {
      expiryDateObj = expiryDate;
    } else if (expiryDate && typeof expiryDate === 'object' && expiryDate._seconds) {
      expiryDateObj = new Date(expiryDate._seconds * 1000 + expiryDate._nanoseconds / 1000000);
    } else {
      return false;
    }
    
    // Check if expiry date is within the specified range
    return expiryDateObj >= startDate && expiryDateObj < endDate;
  });
}

// Helper function to filter entries that expired between two dates (for 60-day final disposal)
function filterEntriesExpiredBetween(
  entries: any[], 
  startDate: Date, 
  endDate: Date
): any[] {
  return entries.filter(doc => {
    const entry = doc.data();
    const expiryDate = entry.expiryDate;
    
    if (!expiryDate) return false;
    
    // Handle Firestore timestamp format
    let expiryDateObj: Date;
    if (expiryDate instanceof Date) {
      expiryDateObj = expiryDate;
    } else if (expiryDate && typeof expiryDate === 'object' && expiryDate._seconds) {
      expiryDateObj = new Date(expiryDate._seconds * 1000 + expiryDate._nanoseconds / 1000000);
    } else {
      return false;
    }
    
    // Check if expiry date is between the two dates (inclusive)
    return expiryDateObj <= startDate && expiryDateObj >= endDate;
  });
}

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
            
            console.log('🔥 [DISPATCH_TRIGGER] Customer SMS variables:', {
              template: 'partialDispatchCustomer',
              var1: originalEntryData.deceasedPersonName || originalEntryData.customerName,
              var2: dispatchInfo.potsDispatched.toString(), // dispatched pots
              var3: dispatchInfo.totalRemainingPots.toString(), // remaining pots (CORRECT)
              var4: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              var5: dispatchInfo.handoverPersonName || 'N/A',
              var6: dispatchInfo.handoverPersonMobile || 'N/A',
              var7: ADMIN_CONFIG.mobile || 'N/A',
              var8: originalEntryData.locationName || 'N/A',
              fullString: customerVariables
            });
            
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
            
            console.log('🔥 [DISPATCH_TRIGGER] Admin SMS variables:', {
              template: 'partialDispatchAdmin',
              var1: originalEntryData.deceasedPersonName || originalEntryData.customerName,
              var2: dispatchInfo.potsDispatched.toString(), // dispatched pots
              var3: dispatchInfo.totalRemainingPots.toString(), // remaining pots (CORRECT)
              var4: originalEntryData.locationName || 'N/A',
              fullString: adminVariables
            });
            
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
 * Unified expiry reminders trigger - handles 3-day, last-day, and 60-day expiry reminders
 * This function replaces the individual scheduled functions and can be triggered manually
 */
export const sendAllExpiryReminders = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .https.onCall(async (data, context) => {
    console.log('🔔 [UNIFIED] Starting unified expiry reminders check...');
    
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const { reminderTypes = ['3day', 'lastday', '60day'] } = data || {};
      
      const results = {
        threeDayReminders: { sent: 0, failed: 0 },
        lastDayReminders: { sent: 0, failed: 0 },
        finalDisposalReminders: { sent: 0, failed: 0 }
      };
      
      // Process 3-day reminders
      if (reminderTypes.includes('3day')) {
        console.log('📅 [UNIFIED] Processing 3-day expiry reminders...');
        const threeDayResult = await processThreeDayReminders();
        results.threeDayReminders = threeDayResult;
      }
      
      // Process last-day reminders
      if (reminderTypes.includes('lastday')) {
        console.log('📅 [UNIFIED] Processing last-day expiry reminders...');
        const lastDayResult = await processLastDayReminders();
        results.lastDayReminders = lastDayResult;
      }
      
      // Process 60-day final disposal reminders
      if (reminderTypes.includes('60day')) {
        console.log('📅 [UNIFIED] Processing 60-day final disposal reminders...');
        const finalDisposalResult = await processFinalDisposalReminders();
        results.finalDisposalReminders = finalDisposalResult;
      }
      
      console.log('🔔 [UNIFIED] Unified expiry reminders completed:', results);
      
      return {
        success: true,
        message: 'All expiry reminders processed successfully',
        results: results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🔔 [UNIFIED] Error in unified expiry reminders:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process expiry reminders'
      );
    }
  });

/**
 * Process 3-day expiry reminders
 */
async function processThreeDayReminders() {
  const result = { sent: 0, failed: 0 };
  
  try {
    const now = new Date();
    // Calculate date 3 days from now
    const reminderDate = new Date(now.getTime() + (EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000));
    const reminderDateStr = reminderDate.toISOString().split('T')[0];
    
    console.log('📅 [3DAY] Checking for entries expiring in 3 days:', {
      reminderDate: reminderDate.toISOString(),
      reminderDateStr: reminderDateStr
    });
    
    // Query for all active entries, then filter by expiry date in memory
    const threeDayActiveSnapshot = await db.collection('entries')
      .where('status', '==', 'active')
      .get();
    
    // Filter entries that expire in 3 days (using the same timezone-aware logic)
    const filteredDocs = filterEntriesByCalendarDate(threeDayActiveSnapshot.docs, reminderDate);
    const entriesSnapshot = createSnapshotFromDocs(filteredDocs);
    
    if (entriesSnapshot.empty) {
      console.log('📅 [3DAY] No entries expiring in 3 days');
      return result;
    }
    
    console.log(`📅 [3DAY] Found ${entriesSnapshot.size} entries expiring in 3 days`);
    
    for (const doc of entriesSnapshot.docs) {
      const entry = doc.data();
      let customerResult: any = null; // Declare outside try block
      
      try {
        // Send 3-day reminder to customer
        const customerTemplate = smsTemplates.getTemplateByKey('threeDayReminder');
        if (customerTemplate && entry.customerMobile) {
          const customerVariables = [
            entry.deceasedPersonName || entry.customerName,
            entry.locationName || 'Unknown Location',
            reminderDateStr, // Simple date format: 2025-12-20
            ADMIN_CONFIG.mobile || 'N/A',
            entry.locationName || 'Unknown Location'
          ].join('|');
          
          customerResult = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVariables);
          if (customerResult.success) {
            result.sent++;
          } else {
            result.failed++;
          }
        }
        
        // Log SMS attempt
        await smsLogs.logSMS({
          type: 'three_day_reminder',
          recipient: entry.customerMobile,
          templateId: customerTemplate?.id || '',
          message: '3-day expiry reminder',
          status: customerResult?.success ? 'sent' : 'failed',
          errorMessage: customerResult?.error,
          timestamp: new Date(),
          retryCount: 1,
          entryId: doc.id,
          customerId: entry.customerId,
          locationId: entry.locationId,
          operatorId: entry.operatorId
        });
        
      } catch (entryError) {
        console.error(`📅 [3DAY] Error processing entry ${doc.id}:`, entryError);
        result.failed++;
      }
    }
    
  } catch (error) {
    console.error('📅 [3DAY] Error in 3-day reminders:', error);
    result.failed++;
  }
  
  return result;
}

async function processLastDayReminders() {
  const result = { sent: 0, failed: 0 };
  
  try {
    const now = new Date();
    // For last day reminder, we want entries expiring TOMORROW
    const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];
    
    console.log('📅 [LASTDAY] Current server time (UTC):', now.toISOString());
    console.log('📅 [LASTDAY] Checking for entries expiring tomorrow (last day reminder):', {
      tomorrowDate: tomorrowDate.toISOString(),
      tomorrowDateStr: tomorrowDateStr
    });
    
    // Query for all active entries, then filter by expiry date in memory
    const allActiveSnapshot = await db.collection('entries')
      .where('status', '==', 'active')
      .get();
    
    console.log('📅 [LASTDAY] Total active entries in database:', allActiveSnapshot.size);
    
    // Filter entries that expire tomorrow (simple calendar date comparison)
    const filteredDocs = filterEntriesByCalendarDate(allActiveSnapshot.docs, tomorrowDate);
    const entriesSnapshot = createSnapshotFromDocs(filteredDocs);
    
    console.log('📅 [LASTDAY] - Target expiry date:', tomorrowDateStr);
    console.log('📅 [LASTDAY] - Entries expiring tomorrow after filtering:', entriesSnapshot.size, 'documents');
    
    if (entriesSnapshot.empty) {
      console.log('📅 [LASTDAY] No entries expiring tomorrow');
      return result;
    }
    
    console.log(`📅 [LASTDAY] Found ${entriesSnapshot.size} entries expiring tomorrow`);
    
    for (const doc of entriesSnapshot.docs) {
      const entry = doc.data();
      let customerResult: any = null; // Declare outside try block
      
      try {
        // Send last-day reminder to customer
        const customerTemplate = smsTemplates.getTemplateByKey('lastdayRenewal');
        if (customerTemplate && entry.customerMobile) {
          const customerVariables = [
            entry.deceasedPersonName || entry.customerName,
            entry.locationName || 'Unknown Location',
            tomorrowDateStr, // Simple date format: 2025-12-18
            ADMIN_CONFIG.mobile || 'N/A',
            entry.locationName || 'Unknown Location'
          ].join('|');
          
          customerResult = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVariables);
          if (customerResult.success) {
            result.sent++;
          } else {
            result.failed++;
          }
        }
        
        // Log SMS attempt
        await smsLogs.logSMS({
          type: 'last_day_reminder',
          recipient: entry.customerMobile,
          templateId: customerTemplate?.id || '',
          message: 'Last day expiry reminder',
          status: customerResult?.success ? 'sent' : 'failed',
          errorMessage: customerResult?.error,
          timestamp: new Date(),
          retryCount: 1,
          entryId: doc.id,
          customerId: entry.customerId,
          locationId: entry.locationId,
          operatorId: entry.operatorId
        });
        
      } catch (entryError) {
        console.error(`📅 [LASTDAY] Error processing entry ${doc.id}:`, entryError);
        result.failed++;
      }
    }
    
  } catch (error) {
    console.error('📅 [LASTDAY] Error in last-day reminders:', error);
    result.failed++;
  }
  
  return result;
}

/**
 * Process 60-day final disposal reminders
 */
async function processFinalDisposalReminders() {
  const result = { sent: 0, failed: 0 };
  
  try {
    const now = new Date();
    // Calculate date 60 days ago
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];
    
    console.log('📅 [60DAY] Checking for entries that expired 60 days ago:', {
      sixtyDaysAgo: sixtyDaysAgo.toISOString(),
      sixtyDaysAgoStr: sixtyDaysAgoStr
    });
    
    // Query for all active entries, then filter by expiry date in memory
    const sixtyDayActiveSnapshot = await db.collection('entries')
      .where('status', '==', 'active')
      .get();
    
    // Filter entries that expired 60+ days ago (using the same timezone-aware logic)
    const filteredDocs = filterEntriesExpiredByCalendarDate(sixtyDayActiveSnapshot.docs, sixtyDaysAgo);
    const entriesSnapshot = createSnapshotFromDocs(filteredDocs);
    
    if (entriesSnapshot.empty) {
      console.log('📅 [60DAY] No entries expired 60 days ago');
      return result;
    }
    
    console.log(`📅 [60DAY] Found ${entriesSnapshot.size} entries expired 60 days ago`);
    
    for (const doc of entriesSnapshot.docs) {
      const entry = doc.data();
      let customerResult: any = null; // Declare outside try block
      let adminResult: any = null;    // Declare outside try block
      
      try {
        // Send final disposal reminder to customer
        const customerTemplate = smsTemplates.getTemplateByKey('finalDisposalReminder');
        if (customerTemplate && entry.customerMobile) {
          const customerVariables = [
            entry.deceasedPersonName || entry.customerName,
            entry.locationName || 'Unknown Location',
            entry.locationName || 'Unknown Location'
          ].join('|');
          
          customerResult = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVariables);
          if (customerResult.success) {
            result.sent++;
          } else {
            result.failed++;
          }
        }
        
        // Send final disposal reminder to admin
        const adminTemplate = smsTemplates.getTemplateByKey('finalDisposalReminderAdmin');
        if (adminTemplate) {
          const adminVariables = [
            entry.locationName || 'Unknown Location',
            entry.deceasedPersonName || entry.customerName
          ].join('|');
          
          adminResult = await sendSMSAPI(ADMIN_CONFIG.mobile!, adminTemplate.id, adminVariables);
          if (adminResult.success) {
            result.sent++;
          } else {
            result.failed++;
          }
        }
        
        // Log customer SMS attempt
        await smsLogs.logSMS({
          type: 'final_disposal_reminder_customer',
          recipient: entry.customerMobile,
          templateId: customerTemplate?.id || '',
          message: 'Final disposal reminder to customer',
          status: customerResult?.success ? 'sent' : 'failed',
          errorMessage: customerResult?.error,
          timestamp: new Date(),
          retryCount: 1,
          entryId: doc.id,
          customerId: entry.customerId,
          locationId: entry.locationId,
          operatorId: entry.operatorId
        });
        
        // Log admin SMS attempt
        await smsLogs.logSMS({
          type: 'final_disposal_reminder_admin',
          recipient: ADMIN_CONFIG.mobile!,
          templateId: adminTemplate?.id || '',
          message: 'Final disposal reminder to admin',
          status: adminResult?.success ? 'sent' : 'failed',
          errorMessage: adminResult?.error,
          timestamp: new Date(),
          retryCount: 1,
          entryId: doc.id,
          customerId: entry.customerId,
          locationId: entry.locationId,
          operatorId: entry.operatorId
        });
        
      } catch (entryError) {
        console.error(`📅 [60DAY] Error processing entry ${doc.id}:`, entryError);
        result.failed++;
      }
    }
    
  } catch (error) {
    console.error('📅 [60DAY] Error in 60-day reminders:', error);
    result.failed++;
  }
  
  return result;
}

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

          // Send SMS to customer
          const customerTemplate = smsTemplates.getTemplateByKey(customerTemplateKey);
          if (customerTemplate && entry.customerMobile) {
            const customerVars = [
              entry.deceasedPersonName || entry.customerName,
              entry.locationName || 'Unknown Location',
              entry.expiryDate || '',
              ADMIN_CONFIG.mobile || 'N/A',
              entry.locationName || 'Unknown Location'
            ].join('|');
            
            try {
              const smsResults = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVars);
              
              if (smsResults.success) {
                successCount++;
                console.log(`✅ [MANUAL] Successfully sent ${reminderType} reminder to ${entry.customerName} (${entry.customerMobile})`);
                
                // Update entry to mark reminder sent
                const updateData: any = {
                  [`${reminderType}ReminderSent`]: true,
                  [`${reminderType}ReminderSentAt`]: admin.firestore.FieldValue.serverTimestamp(),
                  [`${reminderType}ReminderSentBy`]: context.auth.uid
                };
                
                await doc.ref.update(updateData);

                // Log customer SMS
                await smsLogs.logSMS({
                  type: customerTemplateKey,
                  recipient: entry.customerMobile,
                  templateId: customerTemplate.id,
                  message: customerTemplate.name || 'Manual Reminder',
                  status: 'sent',
                  entryId: doc.id,
                  customerId: entry.customerId,
                  locationId: entry.locationId,
                  timestamp: new Date(),
                  retryCount: 0
                });
              } else {
                failureCount++;
                console.error(`❌ [MANUAL] Failed to send ${reminderType} reminder to ${entry.customerName}:`, smsResults.error);
              }
            } catch (error) {
              failureCount++;
              console.error(`❌ [MANUAL] Failed to send ${reminderType} reminder for entry: ${doc.id}`, error);
            }
          } else {
            failureCount++;
            console.error(`❌ [MANUAL] Missing template or customer mobile for entry ${doc.id}`);
          }
      }

      console.log(`📊 [MANUAL] Manual expiry reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: true,
        reminderType,
        processed: entriesSnapshot.size,
        successful: successCount,
        failed: failureCount,
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
    console.log('🔔 [SCHEDULED] Starting 3-day expiry reminders check...');
    
    try {
      const now = new Date();
      // Calculate date 3 days from now
      const reminderDate = new Date(now.getTime() + (EXPIRY_REMINDER_DAYS * 24 * 60 * 60 * 1000));
      const reminderDateStr = reminderDate.toISOString().split('T')[0];
      
      console.log('📅 [SCHEDULED] Checking for entries expiring in 3 days:', {
        reminderDate: reminderDate.toISOString(),
        reminderDateStr: reminderDateStr
      });

      // Query for all active entries, then filter by expiry date in memory using timezone-aware logic
      const allActiveEntries = await db.collection('entries')
        .where('status', '==', 'active')
        .get();

      // Filter entries that expire in 3 days (using the same timezone-aware logic)
      const filteredDocs = filterEntriesByCalendarDate(allActiveEntries.docs, reminderDate);
      const expiringEntries = createSnapshotFromDocs(filteredDocs);

      console.log(`📊 [SCHEDULED] Found ${expiringEntries.size} entries expiring in 3 days after filtering`);

      if (expiringEntries.empty) {
        console.log('✅ [SCHEDULED] No entries require 3-day expiry reminders');
        return null;
      }

      let successCount = 0;
      let failureCount = 0;

      // Process each expiring entry
      for (const doc of expiringEntries.docs) {
        const entry = doc.data();
        
        try {
          console.log(`🔄 [SCHEDULED] Processing 3-day reminder for entry: ${doc.id}`);

          // Send 3-day reminder to customer
          const customerTemplate = smsTemplates.getTemplateByKey('threeDayReminder');
          if (customerTemplate && entry.customerMobile) {
            const customerVariables = [
              entry.deceasedPersonName || entry.customerName,
              entry.locationName || 'Unknown Location',
              reminderDateStr, // Simple date format: 2025-12-20
              ADMIN_CONFIG.mobile || 'N/A',
              entry.locationName || 'Unknown Location'
            ].join('|');
            
            const customerResult = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVariables);
            if (customerResult.success) {
              successCount++;
              console.log(`✅ [SCHEDULED] Successfully sent 3-day reminder to ${entry.customerName} (${entry.customerMobile})`);
            } else {
              failureCount++;
              console.error(`❌ [SCHEDULED] Failed to send 3-day reminder to ${entry.customerName}:`, customerResult.error);
            }
          } else {
            failureCount++;
            console.error(`❌ [SCHEDULED] Missing template or customer mobile for entry ${doc.id}`);
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [SCHEDULED] Failed to send 3-day reminder for entry: ${doc.id}`, error);
        }
      }
      
      console.log(`📊 [SCHEDULED] 3-day expiry reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: successCount > 0,
        message: `Processed ${successCount + failureCount} entries`,
        successCount,
        failureCount,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🔔 [SCHEDULED] Error in 3-day expiry reminders:', error);
      return {
        success: false,
        message: 'Error processing 3-day reminders: ' + error.message,
        successCount: 0,
        failureCount: 1,
        timestamp: new Date().toISOString()
      };
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
      
      console.log('📅 [SCHEDULED] Checking for entries that expired 60+ days ago:', sixtyDaysAgoStr);

      // Query for all active entries, then filter by expiry date in memory using timezone-aware logic
      const allActiveEntries = await db.collection('entries')
        .where('status', '==', 'active')
        .get();

      // Filter entries that expired 60+ days ago (using the same timezone-aware logic)
      const filteredDocs = filterEntriesExpiredByCalendarDate(allActiveEntries.docs, sixtyDaysAgo);
      const expiredEntries = createSnapshotFromDocs(filteredDocs);

      console.log(`📊 [SCHEDULED] Found ${expiredEntries.size} entries expired 60+ days ago after filtering`);

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
          console.log(`🔄 [SCHEDULED] Processing final disposal reminder for entry: ${doc.id}`);

          // Send final disposal reminder to customer
          const customerTemplate = smsTemplates.getTemplateByKey('finalDisposalReminder');
          if (customerTemplate && entry.customerMobile) {
            const customerVariables = [
              entry.deceasedPersonName || entry.customerName,
              entry.locationName || 'Unknown Location',
              entry.locationName || 'Unknown Location'
            ].join('|');
            
            const customerResult = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVariables);
            if (customerResult.success) {
              successCount++;
              console.log(`✅ [SCHEDULED] Successfully sent final disposal reminder to ${entry.customerName} (${entry.customerMobile})`);
            } else {
              failureCount++;
              console.error(`❌ [SCHEDULED] Failed to send final disposal reminder to ${entry.customerName}:`, customerResult.error);
            }
          } else {
            failureCount++;
            console.error(`❌ [SCHEDULED] Missing template or customer mobile for entry ${doc.id}`);
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [SCHEDULED] Failed to send final disposal reminder for entry: ${doc.id}`, error);
        }
      }
      
      console.log(`📊 [SCHEDULED] Final disposal reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: successCount > 0,
        message: `Processed ${successCount + failureCount} entries`,
        successCount,
        failureCount,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🔔 [SCHEDULED] Error in final disposal reminders:', error);
      return {
        success: false,
        message: 'Error processing final disposal reminders: ' + error.message,
        successCount: 0,
        failureCount: 1,
        timestamp: new Date().toISOString()
      };
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
      // For last day reminder, we want entries expiring TOMORROW
      const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];
      
      console.log('📅 [SCHEDULED] Checking for entries expiring tomorrow (last day reminder):', {
        tomorrowDate: tomorrowDate.toISOString(),
        tomorrowDateStr: tomorrowDateStr
      });

      // Query for all active entries, then filter by expiry date in memory
      const allActiveEntries = await db.collection('entries')
        .where('status', '==', 'active')
        .get();

      console.log(`📊 [SCHEDULED] Found ${allActiveEntries.size} total active entries`);

      // Filter entries that expire tomorrow (simple calendar date comparison)
      const filteredDocs = filterEntriesByCalendarDate(allActiveEntries.docs, tomorrowDate);
      const expiringEntries = createSnapshotFromDocs(filteredDocs);

      console.log(`📊 [SCHEDULED] Found ${expiringEntries.size} entries expiring tomorrow after filtering`);

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
          console.log(`🔄 [SCHEDULED] Processing last day reminder for entry: ${doc.id}`);

          // Send last-day reminder to customer
          const customerTemplate = smsTemplates.getTemplateByKey('lastdayRenewal');
          if (customerTemplate && entry.customerMobile) {
            const customerVariables = [
              entry.deceasedPersonName || entry.customerName,
              entry.locationName || 'Unknown Location',
              tomorrowDateStr, // Simple date format: 2025-12-18
              ADMIN_CONFIG.mobile || 'N/A',
              entry.locationName || 'Unknown Location'
            ].join('|');
            
            const customerResult = await sendSMSAPI(entry.customerMobile, customerTemplate.id, customerVariables);
            if (customerResult.success) {
              successCount++;
              console.log(`✅ [SCHEDULED] Successfully sent last day reminder to ${entry.customerName} (${entry.customerMobile})`);
            } else {
              failureCount++;
              console.error(`❌ [SCHEDULED] Failed to send last day reminder to ${entry.customerName}:`, customerResult.error);
            }
          } else {
            failureCount++;
            console.error(`❌ [SCHEDULED] Missing template or customer mobile for entry ${doc.id}`);
          }

        } catch (error) {
          failureCount++;
          console.error(`❌ [SCHEDULED] Failed to send last day reminder for entry: ${doc.id}`, error);
        }
      }
      
      console.log(`📊 [SCHEDULED] Last day expiry reminders completed: ${successCount} successful, ${failureCount} failed`);
      
      return {
        success: successCount > 0,
        message: `Processed ${successCount + failureCount} entries`,
        successCount,
        failureCount,
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

export const testExpiryReminders = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .https.onCall(async (data, context) => {
    console.log('🧪 [TEST] Starting test expiry reminders...');
    
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const { reminderTypes = ['3day', 'lastday', '60day'] } = data || {};
      
      const results = {
        threeDayReminders: { sent: 0, failed: 0 },
        lastDayReminders: { sent: 0, failed: 0 },
        finalDisposalReminders: { sent: 0, failed: 0 }
      };
      
      // Process 3-day reminders
      if (reminderTypes.includes('3day')) {
        console.log('🧪 [TEST] Processing 3-day expiry reminders...');
        const threeDayResult = await processThreeDayReminders();
        results.threeDayReminders = threeDayResult;
      }
      
      // Process last-day reminders
      if (reminderTypes.includes('lastday')) {
        console.log('🧪 [TEST] Processing last-day expiry reminders...');
        const lastDayResult = await processLastDayReminders();
        results.lastDayReminders = lastDayResult;
      }
      
      // Process 60-day final disposal reminders
      if (reminderTypes.includes('60day')) {
        console.log('🧪 [TEST] Processing 60-day final disposal reminders...');
        const finalDisposalResult = await processFinalDisposalReminders();
        results.finalDisposalReminders = finalDisposalResult;
      }
      
      console.log('🧪 [TEST] Test expiry reminders completed:', results);
      
      return {
        success: true,
        message: 'Test expiry reminders processed successfully',
        results: results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🧪 [TEST] Error in test expiry reminders:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process test expiry reminders'
      );
    }
  });

/**
 * Debug Expiry Dates - Inspect actual expiry dates in the database
 */
export const debugExpiryDates = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60
  })
  .https.onCall(async (data, context) => {
    console.log('🔍 [DEBUG_EXPIRY] Starting expiry date debug...');
    
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const now = new Date();
      const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0];
      
      console.log('🔍 [DEBUG_EXPIRY] Current UTC time:', now.toISOString());
      console.log('🔍 [DEBUG_EXPIRY] Tomorrow date (UTC):', tomorrowDate.toISOString());
      console.log('🔍 [DEBUG_EXPIRY] Tomorrow date string:', tomorrowDateStr);
      
      // Query for all active entries
      const allActiveSnapshot = await db.collection('entries')
        .where('status', '==', 'active')
        .get();
      
      console.log('🔍 [DEBUG_EXPIRY] Found', allActiveSnapshot.size, 'active entries');
      
      const expiryDateAnalysis = {
        totalEntries: allActiveSnapshot.size,
        entriesWithExpiryDate: 0,
        entriesWithoutExpiryDate: 0,
        entriesExpiringTomorrow: 0,
        expiryDateFormats: {},
        sampleEntries: []
      };
      
      allActiveSnapshot.docs.forEach((doc, index) => {
        const entry = doc.data();
        const expiryDate = entry.expiryDate;
        
        if (!expiryDate) {
          expiryDateAnalysis.entriesWithoutExpiryDate++;
          return;
        }
        
        expiryDateAnalysis.entriesWithExpiryDate++;
        
        // Analyze expiry date format
        const format = typeof expiryDate;
        if (!expiryDateAnalysis.expiryDateFormats[format]) {
          expiryDateAnalysis.expiryDateFormats[format] = 0;
        }
        expiryDateAnalysis.expiryDateFormats[format]++;
        
        // Convert to date string for comparison using timezone-aware logic
        let expiryDateStr = 'N/A';
        if (expiryDate instanceof Date) {
          const expiryDateObj = expiryDate;
          const istOffset = 5.5 * 60 * 60 * 1000;
          const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
          expiryDateStr = expiryDateIST.toISOString().split('T')[0];
        } else if (expiryDate && typeof expiryDate === 'object') {
          try {
            let expiryDateObj: Date;
            if (expiryDate.toDate && typeof expiryDate.toDate === 'function') {
              expiryDateObj = expiryDate.toDate();
            } else if (expiryDate._seconds !== undefined) {
              expiryDateObj = new Date(expiryDate._seconds * 1000 + (expiryDate._nanoseconds || 0) / 1000000);
            } else {
              expiryDateStr = 'Unknown format';
              return;
            }
            const istOffset = 5.5 * 60 * 60 * 1000;
            const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
            expiryDateStr = expiryDateIST.toISOString().split('T')[0];
          } catch (error) {
            expiryDateStr = 'Conversion error';
            return;
          }
        }
        
        // Check if expires tomorrow
        if (expiryDateStr === tomorrowDateStr) {
          expiryDateAnalysis.entriesExpiringTomorrow++;
        }
        
        // Add sample entries (first 5)
        if (index < 5) {
          expiryDateAnalysis.sampleEntries.push({
            id: doc.id,
            customerName: entry.customerName,
            expiryDate: expiryDate,
            expiryDateType: typeof expiryDate,
            expiryDateStr: expiryDateStr,
            expiresTomorrow: expiryDateStr === tomorrowDateStr,
            status: entry.status
          });
        }
      });
      
      console.log('🔍 [DEBUG_EXPIRY] Analysis complete:', expiryDateAnalysis);
      
      return {
        success: true,
        message: 'Debug completed successfully',
        analysis: expiryDateAnalysis
      };
      
    } catch (error) {
      console.error('🔍 [DEBUG_EXPIRY] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Error debugging expiry dates: ' + error.message
      );
    }
  });

/**
 * Add Test Entry - Create test entries for debugging expiry reminders
 */
export const addTestEntry = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60
  })
  .https.onCall(async (data, context) => {
    console.log('🧪 [ADD_TEST] Starting add test entry...');
    
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const { testType = 'today' } = data || {};
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let testEntry;
      
      if (testType === 'today') {
        // Create entry that expires TOMORROW for testing last-day reminders
        const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        
        testEntry = {
          customerName: 'Test Tomorrow Expiry',
          mobile: '+919014882779',
          deceasedPersonName: 'Test Tomorrow Expiry',
          customerId: 'test_customer_tomorrow',
          locationId: 'bNjk6zT0Nd3w87Bv1yQI',
          locationName: 'ఇన్నీసుపేట – కైలాసభూమి',
          entryDate: todayStart,
          expiryDate: tomorrowDate, // Expires TOMORROW for last-day test
          status: 'active',
          totalPots: 1,
          remainingPots: 1,
          operatorId: context.auth.uid,
          createdAt: admin.firestore.Timestamp.now(),
          months: 1,
          type: 'entry',
          potsPerLocker: 1,
          lockerNumber: 1,
          lockerDetails: [],
          dispatchedPots: [],
          renewals: [],
          payments: [{
            amount: 500,
            date: todayStart,
            method: 'cash',
            description: 'Test entry for today expiry'
          }]
        };
      } else if (testType === '3days') {
        // Create entry that expires in 3 days for testing 3-day reminders
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
        const threeDaysStart = new Date(threeDaysFromNow.getFullYear(), threeDaysFromNow.getMonth(), threeDaysFromNow.getDate());
        
        testEntry = {
          customerName: 'Test 3-Day Expiry',
          mobile: '+919014882779',
          deceasedPersonName: 'Test 3-Day Expiry',
          customerId: 'test_customer_3days',
          locationId: 'bNjk6zT0Nd3w87Bv1yQI',
          locationName: 'ఇన్నీసుపేట – కైలాసభూమి',
          entryDate: threeDaysStart,
          expiryDate: threeDaysStart, // Expires in 3 days
          status: 'active',
          totalPots: 1,
          remainingPots: 1,
          operatorId: context.auth.uid,
          createdAt: admin.firestore.Timestamp.now(),
          months: 1,
          type: 'entry',
          potsPerLocker: 1,
          lockerNumber: 1,
          lockerDetails: [],
          dispatchedPots: [],
          renewals: [],
          payments: [{
            amount: 500,
            date: threeDaysStart,
            method: 'cash',
            description: 'Test entry for 3-day expiry'
          }]
        };
      } else if (testType === '60days') {
        // Create entry that expired 60 days ago for testing final disposal reminders
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
        const sixtyDaysStart = new Date(sixtyDaysAgo.getFullYear(), sixtyDaysAgo.getMonth(), sixtyDaysAgo.getDate());
        
        testEntry = {
          customerName: 'Test 60-Day Expired',
          mobile: '+919014882779',
          deceasedPersonName: 'Test 60-Day Expired',
          customerId: 'test_customer_60days',
          locationId: 'bNjk6zT0Nd3w87Bv1yQI',
          locationName: 'ఇన్నీసుపేట – కైలాసభూమి',
          entryDate: sixtyDaysStart,
          expiryDate: sixtyDaysStart, // Expired 60 days ago
          status: 'active',
          totalPots: 1,
          remainingPots: 1,
          operatorId: context.auth.uid,
          createdAt: admin.firestore.Timestamp.now(),
          months: 1,
          type: 'entry',
          potsPerLocker: 1,
          lockerNumber: 1,
          lockerDetails: [],
          dispatchedPots: [],
          renewals: [],
          payments: [{
            amount: 500,
            date: sixtyDaysStart,
            method: 'cash',
            description: 'Test entry for 60-day expiry'
          }]
        };
      }
      
      // Add the test entry
      const docRef = await db.collection('entries').add(testEntry);
      
      console.log('🧪 [ADD_TEST] Test entry added:', {
        id: docRef.id,
        testType: testType,
        expiryDate: testEntry.expiryDate,
        entryDate: testEntry.entryDate
      });
      
      return {
        success: true,
        message: `Test ${testType} entry created successfully`,
        entryId: docRef.id,
        testEntry: {
          id: docRef.id,
          expiryDate: testEntry.expiryDate,
          expiryDateReadable: testEntry.expiryDate instanceof Date ? testEntry.expiryDate.toDateString() : 'N/A'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🧪 [ADD_TEST] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });
export const debugEntries = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60
  })
  .https.onCall(async (data, context) => {
    console.log('🔍 [DEBUG] Starting entries debug...');
    
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      const now = new Date();
      console.log('🔍 [DEBUG] Current time:', now.toISOString());
      
      // Get all active entries to check their data
      const allEntriesSnapshot = await db.collection('entries')
        .where('status', '==', 'active')
        .limit(10) // Limit to first 10 for debugging
        .get();
      
      console.log(`🔍 [DEBUG] Found ${allEntriesSnapshot.size} active entries`);
      
      const entries = [];
      for (const doc of allEntriesSnapshot.docs) {
        const entry = doc.data();
        
        // Convert Firestore timestamp to readable date for debugging
        let readableExpiryDate = 'N/A';
        if (entry.expiryDate && typeof entry.expiryDate === 'object' && entry.expiryDate._seconds) {
          const expiryDateFromTimestamp = new Date(entry.expiryDate._seconds * 1000 + entry.expiryDate._nanoseconds / 1000000);
          readableExpiryDate = expiryDateFromTimestamp.toISOString().split('T')[0];
        }
        
        entries.push({
          id: doc.id,
          customerName: entry.customerName,
          customerMobile: entry.customerMobile,
          expiryDate: entry.expiryDate,
          expiryDateType: typeof entry.expiryDate,
          expiryDateObj: entry.expiryDate instanceof Date ? 'Date object' : 'Other',
          readableExpiryDate: readableExpiryDate,
          locationName: entry.locationName,
          status: entry.status
        });
      }
      
      // Test date calculations
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
      
      return {
        success: true,
        message: 'Debug completed successfully',
        currentTime: now.toISOString(),
        dateTests: {
          threeDaysFromNow: {
            calculation: '+3 days',
            targetDate: threeDaysFromNow.toISOString().split('T')[0],
            entryMatches: entries.filter(e => {
              // Use the same timezone-aware logic as the main functions
              let expiryDateObj: Date;
              if (e.expiryDate instanceof Date) {
                expiryDateObj = e.expiryDate;
              } else if (e.expiryDate && typeof e.expiryDate === 'object' && e.expiryDate._seconds !== undefined) {
                expiryDateObj = new Date(e.expiryDate._seconds * 1000 + (e.expiryDate._nanoseconds || 0) / 1000000);
              } else {
                return false;
              }
              
              // Convert to IST for comparison
              const istOffset = 5.5 * 60 * 60 * 1000;
              const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
              const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
              const targetDateStr = threeDaysFromNow.toISOString().split('T')[0];
              return expiryDateStr === targetDateStr;
            }).length
          },
          tomorrow: {
            calculation: 'Tomorrow (Last Day Reminder)',
            targetDate: tomorrowDate.toISOString().split('T')[0],
            entryMatches: entries.filter(e => {
              // Use the same timezone-aware logic as the main functions
              let expiryDateObj: Date;
              if (e.expiryDate instanceof Date) {
                expiryDateObj = e.expiryDate;
              } else if (e.expiryDate && typeof e.expiryDate === 'object' && e.expiryDate._seconds !== undefined) {
                expiryDateObj = new Date(e.expiryDate._seconds * 1000 + (e.expiryDate._nanoseconds || 0) / 1000000);
              } else {
                return false;
              }
              
              // Convert to IST for comparison
              const istOffset = 5.5 * 60 * 60 * 1000;
              const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
              const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
              const targetDateStr = tomorrowDate.toISOString().split('T')[0];
              return expiryDateStr === targetDateStr;
            }).length
          },
          today: {
            calculation: 'Today (Expiring Today)',
            targetDate: todayDate.toISOString().split('T')[0],
            entryMatches: entries.filter(e => {
              // Use the same timezone-aware logic as the main functions
              let expiryDateObj: Date;
              if (e.expiryDate instanceof Date) {
                expiryDateObj = e.expiryDate;
              } else if (e.expiryDate && typeof e.expiryDate === 'object' && e.expiryDate._seconds !== undefined) {
                expiryDateObj = new Date(e.expiryDate._seconds * 1000 + (e.expiryDate._nanoseconds || 0) / 1000000);
              } else {
                return false;
              }
              
              // Convert to IST for comparison
              const istOffset = 5.5 * 60 * 60 * 1000;
              const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
              const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
              const targetDateStr = todayDate.toISOString().split('T')[0];
              return expiryDateStr === targetDateStr;
            }).length
          },
          expired: {
            calculation: 'Expired (before today)',
            targetDate: todayDate.toISOString().split('T')[0],
            entryMatches: entries.filter(e => {
              // Use the same timezone-aware logic as the main functions
              let expiryDateObj: Date;
              if (e.expiryDate instanceof Date) {
                expiryDateObj = e.expiryDate;
              } else if (e.expiryDate && typeof e.expiryDate === 'object' && e.expiryDate._seconds !== undefined) {
                expiryDateObj = new Date(e.expiryDate._seconds * 1000 + (e.expiryDate._nanoseconds || 0) / 1000000);
              } else {
                return false;
              }
              
              // Convert to IST for comparison
              const istOffset = 5.5 * 60 * 60 * 1000;
              const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
              const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
              const targetDateStr = todayDate.toISOString().split('T')[0];
              return expiryDateStr < targetDateStr;
            }).length
          },
          sixtyDaysAgo: {
            calculation: '-60 days (60+ days ago)',
            targetDate: sixtyDaysAgo.toISOString().split('T')[0],
            entryMatches: entries.filter(e => {
              // Use the same timezone-aware logic as the main functions
              let expiryDateObj: Date;
              if (e.expiryDate instanceof Date) {
                expiryDateObj = e.expiryDate;
              } else if (e.expiryDate && typeof e.expiryDate === 'object' && e.expiryDate._seconds !== undefined) {
                expiryDateObj = new Date(e.expiryDate._seconds * 1000 + (e.expiryDate._nanoseconds || 0) / 1000000);
              } else {
                return false;
              }
              
              // Convert to IST for comparison
              const istOffset = 5.5 * 60 * 60 * 1000;
              const expiryDateIST = new Date(expiryDateObj.getTime() + istOffset);
              const expiryDateStr = expiryDateIST.toISOString().split('T')[0];
              const targetDateStr = sixtyDaysAgo.toISOString().split('T')[0];
              return expiryDateStr <= targetDateStr;
            }).length
          }
        },
        entries: entries,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🔍 [DEBUG] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });
export const simpleTest = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60
  })
  .https.onCall(async (data, context) => {
    console.log('🧪 [SIMPLE] Starting simple test...');
    
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }
    
    try {
      console.log('🧪 [SIMPLE] Auth check passed');
      console.log('🧪 [SIMPLE] Testing basic operations...');
      
      // Test 1: Basic database connection
      const testDoc = await db.collection('entries').limit(1).get();
      console.log(`🧪 [SIMPLE] Database test: Found ${testDoc.size} entries`);
      
      // Test 2: Config access
      console.log('🧪 [SIMPLE] Config test:', {
        hasApiKey: !!FASTSMS_CONFIG.apiKey,
        hasSenderId: !!FASTSMS_CONFIG.senderId,
        hasAdminMobile: !!ADMIN_CONFIG.mobile
      });
      
      // Test 3: SMS Templates access
      const testTemplate = smsTemplates.getTemplateByKey('threeDayReminder');
      console.log('🧪 [SIMPLE] Template test:', {
        hasTemplate: !!testTemplate,
        templateId: testTemplate?.id
      });
      
      return {
        success: true,
        message: 'Simple test completed successfully',
        tests: {
          database: `Found ${testDoc.size} entries`,
          config: {
            hasApiKey: !!FASTSMS_CONFIG.apiKey,
            hasSenderId: !!FASTSMS_CONFIG.senderId,
            hasAdminMobile: !!ADMIN_CONFIG.mobile
          },
          template: {
            hasTemplate: !!testTemplate,
            templateId: testTemplate?.id
          }
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('🧪 [SIMPLE] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });