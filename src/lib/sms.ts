import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const FAST2SMS_CONFIG = {
  apiKey: process.env.FAST2SMS_API_KEY || '',
  senderId: process.env.FAST2SMS_SENDER_ID || 'RCTTST',
  route: "otp",
  baseUrl: "https://www.fast2sms.com/dev/bulkV2"
};

export const sendSMS = async (mobile: string, message: string, entryId: string | null = null) => {
  try {
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
    
    // Log in Firestore
    await addDoc(collection(db, 'smsLogs'), {
      recipient: mobile,
      message: message,
      status: result.return ? 'sent' : 'failed',
      entryId: entryId,
      fast2smsResponse: result,
      sentAt: serverTimestamp()
    });
    
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