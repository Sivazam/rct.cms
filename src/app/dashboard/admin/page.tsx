'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SpiritualCard from '@/components/ui/spiritual-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';
import LocationManagement from '@/components/admin/LocationManagement';
import OperatorManagement from '@/components/admin/OperatorManagement';
import OperatorPerformance from '@/components/admin/OperatorPerformance';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';
import { 
  Users, 
  MapPin, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Package,
  Truck,
  Clock,
  User,
  Phone,
  LogOut
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [locations, setLocations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalEntries: 0,
    totalRenewals: 0,
    totalDeliveries: 0,
    expiringIn7Days: 0,
    monthlyRevenue: 0
  });
  const [expiringEntries, setExpiringEntries] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('AdminDashboard: activeTab changed to:', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedLocation]);

  useEffect(() => {
    // Handle tab changes from URL parameters
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'overview';
        console.log('AdminDashboard: URL changed, updating tab to:', tab);
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data for location:', selectedLocation);
      
      // Fetch locations
      const locationsData = await getLocations();
      const activeLocations = locationsData.filter(loc => loc.isActive);
      setLocations(activeLocations);
      console.log('Active locations:', activeLocations.length);
      
      // Fetch statistics based on selected location
      const locationId = selectedLocation === 'all' ? undefined : selectedLocation;
      const statsData = await getSystemStats(locationId);
      
      // Fetch real entries count
      const entries = await getEntries({
        locationId: locationId,
        status: 'active'
      });
      console.log('Active entries found:', entries.length);
      
      // Fetch renewals count
      const renewals = await getEntries({
        locationId: locationId,
        expiringSoon: true
      });
      console.log('Renewals (expiring soon) found:', renewals.length);
      
      // Fetch deliveries count
      const deliveries = await getEntries({
        locationId: locationId,
        status: 'delivered'
      });
      console.log('Deliveries found:', deliveries.length);
      
      // Fetch recent entries for display
      const allEntries = await getEntries({
        locationId: locationId
      });
      console.log('All entries found:', allEntries.length);
      const recent = allEntries.slice(0, 5); // Show last 5 entries
      console.log('Recent entries (first 5):', recent.length);
      
      // Fetch expiring entries with details
      const expiring = await getEntries({
        locationId: locationId,
        expiringSoon: true
      });
      console.log('Expiring entries found:', expiring.length);
      
      setStats({
        totalEntries: entries.length,
        totalRenewals: renewals.length,
        totalDeliveries: deliveries.length,
        expiringIn7Days: expiring.length,
        monthlyRevenue: statsData.monthlyRevenue || 0
      });
      
      setExpiringEntries(expiring);
      setRecentEntries(recent);
      
      console.log('Dashboard data updated successfully');
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    console.log('AdminDashboard: handleTabChange called', { tab });
    setActiveTab(tab);
    // Update URL without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
      console.log('AdminDashboard: URL updated to:', url.toString());
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute requiredRole="admin">
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
            <div className="hidden sm:flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-lg sm:text-xl font-semibold text-orange-900">
                  ॐ CMS ॐ
                </h1>
                <Badge variant="outline" className="ml-3 border-orange-200 text-orange-700">Admin</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
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

            {/* Mobile Header - Compact Navbar */}
            <div className="flex sm:hidden justify-between items-center h-14">
              <div className="flex items-center">
                <h1 className="text-base font-semibold text-orange-900 truncate">
                  ॐ CMS ॐ
                </h1>
                <Badge variant="outline" className="ml-2 border-orange-200 text-orange-700 text-xs">Admin</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.venueName.length > 10 ? location.venueName.substring(0, 10) + '...' : location.venueName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2 text-xs">
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
          {/* Desktop Tabs Only - No mobile tabs */}
          <div className="hidden md:block mb-6">
            <div className="w-full overflow-x-auto">
              <div className="grid w-full min-w-max grid-cols-8 gap-1 p-1 bg-orange-100 rounded-lg">
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
                  onClick={() => handleTabChange('locations')}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'locations' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                  }`}
                >
                  Locations
                </button>
                <button
                  onClick={() => handleTabChange('operators')}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'operators' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                  }`}
                >
                  Operators
                </button>
  
                <button
                  onClick={() => handleTabChange('entries')}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'entries' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                  }`}
                >
                  Entries
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
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'analytics' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-orange-700 hover:text-orange-900 hover:bg-orange-50'
                  }`}
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Responsive Content - Works for both desktop and mobile */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
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
                      variant="ritual"
                      title="Renewals"
                      showOm={true}
                      className="h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold text-red-800">{stats.totalRenewals}</div>
                          <p className="text-sm text-red-600 mt-1">
                            +8% from last month
                          </p>
                        </div>
                        <RefreshCw className="h-8 w-8 text-red-600" />
                      </div>
                    </SpiritualCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <SpiritualCard
                      variant="memorial"
                      title="Deliveries"
                      showOm={true}
                      className="h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-3xl font-bold text-amber-800">{stats.totalDeliveries}</div>
                          <p className="text-sm text-amber-600 mt-1">
                            +5% from last month
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-amber-600" />
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
                        </div>
                        <DollarSign className="h-8 w-8 text-orange-600" />
                      </div>
                    </SpiritualCard>
                  </motion.div>
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

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks you can perform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button className="h-20 flex-col space-y-2" onClick={() => {
                        handleTabChange('entries');
                      }}>
                        <Plus className="h-6 w-6" />
                        <span>New Entry</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => {
                        handleTabChange('renewals');
                      }}>
                        <RefreshCw className="h-6 w-6" />
                        <span>Renewal</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => {
                        handleTabChange('deliveries');
                      }}>
                        <Calendar className="h-6 w-6" />
                        <span>Delivery</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Expiring Soon */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Expiring Soon ({expiringEntries.length})</span>
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Entries expiring in the next 7 days - ordered by urgency
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {expiringEntries.length > 0 ? (
                        expiringEntries
                          .sort((a, b) => {
                            const dateA = a.expiryDate?.toDate ? a.expiryDate.toDate() : null;
                            const dateB = b.expiryDate?.toDate ? b.expiryDate.toDate() : null;
                            if (!dateA || !dateB) return 0;
                            return dateA.getTime() - dateB.getTime(); // Sort by earliest first
                          })
                          .slice(0, 5) // Show top 5 expiring entries
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
                          })
                      ) : (
                        <div className="text-center py-8 text-orange-600">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                          <p>No entries expiring soon</p>
                          <p className="text-xs text-orange-500 mt-1">All entries are in good standing</p>
                        </div>
                      )}
                    </div>
                    {expiringEntries.length > 5 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" className="text-orange-800 border-orange-300 hover:bg-orange-100">
                          View All {expiringEntries.length} Expiring Entries
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Entries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Recent Entries ({recentEntries.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Latest customer entries across all locations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentEntries.length > 0 ? (
                        recentEntries.map((entry) => {
                          const entryDate = entry.entryDate?.toDate ? entry.entryDate.toDate() : null;
                          const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : null;
                          
                          return (
                            <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
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
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No entries found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              )}

              {/* Locations Tab */}
              {activeTab === 'locations' && <LocationManagement onLocationsUpdated={fetchDashboardData} />}

              {/* Operators Tab */}
              {activeTab === 'operators' && <OperatorManagement />}

  

              {/* Entries Tab */}
              {activeTab === 'entries' && <CustomerEntrySystem />}

              {/* Renewals Tab */}
              {activeTab === 'renewals' && <RenewalSystem />}

              {/* Deliveries Tab */}
              {activeTab === 'deliveries' && <DeliverySystem />}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && <OperatorPerformance />}
          </div>

        </main>

        {/* Mobile Bottom Navigation */}
        {user && (
          <div>
            {console.log('AdminDashboard: About to render MobileBottomNav', {
              user: user.email,
              userRole: user.role,
              userName: user.name
            })}
            <MobileBottomNav 
              userRole={user.role as 'admin' | 'operator'} 
              userName={user.name || 'User'} 
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}