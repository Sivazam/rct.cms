'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Calculator, DollarSign, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateEntry } from '@/lib/firestore';
import SMSService from '@/lib/sms-service';
const smsService = new SMSService();
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/date-utils';
import { useAdminMobile } from '@/stores/adminConfigStore';

interface Entry {
  id: string;
  customerName: string;
  customerMobile: string;
  numberOfPots: number;
  expiryDate: any;
  locationId: string;
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

interface RenewalFormProps {
  entry: Entry;
  onSuccess: (renewalData: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function RenewalForm({ entry, onSuccess, onCancel, loading = false }: RenewalFormProps) {
  const { user } = useAuth();
  const adminMobile = useAdminMobile();
  const [formData, setFormData] = useState({
    renewalMonths: 1,
    paymentMethod: 'cash' as 'cash' | 'upi'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [renewalSummary, setRenewalSummary] = useState({
    amount: 0,
    newExpiryDate: new Date(),
    totalMonths: 0
  });

  const RENEWAL_RATE_PER_MONTH = 300;

  useEffect(() => {
    calculateRenewalSummary();
  }, [formData.renewalMonths, entry]);

  const calculateRenewalSummary = () => {
    const amount = formData.renewalMonths * RENEWAL_RATE_PER_MONTH;
    const currentExpiry = new Date(entry.expiryDate?.toDate?.() || entry.expiryDate);
    const newExpiryDate = new Date(currentExpiry.getTime() + (formData.renewalMonths * 30 * 24 * 60 * 60 * 1000));
    
    // Calculate total months from original entry
    const totalMonths = entry.payments.reduce((sum, payment) => sum + payment.months, 0) + formData.renewalMonths;

    setRenewalSummary({
      amount,
      newExpiryDate,
      totalMonths
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      // Prepare renewal data
      const renewalData = {
        date: new Date(),
        months: formData.renewalMonths,
        amount: renewalSummary.amount,
        method: formData.paymentMethod,
        operatorId: user.uid,
        newExpiryDate: renewalSummary.newExpiryDate
      };

      // Update entry with renewal
      const updatedRenewals = [...entry.renewals, renewalData];
      
      await updateEntry(entry.id, {
        expiryDate: renewalSummary.newExpiryDate,
        renewals: updatedRenewals,
        status: 'active' // Reactivate if expired
      });

        // Send SMS notification to both admin and customer using the new SMS service
      try {
        // TODO: Fetch actual location name from locations collection using entry.locationId
        // For now, using placeholder - you should implement proper location name fetching
        const locationName = 'Unknown Location'; // Replace with actual location name fetching
        
        console.log('🔍 [DEBUG] Starting SMS send process...');
        console.log('🔍 [DEBUG] SMS Service Status:', smsService.getServiceStatus());
        
        // Send renewal confirmation to customer
        console.log('🔍 [DEBUG] Sending customer SMS...');
        const customerResult = await smsService.sendRenewalConfirmationCustomer(
          entry.customerMobile,
          entry.customerName,
          locationName, // Use actual location name (currently placeholder)
          formatDate(renewalSummary.newExpiryDate),
          entry.id
        );
        
        console.log('🔍 [DEBUG] Customer SMS Result:', customerResult);

        // Debug: Log the admin mobile value
        console.log('🔍 [DEBUG] Admin mobile from global state:', adminMobile);
        console.log('🔍 [DEBUG] Admin mobile type:', typeof adminMobile);
        console.log('🔍 [DEBUG] Admin mobile length:', adminMobile?.length);

        // Ensure adminMobile is valid before sending SMS
        if (!adminMobile || typeof adminMobile !== 'string') {
          console.error('❌ [DEBUG] Admin mobile is invalid:', adminMobile);
          // Use a fallback admin mobile number
          const fallbackAdminMobile = '+919014882779';
          console.log('🔧 [DEBUG] Using fallback admin mobile:', fallbackAdminMobile);
          
          // Send renewal confirmation to admin
          console.log('🔍 [DEBUG] Sending admin SMS with fallback...');
          const adminResult = await smsService.sendRenewalConfirmationAdmin(
            fallbackAdminMobile, // Use fallback admin mobile
            locationName, // Use actual location name (currently placeholder)
            entry.customerName,
            entry.id
          );
          
          console.log('🔍 [DEBUG] Admin SMS Result (with fallback):', adminResult);
        } else {
          // Send renewal confirmation to admin
          console.log('🔍 [DEBUG] Sending admin SMS...');
          const adminResult = await smsService.sendRenewalConfirmationAdmin(
            adminMobile, // Admin mobile from global config
            locationName, // Use actual location name (currently placeholder)
            entry.customerName,
            entry.id
          );
          
          console.log('🔍 [DEBUG] Admin SMS Result:', adminResult);
        }

        if (customerResult.success && adminResult.success) {
          console.log('✅ SMS notifications sent successfully for renewal');
        } else {
          console.error('❌ SMS notifications failed:', {
            customerError: customerResult.error,
            adminError: adminResult.error
          });
        }
      } catch (smsError) {
        console.error('❌ Failed to send SMS notifications:', smsError);
        // Don't fail the renewal process if SMS fails, just log the error
      }

      onSuccess({
        ...renewalData,
        entryId: entry.id,
        customerName: entry.customerName,
        customerMobile: entry.customerMobile
      });
    } catch (error: any) {
      setError(error.message || 'Failed to process renewal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCurrentExpiryStatus = () => {
    const now = new Date();
    const currentExpiry = new Date(entry.expiryDate?.toDate?.() || entry.expiryDate);
    const daysUntil = Math.ceil((currentExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { status: 'expired', days: Math.abs(daysUntil), color: 'red' };
    } else if (daysUntil <= 3) {
      return { status: 'urgent', days: daysUntil, color: 'red' };
    } else if (daysUntil <= 7) {
      return { status: 'warning', days: daysUntil, color: 'yellow' };
    } else {
      return { status: 'active', days: daysUntil, color: 'green' };
    }
  };

  const expiryStatus = getCurrentExpiryStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Renewal Details</span>
        </CardTitle>
        <CardDescription>
          Configure renewal period and payment method for {entry.customerName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Entry Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Current Entry Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-medium">{entry.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mobile:</span>
                <span className="text-sm font-medium">{entry.customerMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lockers:</span>
                <span className="text-sm font-medium">{entry.numberOfPots}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Expiry:</span>
                <span className="text-sm font-medium">
                  {formatDate(new Date(entry.expiryDate?.toDate?.() || entry.expiryDate))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant={expiryStatus.color === 'red' ? 'destructive' : 'secondary'}>
                  {expiryStatus.status === 'expired' ? `Expired ${expiryStatus.days} days ago` : 
                   expiryStatus.status === 'urgent' ? `Expires in ${expiryStatus.days} days` :
                   expiryStatus.status === 'warning' ? `Expires in ${expiryStatus.days} days` : 'Active'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Months:</span>
                <span className="text-sm font-medium">
                  {entry.payments.reduce((sum, payment) => sum + payment.months, 0)} months
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="renewalMonths">Renewal Period *</Label>
              <Select 
                value={formData.renewalMonths.toString()} 
                onValueChange={(value) => handleChange('renewalMonths', parseInt(value))}
                disabled={submitting}
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
              <p className="text-xs text-gray-500">₹{RENEWAL_RATE_PER_MONTH} per month per locker</p>
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
                  {formData.renewalMonths} month(s)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-800">Rate per Month:</span>
                <span className="text-sm font-medium text-blue-800">
                  {formatCurrency(RENEWAL_RATE_PER_MONTH)} per locker
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-800">Number of Lockers:</span>
                <span className="text-sm font-medium text-blue-800">
                  {entry.numberOfPots}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-800">Total Amount:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {formatCurrency(renewalSummary.amount)}
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
                {formatDate(renewalSummary.newExpiryDate)}
              </p>
              <p className="text-xs text-green-600">
                Total storage period: {renewalSummary.totalMonths} months from original entry
              </p>
            </div>
          </div>

          {/* Important Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Once renewed, the entry will be extended by the selected period. 
              SMS notifications will be sent to both the customer and admin. 
              The renewal will be recorded in the entry history.
            </AlertDescription>
          </Alert>

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
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    );
}