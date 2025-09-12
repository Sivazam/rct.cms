'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Calculator, AlertTriangle, ArrowLeft, IndianRupee, Clock } from 'lucide-react';

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
}

interface DeliveryPaymentProps {
  entry: Entry;
  onPaymentComplete: (paymentData: {
    amountPaid: number;
    dueAmount: number;
    reason?: string;
  }) => void;
  onBack: () => void;
  loading?: boolean;
}

export default function DeliveryPayment({ 
  entry, 
  onPaymentComplete, 
  onBack, 
  loading = false 
}: DeliveryPaymentProps) {
  const [dueAmount, setDueAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [reason, setReason] = useState('');
  const [overdueMonths, setOverdueMonths] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Calculate due amount based on overdue months
  useEffect(() => {
    const calculateDueAmount = () => {
      const entryDate = new Date(entry.entryDate);
      const expiryDate = new Date(entryDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from entry
      const now = new Date();
      
      // Calculate overdue months
      const timeDiff = now.getTime() - expiryDate.getTime();
      const overdueDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (overdueDays <= 0) {
        setOverdueMonths(0);
        setDueAmount(0);
        return;
      }
      
      // Calculate overdue months (round up)
      const months = Math.ceil(overdueDays / 30);
      setOverdueMonths(months);
      
      // Calculate due amount (₹300 per month)
      const amount = months * 300;
      setDueAmount(amount);
      setAmountPaid(amount); // Default to full amount
    };

    calculateDueAmount();
  }, [entry.entryDate]);

  const handleAmountChange = (value: string) => {
    const amount = parseInt(value) || 0;
    setAmountPaid(amount);
    
    // Clear error if amount is valid
    if (amount >= 0) {
      setError('');
    }
  };

  const handlePaymentSubmit = async () => {
    // Validate amount
    if (amountPaid < 0) {
      setError('Amount cannot be negative');
      return;
    }

    // If paying less than due amount, reason is required
    if (amountPaid < dueAmount && !reason.trim()) {
      setError('Please provide a reason for paying less than the due amount');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const paymentData = {
        amountPaid,
        dueAmount,
        reason: amountPaid < dueAmount ? reason.trim() : undefined
      };

      onPaymentComplete(paymentData);
    } catch (error) {
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentStatus = () => {
    if (dueAmount === 0) return 'No Due';
    if (amountPaid === dueAmount) return 'Full Payment';
    if (amountPaid === 0) return 'Free Delivery';
    return 'Partial Payment';
  };

  const getPaymentStatusColor = () => {
    if (dueAmount === 0) return 'bg-gray-100 text-gray-800';
    if (amountPaid === dueAmount) return 'bg-green-100 text-green-800';
    if (amountPaid === 0) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
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
            <Calculator className="h-5 w-5" />
            <span>Delivery Payment Processing</span>
          </CardTitle>
          <CardDescription>
            Calculate and process payment for dispatch/delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entry Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Delivery Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Customer:</strong> {entry.customer.name}</p>
                <p><strong>Mobile:</strong> {entry.customer.mobile}</p>
                <p><strong>Location:</strong> {entry.locationName}</p>
              </div>
              <div>
                <p><strong>Pots:</strong> {entry.pots}</p>
                <p><strong>Entry Date:</strong> {new Date(entry.entryDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {entry.status}</p>
              </div>
            </div>
          </div>

          {/* Due Amount Calculation */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-orange-800">
                <Clock className="h-5 w-5" />
                <span>Due Amount Calculation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">{overdueMonths}</div>
                  <div className="text-sm text-orange-600">Overdue Months</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">₹300</div>
                  <div className="text-sm text-orange-600">Per Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800">{formatCurrency(dueAmount)}</div>
                  <div className="text-sm text-orange-600">Total Due</div>
                </div>
              </div>
              
              {overdueMonths > 0 && (
                <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
                  <strong>Calculation:</strong> Entry completed 1 month on {new Date(
                    new Date(entry.entryDate).getTime() + 30 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}. Overdue by {overdueMonths} month(s) at ₹300/month.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Processing */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="amountPaid" className="flex items-center space-x-2">
                <IndianRupee className="h-4 w-4" />
                <span>Amount Paid</span>
              </Label>
              <Input
                id="amountPaid"
                type="number"
                placeholder="Enter amount paid"
                value={amountPaid || ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                min="0"
                className="text-lg"
                disabled={isProcessing || loading}
              />
              <p className="text-sm text-gray-600 mt-1">
                Due amount: {formatCurrency(dueAmount)}
              </p>
            </div>

            {/* Show reason field only if paying less than due amount */}
            {amountPaid < dueAmount && dueAmount > 0 && (
              <div>
                <Label htmlFor="reason">Reason for Partial Payment *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why the customer is paying less than the due amount..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  disabled={isProcessing || loading}
                  className="resize-none"
                />
                <p className="text-sm text-gray-600 mt-1">
                  This note will be recorded for future reference.
                </p>
              </div>
            )}

            {/* Payment Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Status:</span>
              <Badge className={getPaymentStatusColor()}>
                {getPaymentStatus()}
              </Badge>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Warning for partial payment */}
            {amountPaid < dueAmount && dueAmount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Once delivery is processed, the account will be marked as settled 
                  regardless of partial payment. No further balance will be collected.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isProcessing || loading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={isProcessing || loading}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Process Delivery'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}