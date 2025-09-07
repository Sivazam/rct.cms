'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { getLocations, getEntries, getSystemStats } from '@/lib/firestore';
import { 
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
            <div className="md:flex justify-between items-center h-16">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    SCM
                  </h1>
                  <Badge variant="outline" className="ml-2 text-xs">Operator</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-32 text-xs">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.venueName.length > 15 ? location.venueName.substring(0, 15) + '...' : location.venueName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
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
                {/* Simple Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Operator Dashboard</CardTitle>
                    <CardDescription>Welcome to the operator dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalEntries}</div>
                        <div className="text-sm text-gray-600">Total Entries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalRenewals}</div>
                        <div className="text-sm text-gray-600">Renewals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
                        <div className="text-sm text-gray-600">Deliveries</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">₹{stats.monthlyRevenue}</div>
                        <div className="text-sm text-gray-600">Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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