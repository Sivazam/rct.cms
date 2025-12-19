/**
 * Unified Dispatch Data Service
 * Provides consistent data structure for all dispatch-related operations
 * across different collections (dispatchedLockers, deliveries, entries)
 */

import { getDispatchedLockers, getEntries } from './firestore';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export interface UnifiedDispatchRecord {
  id: string;
  entryId: string;
  sourceCollection: 'dispatchedLockers' | 'deliveries' | 'entries' | 'deliveryLogs';
  customerInfo: {
    name: string;
    mobile: string;
    city: string;
    id?: string;
  };
  locationInfo: {
    id: string;
    name: string;
  };
  operatorInfo: {
    id: string;
    name: string;
  };
  originalEntryData: {
    entryDate: any;
    expiryDate: any;
    totalPots: number;
    potsPerLocker?: number;
    numberOfLockers?: number;
    status: string;
    renewalCount?: number;
  };
  dispatchInfo: {
    dispatchType: 'partial' | 'full';
    dispatchDate: any;
    potsDispatched: number;
    remainingPots: number;
    paymentAmount: number;
    dueAmount: number;
    paymentMethod: 'cash' | 'upi';
    paymentType: 'full' | 'partial' | 'free';
    dispatchReason: string;
    handoverPersonName: string;
    handoverPersonMobile: string;
    lockerNumber?: number;
    potsInLockerBeforeDispatch?: number;
    totalRemainingPots?: number;
  };
  metadata: {
    createdAt: any;
    updatedAt?: any;
    otpVerified?: boolean;
    smsSent?: boolean;
  };
}

/**
 * Transforms dispatchedLockers collection data to unified format
 */
function transformDispatchedLockersData(rawData: any[]): UnifiedDispatchRecord[] {
  return rawData.map((item: any) => ({
    id: item.id,
    entryId: item.entryId,
    sourceCollection: 'dispatchedLockers' as const,
    customerInfo: {
      name: item.originalEntryData?.customerName || '',
      mobile: item.originalEntryData?.customerMobile || '',
      city: item.originalEntryData?.customerCity || '',
      id: item.originalEntryData?.customerId
    },
    locationInfo: {
      id: item.originalEntryData?.locationId || '',
      name: item.originalEntryData?.locationName || ''
    },
    operatorInfo: {
      id: item.originalEntryData?.operatorId || '',
      name: item.originalEntryData?.operatorName || ''
    },
    originalEntryData: {
      entryDate: item.originalEntryData?.entryDate,
      expiryDate: item.originalEntryData?.expiryDate,
      totalPots: item.originalEntryData?.totalPots || 0,
      potsPerLocker: item.originalEntryData?.potsPerLocker,
      numberOfLockers: item.originalEntryData?.numberOfLockers,
      status: 'dispatched',
      renewalCount: item.originalEntryData?.renewalCount
    },
    dispatchInfo: {
      dispatchType: item.dispatchInfo?.dispatchType || 'partial',
      dispatchDate: item.dispatchInfo?.dispatchDate,
      potsDispatched: item.dispatchInfo?.potsDispatched || 0,
      remainingPots: item.dispatchInfo?.remainingPotsInLocker || 0,
      paymentAmount: item.dispatchInfo?.paymentAmount || 0,
      dueAmount: 0, // Not stored in dispatchedLockers, would need calculation
      paymentMethod: item.dispatchInfo?.paymentMethod || 'cash',
      paymentType: item.dispatchInfo?.paymentAmount > 0 ? 
        (item.dispatchInfo?.paymentAmount < (item.dispatchInfo?.dueAmount || 0) ? 'partial' : 'full') : 'free',
      dispatchReason: item.dispatchInfo?.dispatchReason || '',
      handoverPersonName: item.dispatchInfo?.handoverPersonName || '',
      handoverPersonMobile: item.dispatchInfo?.handoverPersonMobile || '',
      lockerNumber: item.dispatchInfo?.lockerNumber,
      potsInLockerBeforeDispatch: item.dispatchInfo?.potsInLockerBeforeDispatch,
      totalRemainingPots: item.dispatchInfo?.totalRemainingPots
    },
    metadata: {
      createdAt: item.dispatchInfo?.dispatchDate,
      updatedAt: item.updatedAt
    }
  }));
}

