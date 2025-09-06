'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, RefreshCw, Phone, User, MapPin, Search, Filter, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries, getLocations } from '@/lib/firestore';

interface Renewal {
  id: string;
  entryId: string;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  numberOfPots: number;
  renewalDate: any;
  months: number;
  amount: number;
  method: 'cash' | 'upi';
  newExpiryDate: any;
  locationName?: string;
  operatorId: string;
}

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
  operatorId: string;
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

export default function RenewalsList() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching renewals...');
      
      const [entriesData, locationsData] = await Promise.all([
        getEntries(),
        getLocations()
      ]);
      
      console.log('Entries found:', entriesData.length);
      console.log('Locations found:', locationsData.length);
      
      // Create location mapping
      const locationMap = new Map();
      locationsData.forEach(loc => {
        locationMap.set(loc.id, loc.venueName);
      });
      
      // Extract renewals from entries
      const allRenewals: Renewal[] = [];
      entriesData.forEach(entry => {
        if (entry.renewals && entry.renewals.length > 0) {
          entry.renewals.forEach((renewal, index) => {
            allRenewals.push({
              id: `${entry.id}_renewal_${index}`,
              entryId: entry.id,
              customerName: entry.customerName,
              customerMobile: entry.customerMobile,
              customerCity: entry.customerCity,
              numberOfPots: entry.numberOfPots,
              renewalDate: renewal.date,
              months: renewal.months,
              amount: renewal.amount,
              method: renewal.method,
              newExpiryDate: renewal.newExpiryDate,
              locationName: locationMap.get(entry.locationId) || 'Unknown Location',
              operatorId: renewal.operatorId
            });
          });
        }
      });
      
      // Sort renewals by date (newest first)
      allRenewals.sort((a, b) => {
        const aTime = a.renewalDate?.toDate?.() || new Date(0);
        const bTime = b.renewalDate?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setRenewals(allRenewals);
      setLocations(locationsData.filter(loc => loc.isActive));
    } catch (error) {
      console.error('Error fetching renewals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRenewals = renewals.filter(renewal => {
    const matchesSearch = 
      renewal.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      renewal.customerMobile.includes(searchTerm) ||
      renewal.customerCity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || renewal.locationName === locationFilter;
    const matchesMonths = monthFilter === 'all' || renewal.months.toString() === monthFilter;
    
    return matchesSearch && matchesLocation && matchesMonths;
  });

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'upi': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return date.toDate().toLocaleDateString();
  };

  const isRecent = (renewalDate: any) => {
    if (!renewalDate) return false;
    const now = new Date();
    const renewal = renewalDate.toDate();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return renewal >= sevenDaysAgo && renewal <= now;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5" />
          <span>Renewals List</span>
          <Badge variant="secondary">{filteredRenewals.length}</Badge>
        </CardTitle>
        <CardDescription>
          View all ash pot entry renewals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, mobile, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
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
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Renewals Table - Desktop View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Pots</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Months</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>New Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRenewals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <RefreshCw className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">No renewals found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRenewals.map((renewal, index) => (
                  <motion.tr
                    key={renewal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{renewal.customerName}</div>
                          <div className="text-sm text-gray-500">{renewal.customerCity}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{renewal.customerMobile}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{renewal.locationName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <RefreshCw className="h-4 w-4 text-gray-400" />
                        <span>{renewal.numberOfPots}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center space-x-1 ${isRecent(renewal.renewalDate) ? 'text-green-600 font-medium' : ''}`}>
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(renewal.renewalDate)}</span>
                        {isRecent(renewal.renewalDate) && (
                          <Badge variant="default" className="text-xs">Recent</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{renewal.months} {renewal.months === 1 ? 'month' : 'months'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">₹{renewal.amount}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentMethodColor(renewal.method)}>
                        {renewal.method.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(renewal.newExpiryDate)}</span>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {filteredRenewals.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No renewals found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            filteredRenewals.map((renewal, index) => (
              <motion.div
                key={renewal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                {/* Customer Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <h3 className="font-medium text-gray-900">{renewal.customerName}</h3>
                      {isRecent(renewal.renewalDate) && (
                        <Badge variant="default" className="text-xs">Recent</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                      <Phone className="h-3 w-3" />
                      <span>{renewal.customerMobile}</span>
                    </div>
                    <div className="text-sm text-gray-500">{renewal.customerCity}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                      <RefreshCw className="h-3 w-3" />
                      <span>{renewal.numberOfPots}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                  <MapPin className="h-3 w-3" />
                  <span>{renewal.locationName}</span>
                </div>

                {/* Renewal Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Renewal Date</div>
                    <div className="flex items-center space-x-1 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span>{formatDate(renewal.renewalDate)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                    <Badge variant="outline" className="text-xs">
                      {renewal.months} {renewal.months === 1 ? 'month' : 'months'}
                    </Badge>
                  </div>
                </div>

                {/* Payment & New Expiry */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Amount</div>
                    <div className="font-medium text-green-600">₹{renewal.amount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment</div>
                    <Badge className={getPaymentMethodColor(renewal.method)}>
                      {renewal.method.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* New Expiry Date */}
                <div className="pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-1">New Expiry Date</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>{formatDate(renewal.newExpiryDate)}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {renewals.length}
            </div>
            <div className="text-sm text-green-700">Total Renewals</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {renewals.filter(r => r.method === 'cash').length}
            </div>
            <div className="text-sm text-blue-700">Cash Payments</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {renewals.filter(r => r.method === 'upi').length}
            </div>
            <div className="text-sm text-purple-700">UPI Payments</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              ₹{renewals.reduce((sum, r) => sum + r.amount, 0)}
            </div>
            <div className="text-sm text-yellow-700">Total Revenue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}