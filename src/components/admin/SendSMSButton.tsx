'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, AlertTriangle, CheckCircle, Phone, User, Calendar, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/date-utils';
import { TEMPLATE_NAMES } from '@/lib/sms-templates';

// Import Firebase Functions
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface SendSMSButtonProps {
  entry: {
    id: string;
    customerName: string;
    customerMobile: string;
    customerCity: string;
    expiryDate: any;
    locationId: string;
    locationName: string;
    status: string;
    customerId: string;
  };
  onSMSsent?: () => void;
}

export default function SendSMSButton({ entry, onSMSsent }: SendSMSButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const smsTypes = [
    {
      value: 'threeDayReminder',
      label: TEMPLATE_NAMES.threeDayReminder,
      description: 'Send reminder 3 days before expiry',
      icon: Calendar
    },
    {
      value: 'lastdayRenewal',
      label: TEMPLATE_NAMES.lastdayRenewal,
      description: 'Send reminder on expiry day',
      icon: Calendar
    },
    {
      value: 'renewalConfirmCustomer',
      label: TEMPLATE_NAMES.renewalConfirmCustomer,
      description: 'Send renewal confirmation to customer',
      icon: CheckCircle
    },
    {
      value: 'dispatchConfirmCustomer',
      label: TEMPLATE_NAMES.dispatchConfirmCustomer,
      description: 'Send dispatch confirmation to customer',
      icon: Truck
    },
    {
      value: 'finalDisposalReminder',
      label: TEMPLATE_NAMES.finalDisposalReminder,
      description: 'Send final disposal reminder',
      icon: AlertTriangle
    }
  ];

  const handleSendSMS = async () => {
    if (!selectedType || !user) return;

    setSending(true);
    setResult(null);

    try {
      // Initialize Firebase Functions callable
      const sendSMSFunction = httpsCallable(functions, 'sendSMS');

      // Prepare variables based on template type
      const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
      const formattedExpiryDate = formatDate(expiryDate);
      
      let variables: any = {};

      switch (selectedType) {
        case 'threeDayReminder':
          variables = {
            deceasedPersonName: entry.customerName,
            locationName: entry.locationName,
            date: formattedExpiryDate,
            mobile: '9876543210', // Admin mobile - should be configurable
          };
          break;
          
        case 'lastdayRenewal':
          variables = {
            deceasedPersonName: entry.customerName,
            locationName: entry.locationName,
            date: formattedExpiryDate,
            mobile: '9876543210', // Admin mobile - should be configurable
          };
          break;
          
        case 'renewalConfirmCustomer':
          variables = {
            deceasedPersonName: entry.customerName,
            locationName: entry.locationName,
            date: formattedExpiryDate, // This would be the extended expiry date
            mobile: '9876543210', // Admin mobile - should be configurable
          };
          break;
          
        case 'dispatchConfirmCustomer':
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 3); // Example: 3 days from now
          variables = {
            deceasedPersonName: entry.customerName,
            locationName: entry.locationName,
            date: formatDate(deliveryDate),
            contactPersonName: entry.customerName, // Using customer name as contact person
            mobile: entry.customerMobile,
            adminMobile: '9876543210', // Admin mobile - should be configurable
          };
          break;
          
        case 'finalDisposalReminder':
          variables = {
            deceasedPersonName: entry.customerName,
            locationName: entry.locationName,
          };
          break;
          
        default:
          throw new Error('Invalid SMS type');
      }

      console.log('Sending SMS via Firebase Functions:', {
        templateKey: selectedType,
        recipient: entry.customerMobile,
        variables,
        entryId: entry.id,
        customerId: entry.customerId,
        locationId: entry.locationId
      });

      // Call Firebase Functions
      const result = await sendSMSFunction({
        templateKey: selectedType,
        recipient: entry.customerMobile,
        variables,
        entryId: entry.id,
        customerId: entry.customerId,
        locationId: entry.locationId
      });

      console.log('Firebase Functions result:', result.data);

      setResult({
        success: result.data.success,
        message: result.data.success ? 'SMS sent successfully' : 'Failed to send SMS',
        error: result.data.error
      });

      if (result.data.success && onSMSsent) {
        onSMSsent();
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedType('');
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Send SMS</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Send SMS</span>
          </DialogTitle>
          <DialogDescription>
            Send SMS notification to customer for entry {entry.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entry Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">{entry.customerName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{entry.customerMobile}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm">Expiry: {formatDate(entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate))}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Location:</span>
              <span className="text-sm font-medium">{entry.locationName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Status:</span>
              <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                {entry.status}
              </Badge>
            </div>
          </div>

          {/* SMS Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select SMS Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose SMS type to send" />
              </SelectTrigger>
              <SelectContent>
                {smsTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                {result.message || result.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendSMS} 
              disabled={!selectedType || sending}
              className="flex-1"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}