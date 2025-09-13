'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Copy, Check } from 'lucide-react';
import { SMSTemplates } from './sms';

interface SMSDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mobile: string;
  message: string;
  templateType?: keyof typeof SMSTemplates;
  templateParams?: any;
  entryId?: string;
}

export function SMSDialog({ 
  isOpen, 
  onClose, 
  mobile, 
  message, 
  templateType, 
  templateParams, 
  entryId 
}: SMSDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const getTemplateName = (type: string) => {
    switch (type) {
      case 'entryConfirmation': return 'Entry Confirmation (Admin)';
      case 'customerEntryConfirmation': return 'Entry Confirmation (Customer)';
      case 'renewalReminder7Days': return 'Renewal Reminder (7 Days)';
      case 'renewalReminder3Days': return 'Renewal Reminder (3 Days)';
      case 'renewalReminderToday': return 'Renewal Reminder (Today)';
      case 'renewalConfirmation': return 'Renewal Confirmation (Admin)';
      case 'customerRenewalConfirmation': return 'Renewal Confirmation (Customer)';
      case 'deliveryConfirmation': return 'Delivery Confirmation (Admin)';
      case 'customerDeliveryConfirmation': return 'Delivery Confirmation (Customer)';
      default: return 'Custom Message';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>SMS Notification Preview</span>
          </DialogTitle>
          <DialogDescription>
            This is a placeholder for SMS functionality. Replace with actual Fast2SMS integration later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* SMS Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Recipient:</span>
                <div className="text-blue-600 font-mono">{mobile}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Template:</span>
                <div>
                  <Badge variant="outline" className="text-xs">
                    {templateType ? getTemplateName(templateType) : 'Custom'}
                  </Badge>
                </div>
              </div>
              {entryId && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Entry ID:</span>
                  <div className="font-mono text-xs text-gray-600">{entryId}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Message Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Message Content:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={message}
              readOnly
              className="min-h-24 font-mono text-sm resize-none"
            />
            <div className="text-xs text-gray-500">
              Character count: {message.length}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              💡 This dialog replaces actual SMS sending for development
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  // Simulate SMS sending success
                  alert('SMS would be sent here. Replace with actual Fast2SMS integration.');
                  onClose();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Simulate Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing SMS dialogs
export function useSMSDialog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSMS, setCurrentSMS] = useState<{
    mobile: string;
    message: string;
    templateType?: keyof typeof SMSTemplates;
    templateParams?: any;
    entryId?: string;
  } | null>(null);

  const showSMSDialog = (
    mobile: string, 
    message: string, 
    templateType?: keyof typeof SMSTemplates,
    templateParams?: any,
    entryId?: string
  ) => {
    setCurrentSMS({ mobile, message, templateType, templateParams, entryId });
    setIsDialogOpen(true);
  };

  const closeSMSDialog = () => {
    setIsDialogOpen(false);
    setCurrentSMS(null);
  };

  return {
    showSMSDialog,
    closeSMSDialog,
    isDialogOpen,
    currentSMS
  };
}