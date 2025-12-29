'use client';

import { CheckCircle, Package, Loader2 } from 'lucide-react';

interface PaymentLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function PaymentLoadingOverlay({ isVisible, message = 'Processing your payment...' }: PaymentLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {message}
          </h3>
          <p className="text-gray-600 text-sm">
            Please wait while we process your order and redirect you to the confirmation page.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>Creating your order...</span>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4" />
            <span>Verifying payment...</span>
          </div>
        </div>
      </div>
    </div>
  );
}