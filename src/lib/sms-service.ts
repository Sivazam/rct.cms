// SMS Service for FastSMS DLT-Compliant API Integration
import axios from 'axios';
import SMSLogsService from './sms-logs';
import SMSTemplatesService, { 
  TEMPLATE_IDS, 
  TemplateVariables, 
  SMSRequest, 
  SMSResponse 
} from './sms-templates';
import { SMSLog } from './sms-logs';

// FastSMS API Configuration
const FASTSMS_API_BASE_URL = 'https://www.fastsms.com/dev/bulkV2';
const FASTSMS_API_KEY = 'QgRMDkEVHPoKaJcl3NbqyB8TW6rv9XudhY0Zj2izn57xF1wfICdGanl0ojySLuKHfrP9UDQYMsk41OC2';
const FASTSMS_SENDER_ID = 'ROTCMS';
const FASTSMS_ENTITY_ID = '1701175751242640436';

// Retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// SMS Service Error Types
export enum SMSErrorType {
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR'
}

// Enhanced SMS Error interface
export interface SMSError {
  type: SMSErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// SMS Service Result interface
export interface SMSServiceResult {
  success: boolean;
  messageId?: string;
  error?: SMSError;
  timestamp: Date;
  attempt: number;
  templateUsed: string;
  recipient: string;
}

// SMS Service class
class SMSService {
  private static instance: SMSService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * Initialize SMS service with configuration validation
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Validate required configuration
    const requiredConfig = [
      { key: 'API_KEY', value: FASTSMS_API_KEY, name: 'FastSMS API Key' },
      { key: 'SENDER_ID', value: FASTSMS_SENDER_ID, name: 'Sender ID' },
      { key: 'ENTITY_ID', value: FASTSMS_ENTITY_ID, name: 'Entity ID' }
    ];

    for (const config of requiredConfig) {
      if (!config.value || config.value === 'YOUR_' + config.key || config.value.length === 0) {
        throw new Error(`${config.name} not configured. Please set the ${config.key} environment variable.`);
      }
    }

    this.isInitialized = true;
    console.log('SMS Service initialized successfully with DLT-compliant FastSMS API');
  }

