'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, Package, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { addCustomer, addEntry, getLocations } from '@/lib/firestore';
import { sendSMS, SMSTemplates } from '@/lib/sms';
import { useSMSDialog, SMSDialog } from '@/lib/sms-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/date-utils';

interface Customer {
  id?: string;
  name: string;
  mobile: string;
  city: string;
  additionalDetails?: string;
}

interface CustomerEntryFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CustomerEntryForm({ customer, onSuccess, onCancel, loading = false }: CustomerEntryFormProps) {
  const { user } = useAuth();
  const { showSMSDialog } = useSMSDialog();
  const [formData, setFormData] = useState({
    name: '',  // Don't prefill name - it can be different for different entries
    mobile: customer?.mobile || '',
    city: customer?.city || '',
    additionalDetails: customer?.additionalDetails || '',
    numberOfPots: 1,
    paymentMethod: 'cash' as 'cash' | 'upi',
    locationId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const locationsData = await getLocations();
      setLocations(locationsData.filter(loc => loc.isActive));
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]); // Set empty array instead of fallback data
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!formData.locationId) {
      setError('Please select a location');
      return;
    }

    try {
      let customerId = customer?.id;
      
      // Create new customer if not exists
      if (!customerId) {
        customerId = await addCustomer({
          name: formData.name,
          mobile: formData.mobile,
          city: formData.city,
          additionalDetails: formData.additionalDetails,
          createdBy: user.uid,
          locationId: formData.locationId
        });
      }

      // Create entry
      const entryId = await addEntry({
        customerId: customerId!,
        customerName: formData.name,
        customerMobile: formData.mobile,
        numberOfPots: formData.numberOfPots,
        locationId: formData.locationId,
        operatorId: user.uid,
        paymentMethod: formData.paymentMethod
      });

      // Send SMS notifications (using dialogs for now)
      const location = locations.find(loc => loc.id === formData.locationId);
      
      // TODO: Replace with actual Fast2SMS integration when credentials are available
      // SMS to Admin - currently showing dialog instead of sending
      showSMSDialog(
        process.env.NEXT_PUBLIC_ADMIN_MOBILE || '+919014882779',
        SMSTemplates.entryConfirmation(
          user.name || 'Operator',
          location?.venueName || 'Unknown Location',
          formData.name,
          formData.numberOfPots,
          entryId
        ),
        'entryConfirmation',
        {
          operatorName: user.name || 'Operator',
          location: location?.venueName || 'Unknown Location',
          customerName: formData.name,
          pots: formData.numberOfPots,
          entryId: entryId
        },
        entryId
      );

      // SMS to Customer
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // TODO: Replace with actual Fast2SMS integration when credentials are available
      // SMS to customer - currently showing dialog instead of sending
      showSMSDialog(
        formData.mobile,
        SMSTemplates.customerEntryConfirmation(
          entryId,
          formatDate(expiryDate)
        ),
        'customerEntryConfirmation',
        {
          entryId: entryId,
          expiryDate: formatDate(expiryDate)
        },
        entryId
      );

      onSuccess({
        id: entryId,
        customerName: formData.name,
        customerMobile: formData.mobile,
        customerCity: formData.city,
        numberOfPots: formData.numberOfPots,
        entryDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        locationName: location?.venueName || 'Unknown Location',
        paymentMethod: formData.paymentMethod,
        amount: 500
      });
    } catch (error: any) {
      setError(error.message || 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isExistingCustomer = !!customer?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>
            {isExistingCustomer ? 'Create New Entry' : 'New Customer Entry'}
          </span>
        </CardTitle>
        <CardDescription>
          {isExistingCustomer 
            ? 'Create a new ash pot entry for existing customer'
            : 'Register new customer and create first entry'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  required
                  disabled={isExistingCustomer || submitting}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                required
                disabled={isExistingCustomer || submitting}
                placeholder="Enter city name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalDetails">Additional Details</Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails}
                onChange={(e) => handleChange('additionalDetails', e.target.value)}
                disabled={isExistingCustomer || submitting}
                placeholder="Any additional notes or details"
                rows={3}
              />
            </div>
          </div>

          {/* Entry Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Entry Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfPots">Number of Ash Pots *</Label>
                <Input
                  id="numberOfPots"
                  type="number"
                  min="1"
                  value={formData.numberOfPots}
                  onChange={(e) => handleChange('numberOfPots', parseInt(e.target.value))}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => handleChange('paymentMethod', value)}
                  disabled={submitting}
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

            <div className="space-y-2">
              <Label htmlFor="locationId">Location *</Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleChange('locationId', value)}
                disabled={submitting}
              >
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

            {/* Payment Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Payment Summary</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  ₹500
                </Badge>
              </div>
              <div className="mt-2 text-sm text-blue-800">
                <p>Entry Fee: ₹500 (flat rate)</p>
                <p>Number of Pots: {formData.numberOfPots}</p>
                <p>Storage Period: 30 days</p>
                <p>Total Amount: ₹500</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !formData.locationId}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Entry...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Create Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    );
}