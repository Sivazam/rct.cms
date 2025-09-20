// SMS Logs Service - Firebase Admin SDK Compatible Version
// This is a simplified version for Firebase Functions use

const admin = require('firebase-admin');

/**
 * SMS Log interface
 */
class SMSLog {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.recipient = data.recipient;
    this.templateId = data.templateId;
    this.message = data.message;
    this.status = data.status;
    this.timestamp = data.timestamp;
    this.retryCount = data.retryCount || 0;
    this.entryId = data.entryId;
    this.customerId = data.customerId;
    this.locationId = data.locationId;
    this.operatorId = data.operatorId;
    this.errorMessage = data.errorMessage;
  }
}

/**
 * SMS Log Filters interface
 */
class SMSLogFilters {
  constructor(filters = {}) {
    this.type = filters.type;
    this.status = filters.status;
    this.recipient = filters.recipient;
    this.locationId = filters.locationId;
    this.operatorId = filters.operatorId;
    this.dateRange = filters.dateRange;
  }
}

/**
 * SMS Logs Service - Manages SMS logging and statistics
 */
class SMSLogsService {
  constructor(db) {
    if (SMSLogsService.instance) {
      return SMSLogsService.instance;
    }
    
    this.db = db;
    this.collectionName = 'smsLogs';
    SMSLogsService.instance = this;
  }

  /**
   * Get singleton instance
   */
  static getInstance(db) {
    if (!SMSLogsService.instance) {
      SMSLogsService.instance = new SMSLogsService(db);
    }
    return SMSLogsService.instance;
  }

  /**
   * Log SMS activity
   */
  async logSMS(logData) {
    try {
      const logRef = this.db.collection(this.collectionName).doc();
      await logRef.set({
        ...logData,
        timestamp: admin.firestore.Timestamp.now()
      });
      
      console.log(`SMS logged successfully: ${logData.type} to ${logData.recipient}`);
      return true;
    } catch (error) {
      console.error('Error logging SMS:', error);
      return false;
    }
  }

  /**
   * Get SMS logs with optional filters
   */
  async getSMSLogs(filters = {}) {
    try {
      let query = this.db.collection(this.collectionName);

      // Apply filters
      let filteredQuery = query;
      
      if (filters?.type) {
        filteredQuery = filteredQuery.where('type', '==', filters.type);
      }
      
      if (filters?.status) {
        filteredQuery = filteredQuery.where('status', '==', filters.status);
      }
      
      if (filters?.recipient) {
        filteredQuery = filteredQuery.where('recipient', '==', filters.recipient);
      }
      
      if (filters?.locationId) {
        filteredQuery = filteredQuery.where('locationId', '==', filters.locationId);
      }
      
      if (filters?.operatorId) {
        filteredQuery = filteredQuery.where('operatorId', '==', filters.operatorId);
      }
      
      if (filters?.dateRange) {
        filteredQuery = filteredQuery.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.dateRange.start));
        filteredQuery = filteredQuery.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.dateRange.end));
      }

      // Always order by timestamp (newest first)
      filteredQuery = filteredQuery.orderBy('timestamp', 'desc');

      const querySnapshot = await filteredQuery.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        };
      });
    } catch (error) {
      console.error('Error getting SMS logs:', error);
      throw error;
    }
  }

  /**
   * Get SMS statistics
   */
  async getSMSStatistics(filters = {}) {
    try {
      const logs = await this.getSMSLogs(filters);
      
      const stats = {
        total: logs.length,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {},
        byDate: {},
        retryCount: 0
      };

      logs.forEach(log => {
        // Count by status
        if (log.status === 'sent') stats.sent++;
        else if (log.status === 'failed') stats.failed++;
        else if (log.status === 'pending') stats.pending++;

        // Count by type
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

        // Count by date
        const timestamp = log.timestamp instanceof Date ? log.timestamp : 
                         (log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp));
        const dateKey = timestamp.toISOString().split('T')[0];
        stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting SMS statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent SMS activity
   */
  async getRecentSMS(limit = 10) {
    try {
      const querySnapshot = await this.db.collection(this.collectionName)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        };
      });
    } catch (error) {
      console.error('Error getting recent SMS:', error);
      throw error;
    }
  }

  /**
   * Get failed SMS for retry
   */
  async getFailedSMS(limit = 50) {
    try {
      const querySnapshot = await this.db.collection(this.collectionName)
        .where('status', '==', 'failed')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        };
      });
    } catch (error) {
      console.error('Error getting failed SMS:', error);
      throw error;
    }
  }

  /**
   * Clean up old SMS logs (older than specified days)
   */
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const querySnapshot = await this.db.collection(this.collectionName)
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
        .get();
      
      const batch = this.db.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`Cleaned up ${querySnapshot.size} old SMS logs`);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error cleaning up old SMS logs:', error);
      throw error;
    }
  }
}

module.exports = SMSLogsService;