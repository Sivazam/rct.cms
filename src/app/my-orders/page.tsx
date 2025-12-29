'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, Eye, Calendar, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { userService } from '@/lib/services';
import { AppLayout } from '@/components/layout/AppLayout';
import { isUserAuthenticated, getCurrentUser } from '@/lib/auth';
import { getUserIdentifier, standardizeUserId } from '@/lib/userUtils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface Order {
  id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    discount: number;
    totalPrice: number;
    image?: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderDate: string;
  paidAt?: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('MyOrders: Starting to fetch orders...');
        
        // Check if user is authenticated using our auth utility
        const isAuthenticated = isUserAuthenticated();
        console.log('MyOrders: Authentication status:', isAuthenticated);
        
        if (!isAuthenticated) {
          console.log('MyOrders: User not authenticated, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Get current user using our auth utility
        const currentUser = getCurrentUser();
        console.log('MyOrders: Current user:', currentUser);
        
        if (!currentUser) {
          console.log('MyOrders: No current user found, redirecting to login');
          router.push('/auth/login');
          return;
        }

        // Get standardized user identifier
        const userIdentifier = getUserIdentifier(currentUser);
        const standardizedUserId = standardizeUserId(userIdentifier.userId);
        
        console.log('MyOrders: Fetching orders for user:', currentUser.phoneNumber, 'standardizedUserId:', standardizedUserId);
        
        // Get user with orders using the improved service
        const userWithOrders = await userService.getUserWithOrders(standardizedUserId);
        
        console.log('MyOrders: User with orders result:', userWithOrders);
        console.log('MyOrders: User phone number:', currentUser.phoneNumber);
        console.log('MyOrders: Standardized userId:', standardizedUserId);
        
        if (userWithOrders) {
          console.log('MyOrders: User found, checking orders...');
          if (userWithOrders.orders && Array.isArray(userWithOrders.orders)) {
            console.log('MyOrders: Found orders array with length:', userWithOrders.orders.length);
            setOrders(userWithOrders.orders);
          } else {
            console.log('MyOrders: No orders array found or orders is not an array, trying direct query');
            // Fallback: try to get orders directly by userId
            try {
              const { orderService } = await import('@/lib/services');
              const directOrders = await orderService.getOrdersByUserId(standardizedUserId);
              console.log('MyOrders: Direct query found orders:', directOrders.length);
              setOrders(directOrders);
            } catch (directError) {
              console.error('MyOrders: Direct query failed:', directError);
              setOrders([]);
            }
          }
        } else {
          console.log('MyOrders: No user found, trying direct query');
          // Fallback: try to get orders directly by userId
          try {
            const { orderService } = await import('@/lib/services');
            const directOrders = await orderService.getOrdersByUserId(standardizedUserId);
            console.log('MyOrders: Direct query found orders:', directOrders.length);
            setOrders(directOrders);
          } catch (directError) {
            console.error('MyOrders: Direct query failed:', directError);
            setOrders([]);
          }
        }
      } catch (error) {
        console.error('MyOrders: Error fetching orders:', error);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state change listener
    const handleAuthStateChange = () => {
      console.log('MyOrders: Auth state change event received');
      fetchOrders();
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange);
    
    // Initial fetch
    fetchOrders();

    // Cleanup
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange);
    };
  }, [router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'paid':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductImage = (item: { name: string; image?: string }) => {
    // First try to use the image from the order item if it exists
    if (item.image) {
      return item.image;
    }
    
    // Fallback to hardcoded mapping
    const imageMap: { [key: string]: string } = {
      '10 Mukhi Lord Vishnu': '/products/10-mukhi.jpg',
      '9 Mukhi Goddess Durga': '/products/9-mukhi.jpg',
      '7 Mukhi Goddess Lakshmi': '/products/7-mukhi.jpg',
      '5 Mukhi Lord Shiva': '/products/5-mukhi.jpg',
      '14 Mukhi Lord Hanuman': '/products/14-mukhi.jpg',
      '12 Mukhi Lord Sun': '/products/12-mukhi.jpg',
      '11 Mukhi Lord Indra': '/products/11-mukhi.jpg',
      '8 Mukhi Lord Ganesha': '/products/8-mukhi.jpg',
      '6 Mukhi Lord Kartikeya': '/products/6-mukhi.jpg',
      '4 Mukhi Lord Brahma': '/products/4-mukhi.jpg',
      '3 Mukhi Lord Agni': '/products/3-mukhi.jpg',
      '2 Mukhi Lord Shiva Parvati': '/products/2-mukhi.jpg',
      'Sacred Red Thread Mala': '/products/red-thread.jpg',
      'Natural Sandalwood Mala': '/products/sandalwood.jpg',
      'Tulsi Mala': '/products/tulsi.jpg',
      'Test Product': '/products/10-mukhi.jpg'
    };
    
    return imageMap[item.name] || '/products/10-mukhi.jpg';
  };

  const OrderOverviewCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          {/* Left side - Order details */}
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
              <h3 className="text-lg font-semibold">Order #{order.orderNumber}</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <Badge className={getStatusColor(order.status)}>
                  {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                </Badge>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus === 'completed' ? 'Paid' :
                   order.paymentStatus === 'failed' ? 'Failed' :
                   order.paymentStatus === 'refunded' ? 'Refunded' :
                   'Pending'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(order.orderDate)}</span>
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center text-sm">
                <Package className="h-4 w-4 mr-2 text-gray-500" />
                <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span>{order.customerInfo.city}, {order.customerInfo.state}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-lg font-semibold text-orange-600">
                {formatPrice(order.total)}
              </div>
              <div className="flex gap-2">
                {order.paymentStatus === 'failed' && order.status !== 'cancelled' && (
                  <Link href={`/my-orders/${order.orderNumber}`}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      Retry Payment
                    </Button>
                  </Link>
                )}
                <Link href={`/my-orders/${order.orderNumber}`}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side - Product images */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <div className="flex flex-wrap gap-2 sm:ml-6 sm:flex-nowrap sm:space-x-2">
              {order.items.slice(0, 4).map((item, index) => (
                <div key={index} className="relative">
                  <OptimizedImage
                    src={getProductImage(item)}
                    alt={item.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border"
                    width={64}
                    height={64}
                  />
                  {item.quantity > 1 && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.quantity}
                    </div>
                  )}
                </div>
              ))}
              {order.items.length > 4 && (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <span className="text-xs sm:text-sm text-gray-600">+{order.items.length - 4}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OrderDetailsModal = ({ order }: { order: Order }) => (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Order #{order.orderNumber}</h3>
          <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(order.status)}
          <Badge className={getStatusColor(order.status)}>
            {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
          </Badge>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h4 className="font-semibold mb-3">Order Items</h4>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <OptimizedImage
                src={getProductImage(item)}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-lg"
                width={48}
                height={48}
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{formatPrice(item.totalPrice)}</p>
                {item.discount > 0 && (
                  <p className="text-xs text-gray-500 line-through">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div>
        <h4 className="font-semibold mb-3">Order Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h4 className="font-semibold mb-3">Shipping Address</h4>
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium">{order.customerInfo.name}</p>
          <div className="flex items-center mt-1">
            <Phone className="h-4 w-4 mr-1" />
            <span>{order.customerInfo.phone}</span>
          </div>
          <p className="mt-1">{order.customerInfo.address}</p>
          <p>{order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.pincode}</p>
        </div>
      </div>

      {/* Payment Status */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Payment:</span>
          <Badge className={order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
          </Badge>
        </div>
        {order.paidAt && (
          <p className="text-sm text-gray-600">
            Paid on {formatDate(order.paidAt)}
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track your spiritual product orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">You haven't placed any orders yet</p>
                <Link href="/">
                  <Button style={{ backgroundColor: 'rgba(156,86,26,255)', color: 'white' }}>
                    Start Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/my-orders/${order.orderNumber}`}>
                <div>
                  <OrderOverviewCard order={order} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}