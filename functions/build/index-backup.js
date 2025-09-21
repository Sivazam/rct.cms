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
exports.debugTemplateConfig = exports.smsHealthCheckV2 = exports.getSMSStatisticsV2 = exports.retryFailedSMSV2 = exports.dailyExpiryCheckV2 = exports.sendSMSV2 = exports.healthCheck = exports.testFunction = void 0;
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
        // Enhanced validation of template ID
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
        apiUrl.searchParams.append('message', templateId); // DLT template ID
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
                console.error('🔍 [DEBUG] 1. Template ID is correct and active in FastSMS DLT portal:', templateId);
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
    // Validate template ID format (should be numeric for DLT)
    if (!/^\d+$/.test(template.id)) {
        console.error('🔍 [DEBUG] Invalid template ID format (should be numeric):', template.id);
        throw new Error(`Invalid template ID format: ${template.id}. Template IDs must be numeric for DLT compliance.`);
    }
    // Validate template ID length (DLT template IDs are typically 19 digits)
    if (template.id.length !== 19) {
        console.warn('🔍 [DEBUG] Unusual template ID length (expected 19 digits):', template.id.length);
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
    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    if (!user) {
        console.error('User not found:', context.auth.uid);
        throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    // Check if user is active
    if (user.isActive !== true) {
        console.error('User not active:', context.auth.uid);
        throw new functions.https.HttpsError('permission-denied', 'User account is not active.');
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
        throw new functions.https.HttpsError('permission-denied', 'Only admin users can send this type of SMS.');
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
            throw new functions.https.HttpsError('permission-denied', 'You do not have permission to send SMS for this location.');
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
                }
                else {
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
            }
            catch (error) {
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
    }
    catch (error) {
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
        throw new functions.https.HttpsError('internal', 'Failed to send SMS. Please try again later.');
    }
});
/**
 * Scheduled function to check for expiring entries and send SMS reminders
 * Runs daily at 10 AM IST to check for entries expiring in 3 days and today
 */
exports.dailyExpiryCheckV2 = functions
    .runWith({
    memory: '512MB',
    timeoutSeconds: 540, // 9 minutes
})
    .pubsub.schedule('0 10 * * *')
    .timeZone('Asia/Kolkata')
    .onRun(async (context) => {
    var _a, _b, _c;
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
                const expiryDate = ((_a = entry.expiryDate) === null || _a === void 0 ? void 0 : _a.toDate) ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
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
                    if (isExpiringIn3Days)
                        results.entries3Days++;
                    if (isExpiringToday)
                        results.entriesToday++;
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
                    }
                    else {
                        results.failedSMS++;
                        // Log failed SMS
                        await smsLogsService.logSMS({
                            type: templateKey,
                            recipient: customer.mobile,
                            templateId,
                            message: variablesValues,
                            status: 'failed',
                            errorMessage: ((_b = smsResult.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error',
                            timestamp: new Date(),
                            retryCount: 0,
                            entryId: doc.id,
                            customerId: entry.customerId,
                            locationId: entry.locationId,
                            operatorId: 'system'
                        });
                        console.error(`SMS failed for entry ${doc.id}:`, smsResult.error);
                        results.errors.push(`SMS failed for entry ${doc.id}: ${((_c = smsResult.error) === null || _c === void 0 ? void 0 : _c.message) || 'Unknown error'}`);
                    }
                }
            }
            catch (error) {
                console.error(`Error processing entry ${doc.id}:`, error);
                results.errors.push(`Error processing entry ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        results.endTime = admin.firestore.FieldValue.serverTimestamp();
        // Log the daily check results
        await db.collection('dailyExpiryChecks').add(Object.assign(Object.assign({}, results), { timestamp: admin.firestore.FieldValue.serverTimestamp() }));
        console.log('Daily expiry check completed:', results);
        return null;
    }
    catch (error) {
        console.error('Error in daily expiry check:', error);
        throw new Error(`Daily expiry check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
/**
 * Function to retry failed SMS messages
 */
exports.retryFailedSMSV2 = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 300, // 5 minutes
})
    .https.onCall(async (data, context) => {
    var _a, _b;
    console.log('retryFailedSMS called with data:', JSON.stringify(data, null, 2));
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    if (!user || user.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin users can retry failed SMS.');
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
            errors: []
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
                }
                else {
                    results.failed++;
                    // Update the log to increment retry count
                    await smsLogsService.updateSMSLog(log.id, {
                        retryCount: log.retryCount + 1,
                        errorMessage: ((_a = smsResult.error) === null || _a === void 0 ? void 0 : _a.message) || 'Retry failed'
                    });
                    console.error(`SMS retry failed for log ${log.id}:`, smsResult.error);
                    results.errors.push(`Retry failed for log ${log.id}: ${((_b = smsResult.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'}`);
                }
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Error in retryFailedSMS function:', error);
        throw new functions.https.HttpsError('internal', 'Failed to retry SMS messages. Please try again later.');
    }
});
/**
 * Function to get SMS statistics
 */
