'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Phone, MapPin, Package, Calendar, DollarSign, Map } from 'lucide-react';
import { motion } from 'framer-motion';

interface EntryData {
  id: string;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  numberOfPots: number;
  entryDate: Date;
  expiryDate: Date;
  locationName: string;
  paymentMethod: 'cash' | 'upi';
  amount: number;
}

interface EntryConfirmationProps {
  entryData: EntryData;
  onNewEntry: () => void;
  onViewEntries: () => void;
}

export default function EntryConfirmation({ entryData, onNewEntry, onViewEntries }: EntryConfirmationProps) {
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
        <h2 className="text-2xl font-bold text-green-800 mb-2">Entry Created Successfully!</h2>
        <p className="text-gray-600">
          The ash pot entry has been created and SMS notifications have been sent.
        </p>
      </motion.div>

      {/* Entry Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Entry Details</span>
          </CardTitle>
          <CardDescription>
            Summary of the created entry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entry ID */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Entry ID</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {entryData.id.slice(-6).toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b pb-1">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{entryData.customerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{entryData.customerMobile}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{entryData.customerCity}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Map className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{entryData.locationName}</span>
              </div>
            </div>
          </div>

          {/* Entry Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b pb-1">Entry Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{entryData.numberOfPots} pot(s)</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatCurrency(entryData.amount)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Entry: {entryData.entryDate.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Expiry: {entryData.expiryDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-green-800">Payment Summary</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {entryData.paymentMethod.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p>Entry Fee: ₹500 per pot</p>
              <p>Number of Pots: {entryData.numberOfPots}</p>
              <p className="font-medium">Total Paid: {formatCurrency(entryData.amount)}</p>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">SMS Notifications Sent</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>✓ Confirmation sent to customer</p>
              <p>✓ Notification sent to admin</p>
              <p className="text-xs mt-2">Customer will receive renewal reminders before expiry.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onNewEntry}
          className="flex items-center space-x-2"
        >
          <Package className="h-4 w-4" />
          <span>Create New Entry</span>
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