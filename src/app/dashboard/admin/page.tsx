'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';
import LocationManagement from '@/components/admin/LocationManagement';
import OperatorManagement from '@/components/admin/OperatorManagement';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
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
  Phone
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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedLocation]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch locations
      const locationsData = await getLocations();
      const activeLocations = locationsData.filter(loc => loc.isActive);
      setLocations(activeLocations);
      
      // Fetch statistics based on selected location
      const locationId = selectedLocation === 'all' ? undefined : selectedLocation;
      const statsData = await getSystemStats(locationId);
      
      // Fetch real entries count
      const entries = await getEntries({
        locationId: locationId,
        status: 'active'
      });
      
      // Fetch renewals count
      const renewals = await getEntries({
        locationId: locationId,
        expiringSoon: true
      });
      
      // Fetch deliveries count
      const deliveries = await getEntries({
        locationId: locationId,
        status: 'delivered'
      });
      
      // Fetch recent entries for display
      const allEntries = await getEntries({
        locationId: locationId
      });
      const recent = allEntries.slice(0, 5); // Show last 5 entries
      
      // Fetch expiring entries with details
      const expiring = await getEntries({
        locationId: locationId,
        expiringSoon: true
      });
      
      setStats({
        totalEntries: entries.length,
        totalRenewals: renewals.length,
        totalDeliveries: deliveries.length,
        expiringIn7Days: expiring.length,
        monthlyRevenue: statsData.monthlyRevenue || 0
      });
      
      setExpiringEntries(expiring);
      setRecentEntries(recent);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Smart Cremation Management
                </h1>
                <Badge variant="outline" className="ml-3">Admin</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-48">
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
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="operators">Operators</TabsTrigger>
              <TabsTrigger value="entries">Entries</TabsTrigger>
              <TabsTrigger value="renewals">Renewals</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
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
                        +12% from last month
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
                        +8% from last month
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
                        +5% from last month
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
                        +15% from last month
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
                    <Button className="h-20 flex-col space-y-2" onClick={() => {
                      // This would navigate to the entry system
                      // For now, we'll just show it's coming
                      alert('Entry system will be available in the Entries tab');
                    }}>
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

              {/* Expiring Soon */}
              {expiringEntries.length > 0 && (
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
                      {expiringEntries
                        .sort((a, b) => {
                          const dateA = a.expiryDate?.toDate();
                          const dateB = b.expiryDate?.toDate();
                          return dateA - dateB; // Sort by earliest first
                        })
                        .slice(0, 5) // Show top 5 expiring entries
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
                    {expiringEntries.length > 5 && (
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
                        const entryDate = entry.entryDate?.toDate();
                        const expiryDate = entry.expiryDate?.toDate();
                        
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
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-6">
              <LocationManagement />
            </TabsContent>

            {/* Operators Tab */}
            <TabsContent value="operators" className="space-y-6">
              <OperatorManagement />
            </TabsContent>

            {/* Entries Tab */}
            <TabsContent value="entries" className="space-y-6">
              <CustomerEntrySystem />
            </TabsContent>

            {/* Renewals Tab */}
            <TabsContent value="renewals" className="space-y-6">
              <RenewalSystem />
            </TabsContent>

            {/* Deliveries Tab */}
            <TabsContent value="deliveries" className="space-y-6">
              <DeliverySystem />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>System Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive system performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Analytics dashboard coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}