exports.getSMSStatisticsV2 = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
})
    .https.onCall(async (data, context) => {
    console.log('getSMSStatistics called with data:', JSON.stringify(data, null, 2));
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    if (!user) {
        throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    try {
        const { dateRange, locationId, type } = data || {};
        const filters = {};
        if (dateRange) {
            filters.dateRange = {
                start: new Date(dateRange.start),
                end: new Date(dateRange.end)
            };
        }
        if (locationId)
            filters.locationId = locationId;
        if (type)
            filters.type = type;
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
    }
    catch (error) {
        console.error('Error in getSMSStatistics function:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get SMS statistics. Please try again later.');
    }
});
/**
 * SMS-specific health check function
 */
exports.smsHealthCheckV2 = functions
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
                    error: null
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
            }
            catch (error) {
                healthStatus.checks.fastsms_config.status = 'invalid';
                healthStatus.checks.fastsms_config.error = error instanceof Error ? error.message : 'Unknown error';
            }
        }
        res.status(200).json(healthStatus);
    }
    catch (error) {
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
exports.debugTemplateConfig = functions
    .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
})
    .https.onCall(async (data, context) => {
    console.log('debugTemplateConfig called with data:', JSON.stringify(data, null, 2));
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Get user details for authorization
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    if (!user || user.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin users can debug template configuration.');
    }
    try {
        const { templateKey, testMobile } = data || {};
        // Get all templates
        const allTemplates = sms_templates_1.default.getInstance().getAllTemplates();
        // Validate FastSMS configuration
        let configStatus = 'unknown';
        let configError = null;
        try {
            validateFastSMSConfig();
            configStatus = 'valid';
        }
        catch (error) {
            configStatus = 'invalid';
            configError = error instanceof Error ? error.message : 'Unknown error';
        }
        // Template-specific debug info
        let templateDebug = null;
        if (templateKey) {
            const template = sms_templates_1.default.getInstance().getTemplateByKey(templateKey);
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
                const template = sms_templates_1.default.getInstance().getTemplateByKey(templateKey);
                if (template) {
                    // Create test variables
                    const testVariables = {};
                    template.variables.forEach((variable, index) => {
                        testVariables[variable.name] = `TEST_VAR_${index + 1}`;
                    });
                    const variablesValues = formatVariablesForAPI(templateKey, testVariables);
                    const apiResult = await sendSMSAPI(testMobile, template.id, variablesValues, 1);
                    apiTestResult = {
                        success: apiResult.success,
                        error: apiResult.success ? null : apiResult.error,
                        timestamp: new Date().toISOString()
                    };
                }
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Error in debugTemplateConfig function:', error);
        throw new functions.https.HttpsError('internal', 'Failed to debug template configuration. Please try again later.');
    }
});
