"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSMSTemplate = exports.getSMSLogs = exports.getSMSTemplates = exports.sendExpiryReminders = exports.sendSMSV2 = exports.healthCheck = exports.testFunction = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const sms_templates_1 = __importDefault(require("./lib/sms-templates"));
const sms_logs_1 = __importDefault(require("./lib/sms-logs"));
// Initialize Firebase Admin
admin.initializeApp();
// Firestore instance
const db = admin.firestore();
// Initialize SMS Logs Service with Firestore instance
const smsLogsService = sms_logs_1.default.getInstance(db);
// Configuration constants
const DAILY_CHECK_HOUR = 10; // 10 AM as requested
const TIME_ZONE = 'Asia/Kolkata';
const EXPIRY_REMINDER_DAYS = 3; // 3 days before expiry
// FastSMS Configuration - Securely loaded from environment
const FASTSMS_CONFIG = {
    apiKey: (_a = functions.config().fastsms) === null || _a === void 0 ? void 0 : _a.api_key,
    senderId: (_b = functions.config().fastsms) === null || _b === void 0 ? void 0 : _b.sender_id,
    entityId: (_c = functions.config().fastsms) === null || _c === void 0 ? void 0 : _c.entity_id,
    baseUrl: 'https://www.fast2sms.com/dev/bulkV2' // Updated DLT-compliant endpoint
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
async function sendSMSAPI(recipient, templateId, variablesValues, attempt = 1) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
        const response = await axios_1.default.get(fullUrl, {
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
        }
        else {
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
    }
    catch (error) {
        console.error('🔍 [DEBUG] FastSMS API Error:', error);
        if (axios_1.default.isAxiosError(error)) {
            const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
            const message = ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message;
            const responseData = (_d = error.response) === null || _d === void 0 ? void 0 : _d.data;
            console.error('🔍 [DEBUG] Axios Error Details:', {
                status,
                message,
                responseData,
                config: {
                    url: (_e = error.config) === null || _e === void 0 ? void 0 : _e.url,
                    method: (_f = error.config) === null || _f === void 0 ? void 0 : _f.method,
                    timeout: (_g = error.config) === null || _g === void 0 ? void 0 : _g.timeout
                }
            });
            let errorType = 'API_ERROR';
            if (status === 401)
                errorType = 'AUTHENTICATION_ERROR';
            else if (status === 429)
                errorType = 'RATE_LIMIT_ERROR';
            else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                errorType = 'NETWORK_ERROR';
            }
            const enhancedError = {
                success: false,
                error: {
                    type: errorType,
                    message: `FastSMS API Error: ${message}`,
                    code: status === null || status === void 0 ? void 0 : status.toString(),
                    details: responseData,
                    timestamp: new Date(),
                    debugInfo: {
                        templateId,
                        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
                        axiosError: {
                            status,
                            statusText: (_h = error.response) === null || _h === void 0 ? void 0 : _h.statusText,
                            config: {
                                url: (_j = error.config) === null || _j === void 0 ? void 0 : _j.url,
                                method: (_k = error.config) === null || _k === void 0 ? void 0 : _k.method,
                                timeout: (_l = error.config) === null || _l === void 0 ? void 0 : _l.timeout
                            }
                        }
                    }
                }
            };
            console.error('🔍 [DEBUG] Enhanced Axios Error:', enhancedError);
            return enhancedError;
        }
        else {
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
// Helper function to get template ID by key with enhanced validation
function getTemplateIdByKey(templateKey) {
    console.log('🔍 [DEBUG] Getting template ID for key:', templateKey);
    const template = sms_templates_1.default.getInstance().getTemplateByKey(templateKey);
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
function formatVariablesForAPI(templateKey, variables) {
    console.log('🔍 [DEBUG] Formatting variables for API:', {
        templateKey,
        variables,
        variableKeys: Object.keys(variables || {}),
        variableValues: Object.values(variables || {})
    });
    // Validate variables before formatting
    const validation = sms_templates_1.default.getInstance().validateTemplateVariables(templateKey, variables);
    if (!validation.isValid) {
        console.error('🔍 [DEBUG] Template variable validation failed:', validation.errors);
        throw new Error(`Template variable validation failed: ${validation.errors.join(', ')}`);
    }
    const formattedVariables = sms_templates_1.default.getInstance().formatVariablesForAPI(templateKey, variables);
    console.log('🔍 [DEBUG] Formatted variables result:', {
        originalVariables: variables,
        formattedVariables,
        variableCount: formattedVariables.split('|').length,
        isEmpty: formattedVariables === ''
    });
    return formattedVariables;
}
// Helper function for delay/sleep
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Simple test function to verify deployment works
 */
exports.testFunction = functions
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
    }
    catch (error) {
        console.error('Error in test function:', error);
        throw new functions.https.HttpsError('internal', 'Test function failed');
    }
});
/**
 * Health check function
 */
exports.healthCheck = functions
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
    }
    catch (error) {
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
exports.sendSMSV2 = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
})
    .https.onCall(async (data, context) => {
    var _a;
    console.log('sendSMS called with data:', JSON.stringify(data, null, 2));
    // Check if user is authenticated
    if (!context.auth) {
        console.error('Authentication failed: No auth context');
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Validate required parameters
    const { templateKey, recipient, variables, entryId, customerId, locationId } = data;
    if (!templateKey || !recipient || !variables) {
        console.error('Validation failed: Missing required parameters', {
            templateKey: !!templateKey,
            recipient: !!recipient,
            variables: !!variables
        });
        throw new functions.https.HttpsError('invalid-argument', 'Template key, recipient, and variables are required.');
    }
    try {
        // Get template ID using the service
        const templateId = getTemplateIdByKey(templateKey);
        // Format variables for API
        const formattedVariables = formatVariablesForAPI(templateKey, variables);
        console.log('🔍 [DEBUG] Sending SMS with formatted data:', {
            templateKey,
            templateId,
            recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
            formattedVariables: formattedVariables.substring(0, 30) + '...',
            entryId,
            customerId,
            locationId
        });
        // Send SMS with retry logic
        let lastError = null;
        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                const result = await sendSMSAPI(recipient, templateId, formattedVariables, attempt);
                if (result.success && 'messageId' in result) {
                    console.log('✅ [SUCCESS] SMS sent successfully:', {
                        templateKey,
                        recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
                        messageId: result.messageId,
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
                        operatorId: context.auth.uid,
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
                }
            }
            catch (error) {
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
            operatorId: context.auth.uid,
            timestamp: new Date(),
            errorMessage: (lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error',
            retryCount: MAX_RETRY_ATTEMPTS
        });
        throw new functions.https.HttpsError('internal', `Failed to send SMS after ${MAX_RETRY_ATTEMPTS} attempts: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}`);
    }
    catch (error) {
        console.error('💥 [CRITICAL] SMS sending failed:', error);
        // Format error for client
        let errorMessage = 'Failed to send SMS';
        let errorCode = 'SMS_SEND_FAILED';
        if (error.type === 'AUTHENTICATION_ERROR') {
            errorMessage = 'SMS service authentication failed';
            errorCode = 'SMS_AUTH_ERROR';
        }
        else if (error.type === 'RATE_LIMIT_ERROR') {
            errorMessage = 'SMS rate limit exceeded';
            errorCode = 'SMS_RATE_LIMIT';
        }
        else if (error.type === 'NETWORK_ERROR') {
            errorMessage = 'SMS service network error';
            errorCode = 'SMS_NETWORK_ERROR';
        }
        else if ((_a = error.debugInfo) === null || _a === void 0 ? void 0 : _a.isTemplateEntityError) {
            errorMessage = 'SMS template configuration error';
            errorCode = 'SMS_TEMPLATE_ERROR';
        }
        throw new functions.https.HttpsError('internal', errorMessage, {
            code: errorCode,
            timestamp: new Date().toISOString(),
            debugInfo: error.debugInfo || {}
        });
    }
});
/**
 * Scheduled function to check for expiring entries and send reminders
 * Runs daily at 10 AM Asia/Kolkata time
 */
exports.sendExpiryReminders = functions
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
                // Prepare variables for SMS
                const variables = {
                    var1: entry.deceasedName || '',
                    var2: entry.location || '',
                    var3: entry.expiryDate || '',
                    var4: entry.contactNumber || '',
                    var5: entry.location || '' // Repeated location
                };
                // Get template ID
                const templateId = getTemplateIdByKey('threeDayReminder');
                // Format variables
                const formattedVariables = formatVariablesForAPI('threeDayReminder', variables);
                // Send SMS
                const result = await sendSMSAPI(entry.contactNumber, templateId, formattedVariables);
                if (result.success) {
                    successCount++;
                    console.log(`✅ [SCHEDULED] Reminder sent for entry: ${entry.id}`);
                    // Update entry to mark reminder sent
                    await doc.ref.update({
                        reminderSent: true,
                        reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                        reminderSentBy: 'system'
                    });
                    // Log SMS
                    await smsLogsService.logSMS({
                        templateKey: 'threeDayReminder',
                        recipient: entry.contactNumber,
                        variables: formattedVariables,
                        messageId: result.messageId,
                        status: 'sent',
                        entryId: entry.id,
                        customerId: entry.customerId,
                        locationId: entry.locationId,
                        userId: 'system',
                        timestamp: new Date()
                    });
                }
                else {
                    failureCount++;
                    console.error(`❌ [SCHEDULED] Failed to send reminder for entry: ${entry.id}`, result.error);
                }
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('💥 [CRITICAL] Expiry reminders failed:', error);
        throw new functions.https.HttpsError('internal', `Expiry reminders failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Function to get all available SMS templates
 */
exports.getSMSTemplates = functions
    .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
})
    .https.onCall(async (data, context) => {
    console.log('getSMSTemplates called');
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    try {
        const templates = sms_templates_1.default.getInstance().getAllTemplates();
        const stats = sms_templates_1.default.getInstance().getTemplateStats();
        return {
            success: true,
            templates: templates,
            stats: stats,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error getting SMS templates:', error);
        throw new functions.https.HttpsError('internal', `Failed to get SMS templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Function to get SMS logs
 */
exports.getSMSLogs = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
})
    .https.onCall(async (data, context) => {
    console.log('getSMSLogs called with data:', JSON.stringify(data, null, 2));
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    try {
        const { limit = 50, offset = 0, templateKey, status } = data;
        const logs = await smsLogsService.getSMSLogs({
            limit,
            offset,
            templateKey,
            status
        });
        return {
            success: true,
            logs: logs.logs,
            total: logs.total,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('Error getting SMS logs:', error);
        throw new functions.https.HttpsError('internal', `Failed to get SMS logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Function to test SMS template with specific variables
 */
exports.testSMSTemplate = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
})
    .https.onCall(async (data, context) => {
    var _a;
    console.log('testSMSTemplate called with data:', JSON.stringify(data, null, 2));
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Validate required parameters
    const { templateKey, recipient, variables } = data;
    if (!templateKey || !recipient || !variables) {
        throw new functions.https.HttpsError('invalid-argument', 'Template key, recipient, and variables are required.');
    }
    try {
        // Get template ID
        const templateId = getTemplateIdByKey(templateKey);
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
        if (result.success) {
            console.log('✅ [SUCCESS] Test SMS sent successfully:', {
                templateKey,
                recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
                messageId: result.messageId
            });
            // Log test SMS
            await smsLogsService.logSMS({
                templateKey,
                recipient,
                variables: formattedVariables,
                messageId: result.messageId,
                status: 'sent',
                userId: context.auth.uid,
                timestamp: new Date(),
                isTest: true
            });
            return {
                success: true,
                messageId: result.messageId,
                templateKey,
                recipient: recipient.substring(0, 4) + '****' + recipient.substring(-4),
                timestamp: new Date().toISOString()
            };
        }
        else {
            throw new functions.https.HttpsError('internal', `Failed to send test SMS: ${((_a = result.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'}`);
        }
    }
    catch (error) {
        console.error('Error testing SMS template:', error);
        // Log failed test SMS
        await smsLogsService.logSMS({
            templateKey,
            recipient,
            variables: formatVariablesForAPI(templateKey, variables),
            messageId: null,
            status: 'failed',
            userId: context.auth.uid,
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
            isTest: true
        });
        throw new functions.https.HttpsError('internal', `Failed to test SMS template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
