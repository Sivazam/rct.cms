'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';
import CustomerEntrySystem from '@/components/entries/CustomerEntrySystem';
import RenewalSystem from '@/components/renewals/RenewalSystem';
import DeliverySystem from '@/components/delivery/DeliverySystem';
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
  const [selectedLocation, setSelectedLocation] = useState('loc1');

  // Mock data - replace with actual Firestore queries
  const locations = [
    { id: 'loc1', name: 'Branch 1', address: '123 Main St' },
    { id: 'loc2', name: 'Branch 2', address: '456 Oak Ave' },
  ];

  const stats = {
    totalEntries: 45,
    totalRenewals: 23,
    totalDeliveries: 12,
    expiringIn7Days: 3,
    monthlyRevenue: 15000
  };

  const recentEntries = [
    { id: 'ent1', customerName: 'Raj Kumar', mobile: '+919876543210', pots: 2, date: '2024-01-15', status: 'active' },
    { id: 'ent2', customerName: 'Sita Devi', mobile: '+919876543211', pots: 1, date: '2024-01-14', status: 'active' },
    { id: 'ent3', customerName: 'Amit Singh', mobile: '+919876543212', pots: 3, date: '2024-01-13', status: 'expiring' },
  ];

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
                        {location.name}
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="entries">Entries</TabsTrigger>
              <TabsTrigger value="renewals">Renewals</TabsTrigger>
              <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
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
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}