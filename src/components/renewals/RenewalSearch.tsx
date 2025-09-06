'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, User, Phone, MapPin, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries } from '@/lib/firestore';

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

interface RenewalSearchProps {
  onEntrySelected: (entry: Entry) => void;
  loading?: boolean;
}

export default function RenewalSearch({ onEntrySelected, loading = false }: RenewalSearchProps) {
  const [searchType, setSearchType] = useState<'mobile' | 'entryId'>('mobile');
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEntries([]);
    setSelectedEntry(null);

    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    setSearching(true);

    try {
      let filteredEntries: Entry[] = [];

      if (searchType === 'mobile') {
        // Search by mobile number - get all entries and filter client-side
        const allEntries = await getEntries();
        filteredEntries = allEntries.filter(entry => 
          entry.customerMobile.includes(searchValue.trim())
        );
      } else {
        // Search by entry ID - get all entries and filter client-side
        const allEntries = await getEntries();
        filteredEntries = allEntries.filter(entry => 
          entry.id.toLowerCase().includes(searchValue.trim().toLowerCase())
        );
      }

      // Apply additional filters
      if (locationFilter !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.locationId === locationFilter);
      }

      if (statusFilter !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.status === statusFilter);
      }

      setEntries(filteredEntries);

      if (filteredEntries.length === 0) {
        setError('No entries found matching your search criteria');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to search entries');
    } finally {
      setSearching(false);
    }
  };

  const handleEntrySelect = (entry: Entry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };

  const handleProceed = () => {
    if (selectedEntry) {
      onEntrySelected(selectedEntry);
      setIsDialogOpen(false);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEntry(null);
  };

  const getDaysUntilExpiry = (expiryDate: any) => {
    const now = new Date();
    const expiry = new Date(expiryDate?.toDate?.() || expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (entry: Entry) => {
    const daysUntil = getDaysUntilExpiry(entry.expiryDate);
    
    if (entry.status === 'delivered' || entry.status === 'disposed') {
      return { status: entry.status, color: 'gray', label: entry.status };
    }
    
    if (daysUntil < 0) {
      return { status: 'expired', color: 'red', label: 'Expired' };
    } else if (daysUntil <= 3) {
      return { status: 'urgent', color: 'red', label: 'Expires Soon' };
    } else if (daysUntil <= 7) {
      return { status: 'warning', color: 'yellow', label: 'Expiring Soon' };
    } else {
      return { status: 'active', color: 'green', label: 'Active' };
    }
  };

  // Mock locations for filter
  const locations = [
    { id: 'loc1', name: 'Branch 1' },
    { id: 'loc2', name: 'Branch 2' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Search for Renewal</span>
        </CardTitle>
        <CardDescription>
          Search entries by mobile number or entry ID for renewal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={(value) => setSearchType(value as 'mobile' | 'entryId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Mobile Number</SelectItem>
                  <SelectItem value="entryId">Entry ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchValue">Search Value</Label>
              <Input
                id="searchValue"
                type={searchType === 'mobile' ? 'tel' : 'text'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'mobile' ? '+91XXXXXXXXXX' : 'Enter entry ID'}
                disabled={searching || loading}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                type="submit" 
                disabled={searching || loading || !searchValue.trim()}
                className="w-full"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationFilter">Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Search Results ({entries.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.map((entry, index) => {
                const expiryStatus = getExpiryStatus(entry);
                const daysUntil = getDaysUntilExpiry(entry.expiryDate);
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleEntrySelect(entry)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{entry.customerName}</h4>
                            <Badge variant={expiryStatus.color === 'red' ? 'destructive' : 'secondary'}>
                              {expiryStatus.label}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{entry.customerMobile}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{entry.customerCity}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Entry: {entry.entryDate?.toDate?.()?.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Expiry: {entry.expiryDate?.toDate?.()?.toLocaleDateString()}
                                {daysUntil >= 0 && ` (${daysUntil} days)`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{entry.numberOfPots} pot(s)</div>
                        <div className="text-xs text-gray-500">ID: {entry.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Entry Selection Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Entry Selected for Renewal</DialogTitle>
              <DialogDescription>
                Review the entry details and proceed with renewal
              </DialogDescription>
            </DialogHeader>
            
            {selectedEntry && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{selectedEntry.customerName}</h4>
                      <p className="text-sm text-gray-600">Entry ID: {selectedEntry.id.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedEntry.customerMobile}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{selectedEntry.customerCity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{selectedEntry.numberOfPots} pot(s)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>
                        {selectedEntry.expiryDate?.toDate?.()?.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {getExpiryStatus(selectedEntry).status === 'expired' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      This entry has expired. Renewal will extend the storage period.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleProceed}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Proceed to Renewal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}