import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import SMSTemplatesService from './lib/sms-templates';
import SMSLogsService from './lib/sms-logs';

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
      templateIdLength: templateId.length,
      variablesValues: variablesValues.substring(0, 20) + '...',
      variablesCount: variablesValues.split('|').length,
      route: 'dlt',
      hasEntityId: !!FASTSMS_CONFIG.entityId,
      entityId: FASTSMS_CONFIG.entityId ? FASTSMS_CONFIG.entityId.substring(0, 8) + '****' : 'NOT_SET',
      senderId: FASTSMS_CONFIG.senderId,
      url: apiUrl.toString().substring(0, 100) + '...'
    });

    const response = await axios.get(apiUrl.toString(), {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Rotary-CMS/1.0'
      }
    });

    console.log('FastSMS API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      return: response.data.return,
      request_id: response.data.request_id,
      message: response.data.message
    });

    if (response.data.return === true) {
      return {
        success: true,
        messageId: response.data.request_id
      };
    } else {
      // Enhanced error details
      const errorDetails = {
        type: 'API_ERROR',
        message: response.data.message || 'SMS sending failed',
        code: 'API_ERROR',
        details: response.data,
        timestamp: new Date(),
        debugInfo: {
          templateId,
          templateIdFormat: /^\d+$/.test(templateId) ? 'VALID_NUMERIC' : 'INVALID_FORMAT',
          recipientFormat: /^[6-9]\d{9}$/.test(recipient) ? 'VALID_MOBILE' : 'INVALID_MOBILE',
          variablesFormat: variablesValues.split('|').length > 0 ? 'VALID_VARIABLES' : 'INVALID_VARIABLES',
          apiEndpoint: apiUrl.toString()
        }
      };
      
      console.error('FastSMS API Error Details:', errorDetails);
      throw errorDetails;
    }

  } catch (error) {
    console.error('FastSMS API Error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const responseData = error.response?.data;

      let errorType = 'API_ERROR';
      if (status === 401) errorType = 'AUTHENTICATION_ERROR';
      else if (status === 429) errorType = 'RATE_LIMIT_ERROR';
      else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        errorType = 'NETWORK_ERROR';
      }

      const enhancedError = {
        success: false,
        error: {
          type: errorType,
          message: `FastSMS API Error: ${message}`,
          code: status?.toString(),
          details: responseData,
          timestamp: new Date(),
          debugInfo: {
            templateId,
            recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
            axiosError: {
              status,
              statusText: error.response?.statusText,
              config: {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout
              }
            }
          }
        }
      };

      console.error('Enhanced FastSMS Error:', enhancedError);
      return enhancedError;
    } else {
      const enhancedError = {
        success: false,
        error: {
          type: 'UNKNOWN',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date(),
          debugInfo: {
            templateId,
            recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
            errorType: typeof error,
            errorMessage: error instanceof Error ? error.message : 'Non-error object',
            errorStack: error instanceof Error ? error.stack : undefined
          }
        }
      };

      console.error('Enhanced Unknown Error:', enhancedError);
      return enhancedError;
    }
  }
}

// Helper function to get template ID by key
function getTemplateIdByKey(templateKey: string): string {
  const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey as any);
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }
  
  // Log template details for debugging
  console.log('Template details:', {
    key: template.key,
    id: template.id,
    name: template.name,
    variableCount: template.variableCount,
    isActive: template.isActive
  });
  
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
 * Simple test function to verify deployment works
 */
export const testFunction = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    console.log('Test function called with data:', JSON.stringify(data, null, 2));
    
    try {
      // Simple test response
      return {
        success: true,
        message: 'Test function executed successfully',
        timestamp: new Date().toISOString(),
        data: data
      };
    } catch (error) {
      console.error('Error in test function:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Test function failed'
      );
    }
  });

/**
 * Health check function
 */
