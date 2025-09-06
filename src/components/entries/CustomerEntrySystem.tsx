'use client';

import { useState } from 'react';
import CustomerSearch from './CustomerSearch';
import CustomerEntryForm from './CustomerEntryForm';
import EntryConfirmation from './EntryConfirmation';
import EntriesList from './EntriesList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  city: string;
  additionalDetails?: string;
  createdAt: any;
}

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

type Step = 'search' | 'form' | 'confirmation';

export default function CustomerEntrySystem() {
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createdEntry, setCreatedEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCustomerFound = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      // Customer found, will show dialog, then move to form
      // The dialog will handle the transition
    } else {
      // No customer found, go directly to form
      setCurrentStep('form');
    }
  };

  const handleCreateNew = () => {
    setCurrentStep('form');
  };

  const handleEntrySuccess = () => {
    // Simulate entry creation with mock data
    const entryData: EntryData = {
      id: 'ent_' + Date.now(),
      customerName: selectedCustomer?.name || 'New Customer',
      customerMobile: selectedCustomer?.mobile || '',
      customerCity: selectedCustomer?.city || '',
      numberOfPots: 1,
      entryDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      locationName: 'Branch 1',
      paymentMethod: 'cash',
      amount: 500
    };
    
    setCreatedEntry(entryData);
    setCurrentStep('confirmation');
  };

  const handleCancel = () => {
    setCurrentStep('search');
    setSelectedCustomer(null);
  };

  const handleNewEntry = () => {
    setCurrentStep('search');
    setSelectedCustomer(null);
    setCreatedEntry(null);
  };

  const handleViewEntries = () => {
    // This would navigate to the entries list
    console.log('Navigate to entries list');
    setCurrentStep('search');
    setSelectedCustomer(null);
    setCreatedEntry(null);
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
            <CustomerSearch
              onCustomerFound={handleCustomerFound}
              onCreateNew={handleCreateNew}
              loading={loading}
            />
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
            <CustomerEntryForm
              customer={selectedCustomer}
              onSuccess={handleEntrySuccess}
              onCancel={handleCancel}
              loading={loading}
            />
          </motion.div>
        );

      case 'confirmation':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {createdEntry && (
              <EntryConfirmation
                entryData={createdEntry}
                onNewEntry={handleNewEntry}
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
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Entry System</h1>
              <p className="text-gray-600">Register new customers and create ash pot entries</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mt-6">
            {[
              { step: 'search', label: 'Search Customer', icon: Users },
              { step: 'form', label: 'Entry Details', icon: Package },
              { step: 'confirmation', label: 'Confirmation', icon: Package }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === item.step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep === item.step ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
                {index < 2 && (
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

        {/* Entries List - Only shown in search step */}
        {currentStep === 'search' && (
          <div className="mt-6">
            <EntriesList />
          </div>
        )}

        {/* Quick Stats */}
        {currentStep === 'search' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Entries</p>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Customers</p>
                    <p className="text-2xl font-bold text-green-600">45</p>
                  </div>
                  <Users className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">₹6,000</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}