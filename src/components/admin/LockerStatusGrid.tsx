'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Package, Archive, AlertTriangle, CheckCircle2, CircleDot } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries, getLocations } from '@/lib/firestore';

interface Entry {
  id: string;
  customerName: string;
  customerMobile: string;
  lockerDetails?: Array<{
    lockerNumber: number;
    totalPots: number;
    remainingPots: number;
    dispatchedPots: string[];
  }>;
  entryDate: any;
  expiryDate: any;
  status: string;
  locationId: string;
  numberOfPots?: number;
}

interface Location {
  id: string;
  venueName: string;
  address: string;
  isActive: boolean;
  numberOfLockers?: number;
}

interface LockerStatus {
  number: number;
  status: 'available' | 'active' | 'expired' | 'dispatched';
  entry?: Entry;
  customerName?: string;
  expiryDate?: any;
  pots?: number;
}

type StatusFilter = 'all' | 'active' | 'expired' | 'available';

interface LockerStatusGridProps {
  initialLocationId?: string;
  onLocationChange?: (locationId: string) => void;
}

export default function LockerStatusGrid({ initialLocationId = 'all', onLocationChange }: LockerStatusGridProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lockerStatusMap, setLockerStatusMap] = useState<Map<number, LockerStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const LOCKERS_PER_PAGE = 100;

  useEffect(() => {
    fetchData();
  }, [selectedLocationId]);

  useEffect(() => {
    if (onLocationChange) {
      onLocationChange(selectedLocationId);
    }
  }, [selectedLocationId, onLocationChange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [locationsData, entriesData] = await Promise.all([
        getLocations(),
        getEntries()
      ]);

      setLocations(locationsData.filter(loc => loc.isActive) as Location[]);
      setEntries(entriesData as Entry[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entries.length === 0) return;

    const newStatusMap = new Map<number, LockerStatus>();

    entries.forEach(entry => {
      if (!entry.lockerDetails || entry.lockerDetails.length === 0) return;

      const lockerNum = entry.lockerDetails[0].lockerNumber;
      const locationId = entry.locationId;

      if (selectedLocationId !== 'all' && locationId !== selectedLocationId) return;

      let status: LockerStatus['status'] = 'available';

      if (entry.status === 'dispatched' || entry.status === 'disposed') {
        status = 'dispatched';
      } else if (entry.expiryDate) {
        // Handle both Firestore Timestamp and JavaScript Date
        let expiry: Date;
        if (typeof (entry.expiryDate as any).toDate === 'function') {
          expiry = (entry.expiryDate as any).toDate();
        } else if (entry.expiryDate instanceof Date) {
          expiry = entry.expiryDate;
        } else {
          expiry = new Date(entry.expiryDate);
        }

        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`🔍 [Locker Status] Entry: ${entry.customerName}, Locker: ${lockerNum}, Expiry: ${expiry.toISOString()}, Now: ${now.toISOString()}, Days: ${daysUntilExpiry}, Status: ${entry.status}`);

        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else {
          status = 'active';
        }
      } else {
        status = 'active';
      }

      const lockerStatus: LockerStatus = {
        number: lockerNum,
        status,
        entry,
        customerName: entry.customerName,
        expiryDate: entry.expiryDate,
        pots: entry.lockerDetails[0].remainingPots
      };

      newStatusMap.set(lockerNum, lockerStatus);
    });

    setLockerStatusMap(newStatusMap);
  }, [entries, selectedLocationId]);

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
  const totalLockers = selectedLocation?.numberOfLockers || 0;
  const allLockerNumbers = Array.from({ length: totalLockers }, (_, i) => i + 1);

  const filteredLockers = allLockerNumbers.filter(lockerNum => {
    const lockerStatus = lockerStatusMap.get(lockerNum);

    if (statusFilter === 'all') return true;
    if (statusFilter === 'available') return !lockerStatus;
    if (statusFilter === 'active') return lockerStatus?.status === 'active';
    if (statusFilter === 'expired') return lockerStatus?.status === 'expired';

    return true;
  });

  const searchedLockers = filteredLockers.filter(lockerNum => {
    const lockerStatus = lockerStatusMap.get(lockerNum);

    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    if (lockerStatus?.customerName?.toLowerCase().includes(term)) {
      return true;
    }

    if (lockerNum.toString().includes(term)) {
      return true;
    }

    return false;
  });

  const totalPages = Math.ceil(searchedLockers.length / LOCKERS_PER_PAGE);
  const startIndex = (currentPage - 1) * LOCKERS_PER_PAGE;
  const endIndex = Math.min(startIndex + LOCKERS_PER_PAGE, searchedLockers.length);
  const paginatedLockers = searchedLockers.slice(startIndex, endIndex);

  const getStatusCounts = () => {
    const counts = {
      available: 0,
      active: 0,
      expired: 0,
      total: 0
    };

    allLockerNumbers.forEach(lockerNum => {
      const status = lockerStatusMap.get(lockerNum);
      counts.total++;

      if (!status) {
        counts.available++;
      } else if (status.status === 'active') {
        counts.active++;
      } else if (status.status === 'expired') {
        counts.expired++;
      } else if (status.status === 'dispatched') {
        counts.available++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const getLockerColorClass = (status?: string) => {
    if (!status) return 'bg-green-100 text-green-800 border-green-200 hover:scale-105 cursor-default';
    if (status === 'active') return 'bg-orange-100 text-orange-800 border-orange-200 hover:scale-105 hover:shadow-md cursor-pointer';
    if (status === 'expired') return 'bg-red-100 text-red-800 border-red-200 hover:scale-105 hover:shadow-md cursor-pointer';
    return 'bg-green-100 text-green-800 border-green-200 hover:scale-105 cursor-default';
  };

  const getDotColorClass = (status?: string) => {
    if (!status) return 'text-green-600';
    if (status === 'active') return 'text-orange-600';
    if (status === 'expired') return 'text-red-600';
    return 'text-green-600';
  };

  const getStatusIcon = (status?: string) => {
    if (!status || status === 'dispatched') return <CheckCircle2 className="h-1 w-1 text-white" />;
    if (status === 'active') return <Package className="h-1 w-1 text-white" />;
    if (status === 'expired') return <AlertTriangle className="h-1 w-1 text-white" />;
    return <CheckCircle2 className="h-1 w-1 text-white" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Archive className="h-6 w-6 text-primary" />
              <CardTitle>Locker Status</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time locker availability status across all locations
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status Filter</label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active (Orange)</SelectItem>
                  <SelectItem value="expired">Expired (Red)</SelectItem>
                  <SelectItem value="available">Available (Green)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customer or locker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Quick Actions</label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-300 bg-white">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {searchedLockers.length} of {totalLockers} Lockers
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">Active Entry</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Expired/Renewal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <div className="p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{statusCounts.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-orange-200 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-red-200 shadow-sm">
              <div className="text-2xl font-bold text-red-600">{statusCounts.expired}</div>
              <div className="text-sm text-gray-600">Pending Renewal</div>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.total}</div>
              <div className="text-sm text-gray-600">Total Lockers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLocation && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedLocation.venueName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLocation.address}
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                {selectedLocation.numberOfLockers || 0} Lockers
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>
              {selectedLocation?.venueName || 'All Locations'}
            </CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {paginatedLockers.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">No Lockers Found</h3>
              <p className="text-sm text-gray-600 mt-2">
                {selectedLocationId === 'all'
                  ? 'Please select a location to view lockers'
                  : 'No lockers match your filters'}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-14 2xl:grid-cols-16"
            >
              {paginatedLockers.map((lockerNum) => {
                const lockerStatus = lockerStatusMap.get(lockerNum);
                const status = lockerStatus?.status;

                return (
                  <motion.div
                    key={lockerNum}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    className={'relative w-12 h-12 sm:w-14 sm:h-14 rounded-sm border-2 p-1 flex flex-col items-center justify-center cursor-pointer transition-all ' + getLockerColorClass(status)}
                  >
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="w-3 h-3 sm:w-4 sm:h-4">
                        <CircleDot className={'h-full w-full ' + getDotColorClass(status)} />
                      </div>

                      <div className="text-[10px] sm:text-xs font-medium mt-0.5">
                        #{lockerNum}
                      </div>

                      {status && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full flex items-center justify-center shadow-md">
                          {getStatusIcon(status)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="md:hidden">
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> Lockers in green are available. Tap to see details (coming soon).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
