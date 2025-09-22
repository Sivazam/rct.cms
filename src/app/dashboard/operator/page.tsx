'use client';

import { useState, useEffect, useRef } from 'react';
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
import InteractiveEntriesList from '@/components/dashboard/InteractiveEntriesList';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
import { formatFirestoreDate } from '@/lib/date-utils';
import { ResponsiveDateRangePicker } from '@/components/ui/responsive-date-range-picker';
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
  Plus,
  Building2,
  User,
  LogOut,
  FileText,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OperatorDashboard() {
  const { user, logout } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOperatorData();
  }, [selectedLocation, user, dateRange]);

  const handleCardClick = (cardType: string) => {
    console.log('Operator Card clicked:', cardType);
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

  const fetchOperatorData = async () => {
    if (!user) {
      console.log('User not loaded yet, skipping data fetch');
      return;
    }

    try {
      setLoading(true);
      
      const operatorLocations = user?.locationIds || [];
      console.log('Operator locations:', operatorLocations);
      
      const allLocations = await getLocations();
      const assignedLocations = allLocations.filter(loc => 
        operatorLocations.includes(loc.id) && loc.isActive
      );
      
      console.log('Assigned locations:', assignedLocations);
      setLocations(assignedLocations);
      
      if (!selectedLocation && assignedLocations.length > 0) {
        setSelectedLocation(assignedLocations[0].id);
      }
      
      if (assignedLocations.length === 0) {
        console.log('No locations assigned to operator - showing empty state');
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
        
        const operatorEntries = allEntries.filter(entry => entry.operatorId === user?.uid);
        const operatorActiveEntries = activeEntries.filter(entry => entry.operatorId === user?.uid);
        const operatorPendingRenewalsEntries = pendingRenewalsEntries.filter(entry => entry.operatorId === user?.uid);
        const operatorDeliveredEntries = deliveredEntries.filter(entry => entry.operatorId === user?.uid);
        const operatorExpiringSoonEntries = expiringSoonEntries.filter(entry => entry.operatorId === user?.uid);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayEntries = operatorEntries.filter(entry => {
          const entryDate = entry.entryDate?.toDate ? entry.entryDate.toDate() : null;
          return entryDate && entryDate >= today && entryDate < tomorrow;
        });
        
        const todayRevenue = todayEntries.reduce((sum, entry) => {
          return sum + (entry.payments?.reduce((paymentSum: number, payment: any) => {
            const paymentDate = payment.date?.toDate ? payment.date.toDate() : null;
            return paymentSum + (paymentDate && paymentDate >= today && paymentDate < tomorrow ? payment.amount : 0);
          }, 0) || 0);
        }, 0);
        
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        const monthlyRevenue = operatorEntries.reduce((sum, entry) => {
          return sum + (entry.payments?.reduce((paymentSum: number, payment: any) => {
            const paymentDate = payment.date?.toDate ? payment.date.toDate() : null;
            return paymentSum + (paymentDate && paymentDate >= currentMonth ? payment.amount : 0);
          }, 0) || 0);
        }, 0);
        
        const pendingTasks = operatorExpiringSoonEntries.length + operatorActiveEntries.filter(entry => {
          const expiryDate = entry.expiryDate?.toDate ? entry.expiryDate.toDate() : null;
          return expiryDate && expiryDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }).length;
        
        setStats({
          totalEntries: operatorActiveEntries.length,
          totalRenewals: operatorPendingRenewalsEntries.length,
          totalDeliveries: operatorDeliveredEntries.length,
          expiringIn7Days: operatorExpiringSoonEntries.length,
          monthlyRevenue: monthlyRevenue,
          todayEntries: todayEntries.length,
          todayRevenue: todayRevenue,
          pendingTasks: pendingTasks
        });
        
        setRecentEntries(operatorEntries.slice(0, 5));
        setExpiringEntries(operatorExpiringSoonEntries);
        
        console.log('Operator stats updated:', {
          totalEntries: operatorActiveEntries.length,
          totalRenewals: operatorPendingRenewalsEntries.length,
          totalDeliveries: operatorDeliveredEntries.length,
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
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new Event('urlchange'));
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute requiredRole="operator">
      <div className="min-h-screen bg-amber-50">
        {/* Header */}
        <header className="bg-white border-b border-amber-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-xl font-bold text-amber-900">
                      Cremation Management System
                    </h1>
                    <p className="text-xs text-amber-600">Operator Dashboard</p>
                  </div>
                </div>
                <Badge variant="outline" className="ml-4 border-amber-200 text-amber-700">Operator</Badge>
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
                <div className="text-sm text-amber-700">
                  Welcome, {user?.name}
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="flex md:hidden justify-between items-center h-14">
              <div className="flex items-center">
                <div>
                  <h1 className="text-sm font-bold text-amber-900 leading-tight">
                    CMS
                  </h1>
                  <p className="text-xs text-amber-600">Operator</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-32 h-8 text-xs">
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
                <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2">
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-8">
          {locations.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md border-slate-200">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-slate-600" />
                  </div>
                  <CardTitle className="text-slate-900">No Locations Assigned</CardTitle>
                  <CardDescription className="text-slate-600">
                    You haven't been assigned to any locations yet. Please contact your administrator to get location access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-slate-500 mb-4">
                    Your account is active but you need to be assigned to at least one location to perform operations.
                  </p>
                  <Button variant="outline" onClick={handleLogout} className="border-slate-200 text-slate-700">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button 
                  variant="default" 
                  className="h-auto p-4 flex flex-col items-center gap-2 bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleTabChange('entries')}
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm font-medium">New Entry</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2 border-amber-200 text-amber-700"
                  onClick={() => handleTabChange('renewals')}
                >
                  <RefreshCw className="h-6 w-6" />
                  <span className="text-sm font-medium">Renewals</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2 border-amber-200 text-amber-700"
                  onClick={() => handleTabChange('deliveries')}
                >
                  <Truck className="h-6 w-6" />
                  <span className="text-sm font-medium">Deliveries</span>
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'My Active Entries',
                    value: stats.totalEntries,
                    icon: Package,
                    color: 'amber'
                  },
                  {
                    title: 'Pending Renewals',
                    value: stats.totalRenewals,
                    icon: RefreshCw,
                    color: 'orange'
                  },
                  {
                    title: 'Completed Deliveries',
                    value: stats.totalDeliveries,
                    icon: Truck,
                    color: 'amber'
                  },
                  {
                    title: 'Monthly Revenue',
                    value: `₹${stats.monthlyRevenue.toLocaleString()}`,
                    icon: DollarSign,
                    color: 'orange'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-md transition-all duration-200 border-amber-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700">
                          {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                          <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-900">
                          {stat.value}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>
                          Your latest entries and activities
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {recentEntries.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                                  <User className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-amber-900">{entry.customerName}</p>
                                  <p className="text-xs text-amber-600">{entry.customerPhone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-amber-600">
                                  {entry.entryDate ? formatFirestoreDate(entry.entryDate) : 'N/A'}
                                </p>
                                <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                                  {entry.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {recentEntries.length === 0 && (
                            <p className="text-sm text-amber-600 text-center py-4">
                              No recent activity
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                          Attention Required
                        </CardTitle>
                        <CardDescription>
                          Entries requiring your attention
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {expiringEntries.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-amber-900">{entry.customerName}</p>
                                  <p className="text-xs text-amber-600">Expires: {entry.expiryDate ? formatFirestoreDate(entry.expiryDate) : 'N/A'}</p>
                                </div>
                              </div>
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            </div>
                          ))}
                          {expiringEntries.length === 0 && (
                            <p className="text-sm text-amber-600 text-center py-4">
                              No items require attention
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'entries' && <CustomerEntrySystem />}
                {activeTab === 'renewals' && <RenewalSystem />}
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