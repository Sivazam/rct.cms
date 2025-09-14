import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import SMSService from '../src/lib/sms-service';
import SMSLogsService from '../src/lib/sms-logs';

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

// Scheduled function to check for expiring entries and send SMS reminders
export const dailySMSChecks = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 540,
  })
  .pubsub.schedule('0 10 * * *') // Run daily at 10 AM
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    console.log('Starting daily SMS checks at:', new Date().toISOString());
    
    try {
      const results = {
        entries7Days: 0,
        entries3Days: 0,
        entries0Days: 0,
        entries60Days: 0,
        entriesFinalDisposal: 0,
        totalSMS: 0,
        failedSMS: 0,
        errors: [] as string[]
      };

      // Get all active entries
      const entriesSnapshot = await db.collection('entries')
        .where('status', '==', 'active')
        .get();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      console.log(`Found ${entriesSnapshot.size} active entries to process`);

      for (const doc of entriesSnapshot.docs) {
        const entry = doc.data();
        
        try {
          const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
          
          if (!expiryDate || isNaN(expiryDate.getTime())) {
            console.warn(`Invalid expiry date for entry ${doc.id}`);
            continue;
          }

          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Get customer details
          const customerDoc = await db.collection('customers').doc(entry.customerId).get();
          const customer = customerDoc.data();
          
          if (!customer) {
            console.warn(`Customer not found for entry ${doc.id}`);
            continue;
          }

          // Get location details
          const locationDoc = await db.collection('locations').doc(entry.locationId).get();
          const location = locationDoc.data();
          
          if (!location) {
            console.warn(`Location not found for entry ${doc.id}`);
            continue;
          }

          // Check different timeframes and send appropriate SMS
          
          // 7 days before expiry
          if (daysUntilExpiry === 7) {
            console.log(`Sending 7-day reminder for entry ${doc.id}`);
            const smsResult = await SMSService.getInstance().sendEntryReminder(
              customer.mobile,
              customer.name,
              location.venueName,
              expiryDate.toLocaleDateString('en-IN'),
              location.contactNumber || 'N/A',
              7,
              doc.id,
              entry.customerId
            );
            
            results.entries7Days++;
            results.totalSMS++;
            if (!smsResult.success) {
              results.failedSMS++;
              results.errors.push(`7-day reminder failed for entry ${doc.id}: ${smsResult.error}`);
            }
          }

          // 3 days before expiry
          else if (daysUntilExpiry === 3) {
            console.log(`Sending 3-day reminder for entry ${doc.id}`);
            const smsResult = await SMSService.getInstance().sendEntryReminder(
              customer.mobile,
              customer.name,
              location.venueName,
              expiryDate.toLocaleDateString('en-IN'),
              location.contactNumber || 'N/A',
              3,
              doc.id,
              entry.customerId
            );
            
            results.entries3Days++;
            results.totalSMS++;
            if (!smsResult.success) {
              results.failedSMS++;
              results.errors.push(`3-day reminder failed for entry ${doc.id}: ${smsResult.error}`);
            }
          }

          // 0 days (expiry day)
          else if (daysUntilExpiry === 0) {
            console.log(`Sending 0-day reminder for entry ${doc.id}`);
            const smsResult = await SMSService.getInstance().sendEntryReminder(
              customer.mobile,
              customer.name,
              location.venueName,
              expiryDate.toLocaleDateString('en-IN'),
              location.contactNumber || 'N/A',
              0,
              doc.id,
              entry.customerId
            );
            
            results.entries0Days++;
            results.totalSMS++;
            if (!smsResult.success) {
              results.failedSMS++;
              results.errors.push(`0-day reminder failed for entry ${doc.id}: ${smsResult.error}`);
            }
          }

          // 60 days after expiry (2 months)
          else if (daysUntilExpiry === -60) {
            console.log(`Sending 60-day disposal warning for entry ${doc.id}`);
            const disposalDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
            const smsResult = await SMSService.getInstance().sendDisposalWarning(
              customer.mobile,
              customer.name,
              disposalDate.toLocaleDateString('en-IN'),
              doc.id,
              entry.customerId
            );
            
            results.entries60Days++;
            results.totalSMS++;
            if (!smsResult.success) {
              results.failedSMS++;
              results.errors.push(`60-day disposal warning failed for entry ${doc.id}: ${smsResult.error}`);
            }
          }

          // Final disposal (63 days after expiry)
          else if (daysUntilExpiry === -63) {
            console.log(`Sending final disposal notice for entry ${doc.id}`);
            const smsResult = await SMSService.getInstance().sendFinalDisposalNotice(
              customer.mobile,
              customer.name,
              'River Godavari',
              doc.id,
              entry.customerId
            );
            
            // Update entry status to 'disposed'
            await db.collection('entries').doc(doc.id).update({
              status: 'disposed',
              disposalDate: admin.firestore.FieldValue.serverTimestamp()
            });
            
            results.entriesFinalDisposal++;
            results.totalSMS++;
            if (!smsResult.success) {
              results.failedSMS++;
              results.errors.push(`Final disposal notice failed for entry ${doc.id}: ${smsResult.error}`);
            }
          }

        } catch (error) {
          console.error(`Error processing entry ${doc.id}:`, error);
          results.errors.push(`Error processing entry ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Log the results
      console.log('Daily SMS check completed:', results);
      
      // Save execution log
      await db.collection('smsExecutionLogs').add({
        ...results,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        totalEntries: entriesSnapshot.size
      });

      return {
        success: true,
        message: 'Daily SMS checks completed successfully',
        results
      };

    } catch (error) {
      console.error('Error in daily SMS checks:', error);
      
      // Log error
      await db.collection('smsExecutionLogs').add({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw error;
    }
  });

// Function to retry failed SMS
export const retryFailedSMS = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 300,
  })
  .https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    
    if (!user || user.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can retry failed SMS.'
      );
    }

    try {
      const failedLogs = await SMSLogsService.getInstance().getFailedSMSLogs(2); // Max 2 retries
      let retryCount = 0;
      let successCount = 0;

      for (const log of failedLogs) {
        try {
          // Retry sending SMS based on type
          let result;
          
          switch (log.type) {
            case 'ENTRY_REMINDER_7_DAYS':
            case 'ENTRY_REMINDER_3_DAYS':
            case 'ENTRY_REMINDER_0_DAYS':
              // Parse message to extract variables
              const variables = log.message.split(' - ');
              if (variables.length >= 4) {
                result = await SMSService.getInstance().sendEntryReminder(
                  log.recipient,
                  variables[0], // customer name
                  variables[1], // location name
                  variables[2], // expiry date
                  variables[3], // contact number
                  log.type === 'ENTRY_REMINDER_7_DAYS' ? 7 : 
                  log.type === 'ENTRY_REMINDER_3_DAYS' ? 3 : 0,
                  log.entryId,
                  log.customerId
                );
              }
              break;
              
            case 'DISPOSAL_WARNING_60_DAYS':
              const disposalVars = log.message.split(' in ');
              if (disposalVars.length >= 2) {
                result = await SMSService.getInstance().sendDisposalWarning(
                  log.recipient,
                  disposalVars[0].replace('నమస్తే, దివంగత ', '').replace(' గారి అస్థికలు', ''),
                  disposalVars[1].replace(' లో పంపిణీ చేయబడతాయి.', ''),
                  log.entryId,
                  log.customerId
                );
              }
              break;
              
            case 'FINAL_DISPOSAL_NOTICE':
              const finalVars = log.message.split(' లో పంపిణీ చేయబడతాయి.');
              if (finalVars.length >= 1) {
                result = await SMSService.getInstance().sendFinalDisposalNotice(
                  log.recipient,
                  finalVars[0].replace('నమస్తే, దివంగత ', '').replace(' గారి అస్థికలు నేడు', ''),
                  'River Godavari',
                  log.entryId,
                  log.customerId
                );
              }
              break;
              
            default:
              console.warn(`Unknown SMS type for retry: ${log.type}`);
              continue;
          }

          retryCount++;
          if (result?.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error retrying SMS for log ${log.id}:`, error);
        }
      }

      return {
        success: true,
        message: `Retried ${retryCount} SMS, ${successCount} successful`,
        retryCount,
        successCount
      };

    } catch (error) {
      console.error('Error in retryFailedSMS:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to retry SMS messages.'
      );
    }
  });

