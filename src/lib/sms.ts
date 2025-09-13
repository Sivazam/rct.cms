import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// TODO: Replace with actual Fast2SMS integration when credentials are available
// This function currently shows dialogs for client-side calls and logs for server-side calls
// FAST2SMS_CONFIG will be used when real SMS integration is implemented
const FAST2SMS_CONFIG = {
  apiKey: process.env.FAST2SMS_API_KEY || '', // TODO: Add your Fast2SMS API key here
  senderId: process.env.FAST2SMS_SENDER_ID || 'RCTTST', // TODO: Update with your sender ID
  route: "otp",
  baseUrl: "https://www.fast2sms.com/dev/bulkV2"
};

// TODO: This function currently handles both client-side (dialogs) and server-side (logging) calls
// Replace with actual Fast2SMS API integration when credentials are available
export const sendSMS = async (mobile: string, message: string, entryId: string | null = null) => {
  try {
    // Check if we're in a browser environment (client-side)
    const isClientSide = typeof window !== 'undefined';
    
    if (isClientSide) {
      // Client-side: We can't send SMS directly, so we'll log it for now
      // In the actual components, we're using showSMSDialog() instead
      console.log('SMS (Client-side) - would be sent to:', mobile);
      console.log('SMS (Client-side) - Message:', message);
      console.log('SMS (Client-side) - Entry ID:', entryId);
    } else {
      // Server-side: Log the SMS that would be sent
      console.log('SMS (Server-side) - would be sent to:', mobile);
      console.log('SMS (Server-side) - Message:', message);
      console.log('SMS (Server-side) - Entry ID:', entryId);
      
      // TODO: Uncomment this code when Fast2SMS credentials are available for server-side SMS
      /*
      const response = await fetch(FAST2SMS_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': FAST2SMS_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: FAST2SMS_CONFIG.route,
          sender_id: FAST2SMS_CONFIG.senderId,
          message: message,
          numbers: mobile.replace('+91', ''), // remove country code
          flash: 0
        })
      });
      
      const result = await response.json();
      return result;
      */
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate successful response
    const result = {
      return: true,
      request_id: 'temp_' + Date.now(),
      message: isClientSide ? 'SMS logged (client-side)' : 'SMS logged (server-side)'
    };
    
    // TODO: Keep this logging for tracking SMS sends
    // Log in Firestore for audit purposes (only if we have access to Firestore)
    try {
      if (typeof db !== 'undefined') {
        await addDoc(collection(db, 'smsLogs'), {
          recipient: mobile,
          message: message,
          status: result.return ? 'sent' : 'failed',
          entryId: entryId,
          fast2smsResponse: result,
          sentAt: serverTimestamp(),
          isSimulated: true, // TODO: Remove this field when using real SMS
          isClientSide: isClientSide
        });
      }
    } catch (logError) {
      console.error('Failed to log SMS to Firestore:', logError);
    }
    
    return result;
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error };
  }
};

// SMS Templates
export const SMSTemplates = {
  entryConfirmation: (operatorName: string, location: string, customerName: string, pots: number, entryId: string) =>
    `New entry by ${operatorName} at ${location}. Customer: ${customerName}, Pots: ${pots}, Payment: ₹500. ID: ${entryId.slice(-6)}`,
  
  customerEntryConfirmation: (entryId: string, expiryDate: string) =>
    `RCT-CMS: Registration successful. Storage ID: ${entryId.slice(-6)}. Valid until: ${expiryDate}. Renew or collect before expiry.`,
  
  renewalReminder7Days: (entryId: string, expiryDate: string) =>
    `RCT-CMS: Your storage (ID: ${entryId.slice(-6)}) expires in 7 days on ${expiryDate}. Please renew or collect.`,
  
  renewalReminder3Days: (entryId: string, expiryDate: string) =>
    `RCT-CMS: URGENT - Storage expires in 3 days on ${expiryDate}. ID: ${entryId.slice(-6)}. Contact us immediately.`,
  
  renewalReminderToday: (entryId: string) =>
    `RCT-CMS: FINAL DAY - Storage expires today. Renew/collect immediately. ID: ${entryId.slice(-6)}.`,
  
  renewalConfirmation: (operatorName: string, customerName: string, months: number, amount: number, entryId: string) =>
    `Renewal by ${operatorName}. Customer: ${customerName}, Period: ${months} months, Amount: ₹${amount}. ID: ${entryId.slice(-6)}`,
  
  customerRenewalConfirmation: (entryId: string, newExpiryDate: string, amount: number) =>
    `RCT-CMS: Renewal successful. Valid until: ${newExpiryDate}. Amount paid: ₹${amount}. ID: ${entryId.slice(-6)}.`,
  
  deliveryConfirmation: (operatorName: string, customerName: string, entryId: string, date: string) =>
    `Ashes delivered by ${operatorName} to ${customerName}. ID: ${entryId.slice(-6)} on ${date}.`,
  
  customerDeliveryConfirmation: (entryId: string, date: string) =>
    `RCT-CMS: Ashes delivered successfully on ${date}. Thank you for using our services. ID: ${entryId.slice(-6)}.`
};