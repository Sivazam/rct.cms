'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Package, Phone, User, MapPin, Search, Filter, Users, RefreshCw, Plus, ArrowLeft, Calculator, Clock, Info, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries, getLocations, getUsers, getCustomerByMobile } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import OTPVerification from '@/components/renewals/OTPVerification';
import RenewalForm from '@/components/renewals/RenewalForm';
import RenewalConfirmation from '@/components/renewals/RenewalConfirmation';
import CustomerEntryForm from '@/components/entries/CustomerEntryForm';

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
  // New dialog states
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [showCustomerFoundDialog, setShowCustomerFoundDialog] = useState(false);
  const [showRenewalDetailsDialog, setShowRenewalDetailsDialog] = useState(false);
  const [showDispatchDialog, setShowDispatchDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [customerError, setCustomerError] = useState('');
  const [selectedEntryForDispatch, setSelectedEntryForDispatch] = useState<Entry | null>(null);
  const [dispatchAmount, setDispatchAmount] = useState('');
  const [dispatchReason, setDispatchReason] = useState('');
  const [dispatchPaymentMethod, setDispatchPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const RENEWAL_RATE_PER_MONTH = 300;

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
    setShowMobileDialog(true);
    setMobileNumber('');
    setFoundCustomer(null);
    setCustomerError('');
  };

  const handleMobileSearch = async () => {
    if (!mobileNumber.trim()) {
      setCustomerError('Please enter a mobile number');
      return;
    }

    setSearchingCustomer(true);
    setCustomerError('');
    setFoundCustomer(null);

    try {
      const customer = await getCustomerByMobile(mobileNumber.trim());
      setFoundCustomer(customer);
      if (customer) {
        setShowMobileDialog(false);
        setShowCustomerFoundDialog(true);
      } else {
        // New customer - show entry form directly
        setShowMobileDialog(false);
        setShowNewEntry(true);
      }
    } catch (error: any) {
      setCustomerError(error.message || 'Failed to search customer');
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleCreateNewCustomerEntry = () => {
    setShowCustomerFoundDialog(false);
    setShowNewEntry(true);
  };

  const handleRenewClick = (entry: Entry) => {
    setSelectedEntryForRenewal(entry);
    setRenewalMonths(1);
    setRenewalPaymentMethod('cash');
    setShowRenewalDetailsDialog(true);
  };

  const handleSendOTPForRenewal = () => {
    setShowRenewalDetailsDialog(false);
    setShowRenewal(true);
  };

  const handleDispatchClick = (entry: Entry) => {
    setSelectedEntryForDispatch(entry);
    setDispatchAmount('');
    setDispatchReason('');
    setDispatchPaymentMethod('cash');
    setShowDispatchDialog(true);
  };

  const handleSendOTPForDispatch = () => {
    setShowDispatchDialog(false);
    // For dispatch, we'll directly go to OTP verification
    setShowRenewal(true); // Reuse the renewal system for OTP, but we'll need to handle dispatch differently
  };

  const handleBackToList = () => {
    setShowNewEntry(false);
    setShowRenewal(false);
    setSelectedEntryForRenewal(null);
    setShowMobileDialog(false);
    setShowCustomerFoundDialog(false);
    setShowRenewalDetailsDialog(false);
    setShowDispatchDialog(false);
    setSelectedEntryForDispatch(null);
    setFoundCustomer(null);
    setMobileNumber('');
    setCustomerError('');
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

  const calculateRenewalAmount = (months: number) => {
    return months * RENEWAL_RATE_PER_MONTH; // Fixed rate per month, not per pot
  };

  const getNewExpiryDate = (entry: Entry, months: number) => {
    const currentExpiry = new Date(entry.expiryDate?.toDate?.() || entry.expiryDate);
    return new Date(currentExpiry.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateDueAmount = (entry: Entry) => {
    // Calculate total amount paid
    const totalPaid = entry.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    
    // For dispatch, we don't have a fixed due amount since it's service-based
    // But we can calculate the base service fee if needed
    // For now, return 0 as this is a service-based product
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show CustomerEntryForm if New Entry is clicked for active type
  if (showNewEntry && type === 'active') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-orange-800">
              {foundCustomer ? 'Create New Entry for Existing Customer' : 'Create New Customer Entry'}
            </h3>
            <p className="text-sm text-orange-600">
              {foundCustomer 
                ? `Create ash pot entry for ${foundCustomer.name}`
                : 'Register a new customer and create ash pot entry'
              }
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>
            ← Back to List
          </Button>
        </div>
        <CustomerEntryForm 
          customer={foundCustomer} 
          onSuccess={handleBackToList}
          onCancel={handleBackToList}
        />
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
              {(type === 'active' || type === 'pending') && <TableHead className="w-24">Dispatch</TableHead>}
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
                <TableCell colSpan={
                  (type === 'pending' ? 1 : 0) + 
                  ((type === 'active' || type === 'pending') ? 1 : 0) + 
                  9
                } className="text-center py-12">
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
                    {(type === 'active' || type === 'pending') && (
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleDispatchClick(entry)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Dispatch
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
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.badgeVariant} className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {entry.payments && entry.payments.length > 0 ? (
                          <div>
                            <div className="font-medium">₹{entry.payments.reduce((sum, p) => sum + p.amount, 0)}</div>
                            <div className="text-gray-500">{entry.payments.length} payment(s)</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No payments</span>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
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
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {typeInfo.icon}
                    <div>
                      <h4 className="font-medium">{entry.customerName}</h4>
                      <p className="text-sm text-gray-500">{entry.customerCity}</p>
                    </div>
                  </div>
                  <Badge variant={typeInfo.badgeVariant} className={getStatusColor(entry.status)}>
                    {entry.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{entry.customerMobile}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Package className="h-3 w-3 text-gray-400" />
                    <span>{entry.numberOfPots} pot(s)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">{formatDate(entry.entryDate)}</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${isExpiringSoon(entry.expiryDate) ? 'text-red-600' : ''}`}>
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs">{formatDate(entry.expiryDate)}</span>
                  </div>
                </div>

                {type === 'pending' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleRenewClick(entry)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white mb-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Renew Entry
                  </Button>
                )}
                {(type === 'active' || type === 'pending') && (
                  <Button 
                    size="sm" 
                    onClick={() => handleDispatchClick(entry)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    Dispatch Entry
                  </Button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Mobile Number Dialog for New Entry */}
      <Dialog open={showMobileDialog} onOpenChange={setShowMobileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Mobile Number</DialogTitle>
            <DialogDescription>
              Search for existing customer or register new customer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                disabled={searchingCustomer}
              />
            </div>
            
            {customerError && (
              <Alert variant="destructive">
                <AlertDescription>{customerError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMobileDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMobileSearch}
                disabled={searchingCustomer || !mobileNumber.trim()}
              >
                {searchingCustomer ? 'Searching...' : 'Search Customer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Found Dialog */}
      <Dialog open={showCustomerFoundDialog} onOpenChange={setShowCustomerFoundDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Found</DialogTitle>
            <DialogDescription>
              Customer with this mobile number already exists in the system
            </DialogDescription>
          </DialogHeader>
          
          {foundCustomer && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg">{foundCustomer.name}</h4>
                    <p className="text-sm text-gray-600">Existing Customer</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{foundCustomer.mobile}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{foundCustomer.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      Customer since: {formatFirestoreDate(foundCustomer.createdAt)}
                    </span>
                  </div>
                  {foundCustomer.additionalDetails && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      {foundCustomer.additionalDetails}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCustomerFoundDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNewCustomerEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Renewal Details Dialog */}
      <Dialog open={showRenewalDetailsDialog} onOpenChange={setShowRenewalDetailsDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Renewal Details</DialogTitle>
            <DialogDescription>
              Configure renewal period and payment method for {selectedEntryForRenewal?.customerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntryForRenewal && (
            <div className="space-y-6">
              {/* Current Entry Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Current Entry Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer:</span>
                      <span className="text-sm font-medium">{selectedEntryForRenewal.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mobile:</span>
                      <span className="text-sm font-medium">{selectedEntryForRenewal.customerMobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ash Pots:</span>
                      <span className="text-sm font-medium">{selectedEntryForRenewal.numberOfPots}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Expiry:</span>
                      <span className="text-sm font-medium">
                        {formatDate(new Date(selectedEntryForRenewal.expiryDate?.toDate?.() || selectedEntryForRenewal.expiryDate))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rate per Month:</span>
                      <span className="text-sm font-medium">₹{RENEWAL_RATE_PER_MONTH} per pot</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Months:</span>
                      <span className="text-sm font-medium">
                        {selectedEntryForRenewal.payments.reduce((sum, payment) => sum + payment.months, 0)} months
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Renewal Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="renewalMonths">Renewal Period</Label>
                    <Select 
                      value={renewalMonths.toString()} 
                      onValueChange={(value) => setRenewalMonths(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select renewal period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="2">2 Months</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={renewalPaymentMethod} 
                      onValueChange={(value) => setRenewalPaymentMethod(value as 'cash' | 'upi')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Renewal Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Calculator className="h-4 w-4" />
                    <span>Renewal Summary</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">Renewal Period:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {renewalMonths} month(s)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">Rate per Month:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {formatCurrency(RENEWAL_RATE_PER_MONTH)} per pot
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">Number of Pots:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {selectedEntryForRenewal.numberOfPots}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-blue-800">Total Amount:</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {formatCurrency(calculateRenewalAmount(renewalMonths))}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Expiry Date */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>New Expiry Date</span>
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-800">
                      {formatDate(getNewExpiryDate(selectedEntryForRenewal, renewalMonths))}
                    </p>
                    <p className="text-xs text-green-600">
                      Total storage period: {selectedEntryForRenewal.payments.reduce((sum, payment) => sum + payment.months, 0) + renewalMonths} months from original entry
                    </p>
                  </div>
                </div>

                {/* Important Information */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Once renewed, the entry will be extended by the selected period. 
                    OTP verification will be sent to customer mobile. The renewal will be recorded in the entry history.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRenewalDetailsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendOTPForRenewal}>
                  Send OTP & Continue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch Details Dialog */}
      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispatch Ash Pot</DialogTitle>
            <DialogDescription>
              Process dispatch for {selectedEntryForDispatch?.customerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntryForDispatch && (
            <div className="space-y-6">
              {/* Current Entry Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Current Entry Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer:</span>
                      <span className="text-sm font-medium">{selectedEntryForDispatch.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Mobile:</span>
                      <span className="text-sm font-medium">{selectedEntryForDispatch.customerMobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ash Pots:</span>
                      <span className="text-sm font-medium">{selectedEntryForDispatch.numberOfPots}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium">{selectedEntryForDispatch.locationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Entry Date:</span>
                      <span className="text-sm font-medium">
                        {formatDate(new Date(selectedEntryForDispatch.entryDate?.toDate?.() || selectedEntryForDispatch.entryDate))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {selectedEntryForDispatch.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dispatchAmount">Collection Amount (₹)</Label>
                    <Input
                      id="dispatchAmount"
                      type="number"
                      value={dispatchAmount}
                      onChange={(e) => setDispatchAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                    />
                    <p className="text-xs text-gray-500">
                      Service-based collection - enter any amount
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dispatchPaymentMethod">Payment Method</Label>
                    <Select 
                      value={dispatchPaymentMethod} 
                      onValueChange={(value) => setDispatchPaymentMethod(value as 'cash' | 'upi')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reason for Collection */}
                <div className="space-y-2">
                  <Label htmlFor="dispatchReason">Remarks (Optional)</Label>
                  <textarea
                    id="dispatchReason"
                    value={dispatchReason}
                    onChange={(e) => setDispatchReason(e.target.value)}
                    placeholder="Add any remarks or reasons for the collection amount..."
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Required if collecting less than standard amount
                  </p>
                </div>

                {/* Dispatch Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Calculator className="h-4 w-4" />
                    <span>Dispatch Summary</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">Collection Amount:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {dispatchAmount ? formatCurrency(parseFloat(dispatchAmount) || 0) : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">Payment Method:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {dispatchPaymentMethod === 'cash' ? 'Cash' : 'UPI'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-800">Number of Pots:</span>
                      <span className="text-sm font-medium text-blue-800">
                        {selectedEntryForDispatch.numberOfPots}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> This is a service-based dispatch. You can collect any amount including ₹0. 
                    OTP verification will be sent to customer mobile for confirmation. The entry will be marked as dispatched.
                  </AlertDescription>
                </Alert>

                {/* Validation for Reason */}
                {dispatchAmount && parseFloat(dispatchAmount) < 300 && !dispatchReason && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                      <strong>Required:</strong> Please provide a reason for collecting less than the standard amount (₹300).
                    </AlertDescription>
                  </Alert>
                )}

                {/* Validation for Amount */}
                {dispatchAmount && parseFloat(dispatchAmount) > 300 && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">
                      <strong>Invalid:</strong> Cannot collect more than the standard amount (₹300).
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDispatchDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendOTPForDispatch}
                  disabled={
                    !dispatchAmount || 
                    parseFloat(dispatchAmount) > 300 ||
                    (parseFloat(dispatchAmount) < 300 && !dispatchReason.trim())
                  }
                >
                  Send OTP & Dispatch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}