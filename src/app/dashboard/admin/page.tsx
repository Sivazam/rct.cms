'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbarLocation } from '@/contexts/NavbarLocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';
import LocationManagement from '@/components/admin/LocationManagement';
import OperatorManagement from '@/components/admin/OperatorManagement';
import OperatorPerformance from '@/components/admin/OperatorPerformance';
import SMSLogsTable from '@/components/admin/SMSLogsTable';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminMobileTest from '@/components/admin/AdminMobileTest';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
import InteractiveEntriesList from '@/components/dashboard/InteractiveEntriesList';
import RecentActivity from '@/components/dashboard/RecentActivity';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ResponsiveDateRangePicker } from '@/components/ui/responsive-date-range-picker';
import { Switch } from '@/components/ui/switch';
import DateTimeBar from '@/components/ui/DateTimeBar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';
import { 
  Users, 
  MapPin, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Calendar,
  Package,
  Truck,
  Clock,
  User,
  Phone,
  LogOut,
  Building2,
  FileText,
  BarChart3,
  Settings as SettingsIcon
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { navbarLocation, setNavbarLocation } = useNavbarLocation();
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [showWithDispatch, setShowWithDispatch] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalRenewals: 0,
    totalDeliveries: 0,
    expiringIn7Days: 0,
    monthlyRevenue: 0,
    renewalCollections: 0,
    deliveryCollections: 0,
    currentActive: 0
  });
  const [expiringEntries, setExpiringEntries] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);

  // Handle navbar location change
  const handleNavbarLocationChange = (location: string) => {
    setNavbarLocation(location);
    setSelectedLocation(location);
  };

  const handleCardClick = (cardType: string) => {
    console.log('Card clicked:', cardType);
    const newExpandedCard = expandedCard === cardType ? null : cardType;
    setExpandedCard(newExpandedCard);
    
    if (newExpandedCard && expandedContentRef.current) {
      setTimeout(() => {
        expandedContentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  const safeLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      }
    } catch (error) {
      console.error('Error in logout:', error);
    }
  };

  const safeSetDateRange = (range: { from: Date; to: Date } | undefined) => {
    try {
      setDateRange(range);
    } catch (error) {
      console.error('Error in setDateRange:', error);
    }
  };

  const safeSetShowWithDispatch = (show: boolean) => {
    try {
      setShowWithDispatch(show);
    } catch (error) {
      console.error('Error in setShowWithDispatch:', error);
    }
  };

  useEffect(() => {
    if (expandedCard && expandedContentRef.current) {
      setTimeout(() => {
        expandedContentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 150);
    }
  }, [expandedCard]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedLocation, dateRange, showWithDispatch]);

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'overview';
        setActiveTab(tab);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const locationsData = await getLocations();
      const activeLocations = locationsData.filter(loc => loc.isActive);
      setLocations(activeLocations);
      
      const locationId = selectedLocation === 'all' ? undefined : selectedLocation;
      const statsData = await getSystemStats(locationId, dateRange) || {};
      
      const entries = await getEntries({
        locationId: locationId,
        status: 'active'
      });
      
      const pendingRenewals = await getEntries({
        locationId: locationId,
        needsRenewal: true
      });
      
      const deliveries = await getEntries({
        locationId: locationId,
        status: 'dispatched'
      });
      
      const allEntries = await getEntries({
        locationId: locationId
      });
      const recent = allEntries.slice(0, 5);
      
      const expiring = await getEntries({
        locationId: locationId,
        expiringSoon: true
      });
      
      setStats({
        totalEntries: statsData?.totalEntries || 0,
        totalRenewals: statsData?.totalRenewals || 0,
        totalDeliveries: statsData?.totalDeliveries || 0,
        expiringIn7Days: statsData?.expiringIn7Days || 0,
        monthlyRevenue: showWithDispatch ? 
          ((statsData?.renewalCollections || 0) + (statsData?.deliveryCollections || 0)) : 
          (statsData?.renewalCollections || 0),
        renewalCollections: statsData?.renewalCollections || 0,
        deliveryCollections: statsData?.deliveryCollections || 0,
        currentActive: statsData?.currentActive || 0
      });
      
      setExpiringEntries(expiring);
      setRecentEntries(recent);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntriesDataChanged = () => {
    console.log('Entries data changed, refreshing dashboard');
    fetchDashboardData();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleLogout = async () => {
    await safeLogout();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        {/* Date Time Bar */}
        <DateTimeBar />
        
        {/* Header */}
        <header className="bg-white/80 border-b border-primary/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Header */}
            <div className="hidden sm:flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      CMS
                    </h1>
                    <p className="text-xs text-muted-foreground">Administrative Dashboard</p>
                  </div>
                </div>
                <Badge variant="outline" className="ml-4 border text-muted-foreground">Admin</Badge>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Select value={selectedLocation} onValueChange={handleNavbarLocationChange}>
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
                <div className="text-sm text-muted-foreground">
                  Welcome, {user?.name || 'Admin'}
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="flex sm:hidden justify-between items-center h-14">
              <div className="flex items-center">
                <div>
                  <h1 className="text-sm font-bold text-foreground leading-tight">
                    CMS
                  </h1>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Select value={selectedLocation} onValueChange={handleNavbarLocationChange}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-wrap leading-tight py-3">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id} className="text-wrap leading-tight py-3">
                        {location.venueName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2">
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-8">
          {/* Desktop Tabs */}
          <div className="hidden md:block mb-8">
            <div className="border-b border-primary/20">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
                  { id: 'operators', label: 'Operators', icon: Users },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                  { id: 'settings', label: 'Settings', icon: SettingsIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/50'
                      }
                    `}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {/* Dashboard Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Filters Section */}
                <div className="bg-white border-2 border-border/50 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold text-foreground">Dashboard Overview</h3>
                      <p className="text-sm text-muted-foreground">
                        {dateRange 
                          ? `Showing data from ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`
                          : 'Showing data till today'
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <ResponsiveDateRangePicker 
                        onDateRangeChange={safeSetDateRange}
                        placeholder="Select date range"
                        initialDateRange={dateRange}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fetchDashboardData()}
                        className="flex items-center gap-2 border text-muted-foreground"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Total Active Ash Pots',
                      value: stats.totalEntries,
                      icon: Package,
                      color: 'amber',
                      change: '+12%',
                      type: 'active'
                    },
                    {
                      title: 'Pending Ash Pots',
                      value: stats.totalRenewals,
                      icon: RefreshCw,
                      color: 'orange',
                      change: '+5%',
                      type: 'pending'
                    },
                    {
                      title: 'Dispatched Ash Pots',
                      value: stats.totalDeliveries,
                      icon: Truck,
                      color: 'amber',
                      change: '+8%',
                      type: 'dispatched'
                    },
                    {
                      title: 'Monthly Revenue',
                      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
                      icon: IndianRupee,
                      color: 'orange',
                      change: '+15%',
                      type: 'revenue'
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <Card 
                        className="h-full hover:shadow-md transition-all duration-200 border cursor-pointer hover:scale-105"
                        onClick={() => handleCardClick(stat.type)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </CardTitle>
                          <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                            <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">
                            {stat.value}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-green-600 font-medium">{stat.change}</span> from last month
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to view details
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Expandable Content Sections */}
                <div ref={expandedContentRef} className="space-y-6">
                  {/* Active Ash Pots Details */}
                  {expandedCard === 'active' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-lg border p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Active Ash Pots Details</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setExpandedCard(null)}
                          className="text-muted-foreground"
                        >
                          Close
                        </Button>
                      </div>
                      <InteractiveEntriesList type="active" navbarLocation={navbarLocation} onDataChanged={handleEntriesDataChanged} />
                    </motion.div>
                  )}

                  {/* Pending Ash Pots Details */}
                  {expandedCard === 'pending' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-lg border p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Pending Ash Pots Details</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setExpandedCard(null)}
                          className="text-muted-foreground"
                        >
                          Close
                        </Button>
                      </div>
                      <InteractiveEntriesList type="pending" navbarLocation={navbarLocation} onDataChanged={handleEntriesDataChanged} />
                    </motion.div>
                  )}

                  {/* Dispatched Ash Pots Details */}
                  {expandedCard === 'dispatched' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-lg border p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Dispatched Ash Pots Details</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setExpandedCard(null)}
                          className="text-muted-foreground"
                        >
                          Close
                        </Button>
                      </div>
                      <InteractiveEntriesList type="dispatched" navbarLocation={navbarLocation} onDataChanged={handleEntriesDataChanged} />
                    </motion.div>
                  )}

                  {/* Revenue Details */}
                  {expandedCard === 'revenue' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-lg border p-6 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Revenue Details</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setExpandedCard(null)}
                          className="text-muted-foreground"
                        >
                          Close
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Monthly Revenue Summary */}
                        <Card className="border-accent">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                              ₹{stats.monthlyRevenue.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="text-green-600">+15%</span> from last month
                            </p>
                          </CardContent>
                        </Card>

                        {/* Renewal Collections */}
                        <Card className="border-green-100">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-green-700">Renewal Collections</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-900">
                              ₹{stats.renewalCollections.toLocaleString()}
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              From {stats.totalRenewals} renewals
                            </p>
                          </CardContent>
                        </Card>

                        {/* Delivery Collections */}
                        <Card className="border-blue-100">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-blue-700">Dispatch Collections</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-blue-900">
                              ₹{stats.deliveryCollections.toLocaleString()}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              From {stats.totalDeliveries} dispacthes
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Revenue Breakdown */}
                      <div className="mt-6">
                        <h4 className="font-medium text-foreground mb-3">Revenue Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-primary rounded-full"></div>
                              <span className="text-sm text-foreground">Renewal Revenue</span>
                            </div>
                            <span className="font-medium text-foreground">₹{stats.renewalCollections.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-blue-800">Dispatch Revenue</span>
                            </div>
                            <span className="font-medium text-blue-900">₹{stats.deliveryCollections.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-t-2 border-green-200">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-800">Total Revenue</span>
                            </div>
                            <span className="font-bold text-green-900">₹{stats.monthlyRevenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Transactions */}
                      <div className="mt-6">
                        <h4 className="font-medium text-foreground mb-3">Recent Transactions</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {recentEntries.slice(0, 10).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-2 border-b border-accent">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{entry.customerName}</p>
                                  <p className="text-xs text-muted-foreground">{entry.customerPhone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                {entry.payments && entry.payments.length > 0 && (
                                  <>
                                    <p className="text-sm font-medium text-green-600">
                                      ₹{entry.payments[0].amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {entry.payments[0].date ? formatFirestoreDate(entry.payments[0].date) : 'N/A'}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecentActivity locationId={navbarLocation === 'all' ? undefined : navbarLocation} dateRange={dateRange} />
                  
                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                        Expiring Soon
                      </CardTitle>
                      <CardDescription>
                        Entries requiring attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {expiringEntries.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between py-2 border-b border-accent last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-foreground">{entry.customerName}</p>
                                <p className="text-xs text-muted-foreground">Expires: {entry.expiryDate ? formatFirestoreDate(entry.expiryDate) : 'N/A'}</p>
                              </div>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          </div>
                        ))}
                        {expiringEntries.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No entries expiring soon
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Other Tabs */}
            {activeTab === 'operators' && <OperatorManagement />}
            {activeTab === 'analytics' && <OperatorPerformance />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          userRole="admin" 
          userName={user?.name || 'Admin'} 
          onLogout={handleLogout} 
        />
      </div>
    </ProtectedRoute>
  );
}