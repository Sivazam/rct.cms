// SMS Service for Fast2SMS integration
import axios from 'axios';
import SMSLogsService, { SMSLog } from './sms-logs';

// Environment variables (to be set in .env file)
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'YOUR_FAST2SMS_API_KEY';
const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

// Template IDs (to be set in .env file)
const TEMPLATES = {
  ENTRY_REMINDER_7_DAYS: process.env.TEMPLATE_ENTRY_REMINDER_7_DAYS || 'YOUR_TEMPLATE_ID',
  ENTRY_REMINDER_3_DAYS: process.env.TEMPLATE_ENTRY_REMINDER_3_DAYS || 'YOUR_TEMPLATE_ID',
  ENTRY_REMINDER_0_DAYS: process.env.TEMPLATE_ENTRY_REMINDER_0_DAYS || 'YOUR_TEMPLATE_ID',
  DISPOSAL_WARNING_60_DAYS: process.env.TEMPLATE_DISPOSAL_WARNING_60_DAYS || 'YOUR_TEMPLATE_ID',
  FINAL_DISPOSAL_NOTICE: process.env.TEMPLATE_FINAL_DISPOSAL_NOTICE || 'YOUR_TEMPLATE_ID',
  RENEWAL_NOTIFICATION: process.env.TEMPLATE_RENEWAL_NOTIFICATION || 'YOUR_TEMPLATE_ID',
  DISPATCH_NOTIFICATION: process.env.TEMPLATE_DISPATCH_NOTIFICATION || 'YOUR_TEMPLATE_ID',
};

// Mobile numbers (to be set in .env file)
const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '9014882779';
const TECH_SUPPORT_MOBILE = process.env.TECH_SUPPORT_MOBILE || '9999999999';

// SMS Log interface
export interface SMSLog {
  id: string;
  type: string;
  recipient: string;
  templateId: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  timestamp: Date;
  retryCount: number;
  entryId?: string;
  customerId?: string;
}

// SMS Service class
class SMSService {
  private static instance: SMSService;
  private retryAttempts = 3;
  private retryDelay = 5000; // 5 seconds

