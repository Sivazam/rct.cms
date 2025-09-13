'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, DollarSign, User, Phone, RefreshCw, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/date-utils';

interface RenewalData {
  entryId: string;
  customerName: string;
  customerMobile: string;
  date: Date;
  months: number;
  amount: number;
  method: 'cash' | 'upi';
  newExpiryDate: Date;
  operatorId: string;
}

interface RenewalConfirmationProps {
  renewalData: RenewalData;
  onNewRenewal: () => void;
  onViewEntries: () => void;
}

export default function RenewalConfirmation({ 
  renewalData, 
  onNewRenewal, 
  onViewEntries 
}: RenewalConfirmationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Renewal Processed Successfully!</h2>
        <p className="text-gray-600">
          The ash pot entry has been renewed and SMS notifications have been sent.
        </p>
      </motion.div>

      {/* Renewal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Renewal Details</span>
          </CardTitle>
          <CardDescription>
            Summary of the processed renewal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entry ID */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Entry ID</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {renewalData.entryId.slice(-6).toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b pb-1">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{renewalData.customerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{renewalData.customerMobile}</span>
              </div>
            </div>
          </div>

          {/* Renewal Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b pb-1">Renewal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Renewed for: {renewalData.months} month(s)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatCurrency(renewalData.amount)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Renewed on: {formatDate(renewalData.date)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  New expiry: {formatDate(renewalData.newExpiryDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-800">Payment Summary</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {renewalData.method.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p>Renewal Rate: ₹300 per month</p>
              <p>Renewal Period: {renewalData.months} month(s)</p>
              <p className="font-medium">Total Paid: {formatCurrency(renewalData.amount)}</p>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">SMS Notifications Sent</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>✓ Renewal confirmation sent to customer</p>
              <p>✓ Notification sent to admin</p>
              <p className="text-xs mt-2">Customer will receive new expiry reminders before the new expiry date.</p>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Important Information</h4>
            <div className="space-y-1 text-sm text-yellow-700">
              <p>• The entry has been extended by {renewalData.months} month(s)</p>
              <p>• New expiry date is {formatDate(renewalData.newExpiryDate)}</p>
              <p>• Customer will receive automated reminders before expiry</p>
              <p>• This renewal has been recorded in the entry history</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onNewRenewal}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Renew Another Entry</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={onViewEntries}
          className="flex items-center space-x-2"
        >
          <Calendar className="h-4 w-4" />
          <span>View All Entries</span>
        </Button>
      </div>
    </div>
  );
}