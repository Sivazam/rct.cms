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

// Import the secure SMS service
import SMSService from '@/lib/sms-service';
const smsService = new SMSService();

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
      console.log('🔍 [DEBUG] Starting SMS send process...');
      console.log('🔍 [DEBUG] User:', { uid: user.uid, email: user.email, role: user.role });
      console.log('🔍 [DEBUG] Selected template:', selectedType);
      console.log('🔍 [DEBUG] Entry data:', {
        id: entry.id,
        customerName: entry.customerName,
        customerMobile: entry.customerMobile,
        locationName: entry.locationName,
        expiryDate: entry.expiryDate,
        status: entry.status
      });

      console.log('Initializing SMS service...');
      // Initialize the secure SMS service
      smsService.initialize();

      console.log('SMS service initialized, preparing variables...');
      // Prepare variables based on template type
      const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
      const formattedExpiryDate = formatDate(expiryDate);
      
      console.log('🔍 [DEBUG] Formatted expiry date:', formattedExpiryDate);
      console.log('Sending SMS with template:', selectedType);
      let smsResult;

      // Log template-specific debugging information
      switch (selectedType) {
        case 'threeDayReminder':
          console.log('🔍 [DEBUG] Three Day Reminder variables:', {
            customerMobile: entry.customerMobile,
            customerName: entry.customerName,
            locationName: entry.locationName,
            formattedExpiryDate,
            entryId: entry.id
          });
          smsResult = await smsService.sendThreeDayReminder(
            entry.customerMobile,
            entry.deceasedPersonName || entry.customerName, // Use deceased person name
            entry.locationName,
            formattedExpiryDate,
            entry.id,
            entry.customerId,
            entry.locationId,
            user.uid
          );
          break;
          
        case 'lastdayRenewal':
          console.log('🔍 [DEBUG] Last Day Renewal variables:', {
            customerMobile: entry.customerMobile,
            customerName: entry.customerName,
            locationName: entry.locationName,
            formattedExpiryDate,
            entryId: entry.id
          });
          smsResult = await smsService.sendLastDayRenewalReminder(
            entry.customerMobile,
            entry.deceasedPersonName || entry.customerName, // Use deceased person name
            entry.locationName,
            formattedExpiryDate,
            entry.id,
            entry.customerId,
            entry.locationId,
            user.uid
          );
          break;
          
        case 'renewalConfirmCustomer':
          console.log('🔍 [DEBUG] Renewal Confirmation Customer variables:', {
            customerMobile: entry.customerMobile,
            customerName: entry.customerName,
            locationName: entry.locationName,
            formattedExpiryDate,
            entryId: entry.id
          });
          smsResult = await smsService.sendRenewalConfirmationCustomer(
            entry.customerMobile,
            entry.deceasedPersonName || entry.customerName, // Use deceased person name
            entry.locationName,
            formattedExpiryDate,
            entry.id,
            entry.customerId,
            entry.locationId,
            user.uid
          );
          break;
          
        case 'dispatchConfirmCustomer':
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 3);
          console.log('🔍 [DEBUG] Dispatch Confirmation Customer variables:', {
            customerMobile: entry.customerMobile,
            deceasedPersonName: entry.deceasedPersonName || entry.customerName,
            locationName: entry.locationName,
            deliveryDate: formatDate(deliveryDate),
            contactPerson: entry.customerName,
            contactMobile: entry.customerMobile,
            entryId: entry.id
          });
          smsResult = await smsService.sendDispatchConfirmationCustomer(
            entry.customerMobile,
            entry.deceasedPersonName || entry.customerName, // Use deceased person name
            entry.locationName,
            formatDate(deliveryDate),
            entry.customerName, // Handover person is customer who made entry
            entry.customerMobile,
            entry.id,
            entry.customerId,
            entry.locationId,
            user.uid
          );
          break;
          
        case 'finalDisposalReminder':
          console.log('🔍 [DEBUG] Final Disposal Reminder variables:', {
            recipient: entry.customerMobile,
            deceasedPersonName: entry.deceasedPersonName || entry.customerName,
            locationName: entry.locationName,
            entryId: entry.id
          });
          console.log('🔍 [DEBUG] About to call sendFinalDisposalReminder...');
          smsResult = await smsService.sendFinalDisposalReminder(
            entry.customerMobile,
            entry.deceasedPersonName || entry.customerName, // Use deceased person name
            entry.locationName,
            entry.id,
            entry.customerId,
            entry.locationId,
            user.uid
          );
          console.log('🔍 [DEBUG] sendFinalDisposalReminder completed');
          break;
          
        default:
          throw new Error('Invalid SMS type');
      }

      console.log('🔍 [DEBUG] Secure SMS result:', {
        success: smsResult.success,
        messageId: smsResult.messageId,
        error: smsResult.error,
        timestamp: smsResult.timestamp,
        attempt: smsResult.attempt,
        templateUsed: smsResult.templateUsed,
        recipient: smsResult.recipient
      });

      setResult({
        success: smsResult.success,
        message: smsResult.success ? 'SMS sent successfully' : 'Failed to send SMS',
        error: smsResult.error
      });

      if (smsResult.success && onSMSsent) {
        onSMSsent();
      }

    } catch (error) {
      console.error('🔍 [DEBUG] Error sending SMS:', error);
      console.error('🔍 [DEBUG] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error: error,
        type: typeof error,
        constructor: error?.constructor?.name
      });
      
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