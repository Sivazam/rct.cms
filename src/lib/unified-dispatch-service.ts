/**
 * Unified Dispatch Data Service
 * Provides consistent data structure for all dispatch-related operations
 * across different collections (dispatchedLockers, deliveries, entries)
 */

import { getDispatchedLockers, getEntries } from './firestore';

export interface UnifiedDispatchRecord {
  id: string;
  entryId: string;
  sourceCollection: 'dispatchedLockers' | 'deliveries' | 'entries';
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
 * Transforms deliveries collection data to unified format
 */
function transformDeliveriesData(rawData: any[]): UnifiedDispatchRecord[] {
  return rawData.map((item: any) => ({
    id: item.id,
    entryId: item.entryId,
    sourceCollection: 'deliveries' as const,
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
      totalPots: item.pots || 0,
      potsPerLocker: item.pots, // For full deliveries, all pots are in one locker
      numberOfLockers: 1,
      status: 'dispatched',
      renewalCount: item.renewalCount
    },
    dispatchInfo: {
      dispatchType: 'full',
      dispatchDate: item.deliveryDate,
      potsDispatched: item.pots || 0,
      remainingPots: 0, // Full dispatch means 0 remaining
      paymentAmount: item.amountPaid || 0,
      dueAmount: item.dueAmount || 0,
      paymentMethod: 'cash', // Default, as deliveries don't store this
      paymentType: item.paymentType || 'free',
      dispatchReason: item.reason || '',
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
  }));
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
    const [dispatchedLockersData, entriesData] = await Promise.all([
      getDispatchedLockers(filters),
      getEntries({
        locationId: filters?.locationId,
        status: 'dispatched'
      })
    ]);

    // Transform data to unified format
    const transformedDispatchedLockers = transformDispatchedLockersData(dispatchedLockersData);
    const transformedDispatchedEntries = transformDispatchedEntriesData(entriesData);

    // Combine all records
    let allRecords = [...transformedDispatchedLockers, ...transformedDispatchedEntries];

    // Apply additional filters
    if (filters) {
      allRecords = allRecords.filter(record => {
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
    }

    // Sort by dispatch date (newest first)
    allRecords.sort((a, b) => {
      const dateA = new Date(a.dispatchInfo.dispatchDate).getTime();
      const dateB = new Date(b.dispatchInfo.dispatchDate).getTime();
      return dateB - dateA;
    });

    console.log(`🔍 [UnifiedDispatchService] Returning ${allRecords.length} unified dispatch records`);
    return allRecords;

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