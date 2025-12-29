'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, Package, Calendar, MapPin, Phone, Save, X, CheckCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { OrderTimeline, type OrderStatus } from '@/components/orders/OrderTimeline';
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
  status: OrderStatus;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderDate: string;
  paidAt?: string;
  cancellationReason?: string;
  razorpayOrderId?: string;
}

const CANCELLATION_REASONS = [
  'Out of stock',
  'Customer request',
  'Payment issue',
  'Shipping constraint',
  'Product unavailable',
  'Pricing error',
  'Other'
];

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('Admin OrderDetail: Fetching order:', orderNumber);

        // Fetch all orders and find matching one
        const response = await fetch('/api/admin/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        const allOrders = data.orders || [];
        const foundOrder = allOrders.find((o: Order) => o.orderNumber === orderNumber);

        if (foundOrder) {
          setOrder(foundOrder);
          setStatus(foundOrder.status);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'packed': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductImage = (item: { name: string; image?: string }) => {
    if (item.image) {
      return item.image;
    }

    return '/products/10-mukhi.jpg';
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || isUpdating) return;

    setIsUpdating(true);

    try {
      console.log('Updating order status:', order.id, 'to:', newStatus);

      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
          cancellationReason: newStatus === 'cancelled' ? (customReason ? customReason : cancellationReason) : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const data = await response.json();
      if (data.success) {
        setStatus(newStatus);
        setShowCancelDialog(false);
        setCancellationReason('');
        setCustomReason('');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
    setCancellationReason('');
    setCustomReason('');
  };

  const handleCancelConfirm = () => {
    if (cancellationReason === 'Other' && !customReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    handleStatusUpdate('cancelled');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/admin-dashboard/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for does not exist.</p>
            <Button onClick={() => router.push('/admin-dashboard/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/admin-dashboard/orders')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        {/* Order Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    {formatDate(order.orderDate)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Payment:</span>
                  <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                    {order.paymentStatus === 'completed' ? 'Completed' :
                     order.paymentStatus === 'failed' ? 'Failed' :
                     order.paymentStatus === 'refunded' ? 'Refunded' :
                     'Pending'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Order:</span>
                  <Badge className={getOrderStatusColor(status)}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>

                {/* Admin Actions */}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="status-select" className="text-sm text-gray-600">Status:</Label>
                    <Select
                      id="status-select"
                      value={status}
                      onValueChange={(newStatus: OrderStatus) => setStatus(newStatus)}
                      disabled={isUpdating || order.status === 'cancelled'}
                      className="w-40"
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {status === 'cancelled' ? (
                    <span className="text-sm text-gray-500 ml-2">Order Cancelled</span>
                  ) : (
                    <Button
                      onClick={() => status !== 'cancelled' && handleStatusUpdate(status)}
                      disabled={isUpdating || status === order.status || status === 'cancelled'}
                      size="sm"
                      className="ml-2"
                    >
                      {isUpdating ? 'Updating...' : 'Update'}
                    </Button>
                  )}
                </div>
                )}

                {order.status === 'pending' && order.paymentStatus === 'failed' && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Payment failed. Customer can retry payment within 7 days.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {order.cancellationReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Cancellation Reason:</span> {order.cancellationReason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Timeline */}
          <div>
            <OrderTimeline status={status} />
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <OptimizedImage
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      width={64}
                      height={64}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Price: {formatPrice(item.price)} | Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                      {item.discount > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span style={{ color: '#A36922' }}>
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {order.paidAt && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Paid on {formatDate(order.paidAt)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{order.customerInfo.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{order.customerInfo.phone}</span>
              </div>
              <div className="text-sm text-gray-600">{order.customerInfo.email}</div>
              <div className="text-sm text-gray-600">
                {order.customerInfo.address}
              </div>
              <div className="text-sm text-gray-600">
                {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.pincode}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order {order.orderNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for cancellation</Label>
              <Select
                id="cancel-reason"
                value={cancellationReason}
                onValueChange={setCancellationReason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cancellationReason === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="custom-reason">Please specify</Label>
                <Textarea
                  id="custom-reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter the reason for cancellation..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              No, Go Back
            </Button>
            <Button
              onClick={handleCancelConfirm}
              disabled={!cancellationReason || (cancellationReason === 'Other' && !customReason.trim())}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
