// SMS Service for Front-end Only - Secure Firebase Functions Integration
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import SMSTemplatesService, { TemplateVariables, SMSRequest, TEMPLATE_IDS } from './sms-templates';

// Create a single instance of SMSTemplatesService
const smsTemplatesService = new SMSTemplatesService();

// SMS Service Result interface
export interface SMSServiceResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
  attempt: number;
  templateUsed: string;
  recipient: string;
}

// SMS Service class - Front-end only, no API keys
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
   * Initialize SMS service
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Validate Firebase Functions are available
    if (!functions) {
      console.error('Firebase Functions not available. Current functions value:', functions);
      throw new Error('Firebase Functions not initialized. Please check your Firebase configuration.');
    }

    console.log('Firebase Functions initialized successfully:', !!functions);
    this.isInitialized = true;
    console.log('SMS Service initialized securely with Firebase Functions');
  }

  /**
   * Send SMS via Firebase Functions (Secure)
   */
  public async sendSMSWithRetry(request: SMSRequest): Promise<SMSServiceResult> {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      // Validate request
      const validation = smsTemplatesService.validateTemplateVariables(request.templateKey, request.variables);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('Sending SMS via Firebase Functions:', {
        templateKey: request.templateKey,
        recipient: request.recipient.substring(0, 4) + '****' + request.recipient.substring(-4), // Partial logging for privacy
        entryId: request.entryId
      });

      // Call Firebase Functions securely
      const sendSMSFunction = httpsCallable(functions, 'sendSMS');
      
      const result = await sendSMSFunction({
        templateKey: request.templateKey,
        customerMobile: request.recipient, // Changed from recipient to customerMobile
        variables: request.variables,
        entryId: request.entryId,
        customerId: request.customerId,
        locationId: request.locationId,
        operatorId: request.operatorId
      });

      console.log('Firebase Functions result:', result.data);

      return {
        success: result.data.success,
        messageId: result.data.messageId,
        error: result.data.error,
        timestamp: new Date(),
        attempt: 1,
        templateUsed: request.templateKey,
        recipient: request.recipient
      };

    } catch (error) {
      console.error('SMS sending error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date(),
        attempt: 1,
        templateUsed: request.templateKey,
        recipient: request.recipient
      };
    }
  }

  /**
   * Send 3-day expiry reminder
   */
  public async sendThreeDayReminder(
    customerMobile: string,
    deceasedPersonName: string,
    locationName: string,
    expiryDate: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: expiryDate,
      mobile: customerMobile // Using customer mobile for template
    };

    return await this.sendSMSWithRetry({
      templateKey: 'threeDayReminder',
      recipient: customerMobile,
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
    customerMobile: string,
    deceasedPersonName: string,
    locationName: string,
    expiryDate: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: expiryDate,
      mobile: customerMobile // Using customer mobile for template
    };

    return await this.sendSMSWithRetry({
      templateKey: 'lastdayRenewal',
      recipient: customerMobile,
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
    customerMobile: string,
    deceasedPersonName: string,
    locationName: string,
    extendedExpiryDate: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: extendedExpiryDate,
      mobile: customerMobile // Using customer mobile for template
    };

    return await this.sendSMSWithRetry({
      templateKey: 'renewalConfirmCustomer',
      recipient: customerMobile,
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
    customerMobile: string,
    deceasedPersonName: string,
    locationName: string,
    deliveryDate: string,
    handoverPersonName: string,
    handoverPersonMobile: string,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: deliveryDate,
      contactPersonName: handoverPersonName,
      mobile: handoverPersonMobile,
      adminMobile: customerMobile // Using customer mobile as admin mobile for template
    };

    return await this.sendSMSWithRetry({
      templateKey: 'dispatchConfirmCustomer',
      recipient: customerMobile,
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
   * Get SMS service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    templatesCount: number;
    functionsAvailable: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      templatesCount: smsTemplatesService.getAllTemplates().length,
      functionsAvailable: !!functions
    };
  }

  /**
   * Legacy method compatibility - send dispatch notification (maps to dispatch confirmation)
   */
  public async sendDispatchNotification(
    deceasedPersonName: string,
    locationName: string,
    operatorName: string,
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
      recipient: '+919876543210', // Default admin mobile - should be configurable
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Legacy method compatibility - send final disposal notice (maps to final disposal reminder)
   */
  public async sendFinalDisposalNotice(
    customerMobile: string,
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
      recipient: customerMobile,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Legacy method compatibility - send renewal notification (maps to renewal confirmation admin)
   */
  public async sendRenewalNotification(
    deceasedPersonName: string,
    locationName: string,
    amount: number,
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
      recipient: '+919876543210', // Default admin mobile - should be configurable
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }

  /**
   * Legacy method compatibility - send entry reminder (maps to three day reminder)
   */
  public async sendEntryReminder(
    customerMobile: string,
    deceasedPersonName: string,
    locationName: string,
    expiryDate: string,
    operatorName: string,
    daysUntilExpiry: number,
    entryId?: string,
    customerId?: string,
    locationId?: string,
    operatorId?: string
  ): Promise<SMSServiceResult> {
    const variables: TemplateVariables = {
      deceasedPersonName,
      locationName,
      date: expiryDate,
      mobile: customerMobile
    };

    // Choose template based on days until expiry
    let templateKey: keyof typeof TEMPLATE_IDS;
    if (daysUntilExpiry <= 0) {
      templateKey = 'lastdayRenewal';
    } else if (daysUntilExpiry <= 3) {
      templateKey = 'threeDayReminder';
    } else {
      templateKey = 'threeDayReminder'; // Default to 3-day reminder
    }

    return await this.sendSMSWithRetry({
      templateKey,
      recipient: customerMobile,
      variables,
      entryId,
      customerId,
      locationId,
      operatorId
    });
  }
}

export default SMSService;