// Function to get SMS statistics
export const getSMSStatistics = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    
    if (!user || user.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can access SMS statistics.'
      );
    }

    try {
      const stats = await SMSLogsService.getInstance().getSMSStatistics();
      
      return {
        success: true,
        statistics: stats
      };

    } catch (error) {
      console.error('Error in getSMSStatistics:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get SMS statistics.'
      );
    }
  });

// Function to manually send SMS for an entry
export const sendManualSMS = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 60,
  })
  .https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const user = userDoc.data();
    
    if (!user || user.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admin users can send manual SMS.'
      );
    }

    const { entryId, smsType } = data;

    if (!entryId || !smsType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Entry ID and SMS type are required.'
      );
    }

    try {
      // Get entry details
      const entryDoc = await db.collection('entries').doc(entryId).get();
      const entry = entryDoc.data();
      
      if (!entry) {
        throw new functions.https.HttpsError(
          'not-found',
          'Entry not found.'
        );
      }

      // Get customer details
      const customerDoc = await db.collection('customers').doc(entry.customerId).get();
      const customer = customerDoc.data();
      
      if (!customer) {
        throw new functions.https.HttpsError(
          'not-found',
          'Customer not found.'
        );
      }

      // Get location details
      const locationDoc = await db.collection('locations').doc(entry.locationId).get();
      const location = locationDoc.data();
      
      if (!location) {
        throw new functions.https.HttpsError(
          'not-found',
          'Location not found.'
        );
      }

      const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let result;

      switch (smsType) {
        case '7_DAYS':
          result = await SMSService.getInstance().sendEntryReminder(
            customer.mobile,
            customer.name,
            location.venueName,
            expiryDate.toLocaleDateString('en-IN'),
            location.contactNumber || 'N/A',
            7,
            entryId,
            entry.customerId
          );
          break;
          
        case '3_DAYS':
          result = await SMSService.getInstance().sendEntryReminder(
            customer.mobile,
            customer.name,
            location.venueName,
            expiryDate.toLocaleDateString('en-IN'),
            location.contactNumber || 'N/A',
            3,
            entryId,
            entry.customerId
          );
          break;
          
        case '0_DAYS':
          result = await SMSService.getInstance().sendEntryReminder(
            customer.mobile,
            customer.name,
            location.venueName,
            expiryDate.toLocaleDateString('en-IN'),
            location.contactNumber || 'N/A',
            0,
            entryId,
            entry.customerId
          );
          break;
          
        case 'DISPOSAL_WARNING':
          const disposalDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
          result = await SMSService.getInstance().sendDisposalWarning(
            customer.mobile,
            customer.name,
            disposalDate.toLocaleDateString('en-IN'),
            entryId,
            entry.customerId
          );
          break;
          
        case 'FINAL_DISPOSAL':
          result = await SMSService.getInstance().sendFinalDisposalNotice(
            customer.mobile,
            customer.name,
            'River Godavari',
            entryId,
            entry.customerId
          );
          break;
          
        default:
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid SMS type.'
          );
      }

      return {
        success: result.success,
        message: result.success ? 'SMS sent successfully' : 'Failed to send SMS',
        error: result.error
      };

    } catch (error) {
      console.error('Error in sendManualSMS:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send manual SMS.'
      );
    }
  });