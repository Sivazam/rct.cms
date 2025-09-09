'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Package, Phone, User, MapPin, Search, Filter, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries, getLocations, getUsers } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';

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

export default function EntriesList() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching entries...');
      
      const [entriesData, locationsData, usersData] = await Promise.all([
        getEntries(),
        getLocations(),
        getUsers()
      ]);
      
      console.log('Entries found:', entriesData.length);
      console.log('Locations found:', locationsData.length);
      console.log('Users found:', usersData.length);
      
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
      const entriesWithDetails = entriesData.map(entry => ({
        ...entry,
        locationName: locationMap.get(entry.locationId) || 'Unknown Location',
        operatorName: operatorMap.get(entry.operatorId) || 'Unknown Operator'
      }));
      
      setEntries(entriesWithDetails);
      setLocations(locationsData.filter(loc => loc.isActive));
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.customerMobile.includes(searchTerm) ||
      entry.customerCity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || entry.locationId === locationFilter;
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'disposed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return formatFirestoreDate(date);
  };

  const isExpiringSoon = (expiryDate: any) => {
    if (!expiryDate) return false;
    const now = new Date();
    const expiry = expiryDate.toDate();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiry <= sevenDaysFromNow && expiry > now;
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
          <Package className="h-5 w-5" />
          <span>Entries List</span>
          <Badge variant="secondary">{filteredEntries.length}</Badge>
        </CardTitle>
        <CardDescription>
          View and manage all ash pot entries
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
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

        {/* Entries Table - Desktop View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">No entries found</p>
                      <p className="text-sm text-gray-400">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No entries found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
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
                        <Badge variant="destructive" className="text-xs">Soon</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <div className="font-medium">₹{entry.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0}</div>
                    <div className="text-gray-500">{entry.renewals?.length || 0} renewals</div>
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
              {entries.filter(e => e.status === 'active').length}
            </div>
            <div className="text-sm text-green-700">Active</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {entries.filter(e => e.status === 'expired').length}
            </div>
            <div className="text-sm text-red-700">Expired</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {entries.filter(e => e.status === 'delivered').length}
            </div>
            <div className="text-sm text-blue-700">Delivered</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {entries.filter(e => isExpiringSoon(e.expiryDate)).length}
            </div>
            <div className="text-sm text-yellow-700">Expiring Soon</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}