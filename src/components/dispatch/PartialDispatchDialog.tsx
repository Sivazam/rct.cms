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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Truck, DollarSign, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SMSService from '@/lib/sms-service';
import SMSTemplatesService from '@/lib/sms-templates';

interface LockerDetail {
  lockerNumber: number;
  totalPots: number;
  remainingPots: number;
  dispatchedPots: string[];
}

interface Entry {
  id: string;
  customerName: string;
  customerMobile: string;
  numberOfLockers: number;
  potsPerLocker: number;
  totalPots: number;
  lockerDetails: LockerDetail[];
}

interface PartialDispatchDialogProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
  loading?: boolean;
}

export default function PartialDispatchDialog({ 
  entry, 
  isOpen, 
  onClose, 
  onSuccess, 
  loading = false 
}: PartialDispatchDialogProps) {
  const { user } = useAuth();
  const smsService = new SMSService();
  const templatesService = SMSTemplatesService; // Use default export directly
  const [formData, setFormData] = useState({
    lockerNumber: '',
    potsToDispatch: '',
    dispatchReason: '',
    paymentMethod: '' as 'cash' | 'upi' | '',
    paymentAmount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      setFormData({
        lockerNumber: '',
        potsToDispatch: '',
        dispatchReason: '',
        paymentMethod: '',
        paymentAmount: ''
      });
      setError('');
    }
  }, [entry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!entry) {
      setError('No entry selected');
      return;
    }

    try {
      const response = await fetch('/api/dispatches/partial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: entry.id,
          lockerNumber: parseInt(formData.lockerNumber),
          potsToDispatch: parseInt(formData.potsToDispatch),
          dispatchReason: formData.dispatchReason || 'Partial collection',
          paymentMethod: formData.paymentMethod || undefined,
          paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : undefined,
          operatorId: user.uid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process partial dispatch');
      }

      onSuccess(data);
      
      // Send SMS notifications
      try {
        // Send confirmation to customer
        const customerSMSResult = await smsService.sendPartialDispatchConfirmationCustomer(
          entry.customerName,
          entry.customerMobile,
          entry.locationName || 'Unknown Location',
          parseInt(formData.lockerNumber),
          parseInt(formData.potsToDispatch),
          entry.totalPots - parseInt(formData.potsToDispatch), // remaining pots
          entry.id,
          entry.customerId,
          entry.locationId,
          user.uid
        );
        
        console.log('📱 Customer SMS Result:', customerSMSResult);
        
        // Send notification to admin
        const adminSMSResult = await smsService.sendPartialDispatchNotificationAdmin(
          '+919014882779', // Admin mobile
          entry.customerName,
          entry.locationName || 'Unknown Location',
          parseInt(formData.lockerNumber),
          parseInt(formData.potsToDispatch),
          entry.totalPots - parseInt(formData.potsToDispatch), // remaining pots
          entry.id,
          entry.customerId,
          entry.locationId,
          user.uid
        );
        
        console.log('📞 Admin SMS Result:', adminSMSResult);
      } catch (smsError) {
        console.error('Failed to send SMS notifications:', smsError);
      }
      
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to process partial dispatch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAvailableLockers = () => {
    if (!entry) {
      console.log('🔍 [DEBUG] No entry provided');
      return [];
    }
    
    console.log('🔍 [DEBUG] Entry data:', {
      id: entry.id,
      customerName: entry.customerName,
      totalPots: entry.totalPots,
      numberOfPots: entry.numberOfPots,
      numberOfLockers: entry.numberOfLockers,
      potsPerLocker: entry.potsPerLocker,
      lockerDetails: entry.lockerDetails
    });
    
    // Check if entry has lockerDetails (new structure) or fallback to old structure
    if (entry.lockerDetails && entry.lockerDetails.length > 0) {
      console.log('🔍 [DEBUG] Using new lockerDetails structure');
      return entry.lockerDetails;
    } else {
      // Fallback for old entries - create virtual lockers
      console.log('🔍 [DEBUG] Using fallback structure for old entries');
      const totalPots = entry.totalPots || entry.numberOfPots || 1;
      const numberOfLockers = entry.numberOfLockers || 1;
      const potsPerLocker = entry.potsPerLocker || Math.ceil(totalPots / numberOfLockers);
      
      const virtualLockers = Array.from({ length: numberOfLockers }, (_, index) => ({
        lockerNumber: index + 1,
        totalPots: potsPerLocker,
        remainingPots: totalPots, // For old entries, assume all pots are available
        dispatchedPots: []
      }));
      
      console.log('🔍 [DEBUG] Created virtual lockers:', virtualLockers);
      return virtualLockers;
    }
  };

  const getSelectedLockerDetails = () => {
    if (!entry || !formData.lockerNumber) {
      console.log('🔍 [DEBUG] No entry or locker number selected');
      return null;
    }
    
    console.log('🔍 [DEBUG] Looking for locker number:', formData.lockerNumber);
    
    // Check if entry has lockerDetails (new structure) or fallback to old structure
    if (entry.lockerDetails && entry.lockerDetails.length > 0) {
      console.log('🔍 [DEBUG] Using new lockerDetails structure');
      const found = entry.lockerDetails.find(locker => locker.lockerNumber === parseInt(formData.lockerNumber));
      console.log('🔍 [DEBUG] Found locker:', found);
      return found;
    } else {
      // Fallback for old entries - create virtual locker from old data
      console.log('🔍 [DEBUG] Using fallback structure for old entries');
      const totalPots = entry.totalPots || entry.numberOfPots || 1;
      const numberOfLockers = entry.numberOfLockers || 1;
      const potsPerLocker = entry.potsPerLocker || Math.ceil(totalPots / numberOfLockers);
      
      const virtualLocker = {
        lockerNumber: parseInt(formData.lockerNumber),
        totalPots: potsPerLocker,
        remainingPots: totalPots, // For old entries, assume all pots are available
        dispatchedPots: []
      };
      
      console.log('🔍 [DEBUG] Created virtual locker:', virtualLocker);
      return virtualLocker;
    }
  };

  const selectedLocker = getSelectedLockerDetails();

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Partial Dispatch - {entry.customerName}</span>
          </DialogTitle>
          <DialogDescription>
            Process partial dispatch of pots from locker for {entry.customerMobile}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Entry Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entry Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {entry.customerName}
                </div>
                <div>
                  <span className="font-medium">Mobile:</span> {entry.customerMobile}
                </div>
                <div>
                  <span className="font-medium">Total Lockers:</span> {entry.numberOfLockers || 1}
                </div>
                <div>
                  <span className="font-medium">Pots per Locker:</span> {entry.potsPerLocker || Math.ceil(((entry.totalPots || entry.numberOfPots || 1) / (entry.numberOfLockers || 1)))}
                </div>
                <div>
                  <span className="font-medium">Total Pots:</span> {entry.totalPots || entry.numberOfPots}
                </div>
                <div>
                  <span className="font-medium">Remaining Pots:</span> 
                  {entry.lockerDetails 
                    ? entry.lockerDetails.reduce((sum, locker) => sum + locker.remainingPots, 0)
                    : (entry.totalPots || entry.numberOfPots)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locker Selection */}
          <div className="space-y-4">
            <Label htmlFor="lockerNumber">Select Locker *</Label>
            <Select 
              value={formData.lockerNumber} 
              onValueChange={(value) => handleChange('lockerNumber', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select locker to dispatch from" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableLockers().length > 0 ? (
                  getAvailableLockers().map((locker) => (
                    <SelectItem key={locker.lockerNumber} value={locker.lockerNumber.toString()}>
                      Locker {locker.lockerNumber} - {locker.remainingPots} pots remaining
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No lockers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedLocker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted p-4 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Locker {selectedLocker.lockerNumber} Details</p>
                    <p className="text-sm text-muted-foreground">
                      Total Pots: {selectedLocker.totalPots} | 
                      Remaining: {selectedLocker.remainingPots} | 
                      Dispatched: {selectedLocker.dispatchedPots.length}
                    </p>
                  </div>
                  <Badge variant={selectedLocker.remainingPots > 0 ? "default" : "secondary"}>
                    {selectedLocker.remainingPots > 0 ? 'Active' : 'Empty'}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>

          {/* Pots to Dispatch */}
          <div className="space-y-2">
            <Label htmlFor="potsToDispatch">Number of Pots to Dispatch *</Label>
            <Input
              id="potsToDispatch"
              type="number"
              min="1"
              max={selectedLocker?.remainingPots || 1}
              value={formData.potsToDispatch}
              onChange={(e) => handleChange('potsToDispatch', e.target.value)}
              required
              placeholder="Enter number of pots to dispatch"
              disabled={!selectedLocker || selectedLocker.remainingPots === 0}
            />
            {selectedLocker && (
              <p className="text-sm text-muted-foreground">
                Maximum {selectedLocker.remainingPots} pots can be dispatched from this locker
              </p>
            )}
          </div>

          {/* Dispatch Reason */}
          <div className="space-y-2">
            <Label htmlFor="dispatchReason">Dispatch Reason</Label>
            <Textarea
              id="dispatchReason"
              value={formData.dispatchReason}
              onChange={(e) => handleChange('dispatchReason', e.target.value)}
              placeholder="Reason for partial dispatch (optional)"
              rows={3}
            />
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <Label>Payment Information (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => handleChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Payment</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentAmount}
                  onChange={(e) => handleChange('paymentAmount', e.target.value)}
                  placeholder="Enter amount"
                  disabled={!formData.paymentMethod}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !formData.lockerNumber || !formData.potsToDispatch}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Process Partial Dispatch
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}