'use client';

import { useState, useEffect } from 'react';
import CustomerSearch from './CustomerSearch';
import CustomerEntryForm from './CustomerEntryForm';
import EntryConfirmation from './EntryConfirmation';
import EntriesList from './EntriesList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEntries, getSystemStats } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [createdEntry, setCreatedEntry] = useState<EntryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    todayEntries: 0,
    activeCustomers: 0,
    monthlyRevenue: 0
  });

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

  const handleEntrySuccess = (entryData: any) => {
    // Use real entry data returned from the API
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

  // Fetch statistics data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        // Get today's entries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const allEntries = await getEntries();
        const todayEntries = allEntries.filter(entry => {
          const entryDate = entry.entryDate?.toDate?.() || new Date(entry.entryDate);
          return entryDate >= today && entryDate < tomorrow;
        });
        
        // Get active customers (customers with active entries)
        const activeEntries = allEntries.filter(entry => entry.status === 'active');
        const uniqueCustomers = new Set(activeEntries.map(entry => entry.customerId));
        
        // Get monthly revenue
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const monthlyRevenue = allEntries.reduce((sum, entry) => {
          if (entry.payments && Array.isArray(entry.payments)) {
            return sum + entry.payments.reduce((paymentSum, payment) => {
              const paymentDate = payment.date?.toDate?.() || new Date(payment.date);
              return paymentSum + (paymentDate >= currentMonth ? payment.amount : 0);
            }, 0);
          }
          return sum;
        }, 0);
        
        setStats({
          todayEntries: todayEntries.length,
          activeCustomers: uniqueCustomers.size,
          monthlyRevenue: monthlyRevenue
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };
    
    fetchStats();
  }, [user]);

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Entry System</h1>
              <p className="text-muted-foreground">Register new customers and create ash pot entries</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
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
                    <div className="ml-2 sm:ml-4 w-8 h-0.5 bg-gray-300 hidden sm:block"></div>
                  )}
                </div>
              ))}
            </div>
            {/* Mobile connector lines */}
            <div className="sm:hidden flex flex-col items-center space-y-2 mt-4 ml-4">
              {[
                { step: 'search', label: 'Search Customer', icon: Users },
                { step: 'form', label: 'Entry Details', icon: Package },
                { step: 'confirmation', label: 'Confirmation', icon: Package }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  {index < 2 && (
                    <div className="w-0.5 h-8 bg-gray-300 ml-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
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
                    <p className="text-sm text-muted-foreground">Today's Entries</p>
                    <p className="text-2xl font-bold text-primary">{stats.todayEntries}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Customers</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">₹{stats.monthlyRevenue.toLocaleString()}</p>
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