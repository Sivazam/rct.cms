'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';

interface DebugOrderData {
  user: {
    id: string;
    phoneNumber: string;
    name: string;
    orderIds: string[];
    addressesCount: number;
  } | null;
  ordersByUserId: Array<{
    id: string;
    orderNumber: string;
    userId: string;
    status: string;
    total: number;
    orderDate: string;
  }>;
  allOrdersCount: number;
  userOrdersFromAll: number;
}

export default function DebugOrdersPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [debugData, setDebugData] = useState<DebugOrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user info
    if (isUserAuthenticated()) {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user?.phoneNumber) {
        setPhoneNumber(user.phoneNumber);
      }
    }
  }, []);

  const fetchDebugData = async () => {
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/debug/orders?phoneNumber=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      
      if (data.success) {
        setDebugData(data.data);
      } else {
        console.error('Debug API failed:', data.error);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestOrder = async () => {
    if (!phoneNumber) return;
    
    setTestLoading(true);
    try {
      const response = await fetch('/api/debug/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Test order created:', data.data);
        // Refresh debug data
        await fetchDebugData();
      } else {
        console.error('Test order creation failed:', data.error);
      }
    } catch (error) {
      console.error('Error creating test order:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Debug Dashboard</h1>
          <p className="text-gray-600">Debug order creation and retrieval issues</p>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">{currentUser.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Authenticated</p>
                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Debug Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <Button
                onClick={fetchDebugData}
                disabled={!phoneNumber || loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Debug Orders'}
              </Button>
              <Button
                onClick={createTestOrder}
                disabled={!phoneNumber || testLoading}
                variant="outline"
              >
                {testLoading ? 'Creating...' : 'Create Test Order'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Results */}
        {debugData && (
          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                {debugData.user ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-medium text-sm">{debugData.user.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">{debugData.user.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{debugData.user.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order IDs</p>
                      <p className="font-medium">
                        {debugData.user.orderIds?.length || 0} orders
                      </p>
                      {debugData.user.orderIds && debugData.user.orderIds.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {debugData.user.orderIds.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">User not found</p>
                )}
              </CardContent>
            </Card>

            {/* Orders by User ID */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by User ID (Direct Query)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Badge className={debugData.ordersByUserId.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {debugData.ordersByUserId.length} orders found
                  </Badge>
                </div>
                
                {debugData.ordersByUserId.length > 0 ? (
                  <div className="space-y-3">
                    {debugData.ordersByUserId.map((order) => (
                      <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">ID: {order.id}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">User ID</p>
                            <p className="font-medium">{order.userId}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-medium">₹{order.total}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-gray-600">Order Date</p>
                          <p className="text-sm">{new Date(order.orderDate).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No orders found by direct user ID query</p>
                )}
              </CardContent>
            </Card>

            {/* Overall Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{debugData.allOrdersCount}</p>
                    <p className="text-sm text-gray-600">Total Orders in Database</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{debugData.userOrdersFromAll}</p>
                    <p className="text-sm text-gray-600">User Orders (from all)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{debugData.ordersByUserId.length}</p>
                    <p className="text-sm text-gray-600">User Orders (direct query)</p>
                  </div>
                </div>
                
                {debugData.userOrdersFromAll !== debugData.ordersByUserId.length && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Mismatch detected: Direct query found {debugData.ordersByUserId.length} orders, 
                      but filtering all orders found {debugData.userOrdersFromAll} orders for this user.
                      This indicates a potential database query issue.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}