'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Package, Archive, AlertTriangle, CheckCircle2, CircleDot, ChevronLeft, ChevronRight, User, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  deceasedPersonName?: string;
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
  deceasedPersonName?: string;
}

type StatusFilter = 'all' | 'active' | 'expired' | 'available';

interface LockerStatusGridProps {
  initialLocationId?: string;
  onLocationChange?: (locationId: string) => void;
}

export default function LockerStatusGrid({ initialLocationId = 'all', onLocationChange }: LockerStatusGridProps) {
  const { theme, systemTheme } = useTheme();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lockerStatusMap, setLockerStatusMap] = useState<Map<number, LockerStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false); // Separate loading for grid
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredLocker, setHoveredLocker] = useState<{ lockerNum: number; lockerStatus: LockerStatus | undefined } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const LOCKERS_PER_PAGE = 100;

  // Track locker refs for positioning
  const lockerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Detect if device is touch-enabled
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
    return () => window.removeEventListener('touchstart', checkTouch);
  }, []);

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
      setGridLoading(true); // Start grid loading

      // Clear locker status map immediately when location changes
      setLockerStatusMap(new Map());

      const [locationsData, entriesData] = await Promise.all([
        getLocations(),
        getEntries()
      ]);

      setLocations(locationsData.filter(loc => loc.isActive) as Location[]);
      setEntries(entriesData as Entry[]);

      // Grid loading will be set to false when lockerStatusMap is updated
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set grid loading to false when lockerStatusMap is updated
    setGridLoading(false);
  }, [lockerStatusMap]);

  useEffect(() => {
    if (entries.length === 0) {
      setLockerStatusMap(new Map());
      return;
    }

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
        pots: entry.lockerDetails[0].remainingPots,
        deceasedPersonName: entry.deceasedPersonName
      };

      newStatusMap.set(lockerNum, lockerStatus);
    });

    setLockerStatusMap(newStatusMap);
  }, [entries, selectedLocationId]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, selectedLocationId]);

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
    if (!status) return 'bg-green-700 text-white border-green-800 hover:scale-105 cursor-default';
    if (status === 'active') return 'bg-orange-700 text-white border-orange-800 hover:scale-105 hover:shadow-md cursor-pointer';
    if (status === 'expired') return 'bg-red-700 text-white border-red-800 hover:scale-105 hover:shadow-md cursor-pointer';
    return 'bg-green-700 text-white border-green-800 hover:scale-105 cursor-default';
  };

  const getDotColorClass = (status?: string) => {
    if (!status) return 'text-green-200';
    if (status === 'active') return 'text-orange-200';
    if (status === 'expired') return 'text-red-200';
    return 'text-green-200';
  };

  const getStatusIcon = (status?: string) => {
    if (!status || status === 'dispatched') return <CheckCircle2 className="h-1 w-1 text-white" />;
    if (status === 'active') return <Package className="h-1 w-1 text-white" />;
    if (status === 'expired') return <AlertTriangle className="h-1 w-1 text-white" />;
    return <CheckCircle2 className="h-1 w-1 text-white" />;
  };

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages, currentPage + 1));
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    // Minimum swipe distance to trigger (in pixels)
    const minSwipeDistance = 50;

    if (Math.abs(diff) < minSwipeDistance) return;

    if (diff > 0) {
      // Swipe RIGHT = PREVIOUS page
      console.log('Swipe detected: RIGHT (Previous)');
      handlePreviousPage();
    } else {
      // Swipe LEFT = NEXT page
      console.log('Swipe detected: LEFT (Next)');
      handleNextPage();
    }

    setTouchStartX(null);
  };

  // Mouse drag handlers for desktop swipe
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (touchStartX === null) return;

    const diff = e.clientX - touchStartX;
    const minSwipeDistance = 50;

    if (Math.abs(diff) < minSwipeDistance) return;

    if (diff > 0) {
      console.log('Mouse drag detected: RIGHT (Previous)');
      handlePreviousPage();
    } else {
      console.log('Mouse drag detected: LEFT (Next)');
      handleNextPage();
    }

    setTouchStartX(null);
  };

  // Simplified hover handler - use mouse position directly with offset
  const handleLockerHover = (lockerNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    // Skip hover handling on touch devices
    if (isTouchDevice) return;

    const lockerStatus = lockerStatusMap.get(lockerNum);
    console.log('Hovering locker:', lockerNum, 'Status:', lockerStatus, 'Has deceased:', !!lockerStatus?.deceasedPersonName);

    if (lockerStatus && (lockerStatus.status === 'active' || lockerStatus.status === 'expired')) {
      setHoveredLocker({ lockerNum, lockerStatus });

      // Use mouse position with offset - simpler and more reliable
      const x = e.clientX;
      const y = e.clientY;

      console.log('Setting hover card position from mouse:', { x, y });

      // Position card at mouse position
      setMousePosition({ x, y });
    } else {
      setHoveredLocker(null);
    }
  };

  // Click handler for both touch and desktop - toggle modal
  const handleLockerClick = (lockerNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    const lockerStatus = lockerStatusMap.get(lockerNum);
    e.stopPropagation();

    // Only show modal for filled lockers
    if (lockerStatus && (lockerStatus.status === 'active' || lockerStatus.status === 'expired')) {
      // If clicking the same locker, close it. Otherwise, open new one.
      if (hoveredLocker?.lockerNum === lockerNum) {
        setHoveredLocker(null);
        setMousePosition(null);
      } else {
        setHoveredLocker({ lockerNum, lockerStatus });
        const x = e.clientX;
        const y = e.clientY;
        setMousePosition({ x, y });
      }
    }
  };

  const handleBackdropClick = () => {
    console.log('Backdrop clicked, closing modal');
    setHoveredLocker(null);
    setMousePosition(null);
  };

  const handleLockerLeave = () => {
    // Only close on leave if NOT a touch device AND modal is not currently open via click
    // When modal is open (clicked), we don't want to close it on mouse leave
    if (!isTouchDevice && !mousePosition) {
      console.log('Leaving locker');
      setHoveredLocker(null);
      setMousePosition(null);
    }
  };

  // Debug: Log when hoveredLocker or mousePosition changes
  useEffect(() => {
    console.log('hoveredLocker changed:', hoveredLocker, 'mousePosition:', mousePosition);
  }, [hoveredLocker, mousePosition]);

  return (
    <>
      {/* Centered Modal - Rendered at outermost level for proper z-index */}
      <AnimatePresence>
        {hoveredLocker && hoveredLocker.lockerStatus && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-xl shadow-2xl border-2 p-6 min-w-80 max-w-sm pointer-events-auto ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Close button */}
              <button
                onClick={handleBackdropClick}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  hoveredLocker.lockerStatus.status === 'active' ? 'bg-orange-600' : 'bg-red-600'
                }`}>
                  <Archive className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className={`text-lg font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Locker #{hoveredLocker.lockerNum}
                  </div>
                  <Badge className={
                    hoveredLocker.lockerStatus.status === 'active'
                      ? 'bg-orange-600 text-white'
                      : 'bg-red-600 text-white'
                  }>
                    {hoveredLocker.lockerStatus.status === 'active' ? 'Active' : 'Expired'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-700`}>
                    <User className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-xs uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      Deceased Person
                    </div>
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {hoveredLocker.lockerStatus.deceasedPersonName || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-700`}>
                    <Layers className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-xs uppercase tracking-wider ${
                      theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                    }`}>
                      Total Pots
                    </div>
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {hoveredLocker.lockerStatus.pots || 0} Pots
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
      {/* <Card>
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
      </Card> */}

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
            <div className="p-4 bg-green-600 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-white">{statusCounts.available}</div>
              <div className="text-sm text-green-100">Available</div>
            </div>
            <div className="p-4 bg-orange-600 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-white">{statusCounts.active}</div>
              <div className="text-sm text-orange-100">Active</div>
            </div>
            <div className="p-4 bg-red-600 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-white">{statusCounts.expired}</div>
              <div className="text-sm text-red-100">Pending Renewal</div>
            </div>
            <div className="p-4 bg-blue-600 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-white">{statusCounts.total}</div>
              <div className="text-sm text-blue-100">Total Lockers</div>
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
                  onClick={handlePreviousPage}
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
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {gridLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900">Loading Lockers...</h3>
            </div>
          ) : paginatedLockers.length === 0 ? (
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
            <div className="relative">
              {/* Left Navigation Arrow */}
              {totalPages > 1 && currentPage > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-8 w-8 rounded-full shadow-lg bg-white hover:bg-gray-100"
                  onClick={handlePreviousPage}
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              {/* Right Navigation Arrow */}
              {totalPages > 1 && currentPage < totalPages && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-8 w-8 rounded-full shadow-lg bg-white hover:bg-gray-100"
                  onClick={handleNextPage}
                  disabled={loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {/* Locker Grid with Swipe Support */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-14 2xl:grid-cols-16 px-8"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
              >
                {paginatedLockers.map((lockerNum) => {
                  const lockerStatus = lockerStatusMap.get(lockerNum);
                  const status = lockerStatus?.status;
                  const isFilled = status === 'active' || status === 'expired';

                  return (
                    <motion.div
                      key={lockerNum}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={'relative w-12 h-12 sm:w-14 sm:h-14 rounded-sm border-2 p-1 flex flex-col items-center justify-center cursor-pointer transition-all ' + getLockerColorClass(status)}
                      onMouseEnter={(e) => isFilled && handleLockerHover(lockerNum, e)}
                      onMouseLeave={handleLockerLeave}
                      onClick={(e) => isFilled && handleLockerClick(lockerNum, e)}
                    >
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4">
                          <CircleDot className={'h-full w-full ' + getDotColorClass(status)} />
                        </div>

                        <div className="text-[10px] sm:text-xs font-medium mt-0.5">
                          {lockerNum}
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
            </div>
          )}

          {/* Swipe hint text */}
          {totalPages > 1 && !gridLoading && paginatedLockers.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <p className="hidden md:block">
                💡 Tip: Use arrow buttons on the sides, or swipe/drag left and right to navigate between pages
              </p>
              <p className="md:hidden">
                💡 Tip: Swipe left or right to navigate between pages
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:hidden">
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> Lockers in green are available. Tap filled lockers to see details.
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
