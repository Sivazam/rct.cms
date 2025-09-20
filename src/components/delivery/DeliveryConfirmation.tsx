'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, MapPin, Phone, Package, User, Download, Home, IndianRupee, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/date-utils';

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

interface DeliveryConfirmationProps {
  entry: Entry;
  deliveryData: {
    otp: string;
    deliveryDate: string;
    operatorName: string;
    amountPaid: number;
    dueAmount: number;
    reason?: string;
    handoverPersonName?: string;
    handoverPersonMobile?: string;
  };
  onNewDelivery: () => void;
  onViewHistory: () => void;
  loading?: boolean;
}

export default function DeliveryConfirmation({ 
  entry, 
  deliveryData, 
  onNewDelivery, 
  onViewHistory, 
  loading = false 
}: DeliveryConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadReceipt, setDownloadReceipt] = useState(false);

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const handleDownloadReceipt = async () => {
    setDownloadReceipt(true);
    try {
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In real implementation, this would generate and download a PDF receipt
      console.log('Downloading receipt for delivery:', entry.id);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    } finally {
      setDownloadReceipt(false);
    }
  };

  const deliveryProgress = [
    { step: 'Search Entry', completed: true, icon: Search },
    { step: 'OTP Verification', completed: true, icon: CheckCircle },
    { step: 'Delivery Processed', completed: true, icon: Package },
    { step: 'Confirmation', completed: true, icon: CheckCircle }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Delivery Successful!</h2>
        <p className="text-gray-600">Ash pots have been successfully delivered to the customer</p>
      </motion.div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveryProgress.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <step.icon className={`h-4 w-4 ${
                    step.completed ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.completed ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {step.step}
                  </p>
                </div>
                {step.completed && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Details</CardTitle>
          <CardDescription>Summary of the completed delivery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{entry.customer.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{entry.customer.mobile}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{entry.customer.city}</span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Delivery Information</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{entry.pots} pot(s) delivered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Delivered on: {formatDate(deliveryData.deliveryDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Location: {entry.locationName}</span>
                </div>
              </div>
            </div>

            {/* Handover Person Information */}
            {deliveryData.handoverPersonName && deliveryData.handoverPersonMobile && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Handover Person Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{deliveryData.handoverPersonName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{deliveryData.handoverPersonMobile}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Due Amount:</span>
                  </div>
                  <span className="text-sm font-semibold">₹{deliveryData.dueAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Amount Paid:</span>
                  </div>
                  <span className={`text-sm font-semibold ${deliveryData.amountPaid < deliveryData.dueAmount ? 'text-yellow-600' : 'text-green-600'}`}>
                    ₹{deliveryData.amountPaid.toLocaleString()}
                  </span>
                </div>
                {deliveryData.amountPaid < deliveryData.dueAmount && (
                  <div className="flex items-start space-x-2 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      <strong>Partial Payment:</strong> Customer paid ₹{deliveryData.amountPaid.toLocaleString()} out of ₹{deliveryData.dueAmount.toLocaleString()}
                      {deliveryData.reason && (
                        <div className="mt-1">
                          <strong>Reason:</strong> {deliveryData.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {deliveryData.amountPaid === 0 && (
                  <div className="flex items-start space-x-2 bg-blue-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <strong>Free Delivery:</strong> No payment collected for this delivery
                      {deliveryData.reason && (
                        <div className="mt-1">
                          <strong>Reason:</strong> {deliveryData.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entry Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Entry ID:</span>
                <span className="ml-2 font-mono font-semibold">{entry.id.slice(-6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Entry Date:</span>
                <span className="ml-2">{formatDate(entry.entryDate)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Renewals:</span>
                <span className="ml-2">{entry.renewalCount}</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Successfully Dispatched
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Alert>
        <AlertDescription>
          <strong>Notifications Sent:</strong> SMS confirmation has been sent to the customer ({entry.customer.mobile}) 
          and a dispatch notification has been logged in the system.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleDownloadReceipt}
          disabled={downloadReceipt || loading}
          variant="outline"
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadReceipt ? 'Downloading...' : 'Download Receipt'}
        </Button>
        <Button
          onClick={onViewHistory}
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          <Calendar className="h-4 w-4 mr-2" />
          View Delivery History
        </Button>
        <Button
          onClick={onNewDelivery}
          disabled={loading}
          className="flex-1"
        >
          <Package className="h-4 w-4 mr-2" />
          New Dispatch
        </Button>
      </div>

      {/* Return to Dashboard */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
          disabled={loading}
        >
          <Home className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    </motion.div>
  );
}

// Search icon for progress steps
function Search({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}