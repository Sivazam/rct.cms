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
    potsToDispatch: '',
    dispatchReason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      setFormData({
        potsToDispatch: '',
        dispatchReason: ''
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
          lockerNumber: getCurrentLocker().lockerNumber,
          potsToDispatch: parseInt(formData.potsToDispatch),
          dispatchReason: formData.dispatchReason || 'Partial collection',
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

  const getCurrentLocker = () => {
    if (!entry) {
      return null;
    }
    
    // Check if entry has lockerDetails (new structure) or fallback to old structure
    if (entry.lockerDetails && entry.lockerDetails.length > 0) {
      return entry.lockerDetails[0]; // Return first locker for current entry
    } else {
      // Fallback for old entries - create virtual locker from old data
      const totalPots = entry.totalPots || entry.numberOfPots || 1;
      const numberOfLockers = entry.numberOfLockers || 1;
      const potsPerLocker = entry.potsPerLocker || Math.ceil(totalPots / numberOfLockers);
      
      return {
        lockerNumber: 1,
        totalPots: potsPerLocker,
        remainingPots: totalPots,
        dispatchedPots: []
      };
    }
  };

  const calculatePendingAmount = () => {
    if (!entry) return { monthsOverdue: 0, pendingAmount: 0 };
    
    const now = new Date();
    const expiryDate = new Date(entry.expiryDate?.toDate?.() || entry.expiryDate);
    
    if (expiryDate > now) {
      return { monthsOverdue: 0, pendingAmount: 0 };
    }
    
    // Calculate months overdue (minimum 1 month if expired)
    const daysOverdue = Math.ceil((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsOverdue = Math.max(1, Math.ceil(daysOverdue / 30));
    
    // Calculate pending amount: ₹300 per locker per month (after first free month)
    const numberOfLockers = entry.numberOfLockers || 1;
    const pendingAmount = monthsOverdue * 300 * numberOfLockers;
    
    return { monthsOverdue, pendingAmount };
  };

  const currentLocker = getCurrentLocker();
  const pendingInfo = calculatePendingAmount();

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

          {/* Current Locker Information */}
          <div className="space-y-4">
            <Label>Current Locker Information</Label>
            {currentLocker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted p-4 rounded-lg border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Locker {currentLocker.lockerNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Total Pots: {currentLocker.totalPots} | 
                      Remaining: {currentLocker.remainingPots} | 
                      Dispatched: {currentLocker.dispatchedPots.length}
                    </p>
                  </div>
                  <Badge variant={currentLocker.remainingPots > 0 ? "default" : "secondary"}>
                    {currentLocker.remainingPots > 0 ? 'Active' : 'Empty'}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>

          {/* Pending Amount Breakdown */}
          {pendingInfo.pendingAmount > 0 && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="font-semibold text-orange-800">Outstanding Amount Breakdown:</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Months Overdue:</span>
                      <span className="font-medium">{pendingInfo.monthsOverdue} month(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate per Locker:</span>
                      <span className="font-medium">₹300 per month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Lockers:</span>
                      <span className="font-medium">{entry.numberOfLockers || 1}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-orange-800">
                        <span>Total Outstanding:</span>
                        <span>₹{pendingInfo.pendingAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Pots to Dispatch */}
          <div className="space-y-2">
            <Label htmlFor="potsToDispatch">Number of Pots to Dispatch *</Label>
            <Select 
              value={formData.potsToDispatch} 
              onValueChange={(value) => handleChange('potsToDispatch', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of pots to dispatch" />
              </SelectTrigger>
              <SelectContent>
                {currentLocker && Array.from({ length: currentLocker.remainingPots }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} pot{num > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentLocker && (
              <p className="text-sm text-muted-foreground">
                Maximum {currentLocker.remainingPots} pots can be dispatched from this locker
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
              disabled={submitting || !formData.potsToDispatch || !currentLocker}
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