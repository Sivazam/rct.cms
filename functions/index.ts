// SMS Template Management System - Updated with Fast2SMS Message IDs
// This version uses Fast2SMS Message IDs for API calls, not DLT Template IDs
// Last updated: 2025-01-21 - Fixed template IDs for finalDisposalReminder (198613) and finalDisposalReminderAdmin (198614)

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

// Admin Configuration - Securely loaded from environment
const ADMIN_CONFIG = {
  mobile: functions.config().admin?.mobile
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

// Validate Admin configuration
function validateAdminConfig() {
  if (!ADMIN_CONFIG.mobile) {
    throw new Error('Admin mobile not configured. Please run: firebase functions:config:set admin.mobile="YOUR_ADMIN_MOBILE"');
  }
}

// Secure SMS sending function (server-side only) - Using DLT Route as per Fast2SMS recommendation
async function sendSMSAPI(recipient: string, templateId: string, variablesValues: string, attempt: number = 1) {
  try {
    console.log('🔍 [DEBUG] Starting sendSMSAPI function...');
    console.log('🔍 [DEBUG] Input parameters:', {
      recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
      templateId,
      templateIdLength: templateId.length,
      variablesValues: variablesValues.substring(0, 20) + '...',
      variablesCount: variablesValues.split('|').length,
      attempt
    });

    validateFastSMSConfig();
    
    console.log('🔍 [DEBUG] FastSMS config validated:', {
      hasApiKey: !!FASTSMS_CONFIG.apiKey,
      hasSenderId: !!FASTSMS_CONFIG.senderId,
      hasEntityId: !!FASTSMS_CONFIG.entityId,
      senderId: FASTSMS_CONFIG.senderId,
      entityId: FASTSMS_CONFIG.entityId ? FASTSMS_CONFIG.entityId.substring(0, 8) + '****' : 'NOT_SET',
      baseUrl: FASTSMS_CONFIG.baseUrl
    });

    const apiUrl = new URL(FASTSMS_CONFIG.baseUrl);
    
    // Enhanced validation of recipient number
    if (!recipient || !/^[6-9]\d{9}$/.test(recipient.replace('+91', ''))) {
      console.error('🔍 [DEBUG] Invalid recipient number format:', recipient);
      throw new Error(`Invalid recipient number format: ${recipient}. Must be 10 digits starting with 6-9.`);
    }

    // Enhanced validation of template ID (Fast2SMS Message ID)
    if (!templateId || !/^\d+$/.test(templateId)) {
      console.error('🔍 [DEBUG] Invalid template ID format:', templateId);
      throw new Error(`Invalid template ID format: ${templateId}. Must be numeric.`);
    }

    // Enhanced validation of variables
    if (!variablesValues || typeof variablesValues !== 'string') {
      console.error('🔍 [DEBUG] Invalid variables values:', variablesValues);
      throw new Error(`Invalid variables values: ${variablesValues}. Must be a non-empty string.`);
    }

    // Using DLT Route as recommended by Fast2SMS team
    apiUrl.searchParams.append('authorization', FASTSMS_CONFIG.apiKey);
    apiUrl.searchParams.append('route', 'dlt');
    apiUrl.searchParams.append('sender_id', FASTSMS_CONFIG.senderId);
    apiUrl.searchParams.append('message', templateId); // Fast2SMS Message ID (updated)
    apiUrl.searchParams.append('variables_values', variablesValues); // Pipe-separated variables
    apiUrl.searchParams.append('flash', '0');
    apiUrl.searchParams.append('numbers', recipient.replace('+91', '')); // Remove country code for API
    
    // Add entity_id if available (for enhanced DLT compliance)
    if (FASTSMS_CONFIG.entityId) {
      apiUrl.searchParams.append('entity_id', FASTSMS_CONFIG.entityId);
    }

    const fullUrl = apiUrl.toString();
    console.log(`🔍 [DEBUG] FastSMS API Call (Attempt ${attempt}):`, {
      recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
      templateId,
      templateIdLength: templateId.length,
      variablesValues: variablesValues.substring(0, 20) + '...',
      variablesCount: variablesValues.split('|').length,
      route: 'dlt',
      hasEntityId: !!FASTSMS_CONFIG.entityId,
      entityId: FASTSMS_CONFIG.entityId ? FASTSMS_CONFIG.entityId.substring(0, 8) + '****' : 'NOT_SET',
      senderId: FASTSMS_CONFIG.senderId,
      url: fullUrl.substring(0, 150) + '...',
      urlLength: fullUrl.length
    });

    console.log('🔍 [DEBUG] Making HTTP GET request to FastSMS API...');
    const response = await axios.get(fullUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Rotary-CMS/1.0',
        'Accept': 'application/json'
      }
    });

    console.log('🔍 [DEBUG] FastSMS API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      return: response.data.return,
      request_id: response.data.request_id,
      message: response.data.message,
      type: typeof response.data,
      keys: Object.keys(response.data || {})
    });

    // Enhanced response validation
    if (!response.data || typeof response.data !== 'object') {
      console.error('🔍 [DEBUG] Invalid API response format:', response.data);
      throw new Error('Invalid API response format from FastSMS');
    }

    if (response.data.return === true) {
      console.log('🔍 [DEBUG] SMS sent successfully:', {
        requestId: response.data.request_id,
        message: response.data.message
      });
      return {
        success: true,
        messageId: response.data.request_id
      };
    } else {
      // Enhanced error details with specific focus on template/entity ID issues
      const errorMessage = response.data.message || 'SMS sending failed';
      const errorCode = response.data.code || 'UNKNOWN_ERROR';
      
      console.error('🔍 [DEBUG] FastSMS API Error Details:', {
        errorMessage,
        errorCode,
        fullResponse: response.data,
        templateId,
        entityId: FASTSMS_CONFIG.entityId,
        senderId: FASTSMS_CONFIG.senderId,
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4)
      });

      // Special handling for template/entity ID errors
      if (errorMessage.includes('Invalid Message ID') || errorMessage.includes('Template') || errorMessage.includes('Entity ID')) {
        console.error('🔍 [DEBUG] TEMPLATE/ENTITY ID ERROR DETECTED!');
        console.error('🔍 [DEBUG] Please verify:');
        console.error('🔍 [DEBUG] 1. Fast2SMS Message ID is correct and active:', templateId);
        console.error('🔍 [DEBUG] 2. Entity ID is correct and associated with template:', FASTSMS_CONFIG.entityId);
        console.error('🔍 [DEBUG] 3. Sender ID is approved for this template/entity combination:', FASTSMS_CONFIG.senderId);
        console.error('🔍 [DEBUG] 4. Template variables match the DLT template format exactly');
      }

      const errorDetails = {
        type: 'API_ERROR',
        message: errorMessage,
        code: errorCode,
        details: response.data,
        timestamp: new Date(),
        debugInfo: {
          templateId,
          templateIdFormat: /^\d+$/.test(templateId) ? 'VALID_NUMERIC' : 'INVALID_FORMAT',
          recipientFormat: /^[6-9]\d{9}$/.test(recipient.replace('+91', '')) ? 'VALID_MOBILE' : 'INVALID_MOBILE',
          variablesFormat: variablesValues.split('|').length > 0 ? 'VALID_VARIABLES' : 'INVALID_VARIABLES',
          apiEndpoint: fullUrl,
          isTemplateEntityError: errorMessage.includes('Invalid Message ID') || errorMessage.includes('Template') || errorMessage.includes('Entity ID')
        }
      };
      
      console.error('🔍 [DEBUG] Enhanced FastSMS Error:', errorDetails);
      throw errorDetails;
    }

  } catch (error) {
    console.error('🔍 [DEBUG] FastSMS API Error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const responseData = error.response?.data;

      console.error('🔍 [DEBUG] Axios Error Details:', {
        status,
        message,
        responseData,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });

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

      console.error('🔍 [DEBUG] Enhanced Axios Error:', enhancedError);
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

      console.error('🔍 [DEBUG] Enhanced Unknown Error:', enhancedError);
      return enhancedError;
    }
  }
}