  private constructor() {}

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * Send SMS using Fast2SMS API
   */
  private async sendSMS(
    recipient: string,
    templateId: string,
    variables: string[],
    entryId?: string,
    customerId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message = this.formatMessage(templateId, variables);
      
      const payload = {
        route: 'dlt',
        sender_id: 'YOUR_SENDER_ID', // To be configured
        message: message,
        language: 'telugu',
        numbers: recipient,
        template_id: templateId,
        variables: variables,
        variables_values: variables
      };

      const headers = {
        'Authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(FAST2SMS_BASE_URL, payload, { headers });

      if (response.data.return) {
        // Log successful SMS
        await this.logSMS({
          type: this.getSMSType(templateId),
          recipient,
          templateId,
          message,
          status: 'sent',
          timestamp: new Date(),
          retryCount: 0,
          entryId,
          customerId
        });

        // Send parallel SMS to admin for renew/dispatch events
        if (templateId === TEMPLATES.RENEWAL_NOTIFICATION || templateId === TEMPLATES.DISPATCH_NOTIFICATION) {
          await this.sendAdminNotification(templateId, message, entryId);
        }

        return {
          success: true,
          messageId: response.data.request_id
        };
      } else {
        throw new Error(response.data.message || 'SMS sending failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log failed SMS
      await this.logSMS({
        type: this.getSMSType(templateId),
        recipient,
        templateId,
        message: this.formatMessage(templateId, variables),
        status: 'failed',
        errorMessage,
        timestamp: new Date(),
        retryCount: 0,
        entryId,
        customerId
      });

      // Notify tech support about failure
      await this.notifyTechSupport(templateId, recipient, errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send SMS with retry mechanism
   */
  public async sendSMSWithRetry(
    recipient: string,
    templateId: string,
    variables: string[],
    entryId?: string,
    customerId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      const result = await this.sendSMS(recipient, templateId, variables, entryId, customerId);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Update retry count in log
      await this.updateSMSRetryCount(recipient, templateId, attempt);
      
      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay);
      }
    }
    
    return {
      success: false,
      error: lastError || 'All retry attempts failed'
    };
  }

  /**
   * Send entry reminder SMS
   */
  public async sendEntryReminder(
    recipient: string,
    customerName: string,
    locationName: string,
    expiryDate: string,
    contactNumber: string,
    daysRemaining: number,
    entryId?: string,
    customerId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let templateId: string;
    
    if (daysRemaining === 7) {
      templateId = TEMPLATES.ENTRY_REMINDER_7_DAYS;
    } else if (daysRemaining === 3) {
      templateId = TEMPLATES.ENTRY_REMINDER_3_DAYS;
    } else if (daysRemaining === 0) {
      templateId = TEMPLATES.ENTRY_REMINDER_0_DAYS;
    } else {
      return { success: false, error: 'Invalid days remaining for reminder' };
    }

    const variables = [customerName, locationName, expiryDate, contactNumber, locationName];
    
    return await this.sendSMSWithRetry(recipient, templateId, variables, entryId, customerId);
  }

  /**
   * Send disposal warning SMS
   */
  public async sendDisposalWarning(
    recipient: string,
    customerName: string,
    disposalDate: string,
    entryId?: string,
    customerId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templateId = TEMPLATES.DISPOSAL_WARNING_60_DAYS;
    const variables = [customerName, disposalDate];
    
    return await this.sendSMSWithRetry(recipient, templateId, variables, entryId, customerId);
  }

  /**
   * Send final disposal notice SMS
   */
  public async sendFinalDisposalNotice(
    recipient: string,
    customerName: string,
    riverName: string = 'River Godavari',
    entryId?: string,
    customerId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templateId = TEMPLATES.FINAL_DISPOSAL_NOTICE;
    const variables = [customerName, riverName];
    
    return await this.sendSMSWithRetry(recipient, templateId, variables, entryId, customerId);
  }

  /**
   * Send renewal notification to admin
   */
  public async sendRenewalNotification(
    customerName: string,
    locationName: string,
    amount: number,
    entryId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templateId = TEMPLATES.RENEWAL_NOTIFICATION;
    const variables = [customerName, locationName, amount.toString()];
    
    return await this.sendSMSWithRetry(ADMIN_MOBILE, templateId, variables, entryId);
  }

  /**
   * Send dispatch notification to admin
   */
  public async sendDispatchNotification(
    customerName: string,
    locationName: string,
    operatorName: string,
    entryId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const templateId = TEMPLATES.DISPATCH_NOTIFICATION;
    const variables = [customerName, locationName, operatorName];
    
    return await this.sendSMSWithRetry(ADMIN_MOBILE, templateId, variables, entryId);
  }

  /**
   * Format message based on template
   */
  private formatMessage(templateId: string, variables: string[]): string {
    // This is a simplified version - in production, you'd fetch the actual template from Fast2SMS
    const templates = {
      [TEMPLATES.ENTRY_REMINDER_7_DAYS]: `నమస్తే, దివంగత ${variables[0]} గారి అస్థికలు ${variables[1]} లో ${variables[2]} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం ${variables[3]} కి సంప్రదించండి లేదా మా వద్దకు రండి. – ${variables[4]}`,
      [TEMPLATES.ENTRY_REMINDER_3_DAYS]: `నమస్తే, దివంగత ${variables[0]} గారి అస్థికలు ${variables[1]} లో ${variables[2]} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం ${variables[3]} కి సంప్రదించండి లేదా మా వద్దకు రండి. – ${variables[4]}`,
      [TEMPLATES.ENTRY_REMINDER_0_DAYS]: `నమస్తే, దివంగత ${variables[0]} గారి అస్థికలు ${variables[1]} లో ${variables[2]} న గడువు ముగుస్తుంది. కొనసాగింపు కోసం ${variables[3]} కి సంప్రదించండి లేదా మా వద్దకు రండి. – ${variables[4]}`,
      [TEMPLATES.DISPOSAL_WARNING_60_DAYS]: `నమస్తే, దివంగత ${variables[0]} గారి అస్థికలు ${variables[1]} నుండి 3 రోజుల్లో పంపిణీ చేయబడతాయి. దయచేసి చివరి గడువు ముందు సేకరించండి.`,
      [TEMPLATES.FINAL_DISPOSAL_NOTICE]: `నమస్తే, దివంగత ${variables[0]} గారి అస్థికలు నేడు ${variables[1]} లో పంపిణీ చేయబడతాయి.`,
      [TEMPLATES.RENEWAL_NOTIFICATION]: `పునరుద్ధరణ: ${variables[0]} - ${variables[1]} - ₹${variables[2]}`,
      [TEMPLATES.DISPATCH_NOTIFICATION]: `పంపిణీ: ${variables[0]} - ${variables[1]} - ${variables[2]}`
    };

    return templates[templateId] || 'Template not found';
  }

  /**
   * Get SMS type based on template ID
   */
  private getSMSType(templateId: string): string {
    const typeMap = {
      [TEMPLATES.ENTRY_REMINDER_7_DAYS]: 'ENTRY_REMINDER_7_DAYS',
      [TEMPLATES.ENTRY_REMINDER_3_DAYS]: 'ENTRY_REMINDER_3_DAYS',
      [TEMPLATES.ENTRY_REMINDER_0_DAYS]: 'ENTRY_REMINDER_0_DAYS',
      [TEMPLATES.DISPOSAL_WARNING_60_DAYS]: 'DISPOSAL_WARNING_60_DAYS',
      [TEMPLATES.FINAL_DISPOSAL_NOTICE]: 'FINAL_DISPOSAL_NOTICE',
      [TEMPLATES.RENEWAL_NOTIFICATION]: 'RENEWAL_NOTIFICATION',
      [TEMPLATES.DISPATCH_NOTIFICATION]: 'DISPATCH_NOTIFICATION'
    };

    return typeMap[templateId] || 'UNKNOWN';
  }

  /**
   * Log SMS to database
   */
  private async logSMS(logData: Omit<SMSLog, 'id'>): Promise<void> {
    try {
      await SMSLogsService.getInstance().logSMS(logData);
      console.log('SMS logged successfully to Firestore');
    } catch (error) {
      console.error('Error logging SMS:', error);
    }
  }

  /**
   * Update SMS retry count
   */
  private async updateSMSRetryCount(recipient: string, templateId: string, retryCount: number): Promise<void> {
    try {
      // Get the most recent SMS log for this recipient and template
      const logs = await SMSLogsService.getInstance().getSMSLogs({
        recipient,
        type: this.getSMSType(templateId)
      });
      
      if (logs.length > 0) {
        const latestLog = logs[0];
        await SMSLogsService.getInstance().updateSMSLog(latestLog.id!, { retryCount });
        console.log(`Updated retry count for SMS ${latestLog.id}: ${retryCount}`);
      }
    } catch (error) {
      console.error('Error updating SMS retry count:', error);
    }
  }

  /**
   * Send admin notification for renew/dispatch events
   */
  private async sendAdminNotification(templateId: string, message: string, entryId?: string): Promise<void> {
    try {
      const adminMessage = `Admin Alert: ${message}`;
      // Send to admin mobile
      await this.sendSMS(ADMIN_MOBILE, templateId, [adminMessage], entryId);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  /**
   * Notify tech support about SMS failure
   */
  private async notifyTechSupport(templateId: string, recipient: string, errorMessage: string): Promise<void> {
    try {
      const techMessage = `SMS Failed: Template ${templateId} to ${recipient}. Error: ${errorMessage}`;
      await this.sendSMS(TECH_SUPPORT_MOBILE, TEMPLATES.FINAL_DISPOSAL_NOTICE, [techMessage]);
    } catch (error) {
      console.error('Error notifying tech support:', error);
    }
  }

  /**
   * Delay helper for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SMSService.getInstance();