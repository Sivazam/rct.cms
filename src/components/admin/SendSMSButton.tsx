'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, AlertTriangle, CheckCircle, Phone, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import SMSService from '@/lib/sms-service';
const smsService = SMSService.getInstance();
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/date-utils';

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
      value: '7_DAYS',
      label: '7 Days Reminder',
      description: 'Send reminder 7 days before expiry',
      icon: Calendar
    },
    {
      value: '3_DAYS',
      label: '3 Days Reminder',
      description: 'Send reminder 3 days before expiry',
      icon: Calendar
    },
    {
      value: '0_DAYS',
      label: '0 Days Reminder',
      description: 'Send reminder on expiry day',
      icon: Calendar
    },
    {
      value: 'DISPOSAL_WARNING',
      label: 'Disposal Warning',
      description: 'Send 60-day disposal warning',
      icon: AlertTriangle
    },
    {
      value: 'FINAL_DISPOSAL',
      label: 'Final Disposal',
      description: 'Send final disposal notice',
      icon: AlertTriangle
    }
  ];

  const handleSendSMS = async () => {
    if (!selectedType || !user) return;

    setSending(true);
    setResult(null);

    try {
      const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : new Date(entry.expiryDate);
      let smsResult;

      switch (selectedType) {
        case '7_DAYS':
          smsResult = await smsService.sendEntryReminder(
            entry.customerMobile,
            entry.customerName,
            entry.locationName,
            formatDate(expiryDate),
            'N/A',
            7,
            entry.id,
            entry.customerId
          );
          break;
          
        case '3_DAYS':
          smsResult = await smsService.sendEntryReminder(
            entry.customerMobile,
            entry.customerName,
            entry.locationName,
            formatDate(expiryDate),
            'N/A',
            3,
            entry.id,
            entry.customerId
          );
          break;
          
        case '0_DAYS':
          smsResult = await smsService.sendEntryReminder(
            entry.customerMobile,
            entry.customerName,
            entry.locationName,
            formatDate(expiryDate),
            'N/A',
            0,
            entry.id,
            entry.customerId
          );
          break;
          
        case 'DISPOSAL_WARNING':
          const disposalDate = new Date();
          disposalDate.setDate(disposalDate.getDate() + 3);
          smsResult = await smsService.sendDisposalWarning(
            entry.customerMobile,
            entry.customerName,
            formatDate(disposalDate),
            entry.id,
            entry.customerId
          );
          break;
          
        case 'FINAL_DISPOSAL':
          smsResult = await smsService.sendFinalDisposalNotice(
            entry.customerMobile,
            entry.customerName,
            'River Godavari',
            entry.id,
            entry.customerId
          );
          break;
          
        default:
          throw new Error('Invalid SMS type');
      }

      setResult({
        success: smsResult.success,
        message: smsResult.success ? 'SMS sent successfully' : 'Failed to send SMS',
        error: smsResult.error
      });

      if (smsResult.success && onSMSsent) {
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