/**
 * Fetches delivery logs from deliveryLogs collection
 */
async function getDeliveryLogs(filters?: {
  locationId?: string;
  operatorId?: string;
  dateRange?: { from: Date; to: Date };
}): Promise<any[]> {
  try {
    console.log('🔍 [UnifiedDispatchService] Getting delivery logs with filters:', filters);
    
    let deliveryLogsQuery = query(collection(db, 'deliveryLogs'));
    
    // Build query constraints
    const constraints = [];
    
    if (filters?.locationId) {
      // Need to get entry to find locationId for delivery logs
      const entriesQuery = query(collection(db, 'entries'), where('locationId', '==', filters.locationId));
      const entriesSnapshot = await getDocs(entriesQuery);
      const entryIds = entriesSnapshot.docs.map(doc => doc.id);
      
      if (entryIds.length > 0) {
        constraints.push(where('entryId', 'in', entryIds));
      } else {
        // No entries for this location, return empty array
        return [];
      }
    }
    
    if (filters?.dateRange) {
      constraints.push(where('timestamp', '>=', filters.dateRange.from));
      constraints.push(where('timestamp', '<=', filters.dateRange.to));
    }
    
    // Apply constraints if any
    if (constraints.length > 0) {
      deliveryLogsQuery = query(deliveryLogsQuery, ...constraints);
    }

    const querySnapshot = await getDocs(deliveryLogsQuery);
    const deliveryLogs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`🔍 [UnifiedDispatchService] Found ${deliveryLogs.length} delivery logs`);
    return deliveryLogs;
  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    return [];
  }
}

/**
 * Transforms delivery logs data to unified format
 */
function transformDeliveryLogsData(rawData: any[]): UnifiedDispatchRecord[] {
  return rawData.map((item: any) => ({
    id: item.id,
    entryId: item.entryId,
    sourceCollection: 'deliveryLogs' as const,
    customerInfo: {
      name: '', // Not available in delivery logs, would need entry lookup
      mobile: item.customerMobile || '',
      city: '', // Not available in delivery logs
      id: '' // Not available in delivery logs
    },
    locationInfo: {
      id: '', // Not available in delivery logs, would need entry lookup
      name: '' // Not available in delivery logs, would need entry lookup
    },
    operatorInfo: {
      id: item.operatorId || '',
      name: '' // Not available in delivery logs, would need entry lookup
    },
    originalEntryData: {
      entryDate: null, // Not available in delivery logs
      expiryDate: null, // Not available in delivery logs
      totalPots: 0, // Not available in delivery logs
      status: 'dispatched',
      renewalCount: 0
    },
    dispatchInfo: {
      dispatchType: 'full', // Assume full dispatch for delivery logs
      dispatchDate: item.timestamp,
      potsDispatched: 0, // Not available in delivery logs
      remainingPots: 0, // Not available in delivery logs
      paymentAmount: item.amountPaid || 0,
      dueAmount: item.dueAmount || 0,
      paymentMethod: 'cash', // Default
      paymentType: item.amountPaid > 0 ? 
        (item.amountPaid < (item.dueAmount || 0) ? 'partial' : 'full') : 'free',
      dispatchReason: item.reason || '',
      handoverPersonName: '', // Not available in delivery logs
      handoverPersonMobile: '', // Not available in delivery logs
      lockerNumber: 1,
      potsInLockerBeforeDispatch: 0,
      totalRemainingPots: 0
    },
    metadata: {
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
      otpVerified: false, // Not tracked in delivery logs
      smsSent: item.smsSent || false
    }
  }));
}

/**
 * Fetches deliveries collection data
 */
