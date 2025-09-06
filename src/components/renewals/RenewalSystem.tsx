'use client';

import { useState } from 'react';
import RenewalSearch from './RenewalSearch';
import OTPVerification from './OTPVerification';
import RenewalForm from './RenewalForm';
import RenewalConfirmation from './RenewalConfirmation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Entry {
  id: string;
  customerName: string;
  customerMobile: string;
  customerCity: string;
  numberOfPots: number;
  entryDate: any;
  expiryDate: any;
  status: 'active' | 'expired' | 'delivered' | 'disposed';
  locationId: string;
  operatorId: string;
  payments: Array<{
    amount: number;
    date: any;
    type: string;
    method: string;
    months: number;
  }>;
  renewals: Array<{
    date: any;
    months: number;
    amount: number;
    method: string;
    operatorId: string;
    newExpiryDate: any;
  }>;
}

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

type Step = 'search' | 'otp' | 'form' | 'confirmation';

export default function RenewalSystem() {
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [completedRenewal, setCompletedRenewal] = useState<RenewalData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEntrySelected = (entry: Entry) => {
    setSelectedEntry(entry);
    setCurrentStep('otp');
  };

  const handleOTPVerified = () => {
    setCurrentStep('form');
  };

  const handleRenewalSuccess = (renewalData: RenewalData) => {
    setCompletedRenewal(renewalData);
    setCurrentStep('confirmation');
  };

  const handleCancel = () => {
    setCurrentStep('search');
    setSelectedEntry(null);
  };

  const handleNewRenewal = () => {
    setCurrentStep('search');
    setSelectedEntry(null);
    setCompletedRenewal(null);
  };

  const handleViewEntries = () => {
    // This would navigate to the entries list
    console.log('Navigate to entries list');
    setCurrentStep('search');
    setSelectedEntry(null);
    setCompletedRenewal(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'search':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RenewalSearch
              onEntrySelected={handleEntrySelected}
              loading={loading}
            />
          </motion.div>
        );

      case 'otp':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </div>
            {selectedEntry && (
              <OTPVerification
                mobile={selectedEntry.customerMobile}
                entryId={selectedEntry.id}
                type="renewal"
                onVerified={handleOTPVerified}
                onCancel={handleCancel}
                loading={loading}
              />
            )}
          </motion.div>
        );

      case 'form':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </div>
            {selectedEntry && (
              <RenewalForm
                entry={selectedEntry}
                onSuccess={handleRenewalSuccess}
                onCancel={handleCancel}
                loading={loading}
              />
            )}
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {completedRenewal && (
              <RenewalConfirmation
                renewalData={completedRenewal}
                onNewRenewal={handleNewRenewal}
                onViewEntries={handleViewEntries}
              />
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Renewal System</h1>
              <p className="text-gray-600">Renew ash pot entries with OTP verification</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mt-6">
            {[
              { step: 'search', label: 'Search Entry', icon: Users },
              { step: 'otp', label: 'OTP Verify', icon: RefreshCw },
              { step: 'form', label: 'Renewal Details', icon: RefreshCw },
              { step: 'confirmation', label: 'Confirmation', icon: RefreshCw }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === item.step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep === item.step ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
                {index < 3 && (
                  <div className="ml-4 w-8 h-0.5 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderStep()}
        </div>

        {/* Quick Stats */}
        {currentStep === 'search' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Renewals</p>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">12</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">₹7,200</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}