'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Package,
  Users,
  MapPin
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOperatorData();
  }, [selectedLocation]);

  useEffect(() => {
    // Handle tab changes from URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab') || 'overview';
      setActiveTab(tab);
    }
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
          monthlyRevenue: 0
        });
        setRecentEntries([]);
      } else if (selectedLocation) {
        // Fetch statistics for selected location
        const entries = await getEntries({
          locationId: selectedLocation,
          status: 'active'
        });
        
        const renewals = await getEntries({
          locationId: selectedLocation,
          expiringSoon: true
        });
        
        const deliveries = await getEntries({
          locationId: selectedLocation,
          status: 'delivered'
        });
        
        const statsData = await getSystemStats(selectedLocation);
        
        // Fetch recent entries for this location
        const recentEntriesData = await getEntries({
          locationId: selectedLocation
        });
        
        setStats({
          totalEntries: entries.length,
          totalRenewals: renewals.length,
          totalDeliveries: deliveries.length,
          expiringIn7Days: renewals.length,
          monthlyRevenue: statsData.monthlyRevenue || 0
        });
        
        setRecentEntries(recentEntriesData.slice(0, 5)); // Show last 5 entries
      }
      
    } catch (error) {
      console.error('Error fetching operator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
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
            <div className="flex justify-between items-center h-16">
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
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {/* Normal dashboard with locations */}
              <div className="space-y-6">
              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <div className="w-full overflow-x-auto">
                  <div className="grid w-full min-w-max grid-cols-4 gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'overview' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('entries')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'entries' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Entries
                    </button>
                    <button
                      onClick={() => setActiveTab('renewals')}
                      className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'renewals' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Renewals
                    </button>
                    <button
                      onClick={() => setActiveTab('deliveries')}
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

              {/* Mobile Tabs */}
              <div className="md:hidden">
                <div className="w-full overflow-x-auto">
                  <div className="grid w-full min-w-max grid-cols-4 gap-1 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`whitespace-nowrap px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        activeTab === 'overview' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('entries')}
                      className={`whitespace-nowrap px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        activeTab === 'entries' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Entries
                    </button>
                    <button
                      onClick={() => setActiveTab('renewals')}
                      className={`whitespace-nowrap px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        activeTab === 'renewals' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Renewals
                    </button>
                    <button
                      onClick={() => setActiveTab('deliveries')}
                      className={`whitespace-nowrap px-3 py-2 rounded-md text-xs font-medium transition-colors ${
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

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalEntries}</div>
                      <p className="text-xs text-muted-foreground">
                        This location
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Renewals</CardTitle>
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalRenewals}</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks you can perform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button className="h-20 flex-col space-y-2">
                      <Plus className="h-6 w-6" />
                      <span>New Entry</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col space-y-2">
                      <RefreshCw className="h-6 w-6" />
                      <span>Renewal</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col space-y-2">
                      <Calendar className="h-6 w-6" />
                      <span>Delivery</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Entries */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Entries</CardTitle>
                  <CardDescription>
                    Latest customer entries at your location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{entry.customerName}</h4>
                            <p className="text-sm text-gray-600">{entry.mobile}</p>
                            <p className="text-xs text-gray-500">{entry.pots} pot(s) • {entry.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={entry.status === 'active' ? 'default' : 'destructive'}>
                            {entry.status === 'active' ? 'Active' : 'Expiring'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expiring Soon */}
              {stats.expiringIn7Days > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Expiring Soon</span>
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      {stats.expiringIn7Days} entries expiring in the next 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="text-orange-800 border-orange-300 hover:bg-orange-100">
                      View Expiring Entries
                    </Button>
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
            )}
        </main>

        {/* Mobile Bottom Navigation */}
        {user && (
          <MobileBottomNav 
            userRole={user.role} 
            userName={user.name || 'Operator'} 
            onLogout={handleLogout} 
          />
        )}
      </div>
    </ProtectedRoute>
  );
}