// Helper function to send SMS to both admin and customer
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
        results.adminSMS = await sendSMSAPI(ADMIN_CONFIG.mobile, adminTemplateId, adminFormattedVariables);
        
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
  
  const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey as any);
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
  const validation = SMSTemplatesService.getInstance().validateTemplateVariables(templateKey as any, variables);
  if (!validation.isValid) {
    console.error('🔍 [DEBUG] Template variable validation failed:', validation.errors);
    throw new Error(`Template variable validation failed: ${validation.errors.join(', ')}`);
  }

  const formattedVariables = SMSTemplatesService.getInstance().formatVariablesForAPI(templateKey as any, variables);
  
  console.log('🔍 [DEBUG] Formatted variables result:', {
    originalVariables: variables,
    formattedVariables,
    variableCount: formattedVariables.split('|').length,
    isEmpty: formattedVariables === ''
  });

  return formattedVariables;
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
    const { templateKey, recipient, variables, entryId, customerId, locationId, operatorId } = data;

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

    try {
      console.log('🔍 [DEBUG] Processing SMS request:', {
        templateKey,
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
        hasVariables: !!variables && Object.keys(variables).length > 0,
        entryId,
        customerId,
        locationId
      });

      // Check if this template should be sent to both admin and customer
      const templatesForBothParties = [
        'renewalConfirmCustomer', 'renewalConfirmAdmin',
        'dispatchConfirmCustomer', 'deliveryConfirmAdmin'
      ];

      const shouldSendToBoth = templatesForBothParties.includes(templateKey);

      if (shouldSendToBoth) {
        console.log('🔍 [DEBUG] Template requires sending to both admin and customer:', templateKey);
        
        // Determine admin and customer template keys based on the provided templateKey
        let adminTemplateKey: string;
        let customerTemplateKey: string;
        let customerVariables: any;
        let adminVariables: any;

        if (templateKey === 'renewalConfirmCustomer' || templateKey === 'renewalConfirmAdmin') {
          // For renewal confirmations
          customerTemplateKey = 'renewalConfirmCustomer';
          adminTemplateKey = 'renewalConfirmAdmin';
          
          // Customer variables for renewal confirmation
          customerVariables = {
            var1: variables.var1 || '', // Deceased person name
            var2: variables.var2 || '', // Location
            var3: variables.var3 || '', // New expiry date
            var4: recipient, // Customer mobile (will be cleaned)
            var5: variables.var2 || '' // Location repeated
          };

          // Admin variables for renewal confirmation
          adminVariables = {
            var1: variables.var2 || '', // Location
            var2: variables.var1 || ''  // Deceased person name
          };
        } else if (templateKey === 'dispatchConfirmCustomer' || templateKey === 'deliveryConfirmAdmin') {
          // For dispatch/delivery confirmations
          customerTemplateKey = 'dispatchConfirmCustomer';
          adminTemplateKey = 'deliveryConfirmAdmin';
          
          // Customer variables for dispatch confirmation
          customerVariables = {
            var1: variables.var1 || '', // Deceased person name
            var2: variables.var2 || '', // Location
            var3: variables.var3 || '', // Delivery date
            var4: variables.var4 || '', // Handover person name
            var5: variables.var5 || '', // Handover person mobile
            var6: recipient, // Admin mobile (customer mobile)
            var7: variables.var2 || '' // Location repeated
          };

          // Admin variables for delivery confirmation
          adminVariables = {
            var1: variables.var1 || '', // Deceased person name
            var2: variables.var2 || ''  // Location
          };
        } else {
          // Fallback to single SMS
          console.log('🔍 [DEBUG] Unknown both-party template, falling back to single SMS:', templateKey);
          return await sendSingleSMS(templateKey, recipient, variables, entryId, customerId, locationId, context.auth.uid);
        }

        // Send SMS to both admin and customer
        const results = await sendSMSToBothParties(
          recipient,
          adminTemplateKey,
          customerTemplateKey,
          customerVariables,
          adminVariables,
          entryId
        );

        if (results.success) {
          console.log('✅ [SUCCESS] SMS sent to both parties successfully:', {
            templateKey,
            customerSuccess: results.customerSMS?.success,
            adminSuccess: results.adminSMS?.success
          });

          return {
            success: true,
            customerMessageId: results.customerSMS?.messageId,
            adminMessageId: results.adminSMS?.messageId,
            templateKey,
            recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
            timestamp: new Date().toISOString(),
            sentToBoth: true,
            errors: results.errors
          };
        } else {
          console.error('❌ [ERROR] Failed to send SMS to both parties:', results.errors);
          throw new functions.https.HttpsError(
            'internal',
            `Failed to send SMS to both parties: ${results.errors.join(', ')}`
          );
        }
      } else {
        // Send single SMS
        return await sendSingleSMS(templateKey, recipient, variables, entryId, customerId, locationId, context.auth.uid);
      }

    } catch (error) {
      console.error('💥 [CRITICAL] SMS sending failed:', error);

      // Format error for client
      let errorMessage = 'Failed to send SMS';
      let errorCode = 'SMS_SEND_FAILED';

      if (error.type === 'AUTHENTICATION_ERROR') {
        errorMessage = 'SMS service authentication failed';
        errorCode = 'SMS_AUTH_ERROR';
      } else if (error.type === 'RATE_LIMIT_ERROR') {
        errorMessage = 'SMS rate limit exceeded';
        errorCode = 'SMS_RATE_LIMIT';
      } else if (error.type === 'NETWORK_ERROR') {
        errorMessage = 'SMS service network error';
        errorCode = 'SMS_NETWORK_ERROR';
      } else if (error.debugInfo?.isTemplateEntityError) {
        errorMessage = 'SMS template configuration error';
        errorCode = 'SMS_TEMPLATE_ERROR';
      }

      throw new functions.https.HttpsError(
        'internal',
        errorMessage,
        {
          code: errorCode,
          timestamp: new Date().toISOString(),
          debugInfo: error.debugInfo || {}
        }
      );
    }
  });

