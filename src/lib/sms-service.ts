// SMS Service for Front-end Only - Secure Firebase Functions Integration
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import SMSTemplatesService, { TemplateVariables, SMSRequest } from './sms-templates';

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
      throw new Error('Firebase Functions not initialized');
    }

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
      const validation = SMSTemplatesService.getInstance().validateTemplateVariables(request.templateKey, request.variables);
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
        recipient: request.recipient,
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
   * Get SMS service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    templatesCount: number;
    functionsAvailable: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      templatesCount: SMSTemplatesService.getInstance().getAllTemplates().length,
      functionsAvailable: !!functions
    };
  }
}

export default SMSService;