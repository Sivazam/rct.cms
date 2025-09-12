'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SpiritualCard from '@/components/ui/spiritual-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';
import { 
  MapPin,
  Package,
  RefreshCw,
  Truck,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Phone,
  Calendar,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OperatorDashboard() {
  const { user, logout } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalEntries: 0,
    totalRenewals: 0,
    totalDeliveries: 0,
    expiringIn7Days: 0,
    monthlyRevenue: 0
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [expiringEntries, setExpiringEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOperatorData();
  }, [selectedLocation, user]);

  useEffect(() => {
    // Handle tab changes from URL parameters
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'overview';
        console.log('OperatorDashboard: URL changed, updating tab to:', tab);
        setActiveTab(tab);
      }
    };

    // Initial load
    handleUrlChange();

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleUrlChange);
    
    // Custom event for URL changes
    window.addEventListener('urlchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
    };
  }, []);

  const fetchOperatorData = async () => {
    if (!user) {
      console.log('User not loaded yet, skipping data fetch');
      return;
    }

    try {
      setLoading(true);
      
      // Get operator's assigned locations
      const operatorLocations = user?.locationIds || [];
      console.log('Operator locations:', operatorLocations);
      
      // Fetch all available locations
      const allLocations = await getLocations();
      const assignedLocations = allLocations.filter(loc => 
        operatorLocations.includes(loc.id) && loc.isActive
      );
      
      console.log('Assigned locations:', assignedLocations);
      setLocations(assignedLocations);
      
      // Set default selected location
      if (!selectedLocation && assignedLocations.length > 0) {
        setSelectedLocation(assignedLocations[0].id);
      }
      
      if (assignedLocations.length === 0) {
        console.log('No locations assigned to operator - showing empty state');
        // Set empty stats for operators with no locations
        setStats({
          totalEntries: 0,
          totalRenewals: 0,
          totalDeliveries: 0,
          expiringIn7Days: 0,
          monthlyRevenue: 0,
          todayEntries: 0,
          todayRevenue: 0,
          pendingTasks: 0
        });
        setRecentEntries([]);
        setExpiringEntries([]);
      } else if (selectedLocation) {
        // Fetch comprehensive statistics for selected location
        const [activeEntries, pendingRenewalsEntries, deliveredEntries, allEntries, expiringSoonEntries] = await Promise.all([
          getEntries({
            locationId: selectedLocation,
            status: 'active'
          }),
          getEntries({
            locationId: selectedLocation,
            needsRenewal: true
          }),
          getEntries({
            locationId: selectedLocation,
            status: 'delivered'
          }),
          getEntries({
            locationId: selectedLocation
          }),
          getEntries({
            locationId: selectedLocation,
            expiringSoon: true
          })
        ]);
        
        // Calculate today's entries and revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayEntries = allEntries.filter(entry => {
          const entryDate = entry.entryDate?.toDate ? entry.entryDate.toDate() : null;
          return entryDate && entryDate >= today && entryDate < tomorrow;
        });
        
        const todayRevenue = todayEntries.reduce((sum, entry) => {
          return sum + (entry.payments?.reduce((paymentSum: number, payment: any) => {
            const paymentDate = payment.date?.toDate ? payment.date.toDate() : null;
            return paymentSum + (paymentDate && paymentDate >= today && paymentDate < tomorrow ? payment.amount : 0);
          }, 0) || 0);
        }, 0);
        
        // Calculate monthly revenue
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const monthlyRevenue = allEntries.reduce((sum, entry) => {
          return sum + (entry.payments?.reduce((paymentSum: number, payment: any) => {
            const paymentDate = payment.date?.toDate ? payment.date.toDate() : null;
            return paymentSum + (paymentDate && paymentDate >= currentMonth ? payment.amount : 0);
          }, 0) || 0);
        }, 0);
        
        // Calculate pending tasks (expiring entries + entries needing delivery)
        const pendingTasks = expiringSoonEntries.length + activeEntries.filter(entry => {
          const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : null;
          return expiryDate && expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }).length;
        
        const statsData = await getSystemStats(selectedLocation);
        
        setStats({
          totalEntries: activeEntries.length,
          totalRenewals: pendingRenewalsEntries.length,
          totalDeliveries: deliveredEntries.length,
          expiringIn7Days: expiringSoonEntries.length,
          monthlyRevenue: monthlyRevenue,
          todayEntries: todayEntries.length,
          todayRevenue: todayRevenue,
          pendingTasks: pendingTasks
        });
        
        setRecentEntries(allEntries.slice(0, 5)); // Show last 5 entries
        setExpiringEntries(expiringSoonEntries);
        
        console.log('Operator stats updated:', {
          totalEntries: activeEntries.length,
          totalRenewals: pendingRenewalsEntries.length,
          totalDeliveries: deliveredEntries.length,
          monthlyRevenue: monthlyRevenue,
          todayEntries: todayEntries.length,
          todayRevenue: todayRevenue,
          pendingTasks: pendingTasks
        });
      }
      
    } catch (error) {
      console.error('Error fetching operator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    console.log('OperatorDashboard: handleTabChange called', { tab });
    setActiveTab(tab);
    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
      console.log('OperatorDashboard: URL updated to:', url.toString());
      
      // Dispatch custom event to notify any listeners of URL change
      window.dispatchEvent(new Event('urlchange'));
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute requiredRole="operator">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 relative">
        {/* Background spiritual elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl text-orange-600">ॐ</div>
          <div className="absolute top-20 right-20 text-4xl text-red-600">卍</div>
          <div className="absolute bottom-20 left-20 text-5xl text-amber-600">🔥</div>
          <div className="absolute bottom-10 right-10 text-3xl text-orange-700">𑀰𑀺𑀪𑁆𑀢</div>
        </div>
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-orange-200 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-orange-900">
                  ॐ Cremation Management System ॐ
                </h1>
                <Badge variant="outline" className="ml-3 border-orange-200 text-orange-700">Operator</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.venueName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-orange-700">
                  Welcome, {user?.name}
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="flex md:hidden justify-between items-center h-14">
              <div className="flex items-center">
                <h1 className="text-base font-semibold text-orange-900 truncate">
                  ॐ CMS ॐ
                </h1>
                <Badge variant="outline" className="ml-2 border-orange-200 text-orange-700 text-xs">Operator</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id} className="text-wrap leading-tight py-3">
                        {location.venueName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2 text-xs">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
          {locations.length === 0 ? (
            <div>
              {/* No locations assigned state */}
              <SpiritualCard
                variant="ritual"
                title="No Locations Assigned"
                description="You haven't been assigned to any locations yet. Please contact your administrator to get location access."
                showOm={true}
                className="text-center"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-orange-700">
                      Your account is active but you need to be assigned to at least one location to perform operations.
                    </p>
                    <p className="text-sm text-orange-600">
                      Please ask your administrator to assign you to a location in the Admin Dashboard.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleLogout} className="border-orange-200 text-orange-700 hover:bg-orange-50">
                    Logout
                  </Button>
                </div>
              </SpiritualCard>
            </div>
          ) : (
            <div>
              {/* Desktop Tabs */}
              <div className="hidden md:block mb-6">
                <div className="w-full overflow-x-auto">
                  <div className="flex flex-wrap gap-1 p-1 bg-orange-100 rounded-lg min-w-max">
                    <button
                      onClick={() => handleTabChange('overview')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'overview' 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => handleTabChange('entries')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'entries' 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                      }`}
                    >
                      Customer Entries
                    </button>
                    <button
                      onClick={() => handleTabChange('renewals')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'renewals' 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                      }`}
                    >
                      Renewals
                    </button>
                    <button
                      onClick={() => handleTabChange('deliveries')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'deliveries' 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                      }`}
                    >
                      Deliveries
                    </button>
                  </div>
                </div>
              </div>

              {/* Responsive Content - Works for both desktop and mobile */}
              <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <SpiritualCard
                          variant="sacred"
                          title="Total Entries"
                          showOm={true}
                          className="h-full"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-bold text-orange-800">{stats.totalEntries}</div>
                              <p className="text-sm text-orange-600 mt-1">
                                +12% from last month
                              </p>
                            </div>
                            <Package className="h-8 w-8 text-orange-600" />
                          </div>
                        </SpiritualCard>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <SpiritualCard
                          variant="sacred"
                          title="Pending Renewals"
                          showOm={true}
                          className="h-full"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-bold text-orange-800">{stats.totalRenewals}</div>
                              <p className="text-sm text-orange-600 mt-1">
                                +8% from last month
                              </p>
                              <div className="mt-2 text-xs text-orange-500">
                                This month
                              </div>
                            </div>
                            <RefreshCw className="h-8 w-8 text-orange-600" />
                          </div>
                        </SpiritualCard>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <SpiritualCard
                          variant="sacred"
                          title="Deliveries"
                          showOm={true}
                          className="h-full"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-bold text-orange-800">{stats.totalDeliveries}</div>
                              <p className="text-sm text-orange-600 mt-1">
                                +5% from last month
                              </p>
                              <div className="mt-2 text-xs text-orange-500">
                                Completed
                              </div>
                            </div>
                            <Truck className="h-8 w-8 text-orange-600" />
                          </div>
                        </SpiritualCard>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <SpiritualCard
                          variant="sacred"
                          title="Revenue"
                          showOm={true}
                          className="h-full"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-bold text-orange-800">₹{stats.monthlyRevenue.toLocaleString()}</div>
                              <p className="text-sm text-orange-600 mt-1">
                                +15% from last month
                              </p>
                              <div className="mt-2 text-xs text-orange-500">
                                Monthly collection
                              </div>
                            </div>
                            <DollarSign className="h-8 w-8 text-orange-600" />
                          </div>
                        </SpiritualCard>
                      </motion.div>
                    </div>

                    {/* Quick Actions */}
                    <SpiritualCard
                      variant="sacred"
                      title="Quick Actions"
                      description="Perform common tasks quickly"
                      showOm={true}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button 
                          className="h-20 flex-col space-y-2 bg-orange-600 hover:bg-orange-700" 
                          onClick={() => handleTabChange('entries')}
                        >
                          {/* <Plus className="h-6 w-6" /> */}
                          <span className="font-medium">New Entry</span>
                          {/* <span className="text-xs opacity-80">Register customer</span> */}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col space-y-2 border-orange-200 text-orange-700 hover:bg-orange-50" 
                          onClick={() => handleTabChange('renewals')}
                        >
                          {/* <RefreshCw className="h-6 w-6" /> */}
                          <span className="font-medium">Renewal</span>
                          {/* <span className="text-xs">Extend period</span> */}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="h-20 flex-col space-y-2 border-orange-200 text-orange-700 hover:bg-orange-50" 
                          onClick={() => handleTabChange('deliveries')}
                        >
                          {/* <Truck className="h-6 w-6" /> */}
                          <span className="font-medium">Delivery</span>
                          {/* <span className="text-xs">Complete process</span> */}
                        </Button>
                      </div>
                    </SpiritualCard>

                    {/* Today's Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SpiritualCard
                        variant="ritual"
                        title="Today's Entries"
                        showOm={true}
                        className="h-full"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-red-800">{stats.todayEntries || 0}</div>
                            <p className="text-sm text-red-600 mt-1">Active today</p>
                          </div>
                          <Package className="h-8 w-8 text-red-600" />
                        </div>
                      </SpiritualCard>
                      <SpiritualCard
                        variant="memorial"
                        title="Today's Revenue"
                        showOm={true}
                        className="h-full"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-amber-800">₹{stats.todayRevenue?.toLocaleString() || 0}</div>
                            <p className="text-sm text-amber-600 mt-1">Collected today</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-amber-600" />
                        </div>
                      </SpiritualCard>
                      <SpiritualCard
                        variant="sacred"
                        title="Pending Tasks"
                        showOm={true}
                        className="h-full"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-3xl font-bold text-orange-800">{stats.pendingTasks || 0}</div>
                              <p className="text-sm text-orange-600 mt-1">Need attention</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </SpiritualCard>
                    </div>

                    {/* Spiritual Quote */}
                    <SpiritualCard
                      variant="ritual"
                      title="Daily Wisdom"
                      mantra="The soul is unborn, eternal, ever-existing, undying and primeval. - Bhagavad Gita 2.20"
                      showOm={true}
                      className="text-center"
                    >
                      <div className="text-orange-700 italic">
                        "Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure."
                      </div>
                      <div className="text-sm text-orange-600 mt-2">
                        - Bhagavad Gita 2.38
                      </div>
                    </SpiritualCard>

                    {/* Expiring Soon */}
                    {expiringEntries.length > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2 text-orange-800">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Expiring Soon ({expiringEntries.length})</span>
                          </CardTitle>
                          <CardDescription className="text-orange-700">
                            Entries expiring in the next 7 days
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {expiringEntries
                              .slice(0, 3) // Show top 3 expiring entries
                              .map((entry) => {
                                const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : null;
                                const daysUntilExpiry = expiryDate ? 
                                  Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                
                                return (
                                  <div key={entry.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Package className="h-4 w-4 text-orange-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-sm">{entry.customerName}</h4>
                                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                                          <div className="flex items-center space-x-1">
                                            <Phone className="h-3 w-3" />
                                            <span>{entry.customerMobile}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Package className="h-3 w-3" />
                                            <span>{entry.numberOfPots} pot(s)</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge 
                                        variant={daysUntilExpiry <= 3 ? "destructive" : "secondary"}
                                        className="mb-1"
                                      >
                                        {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
                                      </Badge>
                                      <div className="text-xs text-gray-500">
                                        {formatFirestoreDate(expiryDate)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          {expiringEntries.length > 3 && (
                            <div className="mt-4 text-center">
                              <Button variant="outline" className="text-orange-800 border-orange-300 hover:bg-orange-100">
                                View All {expiringEntries.length} Expiring Entries
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Recent Entries */}
                    {recentEntries.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Clock className="h-5 w-5" />
                            <span>Recent Entries ({recentEntries.length})</span>
                          </CardTitle>
                          <CardDescription>
                            Latest customer entries at your location
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {recentEntries.map((entry) => {
                              const entryDate = entry.entryDate?.toDate ? entry.entryDate.toDate() : null;
                              const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : null;
                              
                              return (
                                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Users className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-sm">{entry.customerName}</h4>
                                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                                        <div className="flex items-center space-x-1">
                                          <Phone className="h-3 w-3" />
                                          <span>{entry.customerMobile}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Package className="h-3 w-3" />
                                          <span>{entry.numberOfPots} pot(s)</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                                      {entry.status === 'active' ? 'Active' : entry.status}
                                    </Badge>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatFirestoreDate(entryDate)}
                                    </div>
                                    {expiryDate && (
                                      <div className="text-xs text-gray-400">
                                        Expires: {formatFirestoreDate(expiryDate)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Entries Tab */}
                {activeTab === 'entries' && <CustomerEntrySystem />}

                {/* Renewals Tab */}
                {activeTab === 'renewals' && <RenewalSystem />}

                {/* Deliveries Tab */}
                {activeTab === 'deliveries' && <DeliverySystem />}
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          userRole="operator" 
          userName={user?.name || 'Operator'} 
          onLogout={handleLogout} 
        />
      </div>
    </ProtectedRoute>
  );
}