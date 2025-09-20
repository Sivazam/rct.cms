"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// SMS Logs Service for Firebase Admin SDK
const admin = __importStar(require("firebase-admin"));
class SMSLogsService {
    constructor(db) {
        this.collectionName = 'smsLogs';
        this.db = db;
    }
    static getInstance(db) {
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
    async logSMS(logData) {
        try {
            const docRef = await this.db.collection(this.collectionName).add(Object.assign(Object.assign({}, logData), { timestamp: logData.timestamp instanceof Date ?
                    admin.firestore.Timestamp.fromDate(logData.timestamp) :
                    logData.timestamp }));
            console.log('SMS logged successfully with ID:', docRef.id);
            return docRef.id;
        }
        catch (error) {
            console.error('Error logging SMS to Firestore:', error);
            throw error;
        }
    }
    /**
     * Update SMS log
     */
    async updateSMSLog(id, updates) {
        try {
            const docRef = this.db.collection(this.collectionName).doc(id);
            const updateData = Object.assign({}, updates);
            if (updates.timestamp) {
                updateData.timestamp = updates.timestamp instanceof Date ?
                    admin.firestore.Timestamp.fromDate(updates.timestamp) :
                    updates.timestamp;
            }
            await docRef.update(updateData);
            console.log('SMS log updated successfully:', id);
        }
        catch (error) {
            console.error('Error updating SMS log:', error);
            throw error;
        }
    }
    /**
     * Get SMS logs with filters
     */
    async getSMSLogs(filters) {
        try {
            let query = this.db.collection(this.collectionName);
            // Apply filters
            let filteredQuery = query;
            if (filters === null || filters === void 0 ? void 0 : filters.type) {
                filteredQuery = filteredQuery.where('type', '==', filters.type);
            }
            if (filters === null || filters === void 0 ? void 0 : filters.status) {
                filteredQuery = filteredQuery.where('status', '==', filters.status);
            }
            if (filters === null || filters === void 0 ? void 0 : filters.recipient) {
                filteredQuery = filteredQuery.where('recipient', '==', filters.recipient);
            }
            if (filters === null || filters === void 0 ? void 0 : filters.locationId) {
                filteredQuery = filteredQuery.where('locationId', '==', filters.locationId);
            }
            if (filters === null || filters === void 0 ? void 0 : filters.operatorId) {
                filteredQuery = filteredQuery.where('operatorId', '==', filters.operatorId);
            }
            if (filters === null || filters === void 0 ? void 0 : filters.dateRange) {
                filteredQuery = filteredQuery.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.dateRange.start));
                filteredQuery = filteredQuery.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.dateRange.end));
            }
            // Always order by timestamp (newest first)
            filteredQuery = filteredQuery.orderBy('timestamp', 'desc');
            const querySnapshot = await filteredQuery.get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { timestamp: data.timestamp.toDate() });
            });
        }
        catch (error) {
            console.error('Error getting SMS logs:', error);
            throw error;
        }
    }
    /**
     * Get SMS logs by entry ID
     */
    async getSMSLogsByEntryId(entryId) {
        try {
            const query = this.db.collection(this.collectionName)
                .where('entryId', '==', entryId)
                .orderBy('timestamp', 'desc');
            const querySnapshot = await query.get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { timestamp: data.timestamp.toDate() });
            });
        }
        catch (error) {
            console.error('Error getting SMS logs by entry ID:', error);
            throw error;
        }
    }
    /**
     * Get SMS logs by customer ID
     */
    async getSMSLogsByCustomerId(customerId) {
        try {
            const query = this.db.collection(this.collectionName)
                .where('customerId', '==', customerId)
                .orderBy('timestamp', 'desc');
            const querySnapshot = await query.get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { timestamp: data.timestamp.toDate() });
            });
        }
        catch (error) {
            console.error('Error getting SMS logs by customer ID:', error);
            throw error;
        }
    }
    /**
     * Get SMS statistics
     */
    async getSMSStatistics(filters) {
        try {
            const logs = await this.getSMSLogs(filters);
            const stats = {
                total: logs.length,
                sent: 0,
                failed: 0,
                pending: 0,
                byType: {},
                byDate: {}
            };
            logs.forEach(log => {
                // Count by status
                if (log.status === 'sent')
                    stats.sent++;
                else if (log.status === 'failed')
                    stats.failed++;
                else if (log.status === 'pending')
                    stats.pending++;
                // Count by type
                stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
                // Count by date
                const timestamp = log.timestamp instanceof Date ? log.timestamp :
                    (log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp.seconds * 1000));
                const dateKey = timestamp.toISOString().split('T')[0];
                stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
            });
            return stats;
        }
        catch (error) {
            console.error('Error getting SMS statistics:', error);
            throw error;
        }
    }
    /**
     * Get recent SMS logs (last 7 days)
     */
    async getRecentSMSLogs(limit = 100) {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const query = this.db.collection(this.collectionName)
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
                .orderBy('timestamp', 'desc');
            const querySnapshot = await query.get();
            return querySnapshot.docs.slice(0, limit).map(doc => {
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { timestamp: data.timestamp.toDate() });
            });
        }
        catch (error) {
            console.error('Error getting recent SMS logs:', error);
            throw error;
        }
    }
    /**
     * Get failed SMS logs for retry
     */
    async getFailedSMSLogs(maxRetryCount = 2) {
        try {
            const query = this.db.collection(this.collectionName)
                .where('status', '==', 'failed')
                .where('retryCount', '<', maxRetryCount)
                .orderBy('timestamp', 'desc');
            const querySnapshot = await query.get();
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { timestamp: data.timestamp.toDate() });
            });
        }
        catch (error) {
            console.error('Error getting failed SMS logs:', error);
            throw error;
        }
    }
    /**
     * Delete old SMS logs (older than specified days)
     */
    async deleteOldSMSLogs(daysToKeep = 90) {
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
        }
        catch (error) {
            console.error('Error deleting old SMS logs:', error);
            throw error;
        }
    }
}
exports.default = SMSLogsService;
