import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Firestore instance
const db = admin.firestore();

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