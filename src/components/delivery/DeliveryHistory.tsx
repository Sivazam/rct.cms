'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Phone, 
  User, 
  MapPin, 
  Package,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/date-utils';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  city: string;
}

interface DispatchRecord {
  id: string;
  entryId: string;
  customerId: string;
  customer: Customer;
  dispatchDate: string;
  operatorName: string;
  operatorId: string;
  locationName: string;
  locationId: string;
  pots: number;
  otpVerified: boolean;
  smsSent: boolean;
  entryDate: string;
  expiryDate: string;
  renewalCount: number;
  amount?: number;
  reason?: string;
  paymentMethod?: string;
}

interface DeliveryHistoryProps {
  onClose?: () => void;
  loading?: boolean;
}

export default function DeliveryHistory({ onClose, loading = false }: DeliveryHistoryProps) {
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [filteredDispatches, setFilteredDispatches] = useState<DispatchRecord[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDispatches();
    loadLocations();
  }, []);

  useEffect(() => {
    filterAndSearchDispatches();
  }, [dispatches, searchTerm, filterLocation, filterDateRange]);

  const loadLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const locationsData = await response.json();
        setLocations(locationsData.filter(loc => loc.isActive));
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadDispatches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/deliveries');
      if (response.ok) {
        const data = await response.json();
        const deliveriesData = data.deliveries || [];
        
        // Transform API data to match our interface
        const transformedDispatches: DispatchRecord[] = deliveriesData.map((delivery: any) => ({
          id: delivery.id,
          entryId: delivery.entryId,
          customerId: delivery.customerId,
          customer: {
            id: delivery.customerId,
            name: delivery.customerName,
            mobile: delivery.customerMobile,
            city: delivery.customerCity || ''
          },
          dispatchDate: delivery.deliveryDate,
          operatorName: delivery.operatorName,
          operatorId: delivery.operatorId,
          locationName: delivery.locationName,
          locationId: delivery.locationId,
          pots: delivery.pots || 0,
          otpVerified: delivery.otpVerified || false,
          smsSent: delivery.smsSent || false,
          entryDate: delivery.entryDate,
          expiryDate: delivery.expiryDate,
          renewalCount: delivery.renewalCount || 0,
          amount: delivery.amount || 0,
          reason: delivery.reason || '',
          paymentMethod: delivery.paymentMethod || 'cash'
        }));
        
        setDispatches(transformedDispatches);
      } else {
        console.error('Failed to load dispatches:', response.statusText);
        setDispatches([]);
      }
    } catch (error) {
      console.error('Failed to load dispatches:', error);
      setDispatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSearchDispatches = () => {
    let filtered = [...dispatches];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(dispatch => {
        const customerName = dispatch.customer?.name || '';
        const customerMobile = dispatch.customer?.mobile || '';
        const entryId = dispatch.entryId || '';
        
        return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               customerMobile.includes(searchTerm) ||
               entryId.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(dispatch => dispatch.locationName === filterLocation);
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filterDateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (filterDateRange !== 'all') {
        filtered = filtered.filter(dispatch => 
          new Date(dispatch.dispatchDate) >= cutoffDate
        );
      }
    }

    setFilteredDispatches(filtered);
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const formatShortDate = (dateString: string) => {
    return formatDate(dateString);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real implementation, this would generate and download a CSV/Excel file
      console.log('Exporting dispatch history...');
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalDispatches = dispatches.length;
  const filteredCount = filteredDispatches.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Dispatch History</span>
          </CardTitle>
          <CardDescription>
            View and manage all dispatch records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer name, mobile, or entry ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.venueName}>
                      {location.venueName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredCount} of {totalDispatches} dispatches</span>
            {(searchTerm || filterLocation !== 'all' || filterDateRange !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLocation('all');
                  setFilterDateRange('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dispatch Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Pots</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell className="font-mono text-sm">
                      {dispatch.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dispatch.customer.name}</div>
                        <div className="text-sm text-gray-500">
                          Entry: {dispatch.entryId.slice(-6)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{dispatch.customer.mobile}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{dispatch.customer.city}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{dispatch.locationName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{dispatch.pots}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">₹{dispatch.amount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <span className="text-sm text-gray-600">
                          {dispatch.reason || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(dispatch.dispatchDate)}</TableCell>
                    <TableCell>{dispatch.operatorName}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Dispatched
                        </Badge>
                        <div className="flex space-x-1">
                          {dispatch.otpVerified && (
                            <Badge variant="outline" className="text-xs">
                              OTP Verified
                            </Badge>
                          )}
                          {dispatch.smsSent && (
                            <Badge variant="outline" className="text-xs">
                              SMS Sent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {filteredDispatches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No dispatch records found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || filterLocation !== 'all' || filterDateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Start making dispatches to see them here'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Dispatches</span>
            </div>
            <div className="text-2xl font-bold mt-1">{totalDispatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">OTP Verified</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {dispatches.filter(d => d.otpVerified).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {dispatches.filter(d => {
                const dispatchDate = new Date(d.dispatchDate);
                const now = new Date();
                return dispatchDate.getMonth() === now.getMonth() && 
                       dispatchDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Unique Customers</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {new Set(dispatches.map(d => d.customerId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="text-center">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close History
          </Button>
        </div>
      )}
    </motion.div>
  );
}