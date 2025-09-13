'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, Plus, Users, Phone, MapPin, Calendar, Package, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCustomerByMobile, addCustomer, addEntry, getLocations } from '@/lib/firestore';
import { sendSMS, SMSTemplates } from '@/lib/sms';
import { useSMSDialog, SMSDialog } from '@/lib/sms-dialog';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  city: string;
  additionalDetails?: string;
  createdAt: any;
}

interface Location {
  id: string;
  venueName: string;
  address: string;
  isActive: boolean;
}

export default function CustomerEntrySystem() {
  const { user } = useAuth();
  const { showSMSDialog } = useSMSDialog();
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResult, setSearchResult] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    city: '',
    numberOfPots: 1,
    additionalDetails: '',
    paymentMethod: 'cash' as 'cash' | 'upi'
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const locationData = await getLocations();
      const activeLocations = locationData.filter(loc => loc.isActive);
      setLocations(activeLocations);
      if (activeLocations.length > 0) {
        setSelectedLocation(activeLocations[0].id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchMobile.trim()) {
      setError('Please enter a mobile number');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResult(null);

    try {
      const customer = await getCustomerByMobile(searchMobile);
      setSearchResult(customer);
    } catch (error: any) {
      setError(error.message || 'Failed to search customer');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewEntry = () => {
    setFormData({
      customerName: '',
      customerMobile: searchMobile,
      city: '',
      numberOfPots: 1,
      additionalDetails: '',
      paymentMethod: 'cash'
    });
    setIsEntryDialogOpen(true);
  };

  const handleExistingEntry = () => {
    if (searchResult) {
      setFormData({
        customerName: '',  // Don't prefill name - it can be different for different entries
        customerMobile: searchResult.mobile,
        city: searchResult.city,
        numberOfPots: 1,
        additionalDetails: searchResult.additionalDetails || '',
        paymentMethod: 'cash'
      });
      setIsEntryDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!user || !selectedLocation) {
      setError('User or location not selected');
      setLoading(false);
      return;
    }

    try {
      let customerId: string;
      
      // Check if customer exists, if not create new customer
      const existingCustomer = await getCustomerByMobile(formData.customerMobile);
      
      if (!existingCustomer) {
        // Create new customer
        customerId = await addCustomer({
          name: formData.customerName,
          mobile: formData.customerMobile,
          city: formData.city,
          additionalDetails: formData.additionalDetails,
          createdBy: user.uid,
          locationId: selectedLocation
        });
      } else {
        customerId = existingCustomer.id;
      }

      // Create entry
      const entryId = await addEntry({
        customerId,
        customerName: formData.customerName,
        customerMobile: formData.customerMobile,
        numberOfPots: formData.numberOfPots,
        locationId: selectedLocation,
        operatorId: user.uid,
        paymentMethod: formData.paymentMethod
      });

      // Send SMS notifications (using dialogs for now)
      const selectedLocationData = locations.find(loc => loc.id === selectedLocation);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // TODO: Replace with actual Fast2SMS integration when credentials are available
      // SMS to admin - currently showing dialog instead of sending
      showSMSDialog(
        '+919876543210', // Admin mobile - should be configurable
        SMSTemplates.entryConfirmation(
          user.name || 'Operator',
          selectedLocationData?.venueName || 'Unknown Location',
          formData.customerName,
          formData.numberOfPots,
          entryId
        ),
        'entryConfirmation',
        {
          operatorName: user.name || 'Operator',
          location: selectedLocationData?.venueName || 'Unknown Location',
          customerName: formData.customerName,
          pots: formData.numberOfPots,
          entryId: entryId
        },
        entryId
      );

      // TODO: Replace with actual Fast2SMS integration when credentials are available
      // SMS to customer - currently showing dialog instead of sending
      showSMSDialog(
        formData.customerMobile,
        SMSTemplates.customerEntryConfirmation(
          entryId,
          expiryDate.toLocaleDateString()
        ),
        'customerEntryConfirmation',
        {
          entryId: entryId,
          expiryDate: expiryDate.toLocaleDateString()
        },
        entryId
      );

      setSuccess('Entry created successfully!');
      setIsEntryDialogOpen(false);
      setSearchMobile('');
      setSearchResult(null);
      
      // Reset form
      setFormData({
        customerName: '',
        customerMobile: '',
        city: '',
        numberOfPots: 1,
        additionalDetails: '',
        paymentMethod: 'cash'
      });

    } catch (error: any) {
      setError(error.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Customer Entry System</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
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
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={searchMobile}
                onChange={(e) => setSearchMobile(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {searchResult ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Users className="h-5 w-5" />
                  <span>Customer Found</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="font-medium">{searchResult.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Mobile</Label>
                    <p className="font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {searchResult.mobile}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">City</Label>
                    <p className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {searchResult.city}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Customer Since</Label>
                    <p className="font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {searchResult.createdAt?.toDate ? searchResult.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
                {searchResult.additionalDetails && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-600">Additional Details</Label>
                    <p className="text-sm text-gray-700">{searchResult.additionalDetails}</p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button onClick={handleExistingEntry}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <AlertCircle className="h-5 w-5" />
                  <span>Customer Not Found</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 mb-4">
                  No customer found with this mobile number. Would you like to create a new entry?
                </p>
                <Button onClick={handleNewEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Entry
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Entry Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {searchResult ? 'Create New Entry' : 'Create Customer & Entry'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details to create a new entry
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerMobile">Mobile Number *</Label>
              <Input
                id="customerMobile"
                type="tel"
                value={formData.customerMobile}
                onChange={(e) => setFormData(prev => ({ ...prev, customerMobile: e.target.value }))}
                required
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                required
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPots">Number of Ash Pots *</Label>
              <Input
                id="numberOfPots"
                type="number"
                min="1"
                value={formData.numberOfPots}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfPots: parseInt(e.target.value) || 1 }))}
                required
                placeholder="Enter number of pots"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalDetails">Additional Details</Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalDetails: e.target.value }))}
                placeholder="Any additional notes or details"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.venueName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as 'cash' | 'upi' }))}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash (₹500)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi">UPI (₹500)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Entry Summary</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Customer:</strong> {formData.customerName}</p>
                <p><strong>Mobile:</strong> {formData.customerMobile}</p>
                <p><strong>Pots:</strong> {formData.numberOfPots}</p>
                <p><strong>Amount:</strong> ₹500</p>
                <p><strong>Storage Period:</strong> 30 days</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEntryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Entry...' : 'Create Entry'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SMS Dialog for notifications */}
      <SMSDialog />
    </div>
  );
}