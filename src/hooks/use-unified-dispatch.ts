/**
 * React Hook for Unified Dispatch Data
 * Provides easy access to unified dispatch records with caching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getUnifiedDispatchRecords, 
  getUnifiedDispatchStats, 
  UnifiedDispatchRecord 
} from '@/lib/unified-dispatch-service';

interface UseUnifiedDispatchOptions {
  locationId?: string;
  operatorId?: string;
  dateRange?: { from: Date; to: Date };
  dispatchType?: 'partial' | 'full' | 'all';
  autoFetch?: boolean;
  enableCache?: boolean;
}

interface UseUnifiedDispatchReturn {
  records: UnifiedDispatchRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
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
  } | null;
  filters: UseUnifiedDispatchOptions;
  updateFilters: (newFilters: Partial<UseUnifiedDispatchOptions>) => void;
  clearFilters: () => void;
}

// Cache for storing fetched data
const cache = new Map<string, {
  records: UnifiedDispatchRecord[];
  timestamp: number;
  ttl: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: UseUnifiedDispatchOptions): string {
  return JSON.stringify({
    locationId: filters.locationId,
    operatorId: filters.operatorId,
    dateRange: filters.dateRange ? {
      from: filters.dateRange.from.toISOString(),
      to: filters.dateRange.to.toISOString()
    } : undefined,
    dispatchType: filters.dispatchType
  });
}

function getFromCache(key: string): UnifiedDispatchRecord[] | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.records;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, records: UnifiedDispatchRecord[]): void {
  cache.set(key, {
    records,
    timestamp: Date.now(),
    ttl: CACHE_TTL
  });
}

export function useUnifiedDispatch(options: UseUnifiedDispatchOptions = {}): UseUnifiedDispatchReturn {
  const [records, setRecords] = useState<UnifiedDispatchRecord[]>([]);
  const [stats, setStats] = useState<UseUnifiedDispatchReturn['stats']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseUnifiedDispatchOptions>({
    autoFetch: true,
    enableCache: true,
    ...options
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey(filters);
      let fetchedRecords: UnifiedDispatchRecord[];

      // Try to get from cache if enabled
      if (filters.enableCache) {
        const cachedRecords = getFromCache(cacheKey);
        if (cachedRecords) {
          fetchedRecords = cachedRecords;
          console.log('🔍 [useUnifiedDispatch] Using cached data');
        } else {
          fetchedRecords = await getUnifiedDispatchRecords(filters);
          setCache(cacheKey, fetchedRecords);
          console.log('🔍 [useUnifiedDispatch] Fetched fresh data');
        }
      } else {
        fetchedRecords = await getUnifiedDispatchRecords(filters);
        console.log('🔍 [useUnifiedDispatch] Cache disabled, fetched fresh data');
      }

      setRecords(fetchedRecords);

      // Calculate stats
      const dispatchStats = await getUnifiedDispatchStats(filters);
      setStats(dispatchStats);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dispatch records';
      setError(errorMessage);
      console.error('Error in useUnifiedDispatch:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(async () => {
    // Clear cache for current filters and refetch
    if (filters.enableCache) {
      const cacheKey = getCacheKey(filters);
      cache.delete(cacheKey);
    }
    await fetchData();
  }, [filters, fetchData]);

  const updateFilters = useCallback((newFilters: Partial<UseUnifiedDispatchOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      autoFetch: true,
      enableCache: true,
      ...options
    });
  }, [options]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (filters.autoFetch) {
      fetchData();
    }
  }, [fetchData, filters.autoFetch]);

  return {
    records,
    loading,
    error,
    refetch,
    stats,
    filters,
    updateFilters,
    clearFilters
  };
}

/**
 * Hook for getting a single dispatch record by ID
 */
export function useUnifiedDispatchRecord(id?: string) {
  const [record, setRecord] = useState<UnifiedDispatchRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!id) {
      setRecord(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const records = await getUnifiedDispatchRecords();
      const foundRecord = records.find(r => r.id === id || r.entryId === id);
      
      if (foundRecord) {
        setRecord(foundRecord);
      } else {
        setError('Dispatch record not found');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dispatch record';
      setError(errorMessage);
      console.error('Error in useUnifiedDispatchRecord:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  return {
    record,
    loading,
    error,
    refetch: fetchRecord
  };
}

/**
 * Hook for dispatch analytics and charts
 */
export function useUnifiedDispatchAnalytics(options: UseUnifiedDispatchOptions = {}) {
  const [analytics, setAnalytics] = useState<{
    revenueByMonth: Array<{ month: string; revenue: number; count: number }>;
    dispatchesByType: Array<{ type: string; count: number; percentage: number }>;
    topOperators: Array<{ name: string; count: number; revenue: number }>;
    revenueTrend: Array<{ date: string; revenue: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const records = await getUnifiedDispatchRecords(options);

      // Revenue by month
      const revenueByMonth = new Map<string, { revenue: number; count: number }>();
      records.forEach(record => {
        const date = new Date(record.dispatchInfo.dispatchDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueByMonth.has(monthKey)) {
          revenueByMonth.set(monthKey, { revenue: 0, count: 0 });
        }
        
        const monthData = revenueByMonth.get(monthKey)!;
        monthData.revenue += record.dispatchInfo.paymentAmount;
        monthData.count += 1;
      });

      // Dispatches by type
      const dispatchesByType = new Map<string, number>();
      records.forEach(record => {
        const type = record.dispatchInfo.dispatchType;
        dispatchesByType.set(type, (dispatchesByType.get(type) || 0) + 1);
      });

      // Top operators
      const operatorStats = new Map<string, { count: number; revenue: number }>();
      records.forEach(record => {
        const name = record.operatorInfo.name;
        if (!operatorStats.has(name)) {
          operatorStats.set(name, { count: 0, revenue: 0 });
        }
        const stats = operatorStats.get(name)!;
        stats.count += 1;
        stats.revenue += record.dispatchInfo.paymentAmount;
      });

      // Revenue trend (last 30 days)
      const revenueTrend = new Map<string, number>();
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        revenueTrend.set(dateKey, 0);
      }

      records.forEach(record => {
        const date = new Date(record.dispatchInfo.dispatchDate);
        const dateKey = date.toISOString().split('T')[0];
        if (revenueTrend.has(dateKey)) {
          revenueTrend.set(dateKey, revenueTrend.get(dateKey)! + record.dispatchInfo.paymentAmount);
        }
      });

      const analyticsData = {
        revenueByMonth: Array.from(revenueByMonth.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        dispatchesByType: Array.from(dispatchesByType.entries())
          .map(([type, count]) => ({
            type,
            count,
            percentage: (count / records.length) * 100
          })),
        topOperators: Array.from(operatorStats.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        revenueTrend: Array.from(revenueTrend.entries())
          .map(([date, revenue]) => ({ date, revenue }))
          .sort((a, b) => a.date.localeCompare(b.date))
      };

      setAnalytics(analyticsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Error in useUnifiedDispatchAnalytics:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

const unifiedDispatchHooks = {
  useUnifiedDispatch,
  useUnifiedDispatchRecord,
  useUnifiedDispatchAnalytics
};

export default unifiedDispatchHooks;