export const healthCheck = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    try {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
              messageId: (apiResult as any).messageId,
              timestamp: new Date().toISOString()
            };

            console.log(`SMS sent successfully on attempt ${attempt}. Message ID: ${(apiResult as any).messageId}`);
            break;
          } else {
            lastError = (apiResult as any).error;
            
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
        messageId: finalResult.messageId || null,
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
        messageId: null,
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

          if (isExpiringIn3Days || isExpiringToday) {
            if (isExpiringIn3Days) results.entries3Days++;
            if (isExpiringToday) results.entriesToday++;

            // Prepare SMS variables
            const smsVariables = {
              var1: entry.deceasedName || 'N/A',
              var2: location.name || 'N/A',
              var3: expiryDate.toLocaleDateString('en-GB'),
              var4: customer.mobile || 'N/A',
              var5: location.name || 'N/A'
            };

            // Determine template based on days until expiry
            const templateKey = isExpiringIn3Days ? 'threeDayReminder' : 'lastdayRenewal';

            console.log(`Sending ${templateKey} SMS for entry ${doc.id}`, {
              deceasedName: entry.deceasedName,
              location: location.name,
              expiryDate: expiryDate.toLocaleDateString('en-GB'),
              mobile: customer.mobile ? customer.mobile.substring(0, 4) + '****' + customer.mobile.substring(-4) : 'N/A'
            });

            // Send SMS
            const templateId = getTemplateIdByKey(templateKey);
            const variablesValues = formatVariablesForAPI(templateKey, smsVariables);

            const smsResult = await sendSMSAPI(customer.mobile, templateId, variablesValues);

            results.totalSMS++;

            if (smsResult.success) {
              results.successfulSMS++;
              
              // Log successful SMS
              await smsLogsService.logSMS({
                type: templateKey,
                recipient: customer.mobile,
                templateId,
                message: variablesValues,
                status: 'sent',
                timestamp: new Date(),
                retryCount: 0,
                entryId: doc.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                operatorId: 'system'
              });

              console.log(`SMS sent successfully for entry ${doc.id}`);
            } else {
              results.failedSMS++;
              
              // Log failed SMS
              await smsLogsService.logSMS({
                type: templateKey,
                recipient: customer.mobile,
                templateId,
                message: variablesValues,
                status: 'failed',
                errorMessage: (smsResult as any).error?.message || 'Unknown error',
                timestamp: new Date(),
                retryCount: 0,
                entryId: doc.id,
                customerId: entry.customerId,
                locationId: entry.locationId,
                operatorId: 'system'
              });

              console.error(`SMS failed for entry ${doc.id}:`, (smsResult as any).error);
              results.errors.push(`SMS failed for entry ${doc.id}: ${(smsResult as any).error?.message || 'Unknown error'}`);
            }
          }
        } catch (error) {
          console.error(`Error processing entry ${doc.id}:`, error);
          results.errors.push(`Error processing entry ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      results.endTime = admin.firestore.FieldValue.serverTimestamp();

      // Log the daily check results
      await db.collection('dailyExpiryChecks').add({
        ...results,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('Daily expiry check completed:', results);

      return null;
    } catch (error) {
      console.error('Error in daily expiry check:', error);
      throw new Error(`Daily expiry check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

/**
 * Function to retry failed SMS messages
 */
export const retryFailedSMSV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 300, // 5 minutes
  })
  .https.onCall(async (data, context) => {
    console.log('retryFailedSMS called with data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Get user details for authorization
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

      // Get failed SMS logs that haven't exceeded max retry count
      const failedLogs = await smsLogsService.getFailedSMSLogs(maxRetryCount);
      const logsToProcess = failedLogs.slice(0, limit);

      console.log(`Found ${logsToProcess.length} failed SMS logs to retry`);

      const results = {
        total: logsToProcess.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const log of logsToProcess) {
        try {
          console.log(`Retrying SMS for log ${log.id} (attempt ${log.retryCount + 1})`);

          // Retry sending the SMS
          const smsResult = await sendSMSAPI(log.recipient, log.templateId, log.message, log.retryCount + 1);

          if (smsResult.success) {
            results.successful++;
            
            // Update the log to mark as sent
            await smsLogsService.updateSMSLog(log.id, {
              status: 'sent',
              retryCount: log.retryCount + 1
            });

            console.log(`SMS retry successful for log ${log.id}`);
          } else {
            results.failed++;
            
            // Update the log to increment retry count
            await smsLogsService.updateSMSLog(log.id, {
              retryCount: log.retryCount + 1,
              errorMessage: (smsResult as any).error?.message || 'Retry failed'
            });

            console.error(`SMS retry failed for log ${log.id}:`, (smsResult as any).error);
            results.errors.push(`Retry failed for log ${log.id}: ${(smsResult as any).error?.message || 'Unknown error'}`);
          }
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Error retrying SMS for log ${log.id}: ${errorMessage}`);
          
          // Update the log to increment retry count
          await smsLogsService.updateSMSLog(log.id, {
            retryCount: log.retryCount + 1,
            errorMessage: errorMessage
          });

          console.error(`Error retrying SMS for log ${log.id}:`, error);
        }
      }

      console.log('SMS retry completed:', results);

      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in retryFailedSMS function:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to retry SMS messages. Please try again later.'
      );
    }
  });

/**
 * Function to get SMS statistics
 */
export const getSMSStatisticsV2 = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    console.log('getSMSStatistics called with data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();

    if (!user) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found.'
      );
    }

    try {
      const { dateRange, locationId, type } = data || {};

      const filters: any = {};
      if (dateRange) {
        filters.dateRange = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        };
      }
      if (locationId) filters.locationId = locationId;
      if (type) filters.type = type;

      // If user is operator, restrict to their locations
      if (user.role === 'operator' && user.locationIds) {
        filters.locationId = { $in: user.locationIds };
      }

      const stats = await smsLogsService.getSMSStatistics(filters);

      return {
        success: true,
        statistics: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getSMSStatistics function:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get SMS statistics. Please try again later.'
      );
    }
  });

/**
 * SMS-specific health check function
 */
export const smsHealthCheckV2 = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'sms-service',
        version: '2.0.0',
        checks: {
          fastsms_config: {
            status: FASTSMS_CONFIG.apiKey ? 'configured' : 'missing',
            has_sender_id: !!FASTSMS_CONFIG.senderId,
            has_entity_id: !!FASTSMS_CONFIG.entityId,
            error: null as string | null
          },
          database: 'connected',
          templates: 'loaded'
        }
      };

      // Test FastSMS configuration if available
      if (FASTSMS_CONFIG.apiKey) {
        try {
          validateFastSMSConfig();
          healthStatus.checks.fastsms_config.status = 'valid';
        } catch (error) {
          healthStatus.checks.fastsms_config.status = 'invalid';
          healthStatus.checks.fastsms_config.error = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      res.status(200).json(healthStatus);
    } catch (error) {
      console.error('SMS health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        service: 'sms-service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

/**
 * Debug function to test template configuration
 * This function helps identify template configuration issues
 */
export const debugTemplateConfig = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    console.log('debugTemplateConfig called with data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();

    if (!user || user.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can debug template configuration.'
      );
    }

    try {
      const { templateKey, testMobile } = data || {};

      // Get all templates
      const allTemplates = SMSTemplatesService.getInstance().getAllTemplates();
      
      // Validate FastSMS configuration
      let configStatus = 'unknown';
      let configError = null;
      try {
        validateFastSMSConfig();
        configStatus = 'valid';
      } catch (error) {
        configStatus = 'invalid';
        configError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Template-specific debug info
      let templateDebug = null;
      if (templateKey) {
        const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey as any);
        if (template) {
          templateDebug = {
            key: template.key,
            id: template.id,
            name: template.name,
            description: template.description,
            variableCount: template.variableCount,
            isActive: template.isActive,
            category: template.category,
            idFormat: /^\d+$/.test(template.id) ? 'VALID_NUMERIC' : 'INVALID_FORMAT',
            idLength: template.id.length,
            variables: template.variables.map(v => ({
              name: v.name,
              description: v.description,
              required: v.required,
              position: v.position
            }))
          };
        }
      }

      // Test template ID format validation
      const templateIdValidation = allTemplates.map(template => ({
        key: template.key,
        id: template.id,
        isValidFormat: /^\d+$/.test(template.id),
        length: template.id.length,
        isActive: template.isActive
      }));

      // Test actual API call if requested
      let apiTestResult = null;
      if (templateKey && testMobile) {
        try {
          console.log(`Testing API call for template: ${templateKey}, mobile: ${testMobile}`);
          
          const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey as any);
          if (template) {
            // Create test variables
            const testVariables: any = {};
            template.variables.forEach((variable, index) => {
              testVariables[variable.name] = `TEST_VAR_${index + 1}`;
            });

            const variablesValues = formatVariablesForAPI(templateKey, testVariables);
            const apiResult = await sendSMSAPI(testMobile, template.id, variablesValues, 1);
            
            apiTestResult = {
              success: apiResult.success,
              error: apiResult.success ? null : (apiResult as any).error,
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          apiTestResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
        }
      }

      return {
        success: true,
        debug: {
          config: {
            status: configStatus,
            error: configError,
            hasApiKey: !!FASTSMS_CONFIG.apiKey,
            hasSenderId: !!FASTSMS_CONFIG.senderId,
            hasEntityId: !!FASTSMS_CONFIG.entityId,
            senderId: FASTSMS_CONFIG.senderId,
            entityId: FASTSMS_CONFIG.entityId ? FASTSMS_CONFIG.entityId.substring(0, 8) + '****' : 'NOT_SET',
            fullEntityId: FASTSMS_CONFIG.entityId, // Show full entity ID for comparison
            apiKeyLength: FASTSMS_CONFIG.apiKey ? FASTSMS_CONFIG.apiKey.length : 0
          },
          templates: {
            total: allTemplates.length,
            active: allTemplates.filter(t => t.isActive).length,
            validation: templateIdValidation,
            requestedTemplate: templateDebug
          },
          apiTest: apiTestResult,
          recommendations: [
            'Ensure all template IDs are numeric (DLT format)',
            'Verify template IDs are registered with your FastSMS account',
            `Check that Entity ID (${FASTSMS_CONFIG.entityId}) matches your DLT registration`,
            'Confirm Sender ID is active and valid',
            'Test with a simple template first',
            'Check if mobile number format is correct (919876543210)',
            'Verify API key has sufficient credits and permissions'
          ]
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in debugTemplateConfig function:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to debug template configuration. Please try again later.'
      );
    }
  });