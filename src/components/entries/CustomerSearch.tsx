'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, User, Phone, MapPin, Calendar, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCustomerByMobile } from '@/lib/firestore';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  city: string;
  additionalDetails?: string;
  createdAt: any;
}

interface CustomerSearchProps {
  onCustomerFound: (customer: Customer | null) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

export default function CustomerSearch({ onCustomerFound, onCreateNew, loading = false }: CustomerSearchProps) {
  const [mobile, setMobile] = useState('');
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) {
      setError('Please enter a mobile number');
      return;
    }

    setSearching(true);
    setError('');
    setCustomer(null);

    try {
      const foundCustomer = await getCustomerByMobile(mobile.trim());
      setCustomer(foundCustomer);
      onCustomerFound(foundCustomer);
    } catch (error: any) {
      setError(error.message || 'Failed to search customer');
    } finally {
      setSearching(false);
    }
  };

  const handleCreateNew = () => {
    setIsDialogOpen(false);
    onCreateNew();
  };

  const handleClear = () => {
    setMobile('');
    setCustomer(null);
    setError('');
    onCustomerFound(null);
  };

  useEffect(() => {
    if (customer) {
      setIsDialogOpen(true);
    }
  }, [customer]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Search Customer</span>
        </CardTitle>
        <CardDescription>
          Search by mobile number before creating new entry
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              disabled={searching || loading}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={searching || loading || !mobile.trim()}
              className="flex-1"
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
            
            {mobile && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClear}
                disabled={searching || loading}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Customer Found Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Customer Found</DialogTitle>
              <DialogDescription>
                Customer with this mobile number already exists in the system
              </DialogDescription>
            </DialogHeader>
            
            {customer && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{customer.name}</h4>
                      <p className="text-sm text-gray-600">Existing Customer</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{customer.mobile}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{customer.city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        Customer since: {customer.createdAt?.toDate()?.toLocaleDateString()}
                      </span>
                    </div>
                    {customer.additionalDetails && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        {customer.additionalDetails}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Entry
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