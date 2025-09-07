'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
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
  }, [selectedLocation]);

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
        const [activeEntries, renewalsEntries, deliveredEntries, allEntries, expiringSoonEntries] = await Promise.all([
          getEntries({
            locationId: selectedLocation,
            status: 'active'
          }),
          getEntries({
            locationId: selectedLocation,
            expiringSoon: true
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
          const entryDate = entry.entryDate?.toDate();
          return entryDate && entryDate >= today && entryDate < tomorrow;
        });
        
        const todayRevenue = todayEntries.reduce((sum, entry) => {
          return sum + (entry.payments?.reduce((paymentSum: number, payment: any) => {
            const paymentDate = payment.date?.toDate();
            return paymentSum + (paymentDate && paymentDate >= today && paymentDate < tomorrow ? payment.amount : 0);
          }, 0) || 0);
        }, 0);
        
        // Calculate monthly revenue
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const monthlyRevenue = allEntries.reduce((sum, entry) => {
          return sum + (entry.payments?.reduce((paymentSum: number, payment: any) => {
            const paymentDate = payment.date?.toDate();
            return paymentSum + (paymentDate && paymentDate >= currentMonth ? payment.amount : 0);
          }, 0) || 0);
        }, 0);
        
        // Calculate pending tasks (expiring entries + entries needing delivery)
        const pendingTasks = expiringSoonEntries.length + activeEntries.filter(entry => {
          const expiryDate = entry.expiryDate?.toDate();
          return expiryDate && expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }).length;
        
        const statsData = await getSystemStats(selectedLocation);
        
        setStats({
          totalEntries: activeEntries.length,
          totalRenewals: renewalsEntries.length,
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
          totalRenewals: renewalsEntries.length,
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Smart Cremation Management
                </h1>
                <Badge variant="outline" className="ml-3">Operator</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-48">
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
                <div className="text-sm text-gray-600">
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
                <h1 className="text-base font-semibold text-gray-900 truncate">
                  SCM
                </h1>
                <Badge variant="outline" className="ml-2 text-xs">Operator</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.venueName.length > 10 ? location.venueName.substring(0, 10) + '...' : location.venueName}
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
              <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>No Locations Assigned</span>
                </CardTitle>
                <CardDescription>
                  You haven't been assigned to any locations yet. Please contact your administrator to get location access.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Your account is active but you need to be assigned to at least one location to perform operations.
                    </p>
                    <p className="text-sm text-gray-500">
                      Please ask your administrator to assign you to a location in the Admin Dashboard.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          ) : (
            <div>
              {/* Desktop Tabs */}
              <div className="hidden md:block mb-6">
                <div className="w-full overflow-x-auto">
                  <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg min-w-max">
                    <button
                      onClick={() => handleTabChange('overview')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'overview' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => handleTabChange('entries')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'entries' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Customer Entries
                    </button>
                    <button
                      onClick={() => handleTabChange('renewals')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'renewals' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Renewals
                    </button>
                    <button
                      onClick={() => handleTabChange('deliveries')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'deliveries' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                            <Package className="h-4 w-4 text-blue-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalEntries}</div>
                            <p className="text-xs text-muted-foreground">
                              +12% from last month
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              Active customers
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Card className="border-l-4 border-l-green-500">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Renewals</CardTitle>
                            <RefreshCw className="h-4 w-4 text-green-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.totalRenewals}</div>
                            <p className="text-xs text-muted-foreground">
                              +8% from last month
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              This month
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Card className="border-l-4 border-l-purple-500">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                            <Truck className="h-4 w-4 text-purple-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats.totalDeliveries}</div>
                            <p className="text-xs text-muted-foreground">
                              +5% from last month
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              Completed
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Card className="border-l-4 border-l-orange-500">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-600" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-orange-600">₹{stats.monthlyRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                              +15% from last month
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              Monthly collection
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Plus className="h-5 w-5" />
                          <span>Quick Actions</span>
                        </CardTitle>
                        <CardDescription>
                          Perform common tasks quickly
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Button 
                            className="h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700" 
                            onClick={() => handleTabChange('entries')}
                          >
                            <Plus className="h-6 w-6" />
                            <span className="font-medium">New Entry</span>
                            <span className="text-xs opacity-80">Register customer</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-20 flex-col space-y-2 border-green-200 text-green-700 hover:bg-green-50" 
                            onClick={() => handleTabChange('renewals')}
                          >
                            <RefreshCw className="h-6 w-6" />
                            <span className="font-medium">Renewal</span>
                            <span className="text-xs">Extend period</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-20 flex-col space-y-2 border-purple-200 text-purple-700 hover:bg-purple-50" 
                            onClick={() => handleTabChange('deliveries')}
                          >
                            <Truck className="h-6 w-6" />
                            <span className="font-medium">Delivery</span>
                            <span className="text-xs">Complete process</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Today's Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Today's Entries</p>
                              <p className="text-2xl font-bold text-blue-600">{stats.todayEntries || 0}</p>
                              <p className="text-xs text-green-600">Active today</p>
                            </div>
                            <Package className="h-8 w-8 text-blue-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Today's Revenue</p>
                              <p className="text-2xl font-bold text-green-600">₹{stats.todayRevenue?.toLocaleString() || 0}</p>
                              <p className="text-xs text-green-600">Collected today</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-200" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Pending Tasks</p>
                              <p className="text-2xl font-bold text-orange-600">{stats.pendingTasks || 0}</p>
                              <p className="text-xs text-gray-500">Need attention</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-200" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

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
                                const expiryDate = entry.expiryDate?.toDate();
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
                                        {expiryDate?.toLocaleDateString()}
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
                              const entryDate = entry.entryDate?.toDate();
                              const expiryDate = entry.expiryDate?.toDate();
                              
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
                                      {entryDate?.toLocaleDateString()}
                                    </div>
                                    {expiryDate && (
                                      <div className="text-xs text-gray-400">
                                        Expires: {expiryDate.toLocaleDateString()}
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