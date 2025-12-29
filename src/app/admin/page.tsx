'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  Plus,
  ArrowRight,
  Star,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Products',
      value: '156',
      change: '+12%',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Orders',
      value: '89',
      change: '+23%',
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      title: 'Customers',
      value: '234',
      change: '+18%',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Revenue',
      value: '₹45,678',
      change: '+34%',
      icon: DollarSign,
      color: 'text-orange-600',
    },
  ];

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', amount: '₹1,299', status: 'Delivered', date: '2024-01-15' },
    { id: 'ORD002', customer: 'Jane Smith', amount: '₹2,499', status: 'Processing', date: '2024-01-15' },
    { id: 'ORD003', customer: 'Bob Johnson', amount: '₹899', status: 'Shipped', date: '2024-01-14' },
    { id: 'ORD004', customer: 'Alice Brown', amount: '₹3,299', status: 'Pending', date: '2024-01-14' },
  ];

  const topProducts = [
    { name: '5 Mukhi Rudraksha', sales: 45, revenue: '₹22,500' },
    { name: 'Tulsi Mala', sales: 38, revenue: '₹11,400' },
    { name: 'Sandalwood Mala', sales: 32, revenue: '₹16,000' },
    { name: '7 Mukhi Rudraksha', sales: 28, revenue: '₹14,000' },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/products/new">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Link href="/admin/categories/new">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from your customers</CardDescription>
                </div>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-sm">{order.id}</p>
                        <p className="text-xs text-gray-500">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="font-medium text-sm">{order.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Products</CardTitle>
                  <CardDescription>Best performing products this month</CardDescription>
                </div>
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sales} sales</p>
                      </div>
                    </div>
                    <p className="font-medium text-sm">{product.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/products/new">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  Add Product
                </Button>
              </Link>
              <Link href="/admin/categories/new">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Eye className="h-6 w-6 mb-2" />
                  Add Category
                </Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <ShoppingCart className="h-6 w-6 mb-2" />
                  View Orders
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}