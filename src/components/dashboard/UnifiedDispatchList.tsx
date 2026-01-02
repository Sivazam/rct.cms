/**
 * Unified Dispatch List Component
 * Demonstrates the use of unified dispatch service for consistent data structure
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Truck, 
  Package, 
  Calendar, 
  Phone, 
  User, 
  MapPin, 
  RefreshCw, 
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  Archive
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUnifiedDispatch, useUnifiedDispatchAnalytics } from '@/hooks/use-unified-dispatch';
import { formatFirestoreDate } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';
import { getLocations } from '@/lib/firestore';

interface UnifiedDispatchListProps {
  locationId?: string;
  dateRange?: { from: Date; to: Date };
  showAnalytics?: boolean;
}

export default function UnifiedDispatchList({ 
  locationId, 
  dateRange, 
  showAnalytics = false 
}: UnifiedDispatchListProps) {
  const { user } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(locationId || 'all');
  const [selectedType, setSelectedType] = useState<'all' | 'partial' | 'full'>('all');

  // Use unified dispatch service
  const { 
    records: dispatchRecords, 
    loading, 
    error, 
    refetch,
    stats,
    updateFilters 
  } = useUnifiedDispatch({
    locationId: selectedLocation === 'all' ? undefined : selectedLocation,
    dateRange: dateRange,
    dispatchType: selectedType === 'all' ? undefined : selectedType,
    autoFetch: true,
    enableCache: true
  });

  // Use analytics hook if needed
  const { 
    analytics, 
    loading: analyticsLoading, 
    error: analyticsError 
  } = useUnifiedDispatchAnalytics({
    locationId: selectedLocation === 'all' ? undefined : selectedLocation,
    dateRange: dateRange
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    updateFilters({
      locationId: selectedLocation === 'all' ? undefined : selectedLocation,
      dispatchType: selectedType === 'all' ? undefined : selectedType
    });
  }, [selectedLocation, selectedType, updateFilters]);

  const fetchLocations = async () => {
    try {
      const locationsData = await getLocations();
      setLocations(locationsData.filter(loc => loc.isActive));
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDispatchTypeBadge = (type: string) => {
    switch (type) {
      case 'partial':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Partial</Badge>;
      case 'full':
        return <Badge variant="default" className="bg-green-100 text-green-800">Full</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'free':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Free</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'full':
        return <Badge variant="default" className="bg-green-100 text-green-800">Full</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading dispatch records...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Error loading dispatch records: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Unified Dispatch Records</span>
          </CardTitle>
          <CardDescription>
            Consistent view of all dispatch records from multiple sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.venueName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="partial">Partial Only</SelectItem>
                  <SelectItem value="full">Full Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Dispatches</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDispatches}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Partial Dispatches</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.partialDispatches}</p>
                </div>
                <Package className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Full Dispatches</p>
                  <p className="text-2xl font-bold text-green-600">{stats.fullDispatches}</p>
                </div>
                <Package className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics */}
      {showAnalytics && analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Dispatch Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Month */}
              <div>
                <h4 className="font-semibold mb-3">Revenue by Month</h4>
                <div className="space-y-2">
                  {analytics.revenueByMonth.slice(-6).map((item) => (
                    <div key={item.month} className="flex justify-between items-center">
                      <span className="text-sm">{item.month}</span>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                        <div className="text-xs text-gray-500">{item.count} dispatches</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Operators */}
              <div>
                <h4 className="font-semibold mb-3">Top Operators</h4>
                <div className="space-y-2">
                  {analytics.topOperators.slice(0, 5).map((operator, index) => (
                    <div key={operator.name} className="flex justify-between items-center">
                      <span className="text-sm">
                        {index + 1}. {operator.name}
                      </span>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(operator.revenue)}</div>
                        <div className="text-xs text-gray-500">{operator.count} dispatches</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispatch Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dispatch Records ({dispatchRecords.length})</CardTitle>
          <CardDescription>
            Unified view from dispatchedLockers, deliveries, and entries collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Locker</TableHead>
                  <TableHead>Pots</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatchRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.customerInfo.name}</div>
                        <div className="text-sm text-gray-500">{record.customerInfo.mobile}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.locationInfo.name}</div>
                        <div className="text-sm text-gray-500">{record.customerInfo.city}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{record.operatorInfo.name}</div>
                    </TableCell>
                    <TableCell>
                      {getDispatchTypeBadge(record.dispatchInfo.dispatchType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Archive className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">#{record.lockerNumber || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{record.dispatchInfo.potsDispatched}</div>
                        {record.dispatchInfo.dispatchType === 'partial' && (
                          <div className="text-xs text-gray-500">
                            {record.dispatchInfo.remainingPots} left
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentTypeBadge(record.dispatchInfo.paymentType)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(record.dispatchInfo.paymentAmount)}
                      </div>
                      {record.dispatchInfo.dueAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          Due: {formatCurrency(record.dispatchInfo.dueAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatFirestoreDate(record.dispatchInfo.dispatchDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {record.sourceCollection}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {dispatchRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No dispatch records found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}