  /**
   * Send SMS using FastSMS DLT API
   */
  private async sendSMSAPI(
    recipient: string,
    templateId: string,
    variablesValues: string,
    attempt: number = 1
  ): Promise<{ success: boolean; messageId?: string; error?: SMSError }> {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      // Validate mobile number
      if (!this.validateMobileNumber(recipient)) {
        throw {
          type: SMSErrorType.VALIDATION_ERROR,
          message: `Invalid mobile number format: ${recipient}`,
          timestamp: new Date()
        } as SMSError;
      }

      // Prepare API request using GET method as per FastSMS documentation
      const apiUrl = new URL(FASTSMS_API_BASE_URL);
      apiUrl.searchParams.append('authorization', FASTSMS_API_KEY);
      apiUrl.searchParams.append('sender_id', FASTSMS_SENDER_ID);
      apiUrl.searchParams.append('message', templateId);
      apiUrl.searchParams.append('variables_values', variablesValues);
      apiUrl.searchParams.append('route', 'dlt');
      apiUrl.searchParams.append('numbers', recipient);

      console.log(`Sending SMS (Attempt ${attempt}):`, {
        recipient,
        templateId,
        variablesValues,
        url: apiUrl.toString().substring(0, 100) + '...' // Log partial URL for security
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
          type: SMSErrorType.API_ERROR,
          message: response.data.message || 'SMS sending failed',
          code: 'API_ERROR',
          details: response.data,
          timestamp: new Date()
        } as SMSError;
      }

    } catch (error) {
      console.error('SMS API Error:', error);

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        let errorType = SMSErrorType.API_ERROR;
        if (status === 401) errorType = SMSErrorType.AUTHENTICATION_ERROR;
        else if (status === 429) errorType = SMSErrorType.RATE_LIMIT_ERROR;
        else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          errorType = SMSErrorType.NETWORK_ERROR;
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
            type: SMSErrorType.UNKNOWN,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date()
          }
        };
      }
    }
  }

  /**
   * Send SMS with retry mechanism and comprehensive logging
   */
  public async sendSMSWithRetry(
    request: SMSRequest
  ): Promise<SMSServiceResult> {
    const { templateKey, recipient, variables, entryId, customerId, locationId, operatorId } = request;

    try {
      // Get template details
      const template = SMSTemplatesService.getInstance().getTemplateByKey(templateKey);
      if (!template) {
        throw {
          type: SMSErrorType.TEMPLATE_ERROR,
          message: `Template not found: ${templateKey}`,
          timestamp: new Date()
        } as SMSError;
      }

      // Validate template variables
      const validation = SMSTemplatesService.getInstance().validateTemplateVariables(templateKey, variables);
      if (!validation.isValid) {
        throw {
          type: SMSErrorType.VALIDATION_ERROR,
          message: `Template validation failed: ${validation.errors.join(', ')}`,
          timestamp: new Date()
        } as SMSError;
      }

      // Format variables for API
      const variablesValues = SMSTemplatesService.getInstance().formatVariablesForAPI(templateKey, variables);

      let lastError: SMSError | undefined;
      let finalResult: SMSServiceResult | undefined;

      // Retry mechanism
      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          console.log(`SMS Send Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} for template ${templateKey}`);

          const apiResult = await this.sendSMSAPI(recipient, template.id, variablesValues, attempt);

          if (apiResult.success) {
            // Log successful SMS
            await this.logSMS({
              type: templateKey,
              recipient,
              templateId: template.id,
              message: variablesValues,
              status: 'sent',
              timestamp: new Date(),
              retryCount: attempt - 1,
              entryId,
              customerId,
              locationId,
              operatorId
            });

            finalResult = {
              success: true,
              messageId: apiResult.messageId,
              timestamp: new Date(),
              attempt,
              templateUsed: templateKey,
              recipient
            };

            console.log(`SMS sent successfully on attempt ${attempt}. Message ID: ${apiResult.messageId}`);
            break;
          } else {
            lastError = apiResult.error;
            
            // Log failed attempt
            await this.logSMS({
              type: templateKey,
              recipient,
              templateId: template.id,
              message: variablesValues,
              status: 'failed',
              errorMessage: lastError.message,
              timestamp: new Date(),
              retryCount: attempt,
              entryId,
              customerId,
              locationId,
              operatorId
            });

            if (attempt < MAX_RETRY_ATTEMPTS) {
              console.log(`SMS failed on attempt ${attempt}, retrying in ${RETRY_DELAY_MS}ms...`);
              await this.delay(RETRY_DELAY_MS);
            }
          }

        } catch (error) {
          lastError = error as SMSError;
          
          // Log exception
          await this.logSMS({
            type: templateKey,
            recipient,
            templateId: template.id,
            message: variablesValues,
            status: 'failed',
            errorMessage: lastError.message,
            timestamp: new Date(),
            retryCount: attempt,
            entryId,
            customerId,
            locationId,
            operatorId
          });

          if (attempt < MAX_RETRY_ATTEMPTS) {
            console.log(`Exception on attempt ${attempt}, retrying in ${RETRY_DELAY_MS}ms...`);
            await this.delay(RETRY_DELAY_MS);
          }
        }
      }

      if (!finalResult) {
        finalResult = {
          success: false,
          error: lastError,
          timestamp: new Date(),
          attempt: MAX_RETRY_ATTEMPTS,
          templateUsed: templateKey,
          recipient
        };
      }

      return finalResult;

    } catch (error) {
      const smsError = error as SMSError;
      
      // Log unexpected errors
      await this.logSMS({
        type: templateKey,
        recipient,
        templateId: TEMPLATE_IDS[templateKey],
        message: 'ERROR',
        status: 'failed',
        errorMessage: smsError.message || 'Unexpected error',
        timestamp: new Date(),
        retryCount: 0,
        entryId,
        customerId,
        locationId,
        operatorId
      });

      return {
        success: false,
        error: smsError,
        timestamp: new Date(),
        attempt: 1,
        templateUsed: templateKey,
        recipient
      };
    }
  }

  /**
   * Send 3-day expiry reminder
   */
  public async sendThreeDayReminder(
    recipient: string,
    deceasedPersonName: string,
    locationName: string,
    expiryDate: string,
    adminMobile: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: expiryDate,
      mobile: adminMobile
    };

    return await this.sendSMSWithRetry({
      templateKey: 'threeDayReminder',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send last day renewal reminder
   */
  public async sendLastDayRenewalReminder(
    recipient: string,
    deceasedPersonName: string,
    locationName: string,
    expiryDate: string,
    adminMobile: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: expiryDate,
      mobile: adminMobile
    };

    return await this.sendSMSWithRetry({
      templateKey: 'lastdayRenewal',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send renewal confirmation to customer
   */
  public async sendRenewalConfirmationCustomer(
    recipient: string,
    deceasedPersonName: string,
    locationName: string,
    extendedExpiryDate: string,
    adminMobile: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: extendedExpiryDate,
      mobile: adminMobile
    };

    return await this.sendSMSWithRetry({
      templateKey: 'renewalConfirmCustomer',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send renewal confirmation to admin
   */
  public async sendRenewalConfirmationAdmin(
    recipient: string,
    locationName: string,
    deceasedPersonName: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName
    };

    return await this.sendSMSWithRetry({
      templateKey: 'renewalConfirmAdmin',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send dispatch confirmation to customer
   */
  public async sendDispatchConfirmationCustomer(
    recipient: string,
    deceasedPersonName: string,
    locationName: string,
    deliveryDate: string,
    contactPersonName: string,
    contactMobile: string,
    adminMobile: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: deliveryDate,
      contactPersonName,
      mobile: contactMobile,
      adminMobile
    };

    return await this.sendSMSWithRetry({
      templateKey: 'dispatchConfirmCustomer',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send delivery confirmation to admin
   */
  public async sendDeliveryConfirmationAdmin(
    recipient: string,
    deceasedPersonName: string,
    locationName: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName
    };

    return await this.sendSMSWithRetry({
      templateKey: 'deliveryConfirmAdmin',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send final disposal reminder
   */
  public async sendFinalDisposalReminder(
    recipient: string,
    deceasedPersonName: string,
    locationName: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName
    };

    return await this.sendSMSWithRetry({
      templateKey: 'finalDisposalReminder',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Send final disposal reminder to admin
   */
  public async sendFinalDisposalReminderAdmin(
    recipient: string,
    locationName: string,
    deceasedPersonName: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName
    };

    return await this.sendSMSWithRetry({
      templateKey: 'finalDisposalReminderAdmin',
      recipient,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Validate mobile number format
   */
  private validateMobileNumber(mobile: string): boolean {
    // Indian mobile number validation (10 digits, starting with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile.replace(/\s/g, ''));
  }

  /**
   * Log SMS to Firestore
   */
  private async logSMS(logData: Omit<SMSLog, 'id'>): Promise<void> {
    try {
      await SMSLogsService.getInstance().logSMS(logData);
      console.log('SMS logged successfully to Firestore');
    } catch (error) {
      console.error('Error logging SMS to Firestore:', error);
      // Don't throw here - SMS sending should not fail due to logging issues
    }
  }

  /**
   * Delay helper for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get SMS service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    templatesCount: number;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
  } {
    return {
      isInitialized: this.isInitialized,
      templatesCount: SMSTemplatesService.getInstance().getAllTemplates().length,
      maxRetries: MAX_RETRY_ATTEMPTS,
      retryDelay: RETRY_DELAY_MS,
      timeout: REQUEST_TIMEOUT_MS
    };
  }
}

export default SMSService;