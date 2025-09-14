// SMS Logs Service for Firestore integration
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SMSLog {
  id?: string;
  type: string;
  recipient: string;
  templateId: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  timestamp: Date | Timestamp;
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

  private constructor() {}

  public static getInstance(): SMSLogsService {
    if (!SMSLogsService.instance) {
      SMSLogsService.instance = new SMSLogsService();
    }
    return SMSLogsService.instance;
  }

  /**
   * Log SMS to Firestore
   */
  public async logSMS(logData: Omit<SMSLog, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...logData,
        timestamp: Timestamp.fromDate(logData.timestamp instanceof Date ? logData.timestamp : new Date(logData.timestamp))
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
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        ...(updates.timestamp && { timestamp: Timestamp.fromDate(updates.timestamp instanceof Date ? updates.timestamp : new Date(updates.timestamp)) })
      });
      
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
      let q = collection(db, this.collectionName);
      const constraints = [];

      // Apply filters
      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters?.recipient) {
        constraints.push(where('recipient', '==', filters.recipient));
      }
      
      if (filters?.locationId) {
        constraints.push(where('locationId', '==', filters.locationId));
      }
      
      if (filters?.operatorId) {
        constraints.push(where('operatorId', '==', filters.operatorId));
      }
      
      if (filters?.dateRange) {
        constraints.push(
          where('timestamp', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('timestamp', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      // Always order by timestamp (newest first)
      constraints.push(orderBy('timestamp', 'desc'));

      q = query(q, ...constraints);
      const querySnapshot = await getDocs(q);
      
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
      const q = query(
        collection(db, this.collectionName),
        where('entryId', '==', entryId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
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
      const q = query(
        collection(db, this.collectionName),
        where('customerId', '==', customerId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
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
        const dateKey = log.timestamp.toISOString().split('T')[0];
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

      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
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
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'failed'),
        where('retryCount', '<', maxRetryCount),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
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

      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '<', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      
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

export default SMSLogsService.getInstance();