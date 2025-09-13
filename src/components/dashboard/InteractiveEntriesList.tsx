'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Package, Phone, User, MapPin, Search, Filter, Users, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries, getLocations, getUsers } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import OTPVerification from '@/components/renewals/OTPVerification';
import RenewalForm from '@/components/renewals/RenewalForm';
import RenewalConfirmation from '@/components/renewals/RenewalConfirmation';

interface Entry {
  id: string;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  numberOfPots: number;
  entryDate: any;
  expiryDate: any;
  status: 'active' | 'expired' | 'delivered' | 'disposed';
  locationId: string;
  locationName?: string;
  operatorId: string;
  operatorName?: string;
  payments: Array<{
    amount: number;
    date: any;
    type: string;
    method: string;
    months: number;
  }>;
  renewals: Array<{
    date: any;
    months: number;
    amount: number;
    method: string;
    operatorId: string;
    newExpiryDate: any;
  }>;
}

interface Location {
  id: string;
  venueName: string;
  address: string;
  isActive: boolean;
}

interface InteractiveEntriesListProps {
  type: 'active' | 'pending' | 'dispatched';
  locationId?: string;
  dateRange?: { from: Date; to: Date };
}

// Wrapper component for RenewalSystem with pre-selected entry
function RenewalSystemWithPreselectedEntry({ entry, onBack }: { entry: Entry; onBack: () => void }) {
  const [currentStep, setCurrentStep] = useState<'otp' | 'form' | 'confirmation'>('otp');
  const [completedRenewal, setCompletedRenewal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOTPVerified = () => {
    setCurrentStep('form');
  };

  const handleRenewalSuccess = (renewalData: any) => {
    setCompletedRenewal(renewalData);
    setCurrentStep('confirmation');
  };

  const handleCancel = () => {
    onBack();
  };

  const handleNewRenewal = () => {
    setCurrentStep('otp');
    setCompletedRenewal(null);
  };

  const handleViewEntries = () => {
    onBack();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'otp':
        return (
          <div className="mb-4">
            <OTPVerification
              mobile={entry.customerMobile}
              entryId={entry.id}
              type="renewal"
              onVerified={handleOTPVerified}
              onCancel={handleCancel}
              loading={loading}
            />
          </div>
        );

      case 'form':
        return (
          <div className="mb-4">
            <RenewalForm
              entry={entry}
              onSuccess={handleRenewalSuccess}
              onCancel={handleCancel}
              loading={loading}
            />
          </div>
        );

      case 'confirmation':
        return (
          <div>
            {completedRenewal && (
              <RenewalConfirmation
                renewalData={completedRenewal}
                onNewRenewal={handleNewRenewal}
                onViewEntries={handleViewEntries}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {renderStep()}
    </div>
  );
}

export default function InteractiveEntriesList({ type, locationId, dateRange }: InteractiveEntriesListProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState(locationId || 'all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const [selectedEntryForRenewal, setSelectedEntryForRenewal] = useState<Entry | null>(null);

  useEffect(() => {
    fetchData();
  }, [type, locationId, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log(`Fetching ${type} entries...`);
      
      // Determine filter based on type
      let statusFilter;
      switch (type) {
        case 'active':
          statusFilter = 'active';
          break;
        case 'pending':
          // For pending, we want entries that need renewal (expired but still active)
          statusFilter = 'active'; // We'll filter client-side for expired entries
          break;
        case 'dispatched':
          statusFilter = 'delivered';
          break;
        default:
          statusFilter = 'active';
      }

      const [entriesData, locationsData, usersData] = await Promise.all([
        getEntries({
          locationId: locationId === 'all' ? undefined : locationId,
          status: statusFilter
        }),
        getLocations(),
        getUsers()
      ]);
      
      console.log(`${type} entries found:`, entriesData.length);
      
      // Create location mapping
      const locationMap = new Map();
      locationsData.forEach(loc => {
        locationMap.set(loc.id, loc.venueName);
      });
      
      // Create operator mapping
      const operatorMap = new Map();
      usersData.forEach(user => {
        operatorMap.set(user.id, user.name);
      });
      
      // Add location names and operator names to entries
      let entriesWithDetails = entriesData.map(entry => ({
        ...entry,
        locationName: locationMap.get(entry.locationId) || 'Unknown Location',
        operatorName: operatorMap.get(entry.operatorId) || 'Unknown Operator'
      }));

      // Additional filtering based on type
      if (type === 'pending') {
        // Filter for entries that need renewal (expired but still active)
        const now = new Date();
        entriesWithDetails = entriesWithDetails.filter(entry => {
          const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
          return expiryDate <= now && entry.status === 'active';
        });
      }

      // Apply date range filtering if specified
      if (dateRange) {
        entriesWithDetails = entriesWithDetails.filter(entry => {
          const entryDate = entry.entryDate?.toDate ? entry.entryDate.toDate() : new Date(entry.entryDate);
          return entryDate >= dateRange.from && entryDate <= dateRange.to;
        });
      }
      
      setEntries(entriesWithDetails);
      setLocations(locationsData.filter(loc => loc.isActive));
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEntryClick = () => {
    setShowNewEntry(true);
    setShowRenewal(false);
    setSelectedEntryForRenewal(null);
  };

  const handleRenewClick = (entry: Entry) => {
    setSelectedEntryForRenewal(entry);
    setShowRenewal(true);
    setShowNewEntry(false);
  };

  const handleBackToList = () => {
    setShowNewEntry(false);
    setShowRenewal(false);
    setSelectedEntryForRenewal(null);
    // Refresh the data
    fetchData();
  };

  const filteredEntries = entries.filter(entry => {
    const customerName = entry.customerName || '';
    const customerMobile = entry.customerMobile || '';
    const customerCity = entry.customerCity || '';
    
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerMobile.includes(searchTerm) ||
      customerCity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || entry.locationId === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'delivered': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'disposed': return 'bg-stone-100 text-stone-800 border-stone-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return formatFirestoreDate(date);
  };

  const isExpiringSoon = (expiryDate: any) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiry <= sevenDaysFromNow && expiry > now;
  };

  const getTypeSpecificInfo = (entry: Entry) => {
    switch (type) {
      case 'active':
        return {
          icon: <Package className="h-4 w-4 text-orange-600" />,
          statusColor: 'text-orange-600',
          badgeVariant: 'default' as const
        };
      case 'pending':
        return {
          icon: <RefreshCw className="h-4 w-4 text-red-600" />,
          statusColor: 'text-red-600',
          badgeVariant: 'destructive' as const
        };
      case 'dispatched':
        return {
          icon: <Calendar className="h-4 w-4 text-amber-600" />,
          statusColor: 'text-amber-600',
          badgeVariant: 'secondary' as const
        };
      default:
        return {
          icon: <Package className="h-4 w-4 text-gray-600" />,
          statusColor: 'text-gray-600',
          badgeVariant: 'outline' as const
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show CustomerEntrySystem if New Entry is clicked for active type
  if (showNewEntry && type === 'active') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-orange-800">Create New Entry</h3>
            <p className="text-sm text-orange-600">Register a new customer and create ash pot entry</p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to List
          </Button>
        </div>
        <CustomerEntrySystem />
      </div>
    );
  }

  // Show RenewalSystem if Renew is clicked for pending type
  if (showRenewal && type === 'pending' && selectedEntryForRenewal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800">Renew Entry</h3>
            <p className="text-sm text-green-600">Renew ash pot entry for {selectedEntryForRenewal.customerName}</p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to List
          </Button>
        </div>
        <RenewalSystemWithPreselectedEntry entry={selectedEntryForRenewal} onBack={handleBackToList} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with New Entry button for Active type */}
      {type === 'active' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-orange-800">Active Ash Pots</h3>
            <p className="text-sm text-orange-600">Currently active ash pot entries</p>
          </div>
          <Button onClick={handleNewEntryClick} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      )}

      {/* Header for Pending type */}
      {type === 'pending' && (
        <div>
          <h3 className="text-lg font-semibold text-red-800">Pending Ash Pots</h3>
          <p className="text-sm text-red-600">Entries pending renewal or processing</p>
        </div>
      )}

      {/* Header for Dispatched type */}
      {type === 'dispatched' && (
        <div>
          <h3 className="text-lg font-semibold text-amber-800">Dispatched Ash Pots</h3>
          <p className="text-sm text-amber-600">Dispatched/delivered ash pot entries</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${
              isSearchFocused ? 'text-orange-500' : 'text-gray-400'
            }`} />
            <Input
              placeholder="Search by name, mobile, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48 border-orange-200 focus:border-orange-400 focus:ring-orange-200">
              <SelectValue placeholder="Location" />
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
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="text-sm text-gray-600">
          Showing {filteredEntries.length} of {entries.length} entries
          {searchTerm && ` for "${searchTerm}"`}
          {locationFilter !== 'all' && ` in ${locations.find(l => l.id === locationFilter)?.venueName || 'selected location'}`}
        </div>
      )}

      {/* Entries Table - Desktop View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {type === 'pending' && <TableHead className="w-24">Action</TableHead>}
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Pots</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={type === 'pending' ? 10 : 9} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium">No {type} entries found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchTerm || locationFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'There are no entries matching your criteria'
                        }
                      </p>
                      {(searchTerm || locationFilter !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setLocationFilter('all');
                          }}
                          className="mt-3 border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry, index) => {
                const typeInfo = getTypeSpecificInfo(entry);
                return (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    {type === 'pending' && (
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleRenewClick(entry)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Renew
                        </Button>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {typeInfo.icon}
                        <div>
                          <div className="font-medium">{entry.customerName}</div>
                          <div className="text-sm text-gray-500">{entry.customerCity}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{entry.customerMobile}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{entry.locationName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{entry.operatorName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{entry.numberOfPots}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(entry.entryDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center space-x-1 ${isExpiringSoon(entry.expiryDate) ? 'text-red-600 font-medium' : ''}`}>
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(entry.expiryDate)}</span>
                        {isExpiringSoon(entry.expiryDate) && (
                          <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">₹{entry.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0}</div>
                        <div className="text-gray-500">{entry.renewals?.length || 0} renewals</div>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-gray-700 font-medium">No {type} entries found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || locationFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'There are no entries matching your criteria'
              }
            </p>
            {(searchTerm || locationFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('all');
                }}
                className="mt-3 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const typeInfo = getTypeSpecificInfo(entry);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                {/* Renew Button for Pending Type */}
                {type === 'pending' && (
                  <div className="mb-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleRenewClick(entry)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Renew Entry
                    </Button>
                  </div>
                )}

                {/* Customer Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {typeInfo.icon}
                      <h3 className="font-medium text-gray-900">{entry.customerName}</h3>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                      <Phone className="h-3 w-3" />
                      <span>{entry.customerMobile}</span>
                    </div>
                    <div className="text-sm text-gray-500">{entry.customerCity}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                      <Package className="h-3 w-3" />
                      <span>{entry.numberOfPots}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{entry.locationName}</span>
                </div>

                {/* Operator */}
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                  <Users className="h-3 w-3" />
                  <span>By {entry.operatorName}</span>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Entry Date</div>
                    <div className="flex items-center space-x-1 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{formatDate(entry.entryDate)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Expiry Date</div>
                    <div className={`flex items-center space-x-1 text-sm ${isExpiringSoon(entry.expiryDate) ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{formatDate(entry.expiryDate)}</span>
                      {isExpiringSoon(entry.expiryDate) && (
                        <Badge variant="destructive" className="text-xs">Expiring Soon</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payments */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-sm">
                    <div className="font-medium">₹{entry.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0}</div>
                    <div className="text-gray-500">{entry.renewals?.length || 0} renewals</div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}