'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Users, ShoppingCart, TrendingUp, Settings, Database, BarChart3, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching dashboard statistics...');

      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();

      console.log('Dashboard statistics response:', data);

      if (data.success) {
        setStats(data.statistics);
      } else {
        setError(data.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, description, icon: Icon, loading }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    loading?: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
        <Button onClick={fetchDashboardStats}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to your admin control panel</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          System Active
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          description="Active products in store"
          icon={Package}
          loading={loading}
        />

        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          description="Orders processed"
          icon={ShoppingCart}
          loading={loading}
        />

        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          description="Registered customers"
          icon={Users}
          loading={loading}
        />

        <StatCard
          title="Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          description="Total revenue"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          description="Orders awaiting processing"
          icon={ShoppingCart}
          loading={loading}
        />

        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          description="Successfully delivered orders"
          icon={ShoppingCart}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Category Management
            </CardTitle>
            <CardDescription>
              Manage product categories, add new categories with images and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin-dashboard/categories">
              <Button className="w-full" variant="outline">
                View All Categories
              </Button>
            </Link>
            <Link href="/admin-dashboard/categories/new">
              <Button className="w-full">
                Add New Category
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Banner Management
            </CardTitle>
            <CardDescription>
              Manage homepage banners, carousel images, and promotional banners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/banners">
              <Button className="w-full" variant="outline">
                Manage Banners
              </Button>
            </Link>
            <Button className="w-full" variant="outline" disabled>
              Banner Analytics (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Management
            </CardTitle>
            <CardDescription>
              Manage your product catalog, add new products with variants and discounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin-dashboard/products">
              <Button className="w-full" variant="outline">
                View All Products
              </Button>
            </Link>
            <Link href="/admin-dashboard/products/new">
              <Button className="w-full">
                Add New Product
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Management
            </CardTitle>
            <CardDescription>
              View and manage customer orders, process payments, and track shipments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin-dashboard/orders">
              <Button className="w-full" variant="outline">
                View All Orders
              </Button>
            </Link>
            <Button className="w-full" variant="outline" disabled>
              Process Orders (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Management
            </CardTitle>
            <CardDescription>
              Manage customer accounts, view profiles, and handle support requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline" disabled>
              View Customers (Coming Soon)
            </Button>
            <Button className="w-full" variant="outline" disabled>
              Customer Support (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>
              View sales analytics, generate reports, and track business performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline" disabled>
              Sales Report (Coming Soon)
            </Button>
            <Button className="w-full" variant="outline" disabled>
              Analytics Dashboard (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Variants Management
            </CardTitle>
            <CardDescription>
              Manage product variants, pricing, and inventory levels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin-dashboard/variants">
              <Button className="w-full" variant="outline">
                Manage Variants
              </Button>
            </Link>
            <Button className="w-full" variant="outline" disabled>
              Bulk Update (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Discounts Management
            </CardTitle>
            <CardDescription>
              Create and manage discount codes and promotional offers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin-dashboard/discounts">
              <Button className="w-full" variant="outline">
                Manage Discounts
              </Button>
            </Link>
            <Button className="w-full" variant="outline" disabled>
              Coupon Analytics (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Store Settings
            </CardTitle>
            <CardDescription>
              Configure store settings, payment methods, and shipping options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline" disabled>
              General Settings (Coming Soon)
            </Button>
            <Button className="w-full" variant="outline" disabled>
              Payment Settings (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Management
            </CardTitle>
            <CardDescription>
              Manage database, backup data, and monitor system performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/debug">
              <Button className="w-full" variant="outline">
                System Debug
              </Button>
            </Link>
            <Button className="w-full" variant="outline" disabled>
              Database Backup (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest system activities and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard updated with real-time statistics</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Order management system active</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Statistics calculated in real-time</p>
                <p className="text-xs text-gray-500">Just now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
