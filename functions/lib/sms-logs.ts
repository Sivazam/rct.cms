// SMS Logs Service for Firebase Admin SDK
import * as admin from 'firebase-admin';

export interface SMSLog {
  id?: string;
  type: string;
  recipient: string;
  templateId: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  timestamp: Date | admin.firestore.Timestamp;
  retryCount: number;
  entryId?: string;
  customerId?: string;
  locationId?: string;
  operatorId?: string;
}

export interface SMSLogFilters {
  type?: string;
  status?: string;
  recipient?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  locationId?: string;
  operatorId?: string;
}

class SMSLogsService {
  private static instance: SMSLogsService;
  private readonly collectionName = 'smsLogs';
  private db: admin.firestore.Firestore;

  constructor(db: admin.firestore.Firestore) {
    this.db = db;
  }

  public static getInstance(db?: admin.firestore.Firestore): SMSLogsService {
    if (!SMSLogsService.instance) {
      if (!db) {
        throw new Error('Firestore instance must be provided for the first initialization');
      }
      SMSLogsService.instance = new SMSLogsService(db);
    }
    return SMSLogsService.instance;
  }

  /**
   * Log SMS to Firestore
   */
  public async logSMS(logData: Omit<SMSLog, 'id'>): Promise<string> {
    try {
      const docRef = await this.db.collection(this.collectionName).add({
        ...logData,
        timestamp: logData.timestamp instanceof Date ? 
          admin.firestore.Timestamp.fromDate(logData.timestamp) : 
          logData.timestamp
      });
      
      console.log('SMS logged successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error logging SMS to Firestore:', error);
      throw error;
    }
  }

  /**
   * Update SMS log
   */
  public async updateSMSLog(id: string, updates: Partial<SMSLog>): Promise<void> {
    try {
      const docRef = this.db.collection(this.collectionName).doc(id);
      const updateData: any = { ...updates };
      
      if (updates.timestamp) {
        updateData.timestamp = updates.timestamp instanceof Date ? 
          admin.firestore.Timestamp.fromDate(updates.timestamp) : 
          updates.timestamp;
      }
      
      await docRef.update(updateData);
      
      console.log('SMS log updated successfully:', id);
    } catch (error) {
      console.error('Error updating SMS log:', error);
      throw error;
    }
  }

  /**
   * Get SMS logs with filters
   */
  public async getSMSLogs(filters?: SMSLogFilters): Promise<SMSLog[]> {
    try {
      let query = this.db.collection(this.collectionName);

      // Apply filters
      if (filters?.type) {
        query = query.where('type', '==', filters.type);
      }
      
      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      
      if (filters?.recipient) {
        query = query.where('recipient', '==', filters.recipient);
      }
      
      if (filters?.locationId) {
        query = query.where('locationId', '==', filters.locationId);
      }
      
      if (filters?.operatorId) {
        query = query.where('operatorId', '==', filters.operatorId);
      }
      
      if (filters?.dateRange) {
        query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.dateRange.start));
        query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.dateRange.end));
      }

      // Always order by timestamp (newest first)
      query = query.orderBy('timestamp', 'desc');

      const querySnapshot = await query.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as SMSLog;
      });
    } catch (error) {
      console.error('Error getting SMS logs:', error);
      throw error;
    }
  }

  /**
   * Get SMS logs by entry ID
   */
  public async getSMSLogsByEntryId(entryId: string): Promise<SMSLog[]> {
    try {
      const query = this.db.collection(this.collectionName)
        .where('entryId', '==', entryId)
        .orderBy('timestamp', 'desc');
      
      const querySnapshot = await query.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as SMSLog;
      });
    } catch (error) {
      console.error('Error getting SMS logs by entry ID:', error);
      throw error;
    }
  }

  /**
   * Get SMS logs by customer ID
   */
  public async getSMSLogsByCustomerId(customerId: string): Promise<SMSLog[]> {
    try {
      const query = this.db.collection(this.collectionName)
        .where('customerId', '==', customerId)
        .orderBy('timestamp', 'desc');
      
      const querySnapshot = await query.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as SMSLog;
      });
    } catch (error) {
      console.error('Error getting SMS logs by customer ID:', error);
      throw error;
    }
  }

  /**
   * Get SMS statistics
   */
  public async getSMSStatistics(filters?: SMSLogFilters): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byType: Record<string, number>;
    byDate: Record<string, number>;
  }> {
    try {
      const logs = await this.getSMSLogs(filters);
      
      const stats = {
        total: logs.length,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {} as Record<string, number>,
        byDate: {} as Record<string, number>
      };

      logs.forEach(log => {
        // Count by status
        if (log.status === 'sent') stats.sent++;
        else if (log.status === 'failed') stats.failed++;
        else if (log.status === 'pending') stats.pending++;

        // Count by type
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

        // Count by date
        const timestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
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
   * Get recent SMS logs (last 7 days)
   */
  public async getRecentSMSLogs(limit: number = 100): Promise<SMSLog[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const query = this.db.collection(this.collectionName)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .orderBy('timestamp', 'desc');

      const querySnapshot = await query.get();
      
      return querySnapshot.docs.slice(0, limit).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as SMSLog;
      });
    } catch (error) {
      console.error('Error getting recent SMS logs:', error);
      throw error;
    }
  }

  /**
   * Get failed SMS logs for retry
   */
  public async getFailedSMSLogs(maxRetryCount: number = 2): Promise<SMSLog[]> {
    try {
      const query = this.db.collection(this.collectionName)
        .where('status', '==', 'failed')
        .where('retryCount', '<', maxRetryCount)
        .orderBy('timestamp', 'desc');

      const querySnapshot = await query.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as SMSLog;
      });
    } catch (error) {
      console.error('Error getting failed SMS logs:', error);
      throw error;
    }
  }

  /**
   * Delete old SMS logs (older than specified days)
   */
  public async deleteOldSMSLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const query = this.db.collection(this.collectionName)
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(cutoffDate));

      const querySnapshot = await query.get();
      
      // Note: In production, you'd want to batch delete these
      // For now, we'll just return the count
      console.log(`Found ${querySnapshot.docs.length} old SMS logs to delete`);
      
      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error deleting old SMS logs:', error);
      throw error;
    }
  }
}

export default SMSLogsService;