async function getDeliveriesCollection(filters?: {
  locationId?: string;
  operatorId?: string;
  dateRange?: { from: Date; to: Date };
}): Promise<any[]> {
  try {
    console.log('🔍 [UnifiedDispatchService] Getting deliveries collection with filters:', filters);
    
    let deliveriesQuery = query(collection(db, 'deliveries'));
    
    // Build query constraints
    const constraints = [];
    
    if (filters?.locationId) {
      constraints.push(where('locationId', '==', filters.locationId));
    }
    
    if (filters?.operatorId) {
      constraints.push(where('operatorId', '==', filters.operatorId));
    }
    
    if (filters?.dateRange) {
      constraints.push(where('deliveryDate', '>=', filters.dateRange.from));
      constraints.push(where('deliveryDate', '<=', filters.dateRange.to));
    }
    
    // Apply constraints if any
    if (constraints.length > 0) {
      deliveriesQuery = query(deliveriesQuery, ...constraints);
    }

    const querySnapshot = await getDocs(deliveriesQuery);
    const deliveries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`🔍 [UnifiedDispatchService] Found ${deliveries.length} deliveries`);
    return deliveries;
  } catch (error) {
    console.error('Error fetching deliveries collection:', error);
    return [];
  }
}

/**
 * Transforms deliveries collection data to unified format
 */
async function transformDeliveriesData(rawData: any[]): Promise<UnifiedDispatchRecord[]> {
  // Get all entries to fetch payment information
  const allEntries = await getEntries();
  const entriesMap = new Map(allEntries.map(entry => [entry.id, entry]));
  
  return rawData.map((item: any) => {
    const correspondingEntry = entriesMap.get(item.entryId);
    
    // Find the delivery payment from the corresponding entry
    const deliveryPayment = correspondingEntry?.payments?.find((payment: any) => payment.type === 'delivery');
    
    return {
      id: item.id,
      entryId: item.entryId,
      sourceCollection: 'deliveries' as const,
      customerInfo: {
        name: item.customerName || correspondingEntry?.customerName || '',
        mobile: item.customerMobile || correspondingEntry?.customerMobile || '',
        city: item.customerCity || correspondingEntry?.customerCity || '',
        id: item.customerId
      },
      locationInfo: {
        id: item.locationId || correspondingEntry?.locationId || '',
        name: item.locationName || correspondingEntry?.locationName || ''
      },
      operatorInfo: {
        id: item.operatorId || correspondingEntry?.operatorId || '',
        name: item.operatorName || correspondingEntry?.operatorName || ''
      },
      originalEntryData: {
        entryDate: item.entryDate || correspondingEntry?.entryDate,
        expiryDate: item.expiryDate || correspondingEntry?.expiryDate,
        totalPots: item.pots || correspondingEntry?.totalPots || correspondingEntry?.numberOfPots || 0,
        potsPerLocker: item.pots || correspondingEntry?.potsPerLocker, // For full deliveries, all pots are in one locker
        numberOfLockers: 1,
        status: 'dispatched',
        renewalCount: item.renewalCount || correspondingEntry?.renewalCount
      },
      dispatchInfo: {
        dispatchType: 'full',
        dispatchDate: item.deliveryDate,
        potsDispatched: item.pots || 0,
        remainingPots: 0, // Full dispatch means 0 remaining
        paymentAmount: deliveryPayment?.amount || 0,
        dueAmount: deliveryPayment?.dueAmount || 0,
        paymentMethod: deliveryPayment?.method || 'cash',
        paymentType: deliveryPayment?.amount > 0 ? 
          (deliveryPayment?.amount < (deliveryPayment?.dueAmount || 0) ? 'partial' : 'full') : 'free',
        dispatchReason: item.reason || deliveryPayment?.reason || '',
        handoverPersonName: item.handoverPersonName || '',
        handoverPersonMobile: item.handoverPersonMobile || '',
        lockerNumber: 1, // Default for full deliveries
        potsInLockerBeforeDispatch: item.pots || 0,
        totalRemainingPots: 0
      },
      metadata: {
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        otpVerified: item.otpVerified,
        smsSent: item.smsSent
      }
    };
  });
}

/**
 * Transforms dispatched entries data to unified format
 */
