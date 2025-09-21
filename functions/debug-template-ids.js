// Debug function to check template IDs in deployed functions
export const debugTemplateIds = functions
  .runWith({
    memory: '128MB',
    timeoutSeconds: 30,
  })
  .https.onRequest(async (req, res) => {
    try {
      // Import the template service
      const SMSTemplatesService = require('./lib/sms-templates').default;
      const service = SMSTemplatesService.getInstance();
      
      // Get the templates that were causing issues
      const finalDisposalTemplate = service.getTemplateByKey('finalDisposalReminder');
      const adminTemplate = service.getTemplateByKey('finalDisposalReminderAdmin');
      
      res.status(200).json({
        success: true,
        templates: {
          finalDisposalReminder: {
            key: finalDisposalTemplate.key,
            id: finalDisposalTemplate.id,
            name: finalDisposalTemplate.name,
            variableCount: finalDisposalTemplate.variableCount
          },
          finalDisposalReminderAdmin: {
            key: adminTemplate.key,
            id: adminTemplate.id,
            name: adminTemplate.name,
            variableCount: adminTemplate.variableCount
          }
        },
        expected: {
          finalDisposalReminder: '198613',
          finalDisposalReminderAdmin: '198614'
        },
        timestamp: new Date().toISOString(),
        deployment: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

// Add this to your index.ts file and deploy with:
// firebase deploy --only functions:debugTemplateIds