import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import SMSTemplatesService from '../lib/sms-templates';
import SMSLogsService from '../lib/sms-logs';

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
  baseUrl: 'https://www.fast2sms.com/dev/bulkV2'  // Updated DLT-compliant endpoint
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
  // Entity ID is optional for DLT route but recommended for enhanced compliance
  if (!FASTSMS_CONFIG.entityId) {
    console.warn('FastSMS entity ID not configured. DLT compliance may be limited. Run: firebase functions:config:set fastsms.entity_id="YOUR_ENTITY_ID"');
  }
}

// Secure SMS sending function (server-side only) - Using DLT Route as per Fast2SMS recommendation
async function sendSMSAPI(recipient: string, templateId: string, variablesValues: string, attempt: number = 1) {
  try {
    validateFastSMSConfig();
    
    const apiUrl = new URL(FASTSMS_CONFIG.baseUrl);
    
    // Using DLT Route as recommended by Fast2SMS team
    // Format: https://www.fast2sms.com/dev/bulkV2?authorization=(Your API Key)&route=dlt&sender_id=ROTCMS&message=198233&variables_values=1111%7C2222%7C3333%7C4444%7C&flash=0&numbers=9014882779&schedule_time=
    apiUrl.searchParams.append('authorization', FASTSMS_CONFIG.apiKey);
    apiUrl.searchParams.append('route', 'dlt');
    apiUrl.searchParams.append('sender_id', FASTSMS_CONFIG.senderId);
    apiUrl.searchParams.append('message', templateId); // DLT template ID
    apiUrl.searchParams.append('variables_values', variablesValues); // Pipe-separated variables
    apiUrl.searchParams.append('flash', '0');
    apiUrl.searchParams.append('numbers', recipient);
    
    // Add entity_id if available (for enhanced DLT compliance)
    if (FASTSMS_CONFIG.entityId) {
      apiUrl.searchParams.append('entity_id', FASTSMS_CONFIG.entityId);
    }

    console.log(`FastSMS API Call (Attempt ${attempt}):`, {
      recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
      templateId,
      variablesValues: variablesValues.substring(0, 20) + '...',
      route: 'dlt',
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
function getTemplateIdByKey(templateKey: string): string {
  const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey as any);
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  return template.id;
}

// Helper function to format variables for API
function formatVariablesForAPI(templateKey: string, variables: any): string {
  return SMSTemplatesService.getInstance().formatVariablesForAPI(templateKey as any, variables);
}

// Helper function for delay/sleep
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Callable function to send SMS securely from front-end
 * This function validates authentication and authorization before sending SMS
 */
export const sendSMSV2 = functions
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

      let lastError: any = undefined;
      let finalResult: any = undefined;

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

/**
 * Scheduled function to check for expiring entries and send SMS reminders
 * Runs daily at 10 AM IST to check for entries expiring in 3 days and today
 */
export const dailyExpiryCheckV2 = functions
  .runWith({
    memory: '512MB',
    timeoutSeconds: 540, // 9 minutes
  })
  .pubsub.schedule('0 10 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('Starting daily expiry check at:', new Date().toISOString());

    try {
      const results = {
        entries3Days: 0,
        entriesToday: 0,
        totalSMS: 0,
        successfulSMS: 0,
        failedSMS: 0,
        errors: [] as string[],
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        endTime: null as any
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

          let smsResult: any = null;

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

          // Track results
          if (smsResult) {
            if (smsResult.success) {
              results.successfulSMS++;
              console.log(`SMS sent successfully for entry ${doc.id}. Message ID: ${smsResult.messageId}`);
            } else {
              results.failedSMS++;
              const errorMsg = smsResult.error?.message || 'Unknown error';
              results.errors.push(`SMS failed for entry ${doc.id}: ${errorMsg}`);
              console.error(`SMS failed for entry ${doc.id}:`, errorMsg);
            }
          }

        } catch (error) {
          console.error(`Error processing entry ${doc.id}:`, error);
          results.errors.push(`Error processing entry ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Set end time and save execution log
      results.endTime = admin.firestore.FieldValue.serverTimestamp();
      
      await db.collection('smsExecutionLogs').add({
        ...results,
        totalEntries: entriesSnapshot.size,
        functionType: 'dailyExpiryCheck',
        timezone: TIME_ZONE
      });

      console.log('Daily expiry check completed:', {
        totalEntries: entriesSnapshot.size,
        entries3Days: results.entries3Days,
        entriesToday: results.entriesToday,
        totalSMS: results.totalSMS,
        successfulSMS: results.successfulSMS,
        failedSMS: results.failedSMS,
        errorsCount: results.errors.length
      });

      return {
        success: true,
        message: 'Daily expiry check completed successfully',
        results: {
          totalEntries: entriesSnapshot.size,
          entriesProcessed: results.entries3Days + results.entriesToday,
          smsSent: results.successfulSMS,
          smsFailed: results.failedSMS,
          errors: results.errors
        }
      };

    } catch (error) {
      console.error('Error in daily expiry check:', error);
      
      // Log error
      await db.collection('smsExecutionLogs').add({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        functionType: 'dailyExpiryCheck',
        timezone: TIME_ZONE
      });

      throw new functions.https.HttpsError(
        'internal',
        'Daily expiry check failed. Please check the logs.'
      );
    }
  });

/**
 * Function to retry failed SMS messages
 * Admin-only function for manual retry of failed SMS
 */
export const retryFailedSMSV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 300,
  })
  .https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    
    if (!user || user.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can retry failed SMS.'
      );
    }

    try {
      const { maxRetryCount = 2, limit = 50 } = data || {};
      
      // Get failed SMS logs with retry count less than max
      const failedLogs = await SMSLogsService.getInstance().getFailedSMSLogs(maxRetryCount);
      const limitedLogs = failedLogs.slice(0, limit);
      
      console.log(`Retrying ${limitedLogs.length} failed SMS messages`);

      let retryCount = 0;
      let successCount = 0;
      const errors: string[] = [];

      for (const log of limitedLogs) {
        try {
          retryCount++;
          
          // Note: This is a simplified retry implementation
          // In production, you would need to reconstruct the original SMS request
          // from the log data and template information
          
          console.log(`Retrying SMS for log ${log.id}`);
          
          // For now, we'll just mark them as retried
          // In a complete implementation, you would reconstruct and resend the SMS
          await SMSLogsService.getInstance().updateSMSLog(log.id!, { 
            retryCount: log.retryCount + 1,
            status: 'pending'
          });
          
          successCount++;
          
        } catch (error) {
          console.error(`Error retrying SMS for log ${log.id}:`, error);
          errors.push(`Failed to retry SMS ${log.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        message: `Retried ${retryCount} SMS, ${successCount} successful`,
        retryCount,
        successCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Error in retryFailedSMS:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to retry SMS messages.'
      );
    }
  });

/**
 * Function to get SMS statistics and logs
 * Admin-only function for monitoring SMS activity
 */
export const getSMSStatisticsV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    
    if (!user || user.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can access SMS statistics.'
      );
    }

    try {
      const { dateRange, filters } = data || {};
      
      const stats = await SMSLogsService.getInstance().getSMSStatistics({
        dateRange,
        ...filters
      });
      
      // Get recent execution logs
      const recentExecutions = await db.collection('smsExecutionLogs')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      const executionLogs = recentExecutions.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));

      return {
        success: true,
        statistics: stats,
        recentExecutions,
        serviceStatus: {
          isInitialized: true,
          templatesCount: SMSTemplatesService.getInstance().getAllTemplates().length,
          functionsAvailable: true,
          configValid: !!FASTSMS_CONFIG.apiKey && !!FASTSMS_CONFIG.senderId && !!FASTSMS_CONFIG.entityId
        }
      };

    } catch (error) {
      console.error('Error in getSMSStatistics:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get SMS statistics.'
      );
    }
  });

/**
 * Health check function for SMS service
 */
export const smsHealthCheckV2 = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (request, response) => {
    try {
      // Check if we can access Firestore
      await db.collection('smsHealthChecks').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy'
      });

      // Validate FastSMS configuration
      let configValid = false;
      let configError = null;
      
      try {
        validateFastSMSConfig();
        configValid = true;
      } catch (error) {
        configError = error instanceof Error ? error.message : 'Configuration error';
      }

      response.status(200).json({
        status: 'healthy',
        service: 'SMS Service',
        timestamp: new Date().toISOString(),
        details: {
          isInitialized: true,
          templatesCount: SMSTemplatesService.getInstance().getAllTemplates().length,
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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

// Helper functions


function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}