function transformDispatchedEntriesData(rawData: any[]): UnifiedDispatchRecord[] {
  return rawData.map((item: any) => {
    // Find the delivery payment from payments array
    const deliveryPayment = item.payments?.find((payment: any) => payment.type === 'delivery');
    
    return {
      id: item.id,
      entryId: item.id,
      sourceCollection: 'entries' as const,
      customerInfo: {
        name: item.customerName || '',
        mobile: item.customerMobile || '',
        city: item.customerCity || '',
        id: item.customerId
      },
      locationInfo: {
        id: item.locationId || '',
        name: item.locationName || ''
      },
      operatorInfo: {
        id: item.operatorId || '',
        name: item.operatorName || ''
      },
      originalEntryData: {
        entryDate: item.entryDate,
        expiryDate: item.expiryDate,
        totalPots: item.totalPots || item.numberOfPots || 0,
        potsPerLocker: item.potsPerLocker,
        numberOfLockers: item.numberOfLockers,
        status: item.status,
        renewalCount: item.renewalCount
      },
      dispatchInfo: {
        dispatchType: 'full', // Entries marked as dispatched are full dispatches
        dispatchDate: item.deliveryDate,
        potsDispatched: item.totalPots || item.numberOfPots || 0,
        remainingPots: 0, // Full dispatch means 0 remaining
        paymentAmount: deliveryPayment?.amount || 0,
        dueAmount: deliveryPayment?.dueAmount || 0,
        paymentMethod: deliveryPayment?.method || 'cash',
        paymentType: deliveryPayment?.amount > 0 ? 
          (deliveryPayment?.amount < (deliveryPayment?.dueAmount || 0) ? 'partial' : 'full') : 'free',
        dispatchReason: item.dispatchReason || deliveryPayment?.reason || '',
        handoverPersonName: item.handoverPersonName || '',
        handoverPersonMobile: item.handoverPersonMobile || '',
        lockerNumber: 1, // Default for entries marked as dispatched
        potsInLockerBeforeDispatch: item.totalPots || item.numberOfPots || 0,
        totalRemainingPots: 0
      },
      metadata: {
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        otpVerified: false, // Not tracked in entries
        smsSent: false // Not tracked in entries
      }
    };
  });
}

/**
 * Main service function to get unified dispatch records
 */
export async function getUnifiedDispatchRecords(filters?: {
  locationId?: string;
  operatorId?: string;
  dateRange?: { from: Date; to: Date };
  dispatchType?: 'partial' | 'full' | 'all';
}): Promise<UnifiedDispatchRecord[]> {
  try {
    console.log('🔍 [UnifiedDispatchService] Getting unified dispatch records with filters:', filters);

    // Fetch data from all sources
    const [dispatchedLockersData, entriesData, deliveriesData] = await Promise.all([
      getDispatchedLockers(filters),
      getEntries({
        locationId: filters?.locationId,
        status: 'dispatched'
      }),
      getDeliveriesCollection(filters)
    ]);

    // Transform data to unified format
    const transformedDispatchedLockers = transformDispatchedLockersData(dispatchedLockersData);
    const transformedDispatchedEntries = transformDispatchedEntriesData(entriesData);
    const transformedDeliveries = await transformDeliveriesData(deliveriesData);

    // Combine all records and remove duplicates
    let allRecords = [...transformedDispatchedLockers, ...transformedDispatchedEntries, ...transformedDeliveries];
    
    // Remove duplicate records based on entryId (each entry should only have one dispatch)
    const uniqueRecords = new Map();
    const deduplicatedRecords = [];
    
    for (const record of allRecords) {
      if (!uniqueRecords.has(record.entryId)) {
        uniqueRecords.set(record.entryId, record);
        deduplicatedRecords.push(record);
      } else {
        // If we find a duplicate, prefer record from deliveries collection (most complete)
        const existingRecord = uniqueRecords.get(record.entryId);
        if (record.sourceCollection === 'deliveries' && existingRecord.sourceCollection !== 'deliveries') {
          // Replace with deliveries collection record
          const index = deduplicatedRecords.findIndex(r => r === existingRecord);
          deduplicatedRecords[index] = record;
          uniqueRecords.set(record.entryId, record);
        }
        // If both are from same collection type, keep the first one (no change needed)
      }
    }
    
    console.log(`🔍 [UnifiedDispatchService] Deduplicated ${allRecords.length} records to ${deduplicatedRecords.length} unique records`);
    
    // Apply additional filters to deduplicated records
    let filteredRecords = deduplicatedRecords;
    if (filters) {
      filteredRecords = deduplicatedRecords.filter(record => {
        // Location filter
        if (filters.locationId && record.locationInfo.id !== filters.locationId) {
          return false;
        }

        // Operator filter
        if (filters.operatorId && record.operatorInfo.id !== filters.operatorId) {
          return false;
        }

        // Date range filter
        if (filters.dateRange) {
          const dispatchDate = new Date(record.dispatchInfo.dispatchDate);
          if (dispatchDate < filters.dateRange.from || dispatchDate > filters.dateRange.to) {
            return false;
          }
        }

        // Dispatch type filter
        if (filters.dispatchType && filters.dispatchType !== 'all') {
          if (record.dispatchInfo.dispatchType !== filters.dispatchType) {
            return false;
          }
        }

        return true;
      });
    } else {
      filteredRecords = deduplicatedRecords;
    }

    // Sort by dispatch date (newest first)
    filteredRecords.sort((a, b) => {
      const dateA = new Date(a.dispatchInfo.dispatchDate).getTime();
      const dateB = new Date(b.dispatchInfo.dispatchDate).getTime();
      return dateB - dateA;
    });

    console.log(`🔍 [UnifiedDispatchService] Returning ${filteredRecords.length} unified dispatch records`);
    return filteredRecords;

  } catch (error) {
    console.error('Error in getUnifiedDispatchRecords:', error);
    throw error;
  }
}

