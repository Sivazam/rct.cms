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

interface DeliveryRecord {
  id: string;
  entryId: string;
  customerId: string;
  customer: Customer;
  deliveryDate: string;
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
}

interface DeliveryHistoryProps {
  onClose?: () => void;
  loading?: boolean;
}

export default function DeliveryHistory({ onClose, loading = false }: DeliveryHistoryProps) {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryRecord[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
    loadLocations();
  }, []);

  useEffect(() => {
    filterAndSearchDeliveries();
  }, [deliveries, searchTerm, filterLocation, filterDateRange]);

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

  const loadDeliveries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/deliveries');
      if (response.ok) {
        const data = await response.json();
        const deliveriesData = data.deliveries || [];
        
        // Transform API data to match our interface
        const transformedDeliveries: DeliveryRecord[] = deliveriesData.map((delivery: any) => ({
          id: delivery.id,
          entryId: delivery.entryId,
          customerId: delivery.customerId,
          customer: {
            id: delivery.customerId,
            name: delivery.customerName,
            mobile: delivery.customerMobile,
            city: delivery.customerCity || ''
          },
          deliveryDate: delivery.deliveryDate,
          operatorName: delivery.operatorName,
          operatorId: delivery.operatorId,
          locationName: delivery.locationName,
          locationId: delivery.locationId,
          pots: delivery.pots || 0,
          otpVerified: delivery.otpVerified || false,
          smsSent: delivery.smsSent || false,
          entryDate: delivery.entryDate,
          expiryDate: delivery.expiryDate,
          renewalCount: delivery.renewalCount || 0
        }));
        
        setDeliveries(transformedDeliveries);
      } else {
        console.error('Failed to load deliveries:', response.statusText);
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
      setDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSearchDeliveries = () => {
    let filtered = [...deliveries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customer.mobile.includes(searchTerm) ||
        delivery.entryId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(delivery => delivery.locationName === filterLocation);
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
        filtered = filtered.filter(delivery => 
          new Date(delivery.deliveryDate) >= cutoffDate
        );
      }
    }

    setFilteredDeliveries(filtered);
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
      console.log('Exporting delivery history...');
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalDeliveries = deliveries.length;
  const filteredCount = filteredDeliveries.length;

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
            <span>Delivery History</span>
          </CardTitle>
          <CardDescription>
            View and manage all delivery records
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
            <span>Showing {filteredCount} of {totalDeliveries} deliveries</span>
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

      {/* Delivery Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delivery ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Pots</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-sm">
                      {delivery.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{delivery.customer.name}</div>
                        <div className="text-sm text-gray-500">
                          Entry: {delivery.entryId.slice(-6)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{delivery.customer.mobile}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{delivery.customer.city}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{delivery.locationName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{delivery.pots}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(delivery.deliveryDate)}</TableCell>
                    <TableCell>{delivery.operatorName}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                        <div className="flex space-x-1">
                          {delivery.otpVerified && (
                            <Badge variant="outline" className="text-xs">
                              OTP Verified
                            </Badge>
                          )}
                          {delivery.smsSent && (
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

      {filteredDeliveries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">No delivery records found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || filterLocation !== 'all' || filterDateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Start making deliveries to see them here'}
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
              <span className="text-sm font-medium">Total Deliveries</span>
            </div>
            <div className="text-2xl font-bold mt-1">{totalDeliveries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">OTP Verified</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {deliveries.filter(d => d.otpVerified).length}
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
              {deliveries.filter(d => {
                const deliveryDate = new Date(d.deliveryDate);
                const now = new Date();
                return deliveryDate.getMonth() === now.getMonth() && 
                       deliveryDate.getFullYear() === now.getFullYear();
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
              {new Set(deliveries.map(d => d.customerId)).size}
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