// Helper function to send single SMS (existing logic)
async function sendSingleSMS(templateKey: string, recipient: string, variables: any, entryId?: string, customerId?: string, locationId?: string, operatorId?: string) {
  // Get template ID using the service
  const templateId = getTemplateIdByKey(templateKey);
  
  // Format variables for API
  const formattedVariables = formatVariablesForAPI(templateKey, variables);

  console.log('🔍 [DEBUG] Sending single SMS with formatted data:', {
    templateKey,
    templateId,
    recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
    formattedVariables: formattedVariables.substring(0, 30) + '...',
    entryId,
    customerId,
    locationId
  });

  // Send SMS with retry logic
  let lastError: any = null;
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await sendSMSAPI(recipient, templateId, formattedVariables, attempt);
      
      if (result.success && 'messageId' in result) {
        console.log('✅ [SUCCESS] SMS sent successfully:', {
          templateKey,
          recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
          messageId: (result as any).messageId,
          attempt
        });

        // Log successful SMS to Firestore
        await smsLogsService.logSMS({
          type: templateKey,
          templateId,
          message: formattedVariables,
          recipient,
          status: 'sent',
          entryId,
          customerId,
          locationId,
          operatorId: operatorId,
          timestamp: new Date(),
          retryCount: 0
        });

        return {
          success: true,
          messageId: (result as any).messageId,
          templateKey,
          recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ [ERROR] Attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`⏳ [RETRY] Waiting ${RETRY_DELAY_MS}ms before retry...`);
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  // All attempts failed
  console.error('💥 [CRITICAL] All SMS attempts failed:', lastError);

  // Log failed SMS to Firestore
  await smsLogsService.logSMS({
    type: templateKey,
    templateId,
    message: formattedVariables,
    recipient,
    status: 'failed',
    entryId,
    customerId,
    locationId,
    operatorId: operatorId,
    timestamp: new Date(),
    errorMessage: lastError?.message || 'Unknown error',
    retryCount: MAX_RETRY_ATTEMPTS
  });

  throw new functions.https.HttpsError(
    'internal',
    `Failed to send SMS after ${MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

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

          // Send SMS to both admin and customer
          const results = await sendSMSToBothParties(
            entry.contactNumber || '',
            'finalDisposalReminderAdmin', // Admin template for expiry reminders
            'threeDayReminder', // Customer template for expiry reminders
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
              await smsLogsService.logSMS({
                type: 'threeDayReminder',
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey('threeDayReminder'),
                message: SMSTemplatesService.getInstance().getTemplateByKey('threeDayReminder')?.name || 'Three Day Reminder',
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
              await smsLogsService.logSMS({
                type: 'finalDisposalReminderAdmin',
                recipient: ADMIN_CONFIG.mobile,
                templateId: getTemplateIdByKey('finalDisposalReminderAdmin'),
                message: SMSTemplatesService.getInstance().getTemplateByKey('finalDisposalReminderAdmin')?.name || 'Final Disposal Reminder Admin',
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

          // Send SMS to both admin and customer
          const results = await sendSMSToBothParties(
            entry.contactNumber || '',
            'finalDisposalReminderAdmin', // Admin template for last day reminders
            'lastdayRenewal', // Customer template for last day reminders
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
              await smsLogsService.logSMS({
                type: 'lastdayRenewal',
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey('lastdayRenewal'),
                message: SMSTemplatesService.getInstance().getTemplateByKey('lastdayRenewal')?.name || 'Last Day Renewal Reminder',
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
              await smsLogsService.logSMS({
                type: 'finalDisposalReminderAdmin',
                recipient: ADMIN_CONFIG.mobile,
                templateId: getTemplateIdByKey('finalDisposalReminderAdmin'),
                message: SMSTemplatesService.getInstance().getTemplateByKey('finalDisposalReminderAdmin')?.name || 'Final Disposal Reminder Admin',
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

          // Send SMS to both admin and customer
          const results = await sendSMSToBothParties(
            entry.contactNumber || '',
            'finalDisposalReminderAdmin', // Admin template for final disposal
            'finalDisposalReminder', // Customer template for final disposal
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
              await smsLogsService.logSMS({
                type: 'finalDisposalReminder',
                recipient: entry.contactNumber,
                templateId: getTemplateIdByKey('finalDisposalReminder'),
                message: SMSTemplatesService.getInstance().getTemplateByKey('finalDisposalReminder')?.name || 'Final Disposal Reminder',
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
              await smsLogsService.logSMS({
                type: 'finalDisposalReminderAdmin',
                recipient: ADMIN_CONFIG.mobile,
                templateId: getTemplateIdByKey('finalDisposalReminderAdmin'),
                message: SMSTemplatesService.getInstance().getTemplateByKey('finalDisposalReminderAdmin')?.name || 'Final Disposal Reminder Admin',
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

/**
 * Function to get all available SMS templates
 */
export const getSMSTemplates = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onCall(async (data, context) => {
    console.log('getSMSTemplates called');

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    try {
      const templates = SMSTemplatesService.getInstance().getAllTemplates();
      const stats = SMSTemplatesService.getInstance().getTemplateStats();

      return {
        success: true,
        templates: templates,
        stats: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting SMS templates:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to get SMS templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * Function to get SMS logs
 */
export const getSMSLogs = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    console.log('getSMSLogs called with data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    try {
      const { limit = 50, offset = 0, templateKey, status } = data;

      const logs = await smsLogsService.getSMSLogs({
        type: templateKey,
        status
      });

      // Apply pagination manually since the service doesn't support it directly
      const paginatedLogs = logs.slice(offset, offset + limit);

      return {
        success: true,
        logs: paginatedLogs,
        total: logs.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting SMS logs:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to get SMS logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * Function to test SMS template with specific variables
 */
export const testSMSTemplate = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    console.log('testSMSTemplate called with data:', JSON.stringify(data, null, 2));

    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Validate required parameters
    const { templateKey, recipient, variables } = data;

    if (!templateKey || !recipient || !variables) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Template key, recipient, and variables are required.'
      );
    }

    // Get template ID (moved outside try block for catch block access)
    const templateId = getTemplateIdByKey(templateKey);

    try {
      // Format variables
      const formattedVariables = formatVariablesForAPI(templateKey, variables);

      console.log('🔍 [DEBUG] Testing SMS template:', {
        templateKey,
        templateId,
        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
        formattedVariables: formattedVariables.substring(0, 30) + '...'
      });

      // Send test SMS
      const result = await sendSMSAPI(recipient, templateId, formattedVariables);

      if (result.success && 'messageId' in result) {
        console.log('✅ [SUCCESS] Test SMS sent successfully:', {
          templateKey,
          recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
          messageId: result.messageId
        });

        // Log test SMS
        await smsLogsService.logSMS({
          type: templateKey,
          recipient,
          templateId: templateId,
          message: SMSTemplatesService.getInstance().getTemplateByKey(templateKey)?.name || 'Test SMS',
          status: 'sent',
          timestamp: new Date(),
          retryCount: 0
        });

        return {
          success: true,
          messageId: result.messageId,
          templateKey,
          recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
          timestamp: new Date().toISOString()
        };
      } else {
        throw new functions.https.HttpsError(
          'internal',
          `Failed to send test SMS: ${'error' in result ? result.error.message : 'Unknown error'}`
        );
      }

    } catch (error) {
      console.error('Error testing SMS template:', error);

      // Log failed test SMS
      await smsLogsService.logSMS({
        type: templateKey,
        recipient,
        templateId: templateId,
        message: SMSTemplatesService.getInstance().getTemplateByKey(templateKey)?.name || 'Test SMS',
        status: 'failed',
        timestamp: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0
      });

      throw new functions.https.HttpsError(
        'internal',
        `Failed to test SMS template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

/**
 * Force deployment trigger function - NEW FUNCTION TO FORCE DEPLOYMENT
 * This function is added to force Firebase to detect changes and deploy the updated template IDs
 */
export const forceDeployTrigger = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    console.log('🚀 Force deploy trigger called - Template IDs Updated:');
    console.log('   finalDisposalReminder: 198613');
    console.log('   finalDisposalReminderAdmin: 198614');
    
    res.status(200).json({
      success: true,
      message: 'Force deploy triggered - Template IDs updated successfully',
      timestamp: new Date().toISOString(),
      templateIds: {
        finalDisposalReminder: '198613',
        finalDisposalReminderAdmin: '198614'
      },
      deploymentStatus: 'completed'
    });
  });

/**
 * Debug function to check recent SMS logs
 * This function helps verify SMS sending attempts and results
 */
export const debugSMSLogs = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    // Set CORS headers for public access
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    try {
      console.log('🔍 Debug SMS logs function called');
      
      // Get recent SMS logs (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const logs = await smsLogsService.getSMSLogs({
        dateRange: {
          start: oneDayAgo,
          end: new Date()
        }
      });
      
      // Get failed SMS logs specifically
      const failedLogs = await smsLogsService.getSMSLogs({
        status: 'failed',
        dateRange: {
          start: oneDayAgo,
          end: new Date()
        }
      });
      
      // Get successful SMS logs
      const successLogs = await smsLogsService.getSMSLogs({
        status: 'sent',
        dateRange: {
          start: oneDayAgo,
          end: new Date()
        }
      });
      
      const response = {
        success: true,
        summary: {
          total: logs.length,
          sent: successLogs.length,
          failed: failedLogs.length,
          pending: logs.length - successLogs.length - failedLogs.length
        },
        recentLogs: logs.slice(0, 10).map(log => ({
          id: log.id,
          type: log.type,
          recipient: log.recipient,
          status: log.status,
          timestamp: log.timestamp,
          errorMessage: log.errorMessage,
          templateId: log.templateId
        })),
        failedLogs: failedLogs.slice(0, 5).map(log => ({
          id: log.id,
          type: log.type,
          recipient: log.recipient,
          status: log.status,
          timestamp: log.timestamp,
          errorMessage: log.errorMessage,
          templateId: log.templateId
        })),
        timestamp: new Date().toISOString(),
        deployment: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV
        }
      };
      
      console.log('🔍 Debug SMS logs response:', JSON.stringify(response, null, 2));
      res.status(200).json(response);
    } catch (error) {
      console.error('🔍 Error in debug SMS logs function:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

/**
 * Debug function to check template IDs in deployed functions
 * This function helps verify that the correct template IDs are being used
 */
export const debugTemplateIds = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    // Set CORS headers for public access
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    try {
      console.log('🔍 Debug template IDs function called');
      
      // Get the templates that were causing issues
      const finalDisposalTemplate = SMSTemplatesService.getInstance().getTemplateByKey('finalDisposalReminder');
      const adminTemplate = SMSTemplatesService.getInstance().getTemplateByKey('finalDisposalReminderAdmin');
      
      const response = {
        success: true,
        templates: {
          finalDisposalReminder: {
            key: finalDisposalTemplate.key,
            id: finalDisposalTemplate.id,
            name: finalDisposalTemplate.name,
            variableCount: finalDisposalTemplate.variableCount
          },
          finalDisposalReminderAdmin: {
            key: adminTemplate.key,
            id: adminTemplate.id,
            name: adminTemplate.name,
            variableCount: adminTemplate.variableCount
          }
        },
        expected: {
          finalDisposalReminder: '198613',
          finalDisposalReminderAdmin: '198614'
        },
        timestamp: new Date().toISOString(),
        deployment: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV
        }
      };
      
      console.log('🔍 Debug template IDs response:', JSON.stringify(response, null, 2));
      res.status(200).json(response);
    } catch (error) {
      console.error('🔍 Error in debug template IDs function:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
