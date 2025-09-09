'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Search, Calendar, User, Phone, MapPin, Package } from 'lucide-react';
import { getEntries, getLocations } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  city: string;
}

interface Entry {
  id: string;
  customerId: string;
  customer: Customer;
  entryDate: string;
  expiryDate: string;
  pots: number;
  status: 'active' | 'expired' | 'delivered';
  locationId: string;
  locationName: string;
  renewalCount: number;
  lastRenewalDate?: string;
}

interface DeliverySearchProps {
  onEntrySelect: (entry: Entry) => void;
  loading?: boolean;
}

export default function DeliverySearch({ onEntrySelect, loading = false }: DeliverySearchProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'mobile' | 'entryId' | 'name'>('mobile');
  const [searchResults, setSearchResults] = useState<Entry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await getLocations();
        const activeLocations = locationsData.filter(loc => loc.isActive);
        setLocations(activeLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Fetch entries from Firestore based on filters
      const locationId = selectedLocation === 'all' ? undefined : selectedLocation;
      const entries = await getEntries({
        locationId: locationId,
        status: 'active' // Only show active entries for delivery
      });

      // Filter entries based on search type
      let filtered = entries.filter(entry => {
        if (searchType === 'mobile') {
          return entry.customerMobile?.includes(searchTerm);
        } else if (searchType === 'entryId') {
          return entry.id?.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (searchType === 'name') {
          return entry.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });

      // Transform entries to match the expected interface
      const transformedResults: Entry[] = filtered.map(entry => ({
        id: entry.id,
        customerId: entry.customerId || '',
        customer: {
          id: entry.customerId || '',
          name: entry.customerName || '',
          mobile: entry.customerMobile || '',
          city: entry.customerCity || ''
        },
        entryDate: entry.entryDate?.toDate?.().toISOString().split('T')[0] || '',
        expiryDate: entry.expiryDate?.toDate?.().toISOString().split('T')[0] || '',
        pots: entry.numberOfPots || 0,
        status: entry.status || 'active',
        locationId: entry.locationId || '',
        locationName: locations.find(loc => loc.id === entry.locationId)?.venueName || '',
        renewalCount: entry.renewals?.length || 0,
        lastRenewalDate: entry.renewals?.length > 0 
          ? entry.renewals[entry.renewals.length - 1].date?.toDate?.().toISOString().split('T')[0]
          : undefined
      }));

      setSearchResults(transformedResults);
    } catch (error) {
      console.error('Error searching entries:', error);
      setError('Failed to search entries. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'Expired' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-soon', color: 'bg-orange-100 text-orange-800', text: 'Expiring Soon' };
    } else {
      return { status: 'active', color: 'bg-green-100 text-green-800', text: 'Active' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search for Delivery</span>
          </CardTitle>
          <CardDescription>
            Search for active entries that are ready for delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select Location" />
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
            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile Number</SelectItem>
                <SelectItem value="entryId">Entry ID</SelectItem>
                <SelectItem value="name">Customer Name</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={
                searchType === 'mobile' ? 'Enter mobile number' :
                searchType === 'entryId' ? 'Enter entry ID' :
                'Enter customer name'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || loading}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} active entries ready for delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((entry) => {
                const expiryStatus = getExpiryStatus(entry.expiryDate);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{entry.customer.name}</h3>
                        <p className="text-sm text-gray-600">Entry ID: {entry.id.slice(-6)}</p>
                      </div>
                      <Badge className={expiryStatus.color}>
                        {expiryStatus.text}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{entry.customer.mobile}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{entry.customer.city}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span>{entry.pots} pot(s)</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Entry: {formatDate(entry.entryDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Expiry: {formatDate(entry.expiryDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{entry.locationName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Renewals: {entry.renewalCount}
                        {entry.lastRenewalDate && (
                          <span className="ml-2">Last: {formatDate(entry.lastRenewalDate)}</span>
                        )}
                      </div>
                      <Button 
                        onClick={() => onEntrySelect(entry)}
                        disabled={loading}
                      >
                        Process Delivery
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {searchResults.length === 0 && searchTerm && !isSearching && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No active entries found for delivery</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}