/**
 * Get dispatch statistics with unified data
 */
export async function getUnifiedDispatchStats(filters?: {
  locationId?: string;
  operatorId?: string;
  dateRange?: { from: Date; to: Date };
}): Promise<{
  totalDispatches: number;
  partialDispatches: number;
  fullDispatches: number;
  totalRevenue: number;
  averageRevenuePerDispatch: number;
  dispatchesByOperator: Array<{
    operatorId: string;
    operatorName: string;
    totalDispatches: number;
    totalRevenue: number;
  }>;
}> {
  try {
    const records = await getUnifiedDispatchRecords(filters);

    const stats = {
      totalDispatches: records.length,
      partialDispatches: records.filter(r => r.dispatchInfo.dispatchType === 'partial').length,
      fullDispatches: records.filter(r => r.dispatchInfo.dispatchType === 'full').length,
      totalRevenue: records.reduce((sum, r) => sum + r.dispatchInfo.paymentAmount, 0),
      averageRevenuePerDispatch: 0,
      dispatchesByOperator: [] as Array<{
        operatorId: string;
        operatorName: string;
        totalDispatches: number;
        totalRevenue: number;
      }>
    };

    stats.averageRevenuePerDispatch = stats.totalDispatches > 0 ? stats.totalRevenue / stats.totalDispatches : 0;

    // Group by operator
    const operatorMap = new Map();
    records.forEach(record => {
      const operatorId = record.operatorInfo.id;
      if (!operatorMap.has(operatorId)) {
        operatorMap.set(operatorId, {
          operatorId,
          operatorName: record.operatorInfo.name,
          totalDispatches: 0,
          totalRevenue: 0
        });
      }
      const operatorStats = operatorMap.get(operatorId);
      operatorStats.totalDispatches += 1;
      operatorStats.totalRevenue += record.dispatchInfo.paymentAmount;
    });

    stats.dispatchesByOperator = Array.from(operatorMap.values());

    return stats;

  } catch (error) {
    console.error('Error in getUnifiedDispatchStats:', error);
    throw error;
  }
}

/**
 * Helper function to calculate due amount for dispatch records
 */
export function calculateDueAmountForDispatch(entryDate: any, dispatchDate: any): number {
  try {
    const entry = new Date(entryDate);
    const expiry = new Date(entry.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from entry
    const dispatch = new Date(dispatchDate);
    
    if (dispatch <= expiry) {
      return 0; // No due amount if dispatched before expiry
    }
    
    // Calculate overdue months
    const overdueDays = Math.ceil((dispatch.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24));
    const overdueMonths = Math.max(1, Math.ceil(overdueDays / 30));
    
    return overdueMonths * 300; // ₹300 per month
  } catch (error) {
    console.error('Error calculating due amount:', error);
    return 0;
  }
}

const unifiedDispatchService = {
  getUnifiedDispatchRecords,
  getUnifiedDispatchStats,
  calculateDueAmountForDispatch,
  transformDispatchedLockersData,
  transformDeliveriesData,
  transformDispatchedEntriesData
};

export default unifiedDispatchService;